import { analyzeStudent } from "./analyze";
import type {
  AtlasResourceCard,
  DevelopmentNeedId,
  PrimaryConstraint,
  RecommendationCategory,
  StudentProfile,
} from "./types";

export type FindResourcesInput = {
  profile: StudentProfile;
  recommendationCategory: RecommendationCategory;
  location: string;
  interests: string[];
  constraint?: PrimaryConstraint;
  developmentNeedId?: DevelopmentNeedId;
};

export function findMockResources(input: FindResourcesInput): AtlasResourceCard[] {
  const analysis =
    input.constraint && input.developmentNeedId
      ? null
      : analyzeStudent(input.profile);
  const constraint = input.constraint ?? analysis?.constraint ?? "none";
  const developmentNeedId = input.developmentNeedId ?? analysis?.developmentNeed.id ?? inferDevelopmentNeedId(input);

  // TODO: Future real search integration can plug in here.
  // Options to evaluate: Tavily, Exa, SerpAPI, OpenAI web search.
  // Keep this function returning normalized AtlasResourceCard objects.
  if (constraint === "academic_foundation") {
    return academicFoundationResources();
  }

  return resourceLibrary(input.location)[developmentNeedId] ?? directionTestingResources();
}

function resourceLibrary(location: string): Record<DevelopmentNeedId, AtlasResourceCard[]> {
  return {
    academic_foundation: academicFoundationResources(),
    civic_advocacy_proof: [
      resource("Model UN", "Civic / Diplomacy Experience", "A practical way to test public speaking, negotiation, research, and global or civic issues.", "Explore Model UN", "high"),
      resource("Junior State of America", "Civic Leadership", "Gives you debates, civic conversations, and student-led public affairs experiences.", "Explore JSA", "high"),
      resource("YMCA Youth and Government", "Government / Public Service", "Lets you practice policy, debate, and public service in a structured youth program.", "Find a chapter", "medium"),
      resource("National Speech & Debate Association", "Debate / Advocacy", "Builds argument, communication, and advocacy skills with a real competitive structure.", "Explore debate", "high"),
      resource("Local town council or school board meeting", "Local Civic Action", "A real way to observe public decision-making and find issues worth acting on.", "Attend a meeting", "medium"),
    ],
    global_affairs_exposure: [
      resource("Model UN", "Global Affairs / Civic Experience", "A practical way to test diplomacy, negotiation, public speaking, and global issues.", "Explore Model UN", "high"),
      resource("Junior State of America", "Public Affairs", "Helps you practice debate, civic leadership, and policy thinking with other students.", "Explore JSA", "high"),
      resource("Council on Foreign Relations education resources", "Global Issues Learning", "Gives accessible explainers and background on international issues worth following.", "Explore CFR education", "medium"),
      resource("Foreign Policy Association Great Decisions", "International Relations", "A strong search target for discussion programs and briefings on global issues.", "Explore Great Decisions", "medium"),
      resource(`${location} university international relations events`, "Local Global Affairs", "Local universities often host talks that let you hear from scholars, diplomats, and policy professionals.", "Search events", "medium"),
    ],
    healthcare_exposure: [
      resource(`${location} hospital volunteer program`, "Healthcare Exposure", "A direct way to observe healthcare settings and learn whether patient-facing work feels meaningful.", "Search hospital volunteering", "high"),
      resource("HOSA Future Health Professionals", "Health Careers", "A student organization built around healthcare exploration, competition, and leadership.", "Explore HOSA", "high"),
      resource("Red Cross Youth", "Health / Service", "Connects service, public health, preparedness, and youth leadership.", "Explore Red Cross Youth", "medium"),
      resource("Local EMS volunteer or observer pathway", "Emergency / Health Exposure", "Some communities offer age-appropriate ways to learn about emergency care and service.", "Check local options", "medium"),
      resource("Rutgers or local university health/science summer program", "Health / Science Program", "A concrete summer search target for structured exposure to science or healthcare.", "Search programs", "high"),
    ],
    technical_builder_portfolio: [
      resource("Congressional App Challenge", "Coding / Builder Portfolio", "Gives you a deadline and audience for a real app or software project.", "Explore challenge", "high"),
      resource("Hack Club", "Coding Community", "A student-friendly way to build projects, join events, and learn with other builders.", "Explore Hack Club", "high"),
      resource("FIRST Robotics", "Robotics / Engineering", "Turns engineering interest into teamwork, building, testing, and competition experience.", "Find a team", "high"),
      resource("CodeDay or local hackathon-style event", "Hackathon / Builder Event", "A short, real event where you can make something and meet other builders.", "Find an event", "medium"),
      resource("GitHub portfolio or itch.io game page", "Portfolio / Showcase", "A place to publish code, demos, screenshots, or playable games people can actually see.", "Create portfolio", "medium"),
    ],
    creative_ownership: [
      resource("YoungArts", "Creative Recognition", "A national opportunity for students building serious creative work.", "Explore YoungArts", "high"),
      resource("Scholastic Art & Writing Awards", "Arts / Writing Competition", "A well-known way to submit writing, art, design, and creative work.", "Explore awards", "high"),
      resource(`${location} local dance or theater showcase`, "Performance Showcase", "A concrete way to share performance work with a real audience nearby.", "Search showcases", "medium"),
      resource("School arts magazine or literary magazine", "Creative Publication", "A practical first audience for writing, art, photography, or media work.", "Submit work", "medium"),
      resource("Performance reel or creative portfolio", "Portfolio", "Collects clips, pieces, process notes, and reflections into something others can review.", "Build portfolio", "high"),
    ],
    venture_validation: [
      resource("DECA", "Business / Competition", "A structured way to test business thinking, presentations, and entrepreneurship skills.", "Explore DECA", "high"),
      resource("FBLA", "Business Leadership", "Offers business competitions, leadership practice, and career exploration.", "Explore FBLA", "medium"),
      resource("Diamond Challenge", "Entrepreneurship Competition", "A student venture competition that pushes you to test and explain an idea.", "Explore challenge", "high"),
      resource("NFTE", "Entrepreneurship Education", "A strong search target for youth entrepreneurship programs and venture-building support.", "Explore NFTE", "medium"),
      resource("Customer discovery interviews", "Venture Validation", "The fastest way to learn whether real people actually want your idea.", "Interview 5 people", "high"),
    ],
    service_impact: [
      resource("School peer tutoring program", "Service / Mentoring", "Turns helping classmates into a consistent role with visible impact.", "Ask about tutoring", "high"),
      resource("National Honor Society tutoring", "Academic Service", "A common school-based pathway for tutoring and peer support.", "Find NHS tutoring", "medium"),
      resource("Big Brothers Big Sisters", "Mentoring", "A real organization focused on mentoring and youth support.", "Explore mentoring", "medium"),
      resource(`${location} food pantry or community service organization`, "Community Service", "A local way to turn service hours into a deeper commitment.", "Search local service", "medium"),
      resource("VolunteerMatch search target", "Volunteer Search", "Useful for finding local nonprofits and causes that match your interests.", "Search VolunteerMatch", "medium"),
    ],
    direction_testing: directionTestingResources(),
  };
}

