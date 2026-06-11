import { analyzeStudent } from "../lib/atlas/analyze";
import { findMockResources } from "../lib/atlas/resources";
import { atlasTestProfiles } from "../lib/atlas/test-profiles";
import type { AtlasTestProfile } from "../lib/atlas/test-profiles";

type DifferentiationCase = {
  profile: AtlasTestProfile;
  expectedNeed: string;
  positive: string[];
  negative?: string[];
};

const byName = new Map(atlasTestProfiles.map((profile) => [profile.name, profile]));
const futureDoctorBelowBs = withAcademicStrength(requiredProfile("Future Doctor"), {
  name: "Future Doctor Below Bs",
  gpa: 2.75,
  notes: ["Below B's", "Academic foundation needs support"],
});
const gamingBuilderBelowBs = withAcademicStrength(requiredProfile("Gaming Builder"), {
  name: "Gaming Builder Below Bs",
  gpa: 2.8,
  notes: ["Below B's", "Academic foundation needs support"],
});
const futureDiplomat: AtlasTestProfile = {
  name: "Future Diplomat",
  grade: 11,
  location: "New Jersey",
  futureDirection: "Diplomat / international relations / foreign service",
  energy: "Debate, current events, global issues, languages",
  intent: "Build stronger college applications",
  interests: ["diplomacy", "international relations", "global affairs", "debate"],
  goals: ["Build stronger college applications", "Find summer opportunities"],
  notes:
    "Interested in becoming a diplomat and learning how countries solve problems. Enjoys debate, current events, languages, and global issues.",
  academics: {
    gpa: 3.8,
    trend: "flat",
    notes: ["A/B student", "Strong humanities and language performance"],
  },
  courseRigor: {
    level: "rigorous",
    courses: ["AP Government", "World History", "Spanish Honors"],
  },
  activities: [
    { name: "Debate club", category: "debate", years: 2 },
    { name: "Language club", category: "club", years: 1 },
  ],
  leadership: [],
  service: {
    hours: 25,
    focusAreas: ["community events"],
    notes: ["Community volunteering"],
  },
  awards: [{ title: "Debate speaker recognition", level: "school" }],
  projects: [],
  essays: [],
  documents: [],
  expectedRecommendationNote:
    "global affairs / diplomacy / Model UN / civic opportunities, NOT direction testing",
};
const futureDoctorWithHealthcareEvidence: AtlasTestProfile = {
  name: "Future Doctor With Healthcare Evidence",
  grade: 11,
  location: "New Jersey",
  futureDirection: "Doctor",
  energy: "Reading, helping people, sports",
  intent: "Find direction",
  interests: ["medicine", "healthcare", "service", "biology"],
  goals: ["Find a direction", "Build stronger college applications"],
  notes:
    "Loves reading and wants to help people. Interested in becoming a doctor and learning whether medicine fits.",
  academics: {
    gpa: 3.9,
    trend: "up",
    notes: ["Mostly A's", "Strong science performance"],
  },
  courseRigor: {
    level: "rigorous",
    courses: ["AP Biology", "Honors Math", "Speech and Debate"],
  },
  activities: [
    { name: "Lacrosse", category: "sports", years: 2 },
    { name: "DECA", category: "business", years: 1 },
    { name: "Debate", category: "debate", years: 2 },
  ],
  leadership: [{ role: "Officer", organization: "BBYO" }],
  service: {
    hours: 120,
    focusAreas: ["EMT volunteering", "Friendship Circle"],
    notes: ["EMT volunteer", "Friendship Circle volunteer", "Helping people through service"],
  },
  awards: [],
  projects: [
    {
      title: "Science project",
      type: "class_project",
      status: "complete",
      notes: "Completed a science class project.",
    },
    {
      title: "Writing portfolio",
      type: "creative_portfolio",
      status: "in_progress",
      notes: "Writing portfolio in progress.",
    },
    {
      title: "Small business idea",
      type: "original_project",
      status: "idea",
      notes: "Early small business idea.",
    },
  ],
  essays: [],
  documents: [],
  expectedRecommendationNote:
    "healthcare exposure should beat civic advocacy when future goal, coursework, and service all point to medicine",
};

