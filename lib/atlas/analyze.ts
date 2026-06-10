import type {
  AtlasAnalysisResponse,
  AtlasRubricArea,
  DevelopmentNeed,
  PrimaryConstraint,
  Recommendation,
  RecommendationAction,
  RecommendationCategory,
  StudentArchetype,
  StudentUnderstanding,
  StudentProfile,
} from "./types";

type CandidateRecommendation = Recommendation & {
  gapScore: number;
  alignmentScore: number;
  applicationImpactScore: number;
  actionabilityScore: number;
  resourceAvailabilityScore: number;
  archetypeBoostScore?: number;
  goalBoostScore?: number;
};

const guardrails = [
  "No admissions guarantees",
  "No exact acceptance odds",
  "Use supportive language",
  "Recommend one next move, not ten",
];

export function analyzeStudent(profile: StudentProfile): AtlasAnalysisResponse {
  const understanding = buildStudentUnderstanding(profile);
  const rubric = buildRubric(profile);
  const constraint = identifyConstraint(profile, rubric);
  const developmentNeed = identifyDevelopmentNeed(profile, rubric);
  const archetype = identifyStudentArchetype(profile, rubric);
  const candidates = buildRecommendationCandidates(profile, rubric, archetype, constraint, developmentNeed);
  const rankedRecommendation = rankRecommendations(candidates);
  const nextBestMove = {
    ...rankedRecommendation,
    whyNow: generateRecommendationWhyNow(profile, rubric, rankedRecommendation, constraint, developmentNeed),
  };

  const strengths = getStrongAreas(rubric)
    .slice(0, 4)
    .map((area) => ({
      title: strengthTitle(area.name),
      evidence: formatEvidence(area.evidence),
    }));

  const growthOpportunities = getOpportunityAreas(rubric)
    .slice(0, 3)
    .map((area) => ({
      title: area.name,
      evidence: area.evidence[0] ?? "Atlas needs more evidence here",
    }));

  return {
    studentName: displayName(profile.name),
    profileSummary: generateProfileSummary(profile, rubric, nextBestMove),
    understanding,
    constraint,
    developmentNeed,
    rubric,
    archetype,
    strengths,
    growthOpportunities,
    nextBestMove,
    whyAtlasPickedIt: generateWhyAtlasPickedIt(profile, rubric, nextBestMove),
    actionPlan: nextBestMove.actionPlan,
    resourceCategories: nextBestMove.resourceCategories,
    guardrails,
  };
}

export function identifyStudentArchetype(
  profile: StudentProfile,
  rubric: AtlasRubricArea[],
): StudentArchetype {
  const area = (name: string) => rubric.find((rubricArea) => rubricArea.name === name);
  const academics = area("Academics");
  const courseRigor = area("Course Rigor");
  const activities = area("Activities");
  const leadership = area("Leadership");
  const service = area("Service / Community Impact");
  const originalWork = area("Original Work / Projects / Research");
  const differentiation = area("Differentiation");
  const applicationReadiness = area("Application Readiness");
  const direction = area("Interests / Direction");
  const academicConstraint = hasAcademicFoundationConstraint(profile);
  const noOriginalWork = isDevelopingOrOpportunity(originalWork);
  const noLeadership = leadership?.status === "opportunity";
  const hasService = service?.status === "developing" || service?.status === "strong";
  const strongProfile =
    academics?.status === "strong" &&
    courseRigor?.status === "strong" &&
    (activities?.status === "strong" || activities?.status === "developing");
  const unclearDirection =
    profile.interests.length === 0 ||
    direction?.status === "unknown" ||
    (profile.interests.length > 4 && profile.goals.length === 0) ||
    isUncertainDirection(profile);

  const matches = [
    archetypeIf(
      academicConstraint,
      {
        id: "academic_foundation_constraint",
        title:
          hasSportsDirection(profile) && !hasMathConcern(profile)
            ? "Protect Your Academic Foundation"
            : "Strengthen Your Math Foundation",
        description:
          "Your biggest opportunity is strengthening academic performance before adding more activities.",
        evidence: academics?.evidence ?? ["Academic foundation needs more evidence"],
        primaryConstraint: "academic_foundation",
        priority: 1,
      },
      evidenceStrength(academics),
    ),
    archetypeIf(
      academics?.status === "strong" &&
        isDevelopingOrOpportunity(courseRigor) &&
        (courseRigor?.status === "opportunity" || !hasCreativeDirection(profile)),
      {
        id: "course_rigor_constraint",
        title: "Course Rigor Constraint",
        description:
          "You have a solid academic foundation and could benefit from more rigorous or better-aligned coursework.",
        evidence: ["Academics are strong", ...(courseRigor?.evidence ?? ["Course rigor needs more evidence"])],
        primaryConstraint: "course_rigor",
        priority: 2,
      },
      evidenceStrength(courseRigor),
    ),
    archetypeIf(
      unclearDirection,
      {
        id: "direction_clarity_constraint",
        title: "Explore One Clear Direction",
        description:
          "You need a clearer direction so future activities and opportunities tell a stronger story.",
        evidence: profile.interests.length > 0 ? profile.interests : ["Interests are not clear yet"],
        primaryConstraint: "direction_clarity",
        priority: 3,
      },
      isUncertainDirection(profile) ? 13 : 8,
    ),
    archetypeIf(
      hasServiceEducationDirection(profile) &&
        (leadership?.status === "opportunity" || differentiation?.status === "opportunity"),
      {
        id: "service_education_impact_constraint",
        title: "Turn Helping Others Into Measurable Impact",
        description:
          "You have a service or education direction and can turn helping others into clearer impact.",
        evidence: [
          "Service or education direction is present",
          ...(service?.evidence ?? ["Service evidence is developing"]),
          ...(leadership?.evidence ?? ["Leadership evidence can be clearer"]),
        ],
        primaryConstraint: "service_impact",
        priority: 3.6,
      },
      Math.max(evidenceStrength(service), evidenceStrength(leadership)) + 3,
    ),
    archetypeIf(
      (profile.grade === 11 || profile.grade === 12) &&
        strongProfile &&
        isDevelopingOrOpportunity(applicationReadiness) &&
        !noOriginalWork,
      {
        id: "application_readiness_constraint",
        title: "Get Your Application Story Ready",
        description:
          "You have a strong profile and need to organize materials, resume, essays, or application assets.",
        evidence: applicationReadiness?.evidence ?? ["Application materials need organization"],
        primaryConstraint: "application_readiness",
        priority: 3.5,
      },
      evidenceStrength(applicationReadiness) + 2,
    ),
    archetypeIf(
      hasMedicineDirection(profile) &&
        academics?.status === "strong" &&
        hasService &&
        noLeadership &&
        isDevelopingOrOpportunity(originalWork),
      {
        id: "health_service_to_leadership",
        title: "Turn Service Hours Into Leadership",
        description:
          "You have meaningful health or service involvement and can turn it into clearer ownership.",
        evidence: [
          "Health direction is clear",
          ...(service?.evidence ?? ["Service is present"]),
          ...(leadership?.evidence ?? ["Leadership evidence is limited"]),
        ],
        primaryConstraint: "service_impact",
        priority: 3.8,
      },
      evidenceStrength(leadership) + evidenceStrength(service) / 2,
    ),
    archetypeIf(
      hasGamingBuilderDirection(profile) && isDevelopingOrOpportunity(originalWork),
      {
        id: "gaming_builder_differentiation_constraint",
        title: "Turn Gaming Into a Builder Portfolio",
        description:
          "You have gaming or builder energy and can turn it into visible project evidence.",
        evidence: [
          "Gaming, software, or builder direction is present",
          ...(originalWork?.evidence ?? ["Project evidence can become stronger"]),
        ],
        primaryConstraint: "differentiation",
        priority: 3.9,
      },
      evidenceStrength(originalWork) + 2,
    ),
    archetypeIf(
      (academics?.status === "strong" || profile.academics.gpa >= 3.5) &&
        (activities?.status === "strong" || activities?.status === "developing") &&
        isDevelopingOrOpportunity(originalWork),
      {
        id: "strong_foundation_missing_differentiation",
        title: differentiationArchetypeTitle(profile),
        description:
          "You have a strong foundation, and the next step is building original work, research, or a distinctive contribution.",
        evidence: [
          "Academics are strong",
          ...(activities?.evidence.slice(0, 2) ?? ["Activities are developing"]),
          ...(originalWork?.evidence ?? ["Original work needs more evidence"]),
        ],
        primaryConstraint: "differentiation",
        priority: 4,
      },
      Math.max(evidenceStrength(originalWork), evidenceStrength(differentiation)),
    ),
    archetypeIf(
      (hasBusinessDirection(profile) || hasSportsDirection(profile)) &&
        (activities?.status === "strong" || activities?.status === "developing") &&
        leadership?.status === "opportunity",
      {
        id: "leadership_constraint",
        title: hasSportsDirection(profile)
          ? "Strengthen Leadership Through Athletics"
          : "Move From Participant To Leader",
        description:
          "You're involved, and the next step is more ownership, initiative, or measurable influence.",
        evidence: [
          ...(activities?.evidence.slice(0, 2) ?? ["Activities are present"]),
          ...(leadership?.evidence ?? ["Leadership evidence is limited"]),
        ],
        primaryConstraint: "leadership",
        priority: 5,
      },
      evidenceStrength(leadership),
    ),
    archetypeIf(
      (service?.status === "developing" || service?.status === "strong") &&
        (leadership?.status === "opportunity" || differentiation?.status === "opportunity"),
      {
        id: "service_impact_constraint",
        title: "Turn Service Into Measurable Impact",
        description:
          "You have service involvement and can turn those hours into a more meaningful impact story.",
        evidence: [
          ...(service?.evidence ?? ["Service is present"]),
          leadership?.status === "opportunity"
            ? "Leadership evidence can be clearer"
            : "Differentiation can be stronger",
        ],
        primaryConstraint: "service_impact",
        priority: 6,
      },
      Math.max(evidenceStrength(service), evidenceStrength(differentiation)),
    ),
    archetypeIf(
      (profile.grade === 11 || profile.grade === 12) && isDevelopingOrOpportunity(applicationReadiness),
      {
        id: "application_readiness_constraint",
        title: "Get Your Application Story Ready",
        description:
          "You need to organize materials, resume, essays, or application assets.",
        evidence: applicationReadiness?.evidence ?? ["Application materials need organization"],
        primaryConstraint: "application_readiness",
        priority: 7,
      },
      evidenceStrength(applicationReadiness),
    ),
  ].filter((match): match is { archetype: StudentArchetype; evidenceScore: number } => Boolean(match));

  const [highestPriority] = matches.sort((a, b) => a.archetype.priority - b.archetype.priority);

  if (!highestPriority) {
    return fallbackArchetype(profile, rubric).archetype;
  }

  const strongerEvidenceMatch = matches.find(
    (match) =>
      match.archetype.priority > highestPriority.archetype.priority &&
      match.evidenceScore >= highestPriority.evidenceScore + 2.5,
  );

  return (strongerEvidenceMatch ?? highestPriority ?? fallbackArchetype(profile, rubric)).archetype;
}

export function generateProfileSummary(
  profile: StudentProfile,
  rubric: AtlasRubricArea[],
  nextBestMove: Recommendation,
): string {
  const strongAreas = getStrongAreas(rubric).slice(0, 3).map((area) => areaSummaryLabel(area));
  const topOpportunity = getOpportunityAreaForRecommendation(rubric, nextBestMove);
  const direction = getProfileDirection(profile);
  const strengthsText = formatList(strongAreas);
  const opportunityText = topOpportunity
    ? opportunitySummary(profile, topOpportunity, nextBestMove)
    : "the next step is turning your progress into a clearer story";

  return `You're building a ${direction} profile with ${strengthsText}. The next opportunity is ${opportunityText}.`;
}

export function generateWhyAtlasPickedIt(
  profile: StudentProfile,
  rubric: AtlasRubricArea[],
  nextBestMove: Recommendation,
): AtlasAnalysisResponse["whyAtlasPickedIt"] {
  const strongAreas = getStrongAreas(rubric).slice(0, 3);
  const strengths = strengthReasoningLines(profile, strongAreas);
  const topOpportunity = getOpportunityAreaForRecommendation(rubric, nextBestMove);
  const personalContext = buildConversationalReasoning(profile, topOpportunity, nextBestMove);

  return {
    title: "Why this move?",
    subtitle: "Here’s the pattern I see.",
    strengthLabel: "What you already have:",
    strengths: strengths.length > 0 ? strengths : nextBestMove.evidenceUsed.slice(0, 3),
    missingProofLabel: "What would strengthen your profile:",
    missingProof: personalContext,
  };
}

