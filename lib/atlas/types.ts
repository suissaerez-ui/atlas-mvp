export type RubricStatus = "strong" | "developing" | "opportunity" | "unknown";

export type RecommendationCategory =
  | "improve_grade"
  | "increase_course_rigor"
  | "gain_research_experience"
  | "build_original_project"
  | "strengthen_leadership"
  | "deepen_service_impact"
  | "pursue_competition"
  | "create_resume"
  | "improve_essay_material"
  | "find_scholarships"
  | "find_tutor"
  | "find_program"
  | "organize_application_materials";

export type RecommendationConfidence = "low" | "medium" | "high";

export type ImpactLevel = "low" | "medium" | "high";

export type PrimaryConstraint =
  | "academic_foundation"
  | "course_rigor"
  | "direction_clarity"
  | "differentiation"
  | "leadership"
  | "service_impact"
  | "application_readiness"
  | "scholarship_optimization"
  | "overextension"
  | "none";

export type DevelopmentNeedId =
  | "civic_advocacy_proof"
  | "creative_ownership"
  | "healthcare_exposure"
  | "technical_builder_portfolio"
  | "venture_validation"
  | "direction_testing"
  | "service_impact"
  | "academic_foundation";

export type DevelopmentNeed = {
  id: DevelopmentNeedId;
  title: string;
  description: string;
  evidence: string[];
  preferredRecommendationCategories: RecommendationCategory[];
  actionPlanStyle: string;
};

export type StudentArchetype = {
  id: string;
  title: string;
  description: string;
  evidence: string[];
  primaryConstraint: PrimaryConstraint;
  priority: number;
};

export type StudentUnderstanding = {
  becoming: string;
  identitySignals: {
    futureDirection: string;
    energy: string;
    interests: string[];
    motivations: string[];
  };
  evidenceSignals: {
    academicStrength: string;
    activities: string[];
    leadership: string[];
    service: string[];
    projects: string[];
  };
};

export type StudentProfile = {
  name: string;
  grade: number;
  location: string;
  schoolName?: string;
  futureDirection?: string;
  energy?: string;
  intent?: string;
  interests: string[];
  goals: string[];
  notes?: string;
  academics: {
    gpa: number;
    trend: "up" | "flat" | "down" | "unknown";
    notes: string[];
  };
  courseRigor: {
    level: "light" | "balanced" | "rigorous" | "unknown";
    courses: string[];
  };
  activities: Array<{
    name: string;
    role?: string;
    category: string;
    years: number;
  }>;
  leadership: Array<{
    role: string;
    organization: string;
  }>;
  service: {
    hours: number;
    focusAreas: string[];
    notes: string[];
  };
  awards: Array<{
    title: string;
    level: "school" | "regional" | "state" | "national" | "unknown";
  }>;
  projects: Array<{
    title: string;
    type: "research" | "original_project" | "creative_portfolio" | "class_project" | "community_project";
    status: "idea" | "in_progress" | "complete";
    notes: string;
  }>;
  essays: Array<{
    title: string;
    status: "not_started" | "drafting" | "revising" | "complete";
  }>;
  documents: Array<{
    title: string;
    type: "transcript" | "resume" | "award" | "essay" | "other";
  }>;
};

export type AtlasRubricArea = {
  name: string;
  status: RubricStatus;
  evidence: string[];
  importance: number;
  improvementPotential: number;
};

export type RecommendationAction = {
  title: string;
  type: "program" | "project" | "course" | "tutor" | "document" | "essay" | "activity";
  priority: number;
  impact: ImpactLevel;
  label: string;
};

export type Recommendation = {
  title: string;
  category: RecommendationCategory;
  confidence: RecommendationConfidence;
  whyNow: string;
  evidenceUsed: string[];
  expectedImpact: string[];
  actionPlan: RecommendationAction[];
  resourceCategories: string[];
};

export type AtlasResourceCard = {
  title: string;
  type: string;
  whyItFits: string;
  impact: ImpactLevel;
  nextStepLabel: string;
};

export type AtlasAnalysisResponse = {
  studentName: string;
  profileSummary: string;
  understanding: StudentUnderstanding;
  constraint: PrimaryConstraint;
  developmentNeed: DevelopmentNeed;
  rubric: AtlasRubricArea[];
  archetype: StudentArchetype;
  strengths: Array<{
    title: string;
    evidence: string;
  }>;
  growthOpportunities: Array<{
    title: string;
    evidence: string;
  }>;
  nextBestMove: Recommendation;
  whyAtlasPickedIt: {
    title: string;
    subtitle: string;
    strengthLabel: string;
    strengths: string[];
    missingProofLabel: string;
    missingProof: string;
  };
  actionPlan: RecommendationAction[];
  resourceCategories: string[];
  guardrails: string[];
};