const cases: DifferentiationCase[] = [
  {
    profile: requiredProfile("Debate Law"),
    expectedNeed: "civic engagement / advocacy / policy proof",
    positive: ["civic", "policy", "debate", "public service", "law", "advocacy"],
  },
  {
    profile: futureDiplomat,
    expectedNeed: "global affairs / diplomacy / public service exposure",
    positive: ["global", "diplomacy", "diplomat", "model un", "international", "foreign"],
    negative: ["direction_testing"],
  },
  {
    profile: requiredProfile("Creative Performer"),
    expectedNeed: "creative ownership / performance portfolio / choreography / mentoring",
    positive: ["creative", "performance", "portfolio", "choreography", "dance", "showcase"],
    negative: ["sports", "athletic"],
  },
  {
    profile: requiredProfile("Future Doctor"),
    expectedNeed: "healthcare exposure / shadowing / service / public health",
    positive: ["health", "healthcare", "shadow", "public health", "service", "research"],
  },
  {
    profile: futureDoctorWithHealthcareEvidence,
    expectedNeed: "healthcare exposure reinforced by future goal, coursework, service, and narrative",
    positive: ["health", "healthcare", "doctor", "medicine", "emt", "shadow", "patient"],
    negative: ["take your civic interest beyond the classroom", "civic_advocacy_proof"],
  },
  {
    profile: futureDoctorBelowBs,
    expectedNeed: "academic foundation override while preserving healthcare direction",
    positive: ["academic", "grade", "study", "teacher", "health", "healthcare"],
  },
  {
    profile: requiredProfile("Future Engineer"),
    expectedNeed: "technical build / robotics / coding portfolio",
    positive: ["technical", "robotics", "coding", "engineering", "build", "portfolio", "research"],
  },
  {
    profile: requiredProfile("Gaming Builder"),
    expectedNeed: "technical builder portfolio despite mild academic development",
    positive: ["game", "coding", "portfolio", "playable", "screenshots", "competition"],
    negative: ["strengthen academic foundation", "teacher help block", "grade recovery"],
  },
  {
    profile: gamingBuilderBelowBs,
    expectedNeed: "academic foundation override while preserving builder direction",
    positive: ["academic", "grade", "study", "teacher", "game", "coding"],
  },
  {
    profile: requiredProfile("Entrepreneur"),
    expectedNeed: "venture validation / selling / customer discovery",
    positive: ["venture", "business", "customer", "selling", "deca", "test it", "people"],
  },
  {
    profile: requiredProfile("Service-Oriented Student"),
    expectedNeed: "service impact / tutoring / mentoring / measurable community leadership",
    positive: ["service", "tutor", "tutoring", "mentor", "mentoring", "impact", "community"],
    negative: ["robotics", "technical", "venture"],
  },
  {
    profile: requiredProfile("Undecided High Achiever"),
    expectedNeed: "exploration / direction testing",
    positive: ["explor", "direction", "test", "try", "interest"],
    negative: ["doctor", "lawyer", "engineer", "medicine", "business owner"],
  },
];

type CaseResult = {
  caseName: string;
  futureDirection: string;
  energy: string;
  intent: string;
  constraint: string;
  developmentNeedTitle: string;
  developmentNeedDescription: string;
  archetypeTitle: string;
  recommendationTitle: string;
  whyThisMove: string;
  explanationBlock: string[];
  actionPlanTitles: string[];
  resourceTitles: string[];
  developmentalNeed: string;
  combinedText: string;
  isGenericProjectTitle: boolean;
  reviewReasons: string[];
};

function requiredProfile(name: string): AtlasTestProfile {
  const profile = byName.get(name);
  if (!profile) {
    throw new Error(`Missing test profile: ${name}`);
  }
  return profile;
}

function withAcademicStrength(
  profile: AtlasTestProfile,
  override: { name: string; gpa: number; notes: string[] },
): AtlasTestProfile {
  return {
    ...profile,
    name: override.name,
    academics: {
      ...profile.academics,
      gpa: override.gpa,
      notes: override.notes,
    },
  };
}