export function getStrongAreas(rubric: AtlasRubricArea[]): AtlasRubricArea[] {
  return [...rubric]
    .filter((area) => area.status === "strong")
    .sort((a, b) => strongAreaPriority(b.name) - strongAreaPriority(a.name));
}

export function getOpportunityAreas(rubric: AtlasRubricArea[]): AtlasRubricArea[] {
  return [...rubric]
    .filter((area) => area.status === "opportunity" || area.status === "developing")
    .sort((a, b) => {
      const bScore = b.importance * 0.55 + b.improvementPotential * 0.45;
      const aScore = a.importance * 0.55 + a.improvementPotential * 0.45;
      return bScore - aScore;
    });
}

function strengthReasoningLines(profile: StudentProfile, areas: AtlasRubricArea[]): string[] {
  return areas.slice(0, 3).map((area) => {
    if (area.name === "Academics") {
      return "Your grades show that you can handle challenging work.";
    }
    if (area.name === "Course Rigor") {
      return "Your classes show that you're willing to stretch yourself.";
    }
    if (area.name === "Service / Community Impact") {
      return "You already have real experience helping people around you.";
    }
    if (area.name === "Activities") {
      return "You have interests outside class that can become a stronger story.";
    }
    if (area.name === "Interests / Direction") {
      return isUncertainDirection(profile)
        ? "You're still figuring out exactly where you want to go, and that's completely normal."
        : identitySignalSentence(profile);
    }

    return `${areaSummaryLabel(area)} is already showing up in your profile.`;
  });
}

function buildConversationalReasoning(
  profile: StudentProfile,
  topOpportunity: AtlasRubricArea | undefined,
  nextBestMove: Recommendation,
): string {
  const constraint = identifyConstraint(profile, buildRubric(profile));
  const developmentNeed = identifyDevelopmentNeed(profile, buildRubric(profile));
  return developmentNeedExplanation(profile, constraint, developmentNeed, nextBestMove, topOpportunity);
}

function conversationalStrengthSummary(profile: StudentProfile): string {
  if (isUncertainDirection(profile)) {
    return "You're still figuring out exactly where you want to go, and that's completely normal.";
  }

  if (profile.academics.gpa >= 3.75 && profile.courseRigor.level === "rigorous") {
    return "You already have the academic side covered. Your grades and coursework show that you can handle challenging work.";
  }

  if (profile.academics.gpa >= 3.45) {
    return "You already have a steady academic foundation to build from.";
  }

  return "You already have interests and effort showing up in your profile.";
}

function conversationalGap(
  profile: StudentProfile,
  topOpportunity: AtlasRubricArea | undefined,
  nextBestMove: Recommendation,
): string {
  if (nextBestMove.category === "improve_grade") {
    return "What would help most right now is making your academic foundation feel more stable and less stressful.";
  }

  if (nextBestMove.category === "increase_course_rigor") {
    return "What people may not see yet is whether your course plan matches the direction you're starting to care about.";
  }

  if (nextBestMove.category === "organize_application_materials" || nextBestMove.category === "improve_essay_material") {
    return "What people may not see yet is the full story behind the work you've already done.";
  }

  if (topOpportunity?.name === "Leadership") {
    return "What people may not see yet is where you've taken ownership instead of just participating.";
  }

  return `What people may not see yet is ${directionSpecificProofText(profile)}.`;
}

function conversationalRecommendationFit(profile: StudentProfile, nextBestMove: Recommendation): string {
  if (isUncertainDirection(profile)) {
    return "That's why this next move is about testing one interest in a small, real way instead of forcing a career choice.";
  }

  if (nextBestMove.category === "improve_grade") {
    return "That's why the next move is to get targeted support in the class that matters most right now.";
  }

  if (nextBestMove.category === "strengthen_leadership") {
    return "That's why this recommendation focuses on turning what you're already doing into visible ownership.";
  }

  return `That's why this recommendation points you toward ${directionSpecificActionText(profile)}.`;
}

function conversationalFutureValue(profile: StudentProfile, nextBestMove: Recommendation): string {
  if (nextBestMove.category === "improve_grade") {
    return "That gives you more confidence now and keeps more future options open later.";
  }

  if (isUncertainDirection(profile)) {
    return "You'll learn more about yourself, and you'll have something real to point to when new opportunities come up.";
  }

  return "It helps you grow in a real direction and gives future applications a clearer story to understand.";
}

function conversationalConstraintText(
  profile: StudentProfile,
  constraint: PrimaryConstraint,
  developmentNeed: DevelopmentNeed,
): string {
  if (constraint === "academic_foundation" && developmentNeed.id !== "academic_foundation") {
    return "The thing that could block progress is your academic foundation, so that needs attention before adding bigger commitments.";
  }

  if (constraint === "academic_foundation") {
    return "The thing that could block progress is your academic foundation, so the next move should make school feel more stable.";
  }

  if (profile.academics.gpa < 3.5 && developmentNeed.id === "technical_builder_portfolio") {
    return "Your academics are worth supporting, but they are not the reason to pause your builder momentum.";
  }

  if (constraint === "direction_clarity") {
    return "The thing that could block progress is not knowing which direction is worth investing in yet.";
  }

  if (constraint === "service_impact") {
    return "The thing that could block progress is having helpful work that people cannot yet understand or measure.";
  }

  if (constraint === "leadership") {
    return "The thing that could block progress is looking like a participant when you may be ready to own something.";
  }

  if (constraint === "application_readiness") {
    return "The thing that could block progress is having good experiences that are not organized into a clear story yet.";
  }

  return "Nothing here says you need to stop and fix a major blocker first.";
}

function developmentNeedExplanation(
  profile: StudentProfile,
  constraint: PrimaryConstraint,
  developmentNeed: DevelopmentNeed,
  nextBestMove: Recommendation,
  topOpportunity?: AtlasRubricArea,
): string {
  if (constraint === "academic_foundation") {
    return academicConstraintExplanation(profile, developmentNeed);
  }

  switch (developmentNeed.id) {
    case "healthcare_exposure":
      return "Healthcare is hard to understand from the outside. Your interest already has a useful starting point, but the next layer is direct exposure: seeing real settings, real people, and real questions. This recommendation gives you a way to test whether the work feels meaningful before you invest more deeply. It also gives future applications a story about curiosity, service, and follow-through.";
    case "technical_builder_portfolio":
      return hasGamingBuilderDirection(profile)
        ? "Games and software are easiest to believe when someone can try what you made. You do not need a huge app; you need one small build that shows how you think, solve problems, and finish. A playable project creates proof of skill and gives you something concrete to improve, share, or enter into a competition."
        : "Engineering grows through making, testing, and improving. Your profile already points toward building, but the next step is a prototype or technical artifact that shows your thinking in motion. A focused build makes your interest easier to understand and gives you material for teachers, programs, and future applications.";
    case "civic_advocacy_proof":
      return "Law and public service become stronger when your opinions meet real people and real problems. You already have the communication side forming; now the opportunity is to choose an issue, listen carefully, and turn your point of view into useful action. That kind of civic work shows judgment, initiative, and a reason behind your interest.";
    case "creative_ownership":
      return hasPerformingArtsDirection(profile)
        ? "Performance is already part of your life, but ownership is different from participation. The next step is showing your choices: what you created, how you practiced, what changed, and what you want an audience to feel. A portfolio or showcase makes your creative growth visible instead of leaving it hidden in rehearsals."
        : "Creative work gets stronger when it starts to show a point of view. You have signals of imagination and expression; the next step is shaping those into a body of work that feels intentionally yours. Sharing or submitting that work helps you grow as a creator and gives others a clearer window into your voice.";
    case "venture_validation":
      return "Business ideas get real when they meet customers. Your entrepreneurial energy is a good sign, but the next step is testing whether people actually want the thing you might offer. Talking to real users, trying a small sale, or measuring interest teaches more than planning alone and creates a sharper story of initiative.";
    case "service_impact":
      return "Helping people already matters in your profile. The next step is making that help easier to see: who you supported, what changed, and what role you played in making it happen. A small mentoring or service initiative can turn kindness into leadership without making the work feel fake or performative.";
    case "direction_testing":
      return "Not knowing yet is not a weakness; it just means guessing would be expensive. The best next move is a small experiment that gives you feedback fast: one conversation, one short experience, one reflection on what gave you energy. That helps you choose future activities with more confidence instead of collecting random options.";
    case "academic_foundation":
      return "Your interests still matter, but grades are the foundation that keeps more doors open. Strengthening the class or skill that feels least stable will make everything else easier to build on. The goal is not perfection; it is confidence, steadier habits, and enough academic room to pursue opportunities without feeling boxed in.";
    default:
      return [
        conversationalStrengthSummary(profile),
        conversationalConstraintText(profile, constraint, developmentNeed),
        conversationalGap(profile, topOpportunity, nextBestMove),
        conversationalRecommendationFit(profile, nextBestMove),
        conversationalFutureValue(profile, nextBestMove),
      ].join(" ");
  }
}

function academicConstraintExplanation(
  profile: StudentProfile,
  developmentNeed: DevelopmentNeed,
): string {
  if (developmentNeed.id === "healthcare_exposure") {
    return "Healthcare is still a direction worth exploring, but medicine asks a lot from your academic foundation. The smartest move is to stabilize the class or skill that is making school harder while keeping one small health-related activity in the background. That way you protect future options without losing touch with the interest that motivates you.";
  }

  if (developmentNeed.id === "technical_builder_portfolio") {
    return "Your builder side is real, and it should not disappear. At the same time, coding and engineering get easier when the academic basics feel steadier. Strengthening the class or skill that is blocking you gives you more confidence, while one small game or coding task keeps your creative momentum alive.";
  }

  return "Your interests are worth building, but the foundation needs attention first. When grades feel unstable, opportunities can narrow before you get to show what you are capable of. The next move is to get support, rebuild rhythm, and make school feel manageable enough for the rest of your profile to grow.";
}

function identitySignalSentence(profile: StudentProfile) {
  if (hasMedicineDirection(profile)) {
    return "Your profile is starting to point toward health, biology, and helping people.";
  }
  if (hasLawPolicyDirection(profile)) {
    return "Your profile has a clear thread around law, debate, policy, and public service.";
  }
  if (hasServiceEducationDirection(profile)) {
    return "Your profile shows a real pull toward helping, teaching, mentoring, or community work.";
  }
  if (hasGamingBuilderDirection(profile)) {
    return "Your profile has builder energy: games, coding, systems, and things people can use.";
  }
  if (hasBusinessDirection(profile)) {
    return "Your profile points toward business, entrepreneurship, and testing ideas in the real world.";
  }
  if (hasPerformingArtsDirection(profile)) {
    return "Your profile shows creative discipline through performance and expression.";
  }
  if (hasArtDirection(profile) || hasWritingDirection(profile)) {
    return "Your profile shows creative voice and a pull toward sharing ideas.";
  }
  if (hasSportsDirection(profile)) {
    return "Your profile shows discipline, team commitment, and room to lead through athletics.";
  }
  if (hasStemDirection(profile)) {
    return "Your profile points toward STEM, problem-solving, and hands-on building.";
  }
  return "Your interests are starting to form a pattern.";
}

function buildStudentUnderstanding(profile: StudentProfile): StudentUnderstanding {
  const futureDirection = primaryInterestDirection(profile);
  const energy = profile.energy ? directionLabel(profile.energy) : inferredDirectionLabel(profile);
  const interests = uniqueCompact([
    futureDirection,
    energy,
    ...profile.interests.map(directionLabel),
  ]).slice(0, 5);
  const motivations = uniqueCompact([
    profile.intent ?? primaryGoal(profile),
    hasServiceDirection(profile) ? "Helping others" : "",
    hasCreativeDirection(profile) ? "Creating and expressing ideas" : "",
    hasBusinessDirection(profile) ? "Building initiative" : "",
    hasStemDirection(profile) || hasMedicineDirection(profile) ? "Solving real problems" : "",
  ]).slice(0, 4);

  return {
    becoming: `${displayName(profile.name)} is becoming a ${futureDirection.toLowerCase()}-oriented student with energy around ${energy.toLowerCase()}.`,
    identitySignals: {
      futureDirection,
      energy,
      interests,
      motivations,
    },
    evidenceSignals: {
      academicStrength: academicStrengthLabel(profile),
      activities: profile.activities.map((activity) => activity.name).slice(0, 6),
      leadership: profile.leadership.map((item) => item.role).slice(0, 4),
      service: profile.service.notes.slice(0, 4),
      projects: profile.projects.map((project) => project.title).slice(0, 5),
    },
  };
}

