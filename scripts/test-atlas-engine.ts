import { analyzeStudent } from "../lib/atlas/analyze";
import { atlasTestProfiles } from "../lib/atlas/test-profiles";

type ExpectedRule = {
  positive: string[];
  negative?: string[];
};

const expectedRules: Record<string, ExpectedRule> = {
  "Future Doctor": {
    positive: ["health", "medicine", "public health", "shadow", "research", "service project"],
  },
  "Debate Law": {
    positive: ["policy", "civic", "debate", "public service", "law"],
  },
  "Creative Performer": {
    positive: ["creative", "portfolio", "performance", "choreography", "dance"],
    negative: ["athletic", "sports"],
  },
  Entrepreneur: {
    positive: ["venture", "business", "initiative", "entrepreneur", "deca"],
  },
  "Undecided High Achiever": {
    positive: ["explor", "direction", "try", "program"],
    negative: ["doctor", "lawyer", "engineer", "medicine", "business"],
  },
  "Future Engineer": {
    positive: ["technical", "robotics", "engineering", "coding", "project", "portfolio", "hackathon"],
  },
  "Service-Oriented Student": {
    positive: ["service", "education", "mentor", "tutor", "impact"],
    negative: ["stem question", "robotics", "technical project"],
  },
  "Gaming Builder": {
    positive: ["game", "coding", "project", "portfolio", "prototype"],
    negative: ["generic clubs", "more clubs"],
  },
};

function main() {
  let passCount = 0;
  let reviewCount = 0;

  for (const profile of atlasTestProfiles) {
    const analysis = analyzeStudent(profile);
    const actionPlanTitles = analysis.actionPlan.map((action) => action.title);
    const recommendationText = [
      analysis.nextBestMove.title,
      analysis.nextBestMove.category,
      ...actionPlanTitles,
      ...analysis.resourceCategories,
    ]
      .join(" ")
      .toLowerCase();
    const fullText = [
      recommendationText,
      analysis.nextBestMove.whyNow,
    ]
      .join(" ")
      .toLowerCase();

    const rule = expectedRules[profile.name];
    const hasPositive = rule.positive.some((term) => recommendationText.includes(term));
    const hasNegative = rule.negative?.some((term) => fullText.includes(term)) ?? false;
    const passed = hasPositive && !hasNegative;

    if (passed) {
      passCount += 1;
    } else {
      reviewCount += 1;
    }

    console.log("=".repeat(80));
    console.log(`Student: ${analysis.studentName}`);
    console.log(`Grade: ${profile.grade}`);
    console.log(`Future direction: ${profile.futureDirection ?? "Unknown"}`);
    console.log(`Archetype: ${analysis.archetype.title}`);
    console.log(`Primary constraint: ${analysis.archetype.primaryConstraint}`);
    console.log(`Recommendation: ${analysis.nextBestMove.title}`);
    console.log(`whyNow: ${analysis.nextBestMove.whyNow}`);
    console.log(`Action plan: ${actionPlanTitles.join(" | ")}`);
    console.log(`Expected note: ${profile.expectedRecommendationNote}`);
    console.log(`Flag: ${passed ? "PASS" : "REVIEW"}`);

    if (!passed) {
      console.log(
        `Review reason: expected one of [${rule.positive.join(", ")}]${
          rule.negative ? ` and none of [${rule.negative.join(", ")}]` : ""
        }.`,
      );
    }
  }

  console.log("=".repeat(80));
  console.log(`Summary: ${passCount} PASS, ${reviewCount} REVIEW`);
}

main();