function main() {
  const results = cases.map(runCase);
  const genericProjectCount = results.filter((result) => result.isGenericProjectTitle).length;
  const actionSimilarityReviews = findActionSimilarityReviews(results);

  if (genericProjectCount >= 3) {
    const genericNames = results
      .filter((result) => result.isGenericProjectTitle)
      .map((result) => result.caseName)
      .join(", ");

    for (const result of results) {
      if (result.isGenericProjectTitle) {
        result.reviewReasons.push(
          `Generic project-style title appears too often (${genericProjectCount} profiles: ${genericNames}).`,
        );
      }
    }
  }

  for (const review of actionSimilarityReviews) {
    review.a.reviewReasons.push(review.reason);
    review.b.reviewReasons.push(review.reason);
  }

  let passCount = 0;
  let reviewCount = 0;

  for (const result of results) {
    const passed = result.reviewReasons.length === 0;
    if (passed) {
      passCount += 1;
    } else {
      reviewCount += 1;
    }

    console.log("=".repeat(88));
    console.log(`Student: ${result.caseName}`);
    console.log(`Future direction: ${result.futureDirection}`);
    console.log(`Energy: ${result.energy}`);
    console.log(`Intent: ${result.intent}`);
    console.log(`Constraint: ${result.constraint}`);
    console.log(`Development need: ${result.developmentNeedTitle}`);
    console.log(`Development need description: ${result.developmentNeedDescription}`);
    console.log(`Archetype: ${result.archetypeTitle}`);
    console.log("");
    console.log("USER-FACING OUTPUT");
    console.log(`Recommendation title: ${result.recommendationTitle}`);
    console.log(`Why this move: ${result.whyThisMove}`);
    console.log("Why Atlas picked it / explanation block:");
    for (const line of result.explanationBlock) {
      console.log(`- ${line}`);
    }
    console.log("Action plan steps:");
    result.actionPlanTitles.forEach((title, index) => {
      console.log(`${index + 1}. ${title}`);
    });
    console.log("Resource titles:");
    if (result.resourceTitles.length > 0) {
      result.resourceTitles.forEach((title, index) => {
        console.log(`${index + 1}. ${title}`);
      });
    } else {
      console.log("- No resources returned");
    }
    console.log("");
    console.log(`Developmental need: ${result.developmentalNeed}`);
    console.log(`Flag: ${passed ? "PASS" : "REVIEW"}`);

    if (!passed) {
      console.log(`Review reason: ${result.reviewReasons.join(" ")}`);
    }
  }

  console.log("=".repeat(88));
  console.log(`Summary: ${passCount} PASS, ${reviewCount} REVIEW`);
  console.log(`Distinct profiles: ${results.filter((result) => result.reviewReasons.length === 0).map((result) => result.caseName).join(", ") || "None"}`);
  console.log(`Too similar / needs review: ${results.filter((result) => result.reviewReasons.length > 0).map((result) => result.caseName).join(", ") || "None"}`);
  console.log(
    `Generic project language: ${
      genericProjectCount >= 3
        ? `REVIEW - ${genericProjectCount} profiles use generic project/show/build language.`
        : `OK - ${genericProjectCount} profiles use broad project language.`
    }`,
  );
  console.log(`Recommended rule changes: ${recommendedRuleChanges(results)}`);
}