function identifyConstraint(profile: StudentProfile, rubric: AtlasRubricArea[]): PrimaryConstraint {
  const area = (name: string) => rubric.find((rubricArea) => rubricArea.name === name);
  const courseRigor = area("Course Rigor");
  const leadership = area("Leadership");
  const service = area("Service / Community Impact");
  const applicationReadiness = area("Application Readiness");

  if (hasSevereAcademicConstraint(profile)) {
    return "academic_foundation";
  }

  if (isUncertainDirection(profile)) {
    return "direction_clarity";
  }

  if (profile.academics.gpa >= 3.8 && isDevelopingOrOpportunity(courseRigor) && courseRigor?.status === "opportunity") {
    return "course_rigor";
  }

  if (hasServiceEducationDirection(profile) && service?.status !== "opportunity") {
    return "service_impact";
  }

  if ((hasBusinessDirection(profile) || hasSportsDirection(profile)) && leadership?.status === "opportunity") {
    return "leadership";
  }

  if ((profile.grade === 11 || profile.grade === 12) && isDevelopingOrOpportunity(applicationReadiness) && profile.projects.length > 0) {
    return "application_readiness";
  }

  return "none";
}

function identifyDevelopmentNeed(profile: StudentProfile, rubric: AtlasRubricArea[]): DevelopmentNeed {
  if (isUncertainDirection(profile)) {
    return developmentNeed("direction_testing", [
      profile.futureDirection ?? "Direction is still forming",
      primaryGoal(profile),
    ]);
  }

  if (hasLawPolicyDirection(profile)) {
    return developmentNeed("civic_advocacy_proof", profile.interests);
  }

  if (hasMedicineDirection(profile)) {
    return developmentNeed("healthcare_exposure", [
      profile.futureDirection ?? "Health direction",
      ...profile.service.notes,
    ]);
  }

  if (hasServiceEducationDirection(profile)) {
    return developmentNeed("service_impact", [
      profile.futureDirection ?? "Service direction",
      ...profile.service.notes,
    ]);
  }

  if (hasGamingBuilderDirection(profile) || hasStemDirection(profile)) {
    return developmentNeed("technical_builder_portfolio", [
      profile.futureDirection ?? "Technical direction",
      profile.energy ?? "",
      ...profile.activities.map((activity) => activity.name),
    ]);
  }

  if (hasBusinessDirection(profile)) {
    return developmentNeed("venture_validation", [
      profile.futureDirection ?? "Business direction",
      profile.energy ?? "",
      ...profile.activities.map((activity) => activity.name),
    ]);
  }

  if (hasCreativeDirection(profile)) {
    return developmentNeed("creative_ownership", [
      profile.futureDirection ?? "Creative direction",
      profile.energy ?? "",
      ...profile.projects.map((project) => project.title),
    ]);
  }

  if (hasSevereAcademicConstraint(profile)) {
    return developmentNeed("academic_foundation", [
      `${profile.academics.gpa.toFixed(2)} GPA`,
      ...profile.academics.notes,
    ]);
  }

  const topOpportunity = getOpportunityAreas(rubric)[0];
  return developmentNeed("direction_testing", topOpportunity?.evidence ?? ["A clearer direction would help"]);
}

function developmentNeed(id: DevelopmentNeed["id"], evidence: string[]): DevelopmentNeed {
  const needs: Record<DevelopmentNeed["id"], Omit<DevelopmentNeed, "evidence">> = {
    civic_advocacy_proof: {
      id: "civic_advocacy_proof",
      title: "Civic advocacy proof",
      description:
        "Prove your interest through advocacy, civic work, debate leadership, policy writing, public service, or local issue work.",
      preferredRecommendationCategories: ["build_original_project", "strengthen_leadership"],
      actionPlanStyle: "civic_issue_to_public_solution",
    },
    creative_ownership: {
      id: "creative_ownership",
      title: "Creative ownership",
      description:
        "Show creative ownership through choreography, portfolio work, showcase, mentoring, performance leadership, or submitted creative work.",
      preferredRecommendationCategories: ["build_original_project", "pursue_competition"],
      actionPlanStyle: "creative_portfolio_or_showcase",
    },
    healthcare_exposure: {
      id: "healthcare_exposure",
      title: "Healthcare exposure",
      description:
        "Test healthcare interest through shadowing, volunteering, public health, research exposure, or health-related service.",
      preferredRecommendationCategories: ["gain_research_experience", "build_original_project", "find_program"],
      actionPlanStyle: "health_exposure_plus_reflection",
    },
    technical_builder_portfolio: {
      id: "technical_builder_portfolio",
      title: "Technical builder portfolio",
      description:
        "Build technical proof through apps, robotics, games, coding portfolio, competitions, or maker projects.",
      preferredRecommendationCategories: ["build_original_project", "pursue_competition"],
      actionPlanStyle: "technical_build_portfolio",
    },
    venture_validation: {
      id: "venture_validation",
      title: "Venture validation",
      description:
        "Test initiative through selling, customer discovery, a small venture, DECA, market validation, or a measurable business project.",
      preferredRecommendationCategories: ["build_original_project", "strengthen_leadership"],
      actionPlanStyle: "venture_customer_validation",
    },
    direction_testing: {
      id: "direction_testing",
      title: "Direction testing",
      description:
        "Explore possible directions through low-risk experiences, short projects, conversations, and focused experiments.",
      preferredRecommendationCategories: ["build_original_project", "find_program"],
      actionPlanStyle: "low_risk_interest_tests",
    },
    service_impact: {
      id: "service_impact",
      title: "Service impact",
      description:
        "Turn helping into measurable impact through tutoring, mentoring, organizing, or community leadership.",
      preferredRecommendationCategories: ["strengthen_leadership", "deepen_service_impact", "build_original_project"],
      actionPlanStyle: "measurable_service_initiative",
    },
    academic_foundation: {
      id: "academic_foundation",
      title: "Academic foundation",
      description:
        "Improve grades, study systems, course support, tutoring, teacher help, and academic confidence.",
      preferredRecommendationCategories: ["improve_grade", "find_tutor"],
      actionPlanStyle: "academic_stability_first",
    },
  };

  return {
    ...needs[id],
    evidence: evidence.filter(Boolean),
  };
}

function uniqueCompact(items: string[]) {
  return Array.from(new Set(items.map((item) => item.trim()).filter(Boolean)));
}

function archetypeIf(
  condition: boolean,
  archetype: StudentArchetype,
  evidenceScore: number,
) {
  return condition ? { archetype, evidenceScore } : null;
}

function isDevelopingOrOpportunity(area?: AtlasRubricArea) {
  return area?.status === "developing" || area?.status === "opportunity";
}

function evidenceStrength(area?: AtlasRubricArea): number {
  if (!area) {
    return 0;
  }

  const statusWeight = area.status === "opportunity" ? 3 : area.status === "developing" ? 2 : 1;
  return area.importance * 0.45 + area.improvementPotential * 0.45 + statusWeight;
}

function fallbackArchetype(
  profile: StudentProfile,
  rubric: AtlasRubricArea[],
): { archetype: StudentArchetype; evidenceScore: number } {
  const topOpportunity = getOpportunityAreas(rubric)[0];

  return {
    archetype: {
      id: "application_readiness_constraint",
      title: "Get Your Application Story Ready",
      description:
        "You need to organize materials, resume, essays, or application assets.",
      evidence: topOpportunity?.evidence ?? [`${displayName(profile.name)} has a strong base and needs a clearer next step`],
      primaryConstraint: "application_readiness",
      priority: 7,
    },
    evidenceScore: evidenceStrength(topOpportunity),
  };
}

function archetypeBoost(
  category: RecommendationCategory,
  archetype: StudentArchetype,
): number {
  const boosts: Record<StudentArchetype["primaryConstraint"], Partial<Record<RecommendationCategory, number>>> = {
    academic_foundation: {
      improve_grade: 5,
      find_tutor: 4,
    },
    course_rigor: {
      increase_course_rigor: 2.4,
    },
    direction_clarity: {
      find_program: 1.8,
      pursue_competition: 1.4,
      build_original_project: 3.4,
    },
    differentiation: {
      gain_research_experience: 2.4,
      build_original_project: 2,
    },
    leadership: {
      strengthen_leadership: 2.4,
    },
    service_impact: {
      deepen_service_impact: 2.4,
      strengthen_leadership: 3.2,
      build_original_project: 2.2,
    },
    application_readiness: {
      organize_application_materials: 2.2,
      create_resume: 1.8,
      improve_essay_material: 1.6,
    },
    scholarship_optimization: {
      find_scholarships: 2.4,
      organize_application_materials: 1.4,
    },
    overextension: {
      organize_application_materials: 1.5,
    },
    none: {},
  };

  return boosts[archetype.primaryConstraint][category] ?? 0;
}

function developmentNeedBoost(
  category: RecommendationCategory,
  developmentNeed: DevelopmentNeed,
  constraint: PrimaryConstraint,
): number {
  if (constraint === "academic_foundation") {
    return developmentNeed.id === "academic_foundation" && category === "improve_grade" ? 6 : 0;
  }

  const baseBoost = developmentNeed.preferredRecommendationCategories.includes(category) ? 4 : 0;
  const specificBoosts: Partial<Record<DevelopmentNeed["id"], Partial<Record<RecommendationCategory, number>>>> = {
    civic_advocacy_proof: { build_original_project: 2, strengthen_leadership: 1 },
    creative_ownership: { build_original_project: 2 },
    healthcare_exposure: { gain_research_experience: 2, build_original_project: 1.5 },
    technical_builder_portfolio: { build_original_project: 3, pursue_competition: 1 },
    venture_validation: { build_original_project: 3, strengthen_leadership: 1 },
    direction_testing: { build_original_project: 2 },
    service_impact: { strengthen_leadership: 2, deepen_service_impact: 2 },
    academic_foundation: { improve_grade: 4, find_tutor: 3 },
  };

  return baseBoost + (specificBoosts[developmentNeed.id]?.[category] ?? 0);
}

function constraintBoost(category: RecommendationCategory, constraint: PrimaryConstraint): number {
  const boosts: Partial<Record<PrimaryConstraint, Partial<Record<RecommendationCategory, number>>>> = {
    academic_foundation: { improve_grade: 10, find_tutor: 8 },
    course_rigor: { increase_course_rigor: 4 },
    direction_clarity: { build_original_project: 3, find_program: 2 },
    leadership: { strengthen_leadership: 4 },
    service_impact: { strengthen_leadership: 3, deepen_service_impact: 3, build_original_project: 1 },
    application_readiness: { organize_application_materials: 4, improve_essay_material: 3, create_resume: 3 },
    differentiation: { build_original_project: 2, gain_research_experience: 2 },
    scholarship_optimization: { find_scholarships: 3 },
    overextension: { organize_application_materials: 2 },
    none: {},
  };

  return boosts[constraint]?.[category] ?? 0;
}