function academicFoundationResources(): AtlasResourceCard[] {
  return [
    resource("Teacher office hours plan", "Academic Support", "Fastest way to identify what is actually blocking your grade.", "Plan the ask", "high"),
    resource("Khan Academy targeted practice", "Academic Practice", "Useful for rebuilding one specific skill with short, focused practice.", "Start practice", "high"),
    resource("School peer tutoring or National Honor Society tutoring", "Peer Tutoring", "A low-pressure support option that may already exist at school.", "Find tutoring", "high"),
    resource("Local tutoring center or online tutoring option", "Tutoring", "Adds structure and accountability when a class feels hard to fix alone.", "Compare options", "medium"),
    resource("Two-week grade recovery plan", "Study System", "Turns grade improvement into a short, trackable plan instead of a vague goal.", "Make a plan", "medium"),
  ];
}

function directionTestingResources(): AtlasResourceCard[] {
  return [
    resource("Career conversation or informational interview", "Exploration Experience", "A real conversation can quickly show what a path feels like day to day.", "Ask one person", "high"),
    resource("Job shadow day", "Career Exposure", "A short observation gives more information than guessing from the outside.", "Find a shadow option", "high"),
    resource("School club sampler", "Activity Exploration", "Trying one meeting or event helps you test an interest without overcommitting.", "Try one club", "medium"),
    resource("Summer pre-college exploration program", "Exploration Program", "A structured way to sample a field before choosing a deeper commitment.", "Search programs", "medium"),
    resource("Talk to a teacher or counselor about two possible paths", "Guidance Conversation", "Helps narrow options into a small next experiment.", "Plan conversation", "medium"),
  ];
}

function resource(
  title: string,
  type: string,
  whyItFits: string,
  nextStepLabel: string,
  impact: AtlasResourceCard["impact"],
): AtlasResourceCard {
  return {
    title,
    type,
    whyItFits,
    impact,
    nextStepLabel,
  };
}

function inferDevelopmentNeedId(input: FindResourcesInput): DevelopmentNeedId {
  const text = [...input.interests, input.profile.futureDirection ?? "", input.profile.energy ?? ""]
    .join(" ")
    .toLowerCase();

  if (["diplomat", "international relations", "foreign service", "global affairs"].some((term) => text.includes(term))) {
    return "global_affairs_exposure";
  }
  if (["doctor", "health", "nursing", "public health", "hospital"].some((term) => text.includes(term))) {
    return "healthcare_exposure";
  }
  if (["law", "policy", "government", "public service", "debate"].some((term) => text.includes(term))) {
    return "civic_advocacy_proof";
  }
  if (["engineer", "robotics", "coding", "software", "game"].some((term) => text.includes(term))) {
    return "technical_builder_portfolio";
  }
  if (["business", "entrepreneur", "marketing", "selling", "deca"].some((term) => text.includes(term))) {
    return "venture_validation";
  }
  if (["dance", "theater", "art", "writing", "music", "creative"].some((term) => text.includes(term))) {
    return "creative_ownership";
  }
  if (["teacher", "nonprofit", "mentoring", "tutoring", "helping kids"].some((term) => text.includes(term))) {
    return "service_impact";
  }
  return "direction_testing";
}