function runCase(item: DifferentiationCase): CaseResult {
  const analysis = analyzeStudent(item.profile);
  const actionPlanTitles = analysis.actionPlan.map((action) => action.title);
  const resources = findMockResources({
    profile: item.profile,
    recommendationCategory: analysis.nextBestMove.category,
    location: item.profile.location,
    interests: item.profile.interests,
    constraint: analysis.constraint,
    developmentNeedId: analysis.developmentNeed.id,
  });
  const resourceTitles = resources.map((resource) => resource.title);
  const explanationBlock = [
    analysis.whyAtlasPickedIt.subtitle,
    analysis.whyAtlasPickedIt.strengthLabel,
    ...analysis.whyAtlasPickedIt.strengths,
    analysis.whyAtlasPickedIt.missingProofLabel,
    analysis.whyAtlasPickedIt.missingProof,
  ];
  const developmentalNeed = summarizeDevelopmentalNeed(analysis.nextBestMove.whyNow);
  const combinedText = [
    analysis.archetype.title,
    analysis.nextBestMove.title,
    analysis.nextBestMove.whyNow,
    ...actionPlanTitles,
    ...analysis.resourceCategories,
    ...resourceTitles,
  ]
    .join(" ")
    .toLowerCase();

  const hasPositive = item.positive.some((term) => combinedText.includes(term));
  const hasNegative = item.negative?.some((term) => combinedText.includes(term)) ?? false;
  const reviewReasons: string[] = [];

  if (!hasPositive) {
    reviewReasons.push(`Expected ${item.expectedNeed}, but key signals were missing.`);
  }

  if (hasNegative) {
    reviewReasons.push(`Recommendation included language that conflicts with ${item.expectedNeed}.`);
  }

  if (item.profile.name === "Future Doctor" && !/(health|shadow|public health|service|research)/.test(combinedText)) {
    reviewReasons.push("Healthcare student got a generic project instead of exposure/shadowing/service/research.");
  }

  if (item.profile.name === "Future Doctor With Healthcare Evidence" && analysis.developmentNeed.id !== "healthcare_exposure") {
    reviewReasons.push("Reinforced future doctor profile did not resolve to healthcare_exposure.");
  }

  if (item.profile.name === "Future Doctor With Healthcare Evidence" && /civic|take your civic interest beyond the classroom/.test(combinedText)) {
    reviewReasons.push("Debate or leadership redirected a strongly reinforced healthcare profile into civic advocacy.");
  }

  if (item.profile.name === "Future Diplomat" && analysis.developmentNeed.id === "direction_testing") {
    reviewReasons.push("Specific diplomat aspiration was incorrectly treated as direction testing.");
  }

  if (item.profile.name === "Future Diplomat" && !/(model un|global affairs|diplomacy|international relations|foreign policy|junior state)/.test(combinedText)) {
    reviewReasons.push("Future diplomat resources did not include global affairs or civic opportunities.");
  }

  if (item.profile.name === "Future Doctor Below Bs" && analysis.constraint !== "academic_foundation") {
    reviewReasons.push("Future doctor with Below B's did not trigger the academic foundation override.");
  }

  if (item.profile.name === "Future Doctor Below Bs" && analysis.developmentNeed.id !== "healthcare_exposure") {
    reviewReasons.push("Future doctor with Below B's lost the healthcare development need.");
  }

  if (item.profile.name === "Undecided High Achiever" && !/(explor|direction|test|try)/.test(combinedText)) {
    reviewReasons.push("Undecided student got a project path instead of exploration.");
  }

  if (item.profile.name === "Entrepreneur" && !/(venture|customer|selling|business|test it|people)/.test(combinedText)) {
    reviewReasons.push("Entrepreneur got a generic project instead of venture validation or customer discovery.");
  }

  if (item.profile.name === "Future Engineer" && !/(technical|robotics|coding|engineering|portfolio|research)/.test(combinedText)) {
    reviewReasons.push("Engineer got a generic project instead of technical build or portfolio work.");
  }

  if (item.profile.name === "Gaming Builder" && analysis.constraint === "academic_foundation") {
    reviewReasons.push("Gaming builder with Mostly B's got automatic academic support instead of builder development.");
  }

  if (item.profile.name === "Gaming Builder Below Bs" && analysis.constraint !== "academic_foundation") {
    reviewReasons.push("Gaming builder with Below B's did not trigger the academic foundation override.");
  }

  if (item.profile.name === "Gaming Builder Below Bs" && analysis.developmentNeed.id !== "technical_builder_portfolio") {
    reviewReasons.push("Gaming builder with Below B's lost the technical builder development need.");
  }

  reviewReasons.push(...resourceReviewReasons(item.profile.name, analysis.constraint, analysis.developmentNeed.id, resourceTitles));

  return {
    caseName: item.profile.name,
    futureDirection: item.profile.futureDirection ?? "Unknown",
    energy: item.profile.energy ?? "Unknown",
    intent: item.profile.intent ?? "Unknown",
    constraint: analysis.constraint,
    developmentNeedTitle: analysis.developmentNeed.title,
    developmentNeedDescription: analysis.developmentNeed.description,
    archetypeTitle: analysis.archetype.title,
    recommendationTitle: analysis.nextBestMove.title,
    whyThisMove: analysis.nextBestMove.whyNow,
    explanationBlock,
    actionPlanTitles,
    resourceTitles,
    developmentalNeed,
    combinedText,
    isGenericProjectTitle: isGenericProjectTitle(analysis.nextBestMove.title),
    reviewReasons,
  };
}