function buildRubric(profile: StudentProfile): AtlasRubricArea[] {
  const originalWork = profile.projects.filter(
    (project) =>
      project.type === "research" ||
      project.type === "original_project" ||
      project.type === "creative_portfolio",
  );
  const completedOriginalWork = originalWork.filter((project) => project.status === "complete");
  const hasResume = profile.documents.some((document) => document.type === "resume");
  const essayInProgress = profile.essays.some((essay) => essay.status !== "not_started");
  const hasEssayDocument = profile.documents.some((document) => document.type === "essay");
  const hasStrongAwards = profile.awards.some(
    (award) => award.level === "regional" || award.level === "state" || award.level === "national",
  );

  return [
    {
      name: "Academics",
      status: profile.academics.gpa >= 3.8 ? "strong" : profile.academics.gpa >= 3 ? "developing" : "opportunity",
      evidence: [`${profile.academics.gpa.toFixed(2)} GPA`, ...profile.academics.notes],
      importance: 9,
      improvementPotential: profile.academics.gpa >= 3.8 ? 3 : profile.academics.gpa >= 3.5 ? 5 : profile.academics.gpa >= 3 ? 8 : 10,
    },
    {
      name: "Course Rigor",
      status: profile.courseRigor.level === "rigorous" ? "strong" : profile.courseRigor.level === "balanced" ? "developing" : "opportunity",
      evidence: [
        `${profile.courseRigor.courses.length} current or notable courses`,
        profile.courseRigor.level,
        ...profile.courseRigor.courses.slice(0, 3),
        ...(profile.schoolName ? [`School: ${profile.schoolName}`] : []),
      ],
      importance: 8,
      improvementPotential: profile.courseRigor.level === "rigorous" ? 3 : 7,
    },
    {
      name: "Activities",
      status: profile.activities.length >= 3 ? "strong" : profile.activities.length > 0 ? "developing" : "opportunity",
      evidence: profile.activities.map((activity) => activity.name),
      importance: 7,
      improvementPotential: profile.activities.length >= 3 ? 4 : 7,
    },
    {
      name: "Leadership",
      status: profile.leadership.length > 0 ? "developing" : "opportunity",
      evidence: profile.leadership.length > 0 ? profile.leadership.map((item) => `${item.role} in ${item.organization}`) : ["Limited leadership evidence"],
      importance: 7,
      improvementPotential: profile.leadership.length > 0 ? 6 : 8,
    },
    {
      name: "Service / Community Impact",
      status: profile.service.hours >= 100 ? "strong" : profile.service.hours > 0 ? "developing" : "opportunity",
      evidence: [`${profile.service.hours}+ volunteer hours`, ...profile.service.notes],
      importance: 7,
      improvementPotential: profile.service.hours >= 100 ? 4 : 7,
    },
    {
      name: "Awards / Recognition",
      status: profile.awards.length >= 5 ? "strong" : profile.awards.length > 0 ? "developing" : "opportunity",
      evidence: [`${profile.awards.length} awards and honors`, ...profile.awards.slice(0, 2).map((award) => award.title)],
      importance: 6,
      improvementPotential: profile.awards.length >= 5 ? 4 : 7,
    },
    {
      name: "Original Work / Projects / Research",
      status: completedOriginalWork.length > 0 ? "strong" : originalWork.length > 0 ? "developing" : "opportunity",
      evidence: originalWork.length > 0 ? originalWork.map((project) => project.title) : ["Limited evidence of independent research or original project work"],
      importance: 9,
      improvementPotential: completedOriginalWork.length > 0 ? 3 : originalWork.length > 0 ? 7 : 10,
    },
    {
      name: "Interests / Direction",
      status: profile.interests.length >= 3 && profile.goals.length > 0 ? "strong" : "developing",
      evidence: [
        ...profile.interests.slice(0, 3),
        ...profile.goals.slice(0, 1),
        ...(profile.notes ? [`Student note: ${narrativeEvidence(profile)}`] : []),
      ],
      importance: 8,
      improvementPotential: 5,
    },
    {
      name: "Differentiation",
      status: completedOriginalWork.length > 0 && hasStrongAwards ? "strong" : originalWork.length > 0 ? "developing" : "opportunity",
      evidence:
        completedOriginalWork.length > 0 && hasStrongAwards
          ? ["Completed original work and meaningful recognition"]
          : originalWork.length > 0
            ? ["Some project evidence"]
            : ["Profile is strong, but needs a clearer original contribution"],
      importance: 9,
      improvementPotential: completedOriginalWork.length > 0 && hasStrongAwards ? 3 : originalWork.length > 0 ? 7 : 10,
    },
    {
      name: "Application Readiness",
      status: hasResume && essayInProgress && hasEssayDocument ? "strong" : hasResume && essayInProgress ? "developing" : "opportunity",
      evidence: [
        hasResume ? "Resume uploaded" : "No resume document yet",
        essayInProgress ? "Essay material started" : "Essay material not started",
      ],
      importance: profile.grade >= 12 ? 9 : 6,
      improvementPotential: hasResume && essayInProgress && hasEssayDocument ? 4 : hasResume && essayInProgress ? 6 : 7,
    },
  ];
}

function buildRecommendationCandidates(
  profile: StudentProfile,
  rubric: AtlasRubricArea[],
  archetype: StudentArchetype,
  constraint: PrimaryConstraint,
  developmentNeed: DevelopmentNeed,
): CandidateRecommendation[] {
  const area = (name: string) => rubric.find((rubricArea) => rubricArea.name === name);
  const originalWorkGap = area("Original Work / Projects / Research");
  const differentiationGap = area("Differentiation");
  const academics = area("Academics");
  const courseRigor = area("Course Rigor");
  const leadership = area("Leadership");
  const applicationReadiness = area("Application Readiness");
  const academicConstraint = hasAcademicFoundationConstraint(profile);
  const mathRecommendation = shouldRecommendMathPerformance(profile);
  const originalWorkScore = averagePotential(originalWorkGap, differentiationGap);
  const leadershipScore = leadership?.improvementPotential ?? 6;
  const applicationReadinessScore = applicationReadiness?.improvementPotential ?? 6;

  const candidates: CandidateRecommendation[] = [
    makeCandidate({
      title: researchRecommendationTitle(profile),
      category: "gain_research_experience",
      confidence: "medium",
      whyNow: "",
      evidenceUsed: hasMedicineDirection(profile)
        ? ["Strong grades", "Health interest", "Service involvement", "Limited research or shadowing"]
        : ["Strong grades", "Competition experience", "Community involvement", "Limited original work"],
      expectedImpact: [
        hasMedicineDirection(profile) ? "Strengthens health pathway story" : "Strengthens STEM narrative",
        "Improves differentiation",
        "Creates stronger scholarship and application material",
      ],
      actionPlan: researchActionPlan(),
      resourceCategories: hasMedicineDirection(profile)
        ? ["health exposure programs", "local hospital volunteering", "research mentors"]
        : ["research programs", "local university labs", "independent project mentors"],
      gapScore: originalWorkScore,
      alignmentScore: hasStemDirection(profile) || hasMedicineDirection(profile) ? 9 : 4,
      applicationImpactScore: 9,
      actionabilityScore: 8,
      resourceAvailabilityScore: 8,
    }),
    makeCandidate({
      title: originalProjectRecommendationTitle(profile, developmentNeed),
      category: "build_original_project",
      confidence: "medium",
      whyNow: "",
      evidenceUsed: hasMedicineDirection(profile)
        ? ["Health interest", "Service involvement", "Opportunity for research, shadowing, or a health project"]
        : hasGamingBuilderDirection(profile)
        ? ["Gaming and coding interest", "Early builder energy", "Project evidence in progress"]
        : hasCreativeDirection(profile)
          ? ["Creative interests", "Portfolio evidence", "Writing, theater, art, or media direction"]
        : hasServiceEducationDirection(profile)
          ? ["Service or education direction", "Helping others", "Opportunity to make impact measurable"]
        : isUncertainDirection(profile)
          ? ["Strong academic foundation", "Exploring interests", "Needs one clearer direction to test"]
        : hasBusinessDirection(profile)
          ? ["Business interests", "Activity involvement", "Limited venture or original project evidence"]
        : ["STEM interests", "Limited original work", "Science fair experience"],
      expectedImpact: ["Creates tangible evidence", "Builds essay material", "Shows initiative"],
      actionPlan: [
        ...developmentActionPlan(profile, developmentNeed),
      ],
      resourceCategories: hasMedicineDirection(profile)
        ? ["health project mentors", "public health project ideas", "shadowing and exposure options"]
        : hasGamingBuilderDirection(profile)
        ? ["game project templates", "coding portfolio ideas", "youth coding competitions"]
        : hasCreativeDirection(profile)
          ? ["portfolio projects", "writing submissions", "arts competitions"]
        : hasServiceEducationDirection(profile)
          ? ["mentoring project guides", "tutoring program templates", "community impact tracking"]
        : isUncertainDirection(profile)
          ? ["interest exploration projects", "career conversations", "short student programs"]
        : hasBusinessDirection(profile)
          ? ["student venture guides", "business project mentors", "DECA project ideas"]
        : hasStemDirection(profile) || hasMedicineDirection(profile)
          ? ["project mentors", "science project guides", "student research journals"]
          : ["project mentors", "activity exploration guides", "student showcase ideas"],
      gapScore: originalWorkScore,
      alignmentScore: developmentNeed.id === "technical_builder_portfolio"
        ? 11
        : hasMedicineDirection(profile)
        ? 9
        : hasGamingBuilderDirection(profile)
        ? 10
        : hasCreativeDirection(profile)
          ? 9
        : hasServiceEducationDirection(profile)
          ? 9
        : isUncertainDirection(profile)
          ? 10
        : hasBusinessDirection(profile)
          ? 9
          : hasStemDirection(profile)
            ? 8
            : 6,
      applicationImpactScore: 8,
      actionabilityScore: 9,
      resourceAvailabilityScore: 7,
    }),
    makeCandidate({
      title: leadershipRecommendationTitle(profile),
      category: "strengthen_leadership",
      confidence: "medium",
      whyNow: "",
      evidenceUsed: ["Activities", "Community involvement", "Developing leadership evidence"],
      expectedImpact: ["Clarifies ownership", "Shows initiative", "Creates stronger recommendation context"],
      actionPlan: leadershipActionPlan(profile),
      resourceCategories: hasServiceEducationDirection(profile)
        ? ["mentoring programs", "tutoring templates", "community impact trackers"]
        : ["leadership roles", "community organizations", "school clubs"],
      gapScore: leadershipScore,
      alignmentScore: hasSportsDirection(profile) || hasBusinessDirection(profile) || hasServiceDirection(profile) || hasServiceEducationDirection(profile) ? 9 : 7,
      applicationImpactScore: 7,
      actionabilityScore: 8,
      resourceAvailabilityScore: 7,
    }),
    makeCandidate({
      title: "Get Your Application Story Ready",
      category: "improve_essay_material",
      confidence: "medium",
      whyNow: "",
      evidenceUsed: applicationReadiness?.evidence ?? ["Application material evidence unknown"],
      expectedImpact: ["Sharpens the student story", "Improves readiness", "Makes strong work easier to understand"],
      actionPlan: [
        { title: "Revise the personal statement", type: "essay", priority: 1, impact: "high", label: "Start here" },
        { title: "Match resume bullets to the story you want people to remember", type: "document", priority: 2, impact: "high", label: "Make it clear" },
        { title: "Prepare scholarship-ready short answers", type: "essay", priority: 3, impact: "medium", label: "Reuse later" },
      ],
      resourceCategories: ["essay review", "resume polish", "scholarship essays"],
      gapScore: applicationReadinessScore,
      alignmentScore: 8,
      applicationImpactScore: profile.grade >= 12 ? 10 : 7,
      actionabilityScore: 9,
      resourceAvailabilityScore: 9,
    }),
    makeCandidate({
      title: "Find Scholarship Matches",
      category: "find_scholarships",
      confidence: "medium",
      whyNow: "",
      evidenceUsed: ["Strong profile evidence", "Awards", "Application materials"],
      expectedImpact: ["Turns readiness into action", "Finds aligned funding opportunities", "Uses existing achievements well"],
      actionPlan: [
        { title: "Build a scholarship shortlist", type: "document", priority: 1, impact: "high", label: "Start here" },
        { title: "Reuse essay themes for short responses", type: "essay", priority: 2, impact: "medium", label: "Save time" },
        { title: "Track deadlines and requirements", type: "document", priority: 3, impact: "medium", label: "Stay ready" },
      ],
      resourceCategories: ["biology scholarships", "medical pathway scholarships", "local New Jersey scholarships"],
      gapScore: profile.grade >= 12 ? 7 : 4,
      alignmentScore: 8,
      applicationImpactScore: profile.grade >= 12 ? 9 : 5,
      actionabilityScore: 8,
      resourceAvailabilityScore: 9,
    }),
    makeCandidate({
      title: "Organize Application Materials",
      category: "organize_application_materials",
      confidence: "medium",
      whyNow: "",
      evidenceUsed: ["Transcript uploaded", "Award certificate uploaded", "No resume document yet"],
      expectedImpact: ["Improves readiness", "Makes future applications faster", "Reveals remaining gaps"],
      actionPlan: [
        { title: "Create a first resume draft", type: "document", priority: 1, impact: "medium", label: "Start here" },
        { title: "Group awards and activities", type: "document", priority: 2, impact: "medium", label: "Clean it up" },
        { title: "Write three story notes", type: "essay", priority: 3, impact: "medium", label: "Future essays" },
      ],
      resourceCategories: ["resume templates", "activity trackers", "essay idea banks"],
      gapScore: applicationReadinessScore,
      alignmentScore: 6,
      applicationImpactScore: profile.grade >= 12 ? 9 : 6,
      actionabilityScore: 10,
      resourceAvailabilityScore: 9,
    }),
    makeCandidate({
      title: "Increase Course Rigor",
      category: "increase_course_rigor",
      confidence: "low",
      whyNow: "",
      evidenceUsed: courseRigor?.evidence ?? ["Course rigor unknown"],
      expectedImpact: ["Shows academic stretch", "Supports STEM direction"],
      actionPlan: [
        { title: "Review next year science options", type: "course", priority: 1, impact: "medium", label: "Start here" },
        { title: "Ask counselor about AP Physics", type: "course", priority: 2, impact: "medium", label: "Check fit" },
        { title: "Balance rigor with workload", type: "course", priority: 3, impact: "medium", label: "Stay steady" },
      ],
      resourceCategories: ["course planning", "school counselor", "AP readiness resources"],
      gapScore: courseRigor?.improvementPotential ?? 5,
      alignmentScore: hasStemDirection(profile) ? 8 : 5,
      applicationImpactScore: 7,
      actionabilityScore: 6,
      resourceAvailabilityScore: 6,
    }),
    makeCandidate({
      title: mathRecommendation ? "Strengthen Your Math Foundation" : "Strengthen Academic Foundation",
      category: "improve_grade",
      confidence: "low",
      whyNow:
        "If a core STEM grade slips, improving it can be the most important next move.",
      evidenceUsed: academics?.evidence ?? ["Academic evidence unknown"],
      expectedImpact: ["Protects academic foundation", "Improves confidence"],
      actionPlan: academicOverrideActionPlan(profile, developmentNeed, mathRecommendation),
      resourceCategories: ["math tutors", "teacher office hours", "practice plans"],
      gapScore: academicConstraint ? academics?.improvementPotential ?? 8 : 2,
      alignmentScore: mathRecommendation ? 8 : 6,
      applicationImpactScore: 8,
      actionabilityScore: 9,
      resourceAvailabilityScore: 9,
    }),
  ];

  return candidates.map((candidate) => ({
    ...candidate,
    archetypeBoostScore: archetypeBoost(candidate.category, archetype),
    goalBoostScore:
      goalBoost(candidate.category, profile) +
      constraintBoost(candidate.category, constraint) +
      developmentNeedBoost(candidate.category, developmentNeed, constraint),
  }));
}

