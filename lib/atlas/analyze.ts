import type {
  AtlasAnalysisResponse,
  AtlasRubricArea,
  Recommendation,
  RecommendationAction,
  RecommendationCategory,
  StudentArchetype,
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
  const rubric = buildRubric(profile);
  const archetype = identifyStudentArchetype(profile, rubric);
  const candidates = buildRecommendationCandidates(profile, rubric, archetype);
  const rankedRecommendation = rankRecommendations(candidates);
  const nextBestMove = {
    ...rankedRecommendation,
    whyNow: generateRecommendationWhyNow(profile, rubric, rankedRecommendation),
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
    (profile.interests.length > 4 && profile.goals.length === 0);

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
          "The student’s biggest opportunity is strengthening academic performance before adding more activities.",
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
          "The student has a solid academic foundation but could benefit from more rigorous or better-aligned coursework.",
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
          "The student needs a clearer direction so future activities and opportunities tell a stronger story.",
        evidence: profile.interests.length > 0 ? profile.interests : ["Interests are not clear yet"],
        primaryConstraint: "direction_clarity",
        priority: 3,
      },
      8,
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
          "The student has a strong profile and needs to organize materials, resume, essays, or application assets.",
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
          "The student has meaningful health or service involvement and can turn it into clearer ownership.",
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
      (academics?.status === "strong" || profile.academics.gpa >= 3.5) &&
        (activities?.status === "strong" || activities?.status === "developing") &&
        isDevelopingOrOpportunity(originalWork),
      {
        id: "strong_foundation_missing_differentiation",
        title: differentiationArchetypeTitle(profile),
        description:
          "The student has a strong foundation, but needs stronger proof of original work, research, or distinctive contribution.",
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
          "The student is involved, but needs more ownership, initiative, or measurable influence.",
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
          "The student has service involvement, but could turn hours into a more meaningful impact story.",
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
          "The student needs to organize materials, resume, essays, or application assets.",
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

  return `${displayName(profile.name)} is building a strong ${direction} profile with ${strengthsText}. The clearest growth opportunity is ${opportunityText}.`;
}

export function generateWhyAtlasPickedIt(
  profile: StudentProfile,
  rubric: AtlasRubricArea[],
  nextBestMove: Recommendation,
): AtlasAnalysisResponse["whyAtlasPickedIt"] {
  const strongAreas = getStrongAreas(rubric).slice(0, 3);
  const strengths = strongAreas.map((area) => shortAreaLabel(area.name));
  const topOpportunity = getOpportunityAreaForRecommendation(rubric, nextBestMove);
  const goal = primaryGoal(profile);
  const direction = primaryInterestDirection(profile);
  const strongestEvidence = strongAreas[0]?.evidence[0];
  const directionInsight = interpretedDirectionInsight(profile);
  const missingProof = topOpportunity
    ? sentenceCase(opportunitySummary(profile, topOpportunity, nextBestMove))
    : "A clearer next artifact that shows who you are and what you can do.";
  const personalContext = [
    isExploringGoal(profile) ? "Goal: still exploring direction." : `Goal: ${goal}.`,
    `Direction: ${direction}.`,
    strongestEvidence ? `Strongest evidence Atlas noticed: ${strongestEvidence}.` : "",
    `Atlas noticed ${directionInsight}.`,
    missingProof,
  ]
    .filter(Boolean)
    .join(" ");

  return {
    title: "Why this move?",
    subtitle: "Atlas noticed the pattern.",
    strengthLabel: "You’re already strong in:",
    strengths: strengths.length > 0 ? strengths : nextBestMove.evidenceUsed.slice(0, 3),
    missingProofLabel: "The missing proof:",
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
        "The student needs to organize materials, resume, essays, or application assets.",
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
      build_original_project: 1,
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
      strengthen_leadership: 1.4,
      build_original_project: 1,
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
  };

  return boosts[archetype.primaryConstraint][category] ?? 0;
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
      title: originalProjectRecommendationTitle(profile),
      category: "build_original_project",
      confidence: "medium",
      whyNow: "",
      evidenceUsed: hasCreativeDirection(profile)
        ? ["Creative interests", "Portfolio evidence", "Writing, theater, art, or media direction"]
        : hasBusinessDirection(profile)
          ? ["Business interests", "Activity involvement", "Limited venture or original project evidence"]
        : ["STEM interests", "Limited original work", "Science fair experience"],
      expectedImpact: ["Creates tangible evidence", "Builds essay material", "Shows initiative"],
      actionPlan: [
        ...originalProjectActionPlan(profile),
      ],
      resourceCategories: hasCreativeDirection(profile)
        ? ["portfolio projects", "writing submissions", "arts competitions"]
        : hasBusinessDirection(profile)
          ? ["student venture guides", "business project mentors", "DECA project ideas"]
        : ["project mentors", "science project guides", "student research journals"],
      gapScore: originalWorkScore,
      alignmentScore: hasCreativeDirection(profile)
        ? 9
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
      resourceCategories: ["leadership roles", "community organizations", "school clubs"],
      gapScore: leadershipScore,
      alignmentScore: hasSportsDirection(profile) || hasBusinessDirection(profile) || hasServiceDirection(profile) ? 9 : 7,
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
        { title: "Match resume bullets to the strongest story", type: "document", priority: 2, impact: "high", label: "Tighten proof" },
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
      actionPlan: academicActionPlan(mathRecommendation),
      resourceCategories: ["math tutors", "teacher office hours", "practice plans"],
      gapScore: academicConstraint ? academics?.improvementPotential ?? 8 : 3,
      alignmentScore: mathRecommendation ? 8 : 6,
      applicationImpactScore: 8,
      actionabilityScore: 9,
      resourceAvailabilityScore: 9,
    }),
  ];

  return candidates.map((candidate) => ({
    ...candidate,
    archetypeBoostScore: archetypeBoost(candidate.category, archetype),
    goalBoostScore: goalBoost(candidate.category, profile),
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
  return ["stem", "engineering", "coding", "science", "research", "robotics"].some((term) =>
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
  return ["writing", "journalism", "newspaper", "theater", "art", "design", "drawing", "media", "creative", "portfolio"].some((term) =>
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
  return ["theater", "performing", "performance", "music", "dance"].some((term) => directionText.includes(term));
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
  return profile.academics.gpa < 3.5 || hasAcademicConcern(profile);
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
  if (hasMedicineDirection(profile)) {
    return "Turn Your Health Interest Into Real Exposure";
  }
  if (hasBusinessDirection(profile)) {
    return "Build Something That Shows Initiative";
  }
  if (hasArtDirection(profile)) {
    return "Build a Portfolio That Shows Your Voice";
  }
  if (hasWritingDirection(profile)) {
    return "Turn Your Writing Into Visible Work";
  }
  if (hasPerformingArtsDirection(profile)) {
    return "Create Proof of Your Performance Growth";
  }
  if (hasLawPolicyDirection(profile)) {
    return "Turn Your Policy Interest Into Civic Impact";
  }
  if (hasSportsDirection(profile)) {
    return "Strengthen Leadership Through Athletics";
  }
  if (hasStemDirection(profile)) {
    return "Turn Your STEM Interest Into Original Work";
  }
  return "Strong Foundation, Missing Differentiation";
}

function researchRecommendationTitle(profile: StudentProfile): string {
  if (hasMedicineDirection(profile)) {
    return "Turn Your Health Interest Into Real Exposure";
  }
  return "Turn Your STEM Interest Into Original Work";
}

function originalProjectRecommendationTitle(profile: StudentProfile): string {
  if (hasArtDirection(profile)) {
    return "Build a Portfolio That Shows Your Voice";
  }
  if (hasWritingDirection(profile)) {
    return "Turn Your Writing Into Visible Work";
  }
  if (hasPerformingArtsDirection(profile)) {
    return "Create Proof of Your Performance Growth";
  }
  if (hasLawPolicyDirection(profile)) {
    return "Turn Your Policy Interest Into Civic Impact";
  }
  if (hasSportsDirection(profile)) {
    return "Strengthen Leadership Through Athletics";
  }
  if (hasBusinessDirection(profile)) {
    return "Build Something That Shows Initiative";
  }
  if (hasStemDirection(profile)) {
    return "Turn Your STEM Interest Into Original Work";
  }
  return "Build Something That Shows Initiative";
}

function leadershipRecommendationTitle(profile: StudentProfile): string {
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
        find_program: 1,
        pursue_competition: 0.6,
        build_original_project: 0.4,
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

function originalProjectActionPlan(profile: StudentProfile): RecommendationAction[] {
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
      { title: "Choose one civic issue", type: "project", priority: 1, impact: "high", label: "Start here" },
      { title: "Interview or survey people affected", type: "activity", priority: 2, impact: "medium", label: "Find proof" },
      { title: "Publish a short policy brief", type: "document", priority: 3, impact: "medium", label: "Share it" },
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

  return [
    { title: "Pick one STEM question", type: "project", priority: 1, impact: "high", label: "Start here" },
    { title: "Find a mentor or teacher reviewer", type: "project", priority: 2, impact: "high", label: "Add support" },
    { title: "Publish a short project writeup", type: "project", priority: 3, impact: "medium", label: "Make it real" },
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
): string {
  const strongAreas = getStrongAreas(rubric).slice(0, 3);
  const strengths = strongAreas.map((area) => shortAreaLabel(area.name).toLowerCase());
  const topOpportunity = getOpportunityAreaForRecommendation(rubric, nextBestMove);
  const strengthsText = strengths.length > 0 ? formatList(strengths) : "meaningful progress";
  const opportunityText = topOpportunity
    ? shortOpportunitySummary(profile, topOpportunity, nextBestMove)
    : "a clearer next step that turns progress into proof";
  const studentName = displayName(profile.name);
  const direction = primaryInterestDirection(profile);
  const directionInsight = interpretedDirectionInsight(profile);
  const opening = isExploringGoal(profile)
    ? `${studentName} is still exploring ${pronoun(profile, "possessive")} direction`
    : `${studentName} is focused on ${primaryGoal(profile).toLowerCase()}`;

  return [
    `${opening}, but Atlas noticed ${directionInsight}.`,
    `${sentencePronoun(profile)} already shows meaningful progress through ${strengthsText}.`,
    `The next best move is to create real exposure through ${opportunityText}.`,
  ]
    .filter(Boolean)
    .join(" ");
}

function getProfileDirection(profile: StudentProfile): string {
  const directionText = [...profile.interests, ...profile.goals].join(" ").toLowerCase();

  if (["stem", "engineering", "science", "research", "biology", "medicine"].some((term) => directionText.includes(term))) {
    return "STEM-oriented";
  }

  if (
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
  const explicitGoal = profile.goals.find((goal) =>
    !goal.toLowerCase().startsWith("build a stronger story around") &&
    goal !== "Find the next best move" &&
    goal !== "Create stronger proof of original work",
  );

  return explicitGoal ?? profile.goals[0] ?? "find the next best move";
}

function isExploringGoal(profile: StudentProfile): boolean {
  return primaryGoal(profile).toLowerCase().includes("not sure");
}

function primaryInterestDirection(profile: StudentProfile): string {
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
  if (["writing", "journalism", "newspaper"].some((term) => lower.includes(term))) {
    return "Writing / Humanities";
  }
  if (["business", "entrepreneur", "deca"].some((term) => lower.includes(term))) {
    return "Business";
  }
  if (["stem", "coding", "robotics", "engineering"].some((term) => lower.includes(term))) {
    return "STEM / Engineering";
  }
  if (["sports", "soccer", "track", "basketball"].some((term) => lower.includes(term))) {
    return "Sports / Athletics";
  }
  return `${direction.charAt(0).toUpperCase()}${direction.slice(1)}`;
}

function inferredDirectionLabel(profile: StudentProfile) {
  if (hasMedicineDirection(profile)) return "Medicine / Health";
  if (hasLawPolicyDirection(profile)) return "Law / Policy";
  if (hasArtDirection(profile)) return "Art / Design";
  if (hasWritingDirection(profile)) return "Writing / Humanities";
  if (hasBusinessDirection(profile)) return "Business";
  if (hasStemDirection(profile)) return "STEM / Engineering";
  if (hasSportsDirection(profile)) return "Sports / Athletics";
  return getProfileDirection(profile);
}

function interpretedDirectionInsight(profile: StudentProfile) {
  const inferred = inferredDirectionLabel(profile);
  const selected = profile.interests.find((item) => item.toLowerCase() !== "undecided");

  if (selected && directionLabel(selected) !== inferred) {
    return `a selected interest in ${directionLabel(selected)} and an emerging interest in ${inferred.toLowerCase()}`;
  }

  return `a clear interest in ${inferred.toLowerCase()}`;
}

function directionSpecificProofText(profile: StudentProfile) {
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
  return "a concrete project, experience, or role that shows this interest in action";
}

function directionSpecificActionText(profile: StudentProfile) {
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