function resourceReviewReasons(
  name: string,
  constraint: string,
  developmentNeedId: string,
  resourceTitles: string[],
) {
  const reasons: string[] = [];
  const text = resourceTitles.join(" ").toLowerCase();

  if (constraint === "academic_foundation" && !/(teacher|khan|tutor|tutoring|grade)/.test(text)) {
    reasons.push(`${name} has academic foundation constraint but resources are not academic support oriented.`);
  }

  if (constraint === "academic_foundation") {
    return reasons;
  }

  if (developmentNeedId === "healthcare_exposure" && !/(hospital|hosa|red cross|ems|health|rutgers)/.test(text)) {
    reasons.push(`${name} needs healthcare exposure but resources are not healthcare related.`);
  }

  if (developmentNeedId === "technical_builder_portfolio" && !/(congressional app|hack club|first robotics|codeday|github|itch)/.test(text)) {
    reasons.push(`${name} needs technical builder resources but did not get coding/building opportunities.`);
  }

  if (developmentNeedId === "civic_advocacy_proof" && !/(model un|junior state|ymca youth|speech|debate|town council|school board)/.test(text)) {
    reasons.push(`${name} needs civic advocacy resources but did not get civic opportunities.`);
  }

  if (developmentNeedId === "global_affairs_exposure" && !/(model un|junior state|council on foreign relations|foreign policy|world affairs|international relations)/.test(text)) {
    reasons.push(`${name} needs global affairs resources but did not get diplomacy/global opportunities.`);
  }

  if (developmentNeedId === "creative_ownership" && !/(youngarts|scholastic|showcase|arts magazine|literary magazine|portfolio)/.test(text)) {
    reasons.push(`${name} needs creative ownership resources but did not get arts/showcase opportunities.`);
  }

  if (developmentNeedId === "venture_validation" && !/(deca|fbla|diamond challenge|nfte|customer discovery|pitch|venture)/.test(text)) {
    reasons.push(`${name} needs venture validation resources but did not get business/customer opportunities.`);
  }

  if (developmentNeedId === "service_impact" && !/(peer tutoring|big brothers|food pantry|service|volunteermatch|mentoring)/.test(text)) {
    reasons.push(`${name} needs service impact resources but did not get service/mentoring opportunities.`);
  }

  if (developmentNeedId === "direction_testing" && !/(career conversation|informational interview|job shadow|club sampler|summer pre-college|volunteer sampler|teacher|counselor)/.test(text)) {
    reasons.push(`${name} needs direction testing resources but did not get real exploration experiences.`);
  }

  if (developmentNeedId === "direction_testing" && /journal/.test(text)) {
    reasons.push(`${name} direction testing resources leaned too heavily on journaling.`);
  }

  return reasons;
}

function summarizeDevelopmentalNeed(whyNow: string) {
  const sentences = whyNow.match(/[^.!?]+[.!?]*/g)?.map((sentence) => sentence.trim()).filter(Boolean) ?? [];
  return sentences[sentences.length - 1] ?? whyNow;
}

function isGenericProjectTitle(title: string) {
  const lower = title.toLowerCase();
  return (
    lower.includes("build something") ||
    lower.includes("show what you care about") ||
    lower.includes("create proof") ||
    lower.includes("show initiative") ||
    lower === "build something you can point to"
  );
}

function findActionSimilarityReviews(results: CaseResult[]) {
  const reviews: Array<{ a: CaseResult; b: CaseResult; reason: string }> = [];

  for (let i = 0; i < results.length; i += 1) {
    for (let j = i + 1; j < results.length; j += 1) {
      const a = results[i];
      const b = results[j];
      if (a.developmentNeedTitle === "Healthcare exposure" && b.developmentNeedTitle === "Healthcare exposure") {
        continue;
      }
      const similarity = jaccard(actionTokens(a), actionTokens(b));

      if (similarity >= 0.45) {
        reviews.push({
          a,
          b,
          reason: `Action plans may be too similar to ${a.caseName === b.caseName ? "itself" : a.caseName === results[i].caseName ? b.caseName : a.caseName} (${Math.round(similarity * 100)}% token overlap).`,
        });
      }
    }
  }

  const dancer = results.find((result) => result.caseName === "Creative Performer");
  const lawyer = results.find((result) => result.caseName === "Debate Law");
  if (dancer && lawyer && jaccard(actionTokens(dancer), actionTokens(lawyer)) >= 0.3) {
    reviews.push({
      a: dancer,
      b: lawyer,
      reason: "Dancer and lawyer action structures are too similar.",
    });
  }

  return reviews;
}

function actionTokens(result: CaseResult) {
  const stopWords = new Set([
    "a",
    "an",
    "and",
    "or",
    "one",
    "the",
    "to",
    "with",
    "it",
    "you",
    "your",
    "what",
  ]);

  return new Set(
    result.actionPlanTitles
      .join(" ")
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((token) => token.length > 2 && !stopWords.has(token)),
  );
}

function jaccard(a: Set<string>, b: Set<string>) {
  const aTokens = Array.from(a);
  const bTokens = Array.from(b);
  const intersection = aTokens.filter((token) => b.has(token)).length;
  const union = new Set([...aTokens, ...bTokens]).size;
  return union === 0 ? 0 : intersection / union;
}

function recommendedRuleChanges(results: CaseResult[]) {
  const reviewNames = results
    .filter((result) => result.reviewReasons.length > 0)
    .map((result) => result.caseName);

  if (reviewNames.length === 0) {
    return "No immediate rule changes required from this differentiation check.";
  }

  return `Review identity-specific titles and action templates for ${reviewNames.join(", ")}.`;
}

main();