function rankRecommendations(candidates: CandidateRecommendation[]): Recommendation {
  const [best] = [...candidates].sort((a, b) => scoreCandidate(b) - scoreCandidate(a));

  return {
    title: best.title,
    category: best.category,
    confidence: best.confidence,
    whyNow: best.whyNow,
    evidenceUsed: best.evidenceUsed,
    expectedImpact: best.expectedImpact,
    actionPlan: best.actionPlan,
    resourceCategories: best.resourceCategories,
  };
}

function scoreCandidate(candidate: CandidateRecommendation): number {
  return (
    candidate.gapScore +
    candidate.alignmentScore +
    candidate.applicationImpactScore +
    candidate.actionabilityScore +
    candidate.resourceAvailabilityScore +
    (candidate.archetypeBoostScore ?? 0) +
    (candidate.goalBoostScore ?? 0)
  );
}

function makeCandidate(candidate: CandidateRecommendation): CandidateRecommendation {
  return candidate;
}

function averagePotential(...areas: Array<AtlasRubricArea | undefined>): number {
  const knownAreas = areas.filter((area): area is AtlasRubricArea => Boolean(area));
  if (knownAreas.length === 0) {
    return 5;
  }

  return knownAreas.reduce((total, area) => total + area.improvementPotential, 0) / knownAreas.length;
}

function hasStemDirection(profile: StudentProfile): boolean {
  const directionText = directionTextFor(profile);
  return ["stem", "engineering", "coding", "science", "research", "robotics", "software", "game developer", "game design"].some((term) =>
    directionText.includes(term),
  );
}

function hasMedicineDirection(profile: StudentProfile): boolean {
  const directionText = directionTextFor(profile);
  return ["medicine", "medical", "doctor", "health", "nursing", "public health", "biology", "hospital", "patient"].some((term) =>
    directionText.includes(term),
  );
}

function hasBusinessDirection(profile: StudentProfile): boolean {
  const directionText = directionTextFor(profile);
  return ["business", "entrepreneurship", "entrepreneur", "startup", "deca", "venture"].some((term) =>
    directionText.includes(term),
  );
}

function hasCreativeDirection(profile: StudentProfile): boolean {
  const directionText = directionTextFor(profile);
  return ["dance", "choreography", "writing", "journalism", "newspaper", "theater", "art", "design", "drawing", "media", "creative", "portfolio"].some((term) =>
    directionText.includes(term),
  );
}

function hasWritingDirection(profile: StudentProfile): boolean {
  const directionText = directionTextFor(profile);
  return ["writing", "newspaper", "journalism", "humanities"].some((term) => directionText.includes(term));
}

function hasArtDirection(profile: StudentProfile): boolean {
  const words = tokenizeDirection(profile);
  return words.has("art") || words.has("arts") || words.has("design") || words.has("visual");
}

function hasPerformingArtsDirection(profile: StudentProfile): boolean {
  const directionText = directionTextFor(profile);
  return ["dance", "choreography", "theater", "performing", "performance", "music"].some((term) => directionText.includes(term));
}

function hasLawPolicyDirection(profile: StudentProfile): boolean {
  const directionText = directionTextFor(profile);
  return ["law", "policy", "debate", "government", "public service", "civic"].some((term) => directionText.includes(term));
}

function hasSportsDirection(profile: StudentProfile): boolean {
  const interestGoalText = [...profile.interests, ...profile.goals].join(" ").toLowerCase();
  const sportActivityCount = profile.activities.filter((activity) =>
    activity.category.toLowerCase().includes("sports") ||
    ["soccer", "basketball", "tennis", "track", "volleyball"].some((term) =>
      activity.name.toLowerCase().includes(term),
    ),
  ).length;

  if (interestGoalText.includes("sports") || interestGoalText.includes("athletic")) {
    return true;
  }

  return (
    sportActivityCount >= 2 &&
    !hasStemDirection(profile) &&
    !hasMedicineDirection(profile) &&
    !hasBusinessDirection(profile) &&
    !hasCreativeDirection(profile)
  );
}

function hasServiceDirection(profile: StudentProfile): boolean {
  const directionText = directionTextFor(profile);
  return ["service", "community", "volunteer", "impact"].some((term) => directionText.includes(term));
}

function hasAcademicFoundationConstraint(profile: StudentProfile): boolean {
  return hasSevereAcademicConstraint(profile);
}

function hasSevereAcademicConstraint(profile: StudentProfile): boolean {
  return (
    profile.academics.gpa < 3 ||
    (profile.academics.gpa < 3.5 && primaryGoal(profile).toLowerCase().includes("improve grades")) ||
    hasAcademicConcern(profile)
  );
}

function hasAcademicConcern(profile: StudentProfile): boolean {
  const notes = profile.academics.notes.join(" ").toLowerCase();
  return notes.includes("concern") || notes.includes("needs attention") || notes.includes("needs support");
}

function hasMathConcern(profile: StudentProfile): boolean {
  return profile.academics.notes.join(" ").toLowerCase().includes("math");
}

function shouldRecommendMathPerformance(profile: StudentProfile): boolean {
  return (
    hasMathConcern(profile) ||
    ((hasStemDirection(profile) || hasMedicineDirection(profile)) && profile.academics.gpa < 3.5) ||
    ((hasStemDirection(profile) || hasMedicineDirection(profile)) && profile.courseRigor.level === "light")
  );
}

function isUncertainDirection(profile: StudentProfile): boolean {
  const directionText = `${profile.futureDirection ?? ""} ${primaryGoal(profile)} ${profile.intent ?? ""} ${profile.interests.join(" ")}`.toLowerCase();
  const uncertain = ["not sure", "undecided", "find direction", "find a direction", "still exploring"].some((term) =>
    directionText.includes(term),
  );
  const hasSpecificDirection =
    hasMedicineDirection(profile) ||
    hasLawPolicyDirection(profile) ||
    hasBusinessDirection(profile) ||
    hasCreativeDirection(profile) ||
    hasStemDirection(profile) ||
    hasSportsDirection(profile);

  return uncertain && !hasSpecificDirection;
}

function hasServiceEducationDirection(profile: StudentProfile): boolean {
  const directionText = directionTextFor(profile);
  return [
    "teacher",
    "teaching",
    "education",
    "helping kids",
    "younger students",
    "mentor",
    "mentoring",
    "tutor",
    "tutoring",
    "community impact",
    "community center",
    "nonprofit",
  ].some((term) => directionText.includes(term));
}

function hasGamingBuilderDirection(profile: StudentProfile): boolean {
  const directionText = directionTextFor(profile);
  const tokens = tokenizeDirection(profile);
  const hasGameSignal = [
    "gaming",
    "roblox",
    "minecraft",
    "game design",
    "game developer",
    "game level",
    "building games",
    "small games",
    "modding",
  ].some((term) => directionText.includes(term));
  const hasBuilderSignal = tokens.has("software") || tokens.has("app") || directionText.includes("coding project");
  const hasEngineeringContext = directionText.includes("engineering") || directionText.includes("robotics");

  return hasGameSignal || (hasBuilderSignal && !hasEngineeringContext);
}

function tokenizeDirection(profile: StudentProfile) {
  return new Set(
    [...profile.interests, ...profile.goals, profile.notes ?? "", ...profile.activities.map((activity) => activity.name)]
      .join(" ")
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter(Boolean),
  );
}

function directionTextFor(profile: StudentProfile) {
  return [
    profile.futureDirection ?? "",
    profile.energy ?? "",
    profile.intent ?? "",
    ...profile.interests,
    ...profile.goals,
    profile.notes ?? "",
    ...profile.activities.map((activity) => `${activity.name} ${activity.category}`),
    ...profile.service.focusAreas,
  ]
    .join(" ")
    .toLowerCase();
}

function differentiationArchetypeTitle(profile: StudentProfile): string {
  if (isUncertainDirection(profile)) {
    return "Explore One Clear Direction";
  }
  if (hasServiceEducationDirection(profile)) {
    return "Turn Helping Others Into Real Impact";
  }
  if (hasGamingBuilderDirection(profile)) {
    return "Build a Game or Coding Project You Can Show";
  }
  if (hasMedicineDirection(profile)) {
    return "Explore This Interest In Real Life";
  }
  if (hasBusinessDirection(profile)) {
    return "Build Something You Can Point To";
  }
  if (hasArtDirection(profile)) {
    return "Build a Portfolio That Shows Your Voice";
  }
  if (hasWritingDirection(profile)) {
    return "Share Your Ideas Where People Can See Them";
  }
  if (hasPerformingArtsDirection(profile)) {
    return "Create A Performance Portfolio";
  }
  if (hasLawPolicyDirection(profile)) {
    return "Take Your Civic Interest Beyond The Classroom";
  }
  if (hasSportsDirection(profile)) {
    return "Use Your Team Experience To Lead";
  }
  if (hasStemDirection(profile)) {
    return "Build Something You Can Point To";
  }
  return "Show What You Care About";
}

function researchRecommendationTitle(profile: StudentProfile): string {
  if (hasMedicineDirection(profile)) {
    return "Explore This Interest In Real Life";
  }
  return "Build Something You Can Point To";
}

