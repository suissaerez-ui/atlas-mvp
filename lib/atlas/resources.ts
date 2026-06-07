import type {
  AtlasResourceCard,
  RecommendationCategory,
  StudentProfile,
} from "./types";

export type FindResourcesInput = {
  profile: StudentProfile;
  recommendationCategory: RecommendationCategory;
  location: string;
  interests: string[];
};

export function findMockResources(input: FindResourcesInput): AtlasResourceCard[] {
  const isCreative = hasCreativeDirection(input.interests);
  const category =
    input.recommendationCategory === "build_original_project" && isCreative
      ? "creative_portfolio"
      : input.recommendationCategory;

  // TODO: Future real search integration can plug in here.
  // Options to evaluate: Tavily, Exa, SerpAPI, OpenAI web search.
  // Keep this function returning normalized AtlasResourceCard objects.
  const resourceMap: Record<string, AtlasResourceCard[]> = {
    gain_research_experience: [
      {
        title: `${input.location} university lab outreach list`,
        type: "local university research programs",
        whyItFits: "Matches a student who needs real research exposure and mentor conversations.",
        impact: "high",
        nextStepLabel: "Find 3 nearby labs",
      },
      {
        title: "STEM summer program shortlist",
        type: "STEM summer programs",
        whyItFits: "Gives structure, deadlines, and a credible way to build original work.",
        impact: "high",
        nextStepLabel: "Build shortlist",
      },
      {
        title: "Independent research mentor path",
        type: "independent research mentor/project option",
        whyItFits: "Creates a project even if formal programs are not available.",
        impact: "medium",
        nextStepLabel: "Pick a question",
      },
    ],
    improve_grade: [
      {
        title: "Math/science tutor match plan",
        type: "math/science tutor",
        whyItFits: "The fastest next move is strengthening the academic foundation.",
        impact: "high",
        nextStepLabel: "Find support",
      },
      {
        title: "Teacher office hours script",
        type: "teacher office hours plan",
        whyItFits: "Helps the student ask for targeted help without guessing what to say.",
        impact: "high",
        nextStepLabel: "Plan the ask",
      },
      {
        title: "Khan Academy two-week practice plan",
        type: "Khan Academy/practice plan",
        whyItFits: "Turns vague grade improvement into a steady weekly rhythm.",
        impact: "medium",
        nextStepLabel: "Start practice",
      },
    ],
    build_original_project: [
      {
        title: "Original project mentor map",
        type: "project mentor",
        whyItFits: "A mentor can help turn an interest into a focused, explainable project.",
        impact: "high",
        nextStepLabel: "Choose mentor type",
      },
      {
        title: "Project one-page template",
        type: "portfolio/project template",
        whyItFits: "Clarifies the question, process, result, and story before work expands.",
        impact: "high",
        nextStepLabel: "Draft project",
      },
      {
        title: "Student showcase or competition list",
        type: "competition/showcase option",
        whyItFits: "Creates an audience and deadline for the original work.",
        impact: "medium",
        nextStepLabel: "Pick a venue",
      },
    ],
    strengthen_leadership: [
      {
        title: "Club initiative starter",
        type: "club initiative idea",
        whyItFits: "Turns participation into ownership with a visible outcome.",
        impact: "high",
        nextStepLabel: "Design initiative",
      },
      {
        title: "Community project template",
        type: "community project template",
        whyItFits: "Helps define who is helped, what changes, and how impact is measured.",
        impact: "high",
        nextStepLabel: "Map impact",
      },
      {
        title: "Volunteer leadership ask",
        type: "volunteer leadership opportunity",
        whyItFits: "Builds leadership from existing service instead of adding random activities.",
        impact: "medium",
        nextStepLabel: "Ask for role",
      },
    ],
    deepen_service_impact: [
      {
        title: "Service impact story map",
        type: "community project template",
        whyItFits: "Turns hours into a clearer story of ownership and measurable impact.",
        impact: "high",
        nextStepLabel: "Map service",
      },
      {
        title: "Volunteer leadership upgrade",
        type: "volunteer leadership opportunity",
        whyItFits: "Helps the student deepen an existing commitment instead of starting over.",
        impact: "medium",
        nextStepLabel: "Find role",
      },
      {
        title: "Community initiative idea bank",
        type: "club initiative idea",
        whyItFits: "Gives practical project ideas tied to local needs.",
        impact: "medium",
        nextStepLabel: "Choose idea",
      },
    ],
    create_resume: applicationResources(),
    organize_application_materials: applicationResources(),
    improve_essay_material: applicationResources(),
    creative_portfolio: [
      {
        title: "Creative portfolio builder",
        type: "portfolio builder",
        whyItFits: "Organizes writing, art, theater, or media work into a coherent story.",
        impact: "high",
        nextStepLabel: "Pick pieces",
      },
      {
        title: "Writing/art competition shortlist",
        type: "writing/art competition",
        whyItFits: "Creates a deadline and a public way to share original creative work.",
        impact: "high",
        nextStepLabel: "Find submissions",
      },
      {
        title: `${input.location} showcase/submission options`,
        type: "local showcase/submission opportunity",
        whyItFits: "Connects the student’s creative work to real audiences nearby.",
        impact: "medium",
        nextStepLabel: "Choose venue",
      },
    ],
  };

  return resourceMap[category] ?? resourceMap.build_original_project;
}

function applicationResources(): AtlasResourceCard[] {
  return [
    {
      title: "Student resume builder",
      type: "resume builder",
      whyItFits: "Turns activities, awards, and projects into application-ready proof.",
      impact: "high",
      nextStepLabel: "Draft resume",
    },
    {
      title: "Activity list generator",
      type: "activity list generator",
      whyItFits: "Helps prioritize the strongest commitments and avoid scattered lists.",
      impact: "high",
      nextStepLabel: "Rank activities",
    },
    {
      title: "Brag sheet template",
      type: "brag sheet template",
      whyItFits: "Makes recommendations, essays, and scholarship answers easier to prepare.",
      impact: "medium",
      nextStepLabel: "Fill template",
    },
  ];
}

function hasCreativeDirection(interests: string[]) {
  const text = interests.join(" ").toLowerCase();
  return ["writing", "art", "theater", "media", "creative"].some((term) =>
    text.includes(term),
  );
}