function originalProjectRecommendationTitle(profile: StudentProfile, developmentNeed?: DevelopmentNeed): string {
  if (developmentNeed?.id === "civic_advocacy_proof") {
    return "Take Your Civic Interest Beyond The Classroom";
  }
  if (developmentNeed?.id === "creative_ownership") {
    return hasPerformingArtsDirection(profile) ? "Create A Performance Portfolio" : "Build a Portfolio That Shows Your Voice";
  }
  if (developmentNeed?.id === "healthcare_exposure") {
    return "Explore Healthcare In Real Life";
  }
  if (developmentNeed?.id === "technical_builder_portfolio") {
    return hasGamingBuilderDirection(profile)
      ? "Build a Game or Coding Project You Can Show"
      : "Build a Technical Project You Can Show";
  }
  if (developmentNeed?.id === "venture_validation") {
    return "Test a Venture With Real People";
  }
  if (developmentNeed?.id === "direction_testing") {
    return "Test Your Interests Through Small Experiences";
  }
  if (developmentNeed?.id === "service_impact") {
    return "Build a Mentoring or Teaching Initiative";
  }
  if (isUncertainDirection(profile)) {
    return "Test Your Interests Through Small Experiences";
  }
  if (hasMedicineDirection(profile)) {
    return "Explore This Interest In Real Life";
  }
  if (hasServiceEducationDirection(profile)) {
    return "Build a Mentoring or Teaching Initiative";
  }
  if (hasGamingBuilderDirection(profile)) {
    return "Build a Game or Coding Project You Can Show";
  }
  if (hasArtDirection(profile)) {
    return "Build a Portfolio That Shows Your Voice";
  }
  if (hasWritingDirection(profile)) {
    return "Share Your Ideas Where People Can See Them";
  }
  if (hasPerformingArtsDirection(profile)) {
    return "Create A Performance Portfolio";
  }
  if (hasLawPolicyDirection(profile)) {
    return "Take Your Civic Interest Beyond The Classroom";
  }
  if (hasSportsDirection(profile)) {
    return "Use Your Team Experience To Lead";
  }
  if (hasBusinessDirection(profile)) {
    return "Build Something You Can Point To";
  }
  if (hasStemDirection(profile)) {
    return "Build Something You Can Point To";
  }
  return "Show What You Care About";
}

function leadershipRecommendationTitle(profile: StudentProfile): string {
  if (hasServiceEducationDirection(profile)) {
    return "Turn Helping Others Into Measurable Impact";
  }
  if (hasMedicineDirection(profile) && profile.service.hours >= 50) {
    return "Turn Service Hours Into Leadership";
  }
  if (hasServiceDirection(profile) && profile.service.hours > 0) {
    return "Turn Service Into Measurable Impact";
  }
  if (hasSportsDirection(profile)) {
    return "Strengthen Leadership Through Athletics";
  }
  if (hasBusinessDirection(profile)) {
    return "Move From Participant To Leader";
  }
  return "Move From Participant To Leader";
}

function goalBoost(category: RecommendationCategory, profile: StudentProfile): number {
  const goalText = profile.goals.join(" ").toLowerCase();
  const boosts: Array<[boolean, Partial<Record<RecommendationCategory, number>>]> = [
    [
      goalText.includes("scholarship"),
      {
        find_scholarships: 1.4,
        organize_application_materials: 0.9,
        improve_essay_material: 0.7,
        improve_grade: 0.4,
      },
    ],
    [
      goalText.includes("summer") || goalText.includes("opportunities") || goalText.includes("program"),
      {
        find_program: 1.2,
        gain_research_experience: 1,
        build_original_project: 0.8,
      },
    ],
    [
      goalText.includes("improve grades") || goalText.includes("academic") || goalText.includes("study"),
      {
        improve_grade: 1.2,
        find_tutor: 1,
      },
    ],
    [
      goalText.includes("leadership") || goalText.includes("lead"),
      {
        strengthen_leadership: 1.2,
        deepen_service_impact: 0.8,
      },
    ],
    [
      goalText.includes("direction") || goalText.includes("not sure"),
      {
        find_program: 1.2,
        pursue_competition: 0.7,
        build_original_project: 2.4,
      },
    ],
    [
      goalText.includes("portfolio") || goalText.includes("project"),
      {
        build_original_project: 1.2,
        gain_research_experience: 0.5,
      },
    ],
    [
      goalText.includes("organize") || goalText.includes("materials") || goalText.includes("application"),
      {
        organize_application_materials: 1.2,
        create_resume: 0.9,
        improve_essay_material: 0.8,
      },
    ],
  ];

  return boosts.reduce((total, [matches, categoryBoosts]) => {
    return total + (matches ? categoryBoosts[category] ?? 0 : 0);
  }, 0);
}

function developmentActionPlan(
  profile: StudentProfile,
  developmentNeed: DevelopmentNeed,
): RecommendationAction[] {
  if (developmentNeed.id === "academic_foundation") {
    return academicActionPlan(shouldRecommendMathPerformance(profile));
  }

  if (developmentNeed.id === "civic_advocacy_proof") {
    return [
      { title: "Pick one issue you actually care about", type: "project", priority: 1, impact: "high", label: "Start here" },
      { title: "Talk to five students, teachers, or community members", type: "activity", priority: 2, impact: "medium", label: "Listen first" },
      { title: "Write one page with the problem, what you learned, and one possible solution", type: "document", priority: 3, impact: "medium", label: "Make it clear" },
      { title: "Share it with debate, student government, a teacher, or the school paper", type: "activity", priority: 4, impact: "medium", label: "Put it out there" },
    ];
  }

  if (developmentNeed.id === "creative_ownership") {
    return hasPerformingArtsDirection(profile)
      ? [
          { title: "Choose one piece or performance that shows your point of view", type: "project", priority: 1, impact: "high", label: "Start here" },
          { title: "Record clips, rehearsal notes, or choreography choices", type: "document", priority: 2, impact: "medium", label: "Show process" },
          { title: "Pursue one showcase, lead role, class performance, or mentor moment", type: "activity", priority: 3, impact: "high", label: "Make it visible" },
        ]
      : [
          { title: "Choose one portfolio theme that feels personal", type: "project", priority: 1, impact: "high", label: "Start here" },
          { title: "Polish three pieces that show your voice", type: "project", priority: 2, impact: "high", label: "Make it real" },
          { title: "Submit or share the work with a real audience", type: "activity", priority: 3, impact: "medium", label: "Put it out there" },
        ];
  }

  if (developmentNeed.id === "healthcare_exposure") {
    return [
      { title: "Find one health exposure, shadowing, or hospital volunteer option", type: "activity", priority: 1, impact: "high", label: "Start here" },
      { title: "Choose one public health question you care about", type: "project", priority: 2, impact: "high", label: "Go deeper" },
      { title: "Document what you learned and what surprised you", type: "document", priority: 3, impact: "medium", label: "Reflect" },
    ];
  }

  if (developmentNeed.id === "technical_builder_portfolio") {
    return hasGamingBuilderDirection(profile)
      ? [
          { title: "Build one small playable game with a clear goal and win condition", type: "project", priority: 1, impact: "high", label: "Start here" },
          { title: "Record a 30-second gameplay demo and three screenshots", type: "document", priority: 2, impact: "high", label: "Make it visible" },
          { title: "Share it on a portfolio page, GitHub, itch.io, or a youth game competition", type: "activity", priority: 3, impact: "medium", label: "Show it" },
        ]
      : [
          { title: "Build one small robotics, engineering, or maker prototype", type: "project", priority: 1, impact: "high", label: "Start here" },
          { title: "Test it, measure what changed, and write down one improvement", type: "document", priority: 2, impact: "high", label: "Think like an engineer" },
          { title: "Show the build log to a robotics coach, STEM teacher, or hackathon mentor", type: "activity", priority: 3, impact: "medium", label: "Get feedback" },
        ];
  }

  if (developmentNeed.id === "venture_validation") {
    return [
      { title: "Pick one small venture idea you could test this month", type: "project", priority: 1, impact: "high", label: "Start here" },
      { title: "Ask five potential customers what they would actually use or buy", type: "activity", priority: 2, impact: "high", label: "Validate" },
      { title: "Track what people said, what changed, and what you would try next", type: "document", priority: 3, impact: "medium", label: "Show learning" },
    ];
  }

  if (developmentNeed.id === "direction_testing") {
    return [
      { title: "Try one short experience in a direction that seems interesting", type: "activity", priority: 1, impact: "high", label: "Start here" },
      { title: "Talk to someone who has done that kind of work", type: "activity", priority: 2, impact: "medium", label: "Learn fast" },
      { title: "Write down what gave you energy and what did not", type: "document", priority: 3, impact: "medium", label: "Reflect" },
    ];
  }

  if (developmentNeed.id === "service_impact") {
    return [
      { title: "Create a small tutoring, mentoring, or community help plan", type: "project", priority: 1, impact: "high", label: "Start here" },
      { title: "Track who you helped and what improved", type: "document", priority: 2, impact: "high", label: "Measure" },
      { title: "Ask one adult or organization how you could make it more useful", type: "activity", priority: 3, impact: "medium", label: "Deepen it" },
    ];
  }

  return originalProjectActionPlan(profile);
}

function originalProjectActionPlan(profile: StudentProfile): RecommendationAction[] {
  if (isUncertainDirection(profile)) {
    return [
      { title: "Try one short interest project", type: "project", priority: 1, impact: "high", label: "Start here" },
      { title: "Talk to someone in a field that seems interesting", type: "activity", priority: 2, impact: "medium", label: "Explore" },
      { title: "Join or try one focused activity", type: "activity", priority: 3, impact: "medium", label: "Test it" },
    ];
  }

  if (hasMedicineDirection(profile)) {
    return [
      { title: "Find one health exposure or shadowing option", type: "activity", priority: 1, impact: "high", label: "Start here" },
      { title: "Launch a small public health service project", type: "project", priority: 2, impact: "high", label: "Make it real" },
      { title: "Document what you learned from the experience", type: "document", priority: 3, impact: "medium", label: "Show growth" },
    ];
  }

  if (hasGamingBuilderDirection(profile)) {
    return [
      { title: "Build one small playable game or coding project", type: "project", priority: 1, impact: "high", label: "Start here" },
      { title: "Document it with screenshots or a short video", type: "document", priority: 2, impact: "high", label: "Make it visible" },
      { title: "Share it or enter a youth coding competition", type: "activity", priority: 3, impact: "medium", label: "Show it" },
    ];
  }

  if (hasServiceEducationDirection(profile)) {
    return [
      { title: "Create a small tutoring or mentoring program", type: "project", priority: 1, impact: "high", label: "Start here" },
      { title: "Track who you helped and what improved", type: "document", priority: 2, impact: "high", label: "Show impact" },
      { title: "Document the project for future applications", type: "document", priority: 3, impact: "medium", label: "Make it real" },
    ];
  }

  if (hasSportsDirection(profile)) {
    return [
      { title: "Choose one athletics leadership story", type: "project", priority: 1, impact: "high", label: "Start here" },
      { title: "Lead a team or youth-sports initiative", type: "activity", priority: 2, impact: "high", label: "Make it real" },
      { title: "Track what changed for the team", type: "document", priority: 3, impact: "medium", label: "Show growth" },
    ];
  }

  if (hasBusinessDirection(profile)) {
    return [
      { title: "Pick one small venture idea", type: "project", priority: 1, impact: "high", label: "Start here" },
      { title: "Test it with five real people", type: "activity", priority: 2, impact: "high", label: "Make it real" },
      { title: "Turn the results into a one-page story", type: "document", priority: 3, impact: "medium", label: "Show initiative" },
    ];
  }

  if (hasLawPolicyDirection(profile)) {
    return [
      { title: "Pick one issue you actually care about", type: "project", priority: 1, impact: "high", label: "Start here" },
      { title: "Talk to five students, teachers, or community members", type: "activity", priority: 2, impact: "medium", label: "Listen first" },
      { title: "Write one page with the problem, what you learned, and one possible solution", type: "document", priority: 3, impact: "medium", label: "Make it clear" },
      { title: "Share it with a teacher, club, school paper, or portfolio", type: "activity", priority: 4, impact: "medium", label: "Put it out there" },
    ];
  }

  if (hasPerformingArtsDirection(profile)) {
    return [
      { title: "Collect performance clips and reflections", type: "project", priority: 1, impact: "high", label: "Start here" },
      { title: "Pursue one visible role or showcase", type: "activity", priority: 2, impact: "high", label: "Stretch" },
      { title: "Build a simple performance portfolio", type: "project", priority: 3, impact: "medium", label: "Make it visible" },
    ];
  }

  if (hasCreativeDirection(profile)) {
    return [
      { title: "Choose one portfolio theme", type: "project", priority: 1, impact: "high", label: "Start here" },
      { title: "Polish three strongest pieces", type: "project", priority: 2, impact: "high", label: "Make it real" },
      { title: "Submit to a writing or arts opportunity", type: "activity", priority: 3, impact: "medium", label: "Share it" },
    ];
  }

  if (hasStemDirection(profile) || hasMedicineDirection(profile)) {
    return [
      { title: "Pick one question or problem you would actually enjoy exploring", type: "project", priority: 1, impact: "high", label: "Start here" },
      { title: "Ask one teacher, mentor, or older student for feedback", type: "activity", priority: 2, impact: "high", label: "Add support" },
      { title: "Make a short page with what you tried, learned, and would do next", type: "document", priority: 3, impact: "medium", label: "Make it real" },
    ];
  }

  return [
    { title: "Try one short project connected to your interests", type: "project", priority: 1, impact: "high", label: "Start here" },
    { title: "Ask a teacher or mentor for feedback", type: "activity", priority: 2, impact: "medium", label: "Add support" },
    { title: "Turn what you learned into a one-page story", type: "document", priority: 3, impact: "medium", label: "Make it real" },
  ];
}

function leadershipActionPlan(profile: StudentProfile): RecommendationAction[] {
  if (hasSportsDirection(profile)) {
    return [
      { title: "Lead one team culture or training initiative", type: "activity", priority: 1, impact: "high", label: "Start here" },
      { title: "Track attendance, effort, or team outcomes", type: "document", priority: 2, impact: "medium", label: "Make it visible" },
      { title: "Ask a coach for one leadership responsibility", type: "activity", priority: 3, impact: "medium", label: "Own it" },
    ];
  }

  if (hasBusinessDirection(profile)) {
    return [
      { title: "Lead one DECA or business-club initiative", type: "activity", priority: 1, impact: "high", label: "Start here" },
      { title: "Recruit two classmates into clear roles", type: "activity", priority: 2, impact: "medium", label: "Build ownership" },
      { title: "Track results in a simple project brief", type: "document", priority: 3, impact: "medium", label: "Show impact" },
    ];
  }

  if (hasServiceEducationDirection(profile)) {
    return [
      { title: "Create a small tutoring or mentoring program", type: "activity", priority: 1, impact: "high", label: "Start here" },
      { title: "Track who you helped and what improved", type: "document", priority: 2, impact: "medium", label: "Show impact" },
      { title: "Document the project for future applications", type: "document", priority: 3, impact: "medium", label: "Make it real" },
    ];
  }

  if (hasServiceDirection(profile) || hasMedicineDirection(profile)) {
    return [
      { title: "Turn one service area into a small initiative", type: "activity", priority: 1, impact: "high", label: "Start here" },
      { title: "Create a simple volunteer playbook", type: "document", priority: 2, impact: "medium", label: "Make it visible" },
      { title: "Track outcomes from the project", type: "document", priority: 3, impact: "medium", label: "Show impact" },
    ];
  }

  return [
    { title: "Lead a small club initiative", type: "activity", priority: 1, impact: "high", label: "Start here" },
    { title: "Invite two people into clear roles", type: "activity", priority: 2, impact: "medium", label: "Build ownership" },
    { title: "Track what changed", type: "document", priority: 3, impact: "medium", label: "Show impact" },
  ];
}

function academicActionPlan(mathRecommendation: boolean): RecommendationAction[] {
  if (mathRecommendation) {
    return [
      { title: "Identify the hardest math unit", type: "tutor", priority: 1, impact: "high", label: "Start here" },
      { title: "Find a tutor or teacher help block", type: "tutor", priority: 2, impact: "high", label: "Get support" },
      { title: "Set a two-week practice plan", type: "course", priority: 3, impact: "medium", label: "Build rhythm" },
    ];
  }

  return [
    { title: "Name the class that needs the most support", type: "course", priority: 1, impact: "high", label: "Start here" },
    { title: "Meet the teacher with one clear question", type: "activity", priority: 2, impact: "high", label: "Get support" },
    { title: "Set a two-week grade recovery plan", type: "document", priority: 3, impact: "medium", label: "Build rhythm" },
  ];
}

function academicOverrideActionPlan(
  profile: StudentProfile,
  developmentNeed: DevelopmentNeed,
  mathRecommendation: boolean,
): RecommendationAction[] {
  if (developmentNeed.id === "healthcare_exposure") {
    return [
      { title: "Identify the science or math unit making health classes harder", type: "course", priority: 1, impact: "high", label: "Start here" },
      { title: "Ask your teacher for one targeted recovery plan", type: "activity", priority: 2, impact: "high", label: "Get support" },
      { title: "Keep one small healthcare exposure activity in the background", type: "activity", priority: 3, impact: "medium", label: "Stay connected" },
    ];
  }

  if (developmentNeed.id === "technical_builder_portfolio") {
    return [
      { title: "Pick the math or computer science skill blocking your builds", type: "course", priority: 1, impact: "high", label: "Start here" },
      { title: "Set a two-week practice plan tied to one small game or coding task", type: "document", priority: 2, impact: "high", label: "Build rhythm" },
      { title: "Ask a teacher, tutor, or coding mentor to review one stuck point", type: "tutor", priority: 3, impact: "medium", label: "Get unstuck" },
    ];
  }

  if (developmentNeed.id === "venture_validation") {
    return [
      { title: "Name the class most likely to limit future business options", type: "course", priority: 1, impact: "high", label: "Start here" },
      { title: "Create a two-week grade recovery plan", type: "document", priority: 2, impact: "high", label: "Stabilize" },
      { title: "Keep one tiny customer interview or selling test in the background", type: "activity", priority: 3, impact: "medium", label: "Stay curious" },
    ];
  }

  return academicActionPlan(mathRecommendation);
}

function researchActionPlan(): RecommendationAction[] {
  return [
    {
      title: "Rutgers Summer Research Program",
      type: "program",
      priority: 1,
      impact: "high",
      label: "Start here",
    },
    {
      title: "NJ Governor’s STEM Scholars",
      type: "program",
      priority: 2,
      impact: "high",
      label: "Also great",
    },
    {
      title: "Independent Research Project",
      type: "project",
      priority: 3,
      impact: "medium",
      label: "Do this now",
    },
  ];
}

function strengthTitle(areaName: string): string {
  const titles: Record<string, string> = {
    Academics: "Strong academics",
    "Course Rigor": "Rigorous coursework",
    Activities: "Well-rounded involvement",
    "Service / Community Impact": "Meaningful community impact",
    "Awards / Recognition": "Recognized achievement",
    "Interests / Direction": "Clear STEM direction",
  };

  return titles[areaName] ?? areaName;
}

function generateRecommendationWhyNow(
  profile: StudentProfile,
  rubric: AtlasRubricArea[],
  nextBestMove: Recommendation,
  constraint: PrimaryConstraint,
  developmentNeed: DevelopmentNeed,
): string {
  if (constraint === "academic_foundation" && developmentNeed.id !== "academic_foundation") {
    return academicConstraintWhyNow(profile, developmentNeed);
  }

  if (constraint === "academic_foundation") {
    return "Your next move is about fundamentals. When a class or study rhythm feels shaky, strengthening it keeps more doors open and makes every future opportunity easier to reach.";
  }

  return developmentNeedWhyNow(profile, developmentNeed);
}

function developmentNeedWhyNow(profile: StudentProfile, developmentNeed: DevelopmentNeed): string {
  switch (developmentNeed.id) {
    case "healthcare_exposure":
      return "Healthcare gets clearer when you see it up close. A shadowing, service, research, or public health experience can help you test the interest before you commit more deeply.";
    case "technical_builder_portfolio":
      return hasGamingBuilderDirection(profile)
        ? "A game or coding build can show how you think in a way a club name cannot. One small finished project is enough to start building a real portfolio."
        : "Engineering is easier to believe when there is a build people can inspect. A small prototype or technical project can show your problem-solving in motion.";
    case "civic_advocacy_proof":
      return "Law and policy become more meaningful when you move from having opinions to taking action on an issue. A civic project gives your interest a real-world shape.";
    case "creative_ownership":
      return hasPerformingArtsDirection(profile)
        ? "Your performance work can say more when it shows your choices, growth, and point of view. A portfolio or showcase helps others see the creator behind the activity."
        : "Creative interests get stronger when they become a body of work. Building and sharing a portfolio gives your voice somewhere to live.";
    case "venture_validation":
      return "An idea becomes more powerful when real people react to it. Testing a small venture teaches you what customers want and shows initiative with evidence behind it.";
    case "service_impact":
      return "Your helping work can become more powerful when the impact is visible. A small mentoring or service initiative can show who you helped and what changed.";
    case "direction_testing":
      return "You do not need to choose your whole future right now. A small experiment can show what gives you energy and what is worth exploring next.";
    case "academic_foundation":
      return "Strengthening your academic foundation keeps more future options open. The goal is confidence and stability, not perfection.";
    default:
      return "The next move should help you grow in a direction that fits your interests and opens more future options.";
  }
}

function academicConstraintWhyNow(profile: StudentProfile, developmentNeed: DevelopmentNeed): string {
  if (developmentNeed.id === "healthcare_exposure") {
    return "Healthcare is still worth exploring, but medicine depends on a steady academic base. Strengthening your grades first protects that path while you keep one small health exposure in the background.";
  }

  if (developmentNeed.id === "technical_builder_portfolio") {
    return "Your coding or builder interest still matters. The priority is stabilizing the academic skill that could hold you back, while keeping one small build alive so you do not lose momentum.";
  }

  return "Your interests are still part of the plan. The priority is making school feel steadier first, because a stronger academic base keeps more future doors open.";
}

function getProfileDirection(profile: StudentProfile): string {
  const directionText = directionTextFor(profile);

  if (["medicine", "medical", "doctor", "health", "nursing", "public health"].some((term) => directionText.includes(term))) {
    return "medicine / health";
  }

  if (["law", "policy", "debate", "government", "public service"].some((term) => directionText.includes(term))) {
    return "law / policy";
  }

  if (["stem", "engineering", "coding", "science", "research", "robotics"].some((term) => directionText.includes(term))) {
    return "STEM-oriented";
  }

  if (
    directionText.includes("dance") ||
    directionText.includes("art") ||
    directionText.includes("design") ||
    directionText.includes("writing") ||
    directionText.includes("theater") ||
    directionText.includes("media")
  ) {
    return "creative";
  }

  if (directionText.includes("business") || directionText.includes("entrepreneur")) {
    return "business-oriented";
  }

  return "student";
}

function primaryGoal(profile: StudentProfile): string {
  if (profile.intent) {
    return profile.intent;
  }

  const explicitGoal = profile.goals.find((goal) =>
    !goal.toLowerCase().startsWith("build a stronger story around") &&
    goal !== "Find the next best move" &&
    goal !== "Create stronger proof of original work",
  );

  return explicitGoal ?? profile.goals[0] ?? "find the next best move";
}

function goalPhrase(goal: string) {
  const cleaned = goal.trim();
  const lower = cleaned.toLowerCase();
  if (lower.startsWith("build ")) {
    return lower.replace(/^build /, "building ");
  }
  if (lower.startsWith("find ")) {
    return lower.replace(/^find /, "finding ");
  }
  if (lower.startsWith("organize ")) {
    return lower.replace(/^organize /, "organizing ");
  }
  if (lower.startsWith("improve ")) {
    return lower.replace(/^improve /, "improving ");
  }
  return lower;
}

function isExploringGoal(profile: StudentProfile): boolean {
  const goal = primaryGoal(profile).toLowerCase();
  return goal.includes("not sure") || goal.includes("find a direction");
}

function primaryInterestDirection(profile: StudentProfile): string {
  if (profile.futureDirection?.trim() && !profile.futureDirection.toLowerCase().includes("not sure")) {
    return directionLabel(profile.futureDirection);
  }

  const interest = profile.interests.find((item) => item.toLowerCase() !== "undecided");

  if (interest) {
    return directionLabel(interest);
  }

  return inferredDirectionLabel(profile);
}

function narrativeEvidence(profile: StudentProfile): string {
  const notes = cleanNarrative(profile.notes ?? "");
  if (!notes) {
    return "";
  }

  const sentences = notes.match(/[^.!?]+[.!?]*/g)?.slice(0, 2).join(" ").trim() ?? notes;
  return sentences.length > 170 ? `${sentences.slice(0, 167).trim()}...` : sentences;
}

function cleanNarrative(text: string) {
  const cleaned = text
    .trim()
    .replace(/\bim\b/gi, "I’m")
    .replace(/\bi am\b/gi, "I’m")
    .replace(/\s+/g, " ");

  return cleaned ? `${cleaned.charAt(0).toUpperCase()}${cleaned.slice(1)}` : "";
}

function displayName(name: string) {
  const trimmed = name.trim() || "Student";
  return trimmed
    .split(/\s+/)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

function pronoun(profile: StudentProfile, type: "subject" | "possessive") {
  const lowerName = profile.name.toLowerCase();
  const masculine = ["tim", "jake", "max", "leo"].some((name) => lowerName.includes(name));
  const feminine = ["sarah", "emma", "ava", "mia", "lily", "nora"].some((name) => lowerName.includes(name));

  if (masculine) {
    return type === "possessive" ? "his" : "he";
  }

  if (feminine) {
    return type === "possessive" ? "her" : "she";
  }

  return type === "possessive" ? "their" : "they";
}

function sentencePronoun(profile: StudentProfile) {
  const subject = pronoun(profile, "subject");
  return `${subject.charAt(0).toUpperCase()}${subject.slice(1)}`;
}

function progressVerb(profile: StudentProfile) {
  return pronoun(profile, "subject") === "they" ? "show" : "shows";
}

function directionLabel(direction: string) {
  const lower = direction.toLowerCase();
  if (["medicine", "medical", "health", "biology", "public health"].some((term) => lower.includes(term))) {
    return "Medicine / Health";
  }
  if (["law", "policy", "government", "public service", "debate"].some((term) => lower.includes(term))) {
    return "Law / Policy";
  }
  if (["art", "design", "drawing"].some((term) => lower.includes(term))) {
    return "Art / Design";
  }
  if (["writing", "journalism", "newspaper", "reading"].some((term) => lower.includes(term))) {
    return "Writing / Humanities";
  }
  if (["business", "entrepreneur", "deca"].some((term) => lower.includes(term))) {
    return "Business";
  }
  if (["gaming", "game", "software", "app"].some((term) => lower.includes(term))) {
    return "Creative / Builder";
  }
  if (["stem", "coding", "robotics", "engineering"].some((term) => lower.includes(term))) {
    return "STEM / Engineering";
  }
  if (["teacher", "education", "tutoring", "mentoring"].some((term) => lower.includes(term))) {
    return "Education / Service";
  }
  if (["dance", "music", "theater", "performance"].some((term) => lower.includes(term))) {
    return "Creative / Performance";
  }
  if (["sports", "soccer", "track", "basketball"].some((term) => lower.includes(term))) {
    return "Sports / Athletics";
  }
  return `${direction.charAt(0).toUpperCase()}${direction.slice(1)}`;
}

function inferredDirectionLabel(profile: StudentProfile) {
  if (hasMedicineDirection(profile)) return "Medicine / Health";
  if (hasLawPolicyDirection(profile)) return "Law / Policy";
  if (hasServiceEducationDirection(profile)) return "Education / Service";
  if (hasGamingBuilderDirection(profile)) return "Creative / Builder";
  if (hasArtDirection(profile)) return "Art / Design";
  if (hasWritingDirection(profile)) return "Writing / Humanities";
  if (hasBusinessDirection(profile)) return "Business";
  if (hasStemDirection(profile)) return "STEM / Engineering";
  if (hasSportsDirection(profile)) return "Sports / Athletics";
  return getProfileDirection(profile);
}

function academicStrengthLabel(profile: StudentProfile) {
  if (profile.academics.gpa >= 3.8) {
    return "Mostly A's";
  }
  if (profile.academics.gpa >= 3.45) {
    return "A/B student";
  }
  if (profile.academics.gpa >= 3) {
    return "Mostly B's";
  }
  return "Below B's";
}

function interpretedDirectionInsight(profile: StudentProfile) {
  const inferred = inferredDirectionLabel(profile);
  const selected = profile.interests.find((item) => item.toLowerCase() !== "undecided");

  if (selected && directionLabel(selected) !== inferred) {
    return `a selected interest in ${directionLabel(selected)} and an emerging interest in ${inferred}`;
  }

  return `a clear interest in ${inferred}`;
}

function secondPersonDirectionSignal(profile: StudentProfile) {
  if (hasMedicineDirection(profile)) {
    return "Your profile points toward health, biology, or helping people through medicine.";
  }
  if (hasLawPolicyDirection(profile)) {
    return "Your profile has a clear thread around law, policy, debate, or public service.";
  }
  if (hasServiceEducationDirection(profile)) {
    return "Your profile shows a pull toward helping, teaching, mentoring, or serving your community.";
  }
  if (hasGamingBuilderDirection(profile)) {
    return "Your profile shows builder energy through games, coding, and things people can use.";
  }
  if (hasBusinessDirection(profile)) {
    return "Your profile points toward business, entrepreneurship, and making ideas real.";
  }
  if (hasPerformingArtsDirection(profile)) {
    return "Your profile shows performance, expression, and creative discipline.";
  }
  if (hasArtDirection(profile) || hasWritingDirection(profile)) {
    return "Your profile shows creative work and a pull to share ideas.";
  }
  if (hasSportsDirection(profile)) {
    return "Your profile shows team commitment, discipline, and how you show up for others.";
  }
  if (hasStemDirection(profile)) {
    return "Your profile points toward STEM, problem-solving, and building things.";
  }
  return "You have a few interests starting to show up.";
}

function directionSpecificProofText(profile: StudentProfile) {
  if (isUncertainDirection(profile)) {
    return "one small experience that helps test a direction without forcing a career path";
  }
  if (hasServiceEducationDirection(profile)) {
    return "a mentoring, tutoring, or community initiative with clear evidence of who was helped";
  }
  if (hasGamingBuilderDirection(profile)) {
    return "a playable game, coding project, or builder portfolio that shows this interest in action";
  }
  if (hasMedicineDirection(profile)) {
    return "health exposure, research, shadowing, or a service project that shows this interest in action";
  }
  if (hasLawPolicyDirection(profile)) {
    return "a civic project, debate leadership, policy writing, or public service initiative that shows this interest in action";
  }
  if (hasArtDirection(profile) || hasWritingDirection(profile)) {
    return "a portfolio or published/submitted work that shows this interest in action";
  }
  if (hasSportsDirection(profile)) {
    return "leadership, measurable growth, coaching, or mentoring that shows this interest in action";
  }
  if (hasBusinessDirection(profile)) {
    return "a venture, initiative, competition, or project that shows this interest in action";
  }
  if (hasStemDirection(profile)) {
    return "original work, research, or a technical project that shows this interest in action";
  }
  return "a concrete project, experience, or role that shows this interest in action";
}

function directionSpecificActionText(profile: StudentProfile) {
  if (isUncertainDirection(profile)) {
    return "small exploration experiences";
  }
  if (hasServiceEducationDirection(profile)) {
    return "a mentoring or tutoring initiative with visible impact";
  }
  if (hasGamingBuilderDirection(profile)) {
    return "a game, coding project, or builder portfolio";
  }
  if (hasMedicineDirection(profile)) {
    return "research, shadowing, service, or a health-related project";
  }
  if (hasLawPolicyDirection(profile)) {
    return "a civic project, debate leadership, policy writing, or a public service initiative";
  }
  if (hasArtDirection(profile) || hasWritingDirection(profile)) {
    return "a portfolio or published/submitted work";
  }
  if (hasSportsDirection(profile)) {
    return "leadership, measurable growth, coaching, or mentoring";
  }
  if (hasBusinessDirection(profile)) {
    return "a venture, initiative, competition, or project";
  }
  if (hasStemDirection(profile)) {
    return "original work, research, or a technical project";
  }
  return "a concrete project, experience, or role";
}

function opportunitySummary(
  profile: StudentProfile,
  area: AtlasRubricArea,
  nextBestMove: Recommendation,
): string {
  if (
    area.name === "Original Work / Projects / Research" ||
    area.name === "Differentiation" ||
    nextBestMove.category === "gain_research_experience" ||
    nextBestMove.category === "build_original_project"
  ) {
    return directionSpecificProofText(profile);
  }

  if (area.name === "Leadership") {
    return "a clearer leadership role with visible ownership and impact";
  }

  if (area.name === "Application Readiness") {
    return "organized application material that makes the story easier to use";
  }

  if (area.name === "Course Rigor") {
    return "a course plan that shows the right level of academic stretch";
  }

  if (area.name === "Academics") {
    return "a steadier academic foundation in the most important courses";
  }

  return `${area.name.toLowerCase()} with clearer evidence and momentum`;
}

function getOpportunityAreaForRecommendation(
  rubric: AtlasRubricArea[],
  recommendation: Recommendation,
) {
  const preferredAreas: Partial<Record<RecommendationCategory, string[]>> = {
    improve_grade: ["Academics"],
    find_tutor: ["Academics"],
    increase_course_rigor: ["Course Rigor"],
    gain_research_experience: ["Original Work / Projects / Research", "Differentiation"],
    build_original_project: ["Original Work / Projects / Research", "Differentiation"],
    strengthen_leadership: ["Leadership"],
    deepen_service_impact: ["Service / Community Impact", "Leadership", "Differentiation"],
    create_resume: ["Application Readiness"],
    improve_essay_material: ["Application Readiness"],
    organize_application_materials: ["Application Readiness"],
  };

  const opportunities = getOpportunityAreas(rubric);
  const preferredNames = preferredAreas[recommendation.category] ?? [];
  const preferred = preferredNames
    .map((name) => rubric.find((area) => area.name === name))
    .find((area): area is AtlasRubricArea => Boolean(area));

  return preferred ?? opportunities[0];
}

function shortOpportunitySummary(
  profile: StudentProfile,
  area: AtlasRubricArea,
  nextBestMove: Recommendation,
): string {
  if (
    area.name === "Original Work / Projects / Research" ||
    area.name === "Differentiation" ||
    nextBestMove.category === "gain_research_experience" ||
    nextBestMove.category === "build_original_project"
  ) {
    return directionSpecificActionText(profile);
  }

  if (area.name === "Leadership") {
    return "clearer leadership";
  }

  if (area.name === "Application Readiness") {
    return "organized materials";
  }

  if (area.name === "Course Rigor") {
    return "academic stretch";
  }

  return area.name.toLowerCase();
}

function areaSummaryLabel(area: AtlasRubricArea): string {
  if (area.name === "Academics") {
    return "strong academics";
  }

  if (area.name === "Course Rigor") {
    return "rigorous coursework";
  }

  if (area.name === "Activities") {
    const hasCompetition = area.evidence.some((evidence) =>
      evidence.toLowerCase().includes("olympiad") ||
      evidence.toLowerCase().includes("competition"),
    );
    return hasCompetition ? "competition experience" : "activity involvement";
  }

  if (area.name === "Service / Community Impact") {
    return "meaningful community involvement";
  }

  if (area.name === "Awards / Recognition") {
    return "recognized achievement";
  }

  if (area.name === "Interests / Direction") {
    return "clear direction";
  }

  return area.name.toLowerCase();
}

function shortAreaLabel(areaName: string): string {
  const labels: Record<string, string> = {
    Academics: "Grades",
    "Course Rigor": "Course rigor",
    Activities: "Competitions",
    Leadership: "Leadership",
    "Service / Community Impact": "Community",
    "Awards / Recognition": "Awards",
    "Interests / Direction": "Direction",
  };

  return labels[areaName] ?? areaName;
}

function strongAreaPriority(areaName: string): number {
  const priorities: Record<string, number> = {
    Academics: 100,
    Activities: 90,
    "Service / Community Impact": 80,
    "Course Rigor": 70,
    "Awards / Recognition": 60,
    "Interests / Direction": 50,
  };

  return priorities[areaName] ?? 0;
}

function formatList(items: string[]): string {
  if (items.length === 0) {
    return "meaningful progress";
  }

  if (items.length === 1) {
    return items[0];
  }

  if (items.length === 2) {
    return `${items[0]} and ${items[1]}`;
  }

  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

function formatEvidence(evidence: string[]): string {
  if (evidence.length <= 1) {
    return evidence[0] ?? "Evidence still developing";
  }

  if (evidence.length === 2) {
    return `${evidence[0]} and ${evidence[1]}`;
  }

  return `${evidence.slice(0, -1).join(", ")}, and ${evidence[evidence.length - 1]}`;
}

function sentenceCase(text: string): string {
  const sentence = `${text.charAt(0).toUpperCase()}${text.slice(1)}`;
  return sentence.endsWith(".") ? sentence : `${sentence}.`;
}
