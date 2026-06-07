"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  BookOpen,
  Bot,
  Check,
  ChevronRight,
  FileUp,
  FlaskConical,
  GraduationCap,
  HeartHandshake,
  Home,
  Lightbulb,
  Medal,
  MessageCircle,
  Mic,
  NotebookPen,
  Pencil,
  Plus,
  Send,
  Sparkles,
  Star,
  Trophy,
  UserRound,
  Users,
  X,
  Zap,
} from "lucide-react";
import type {
  AtlasAnalysisResponse,
  AtlasResourceCard,
  RecommendationAction,
  StudentProfile,
} from "@/lib/atlas/types";

type Screen = "home" | "profile" | "chat" | "add" | "you";
type DemoStudent = "sarah" | "jake" | "emma" | "max" | "ava" | "leo" | "mia" | "lily";
type GpaRange = "below_3" | "3_0_3_4" | "3_5_3_7" | "3_8_plus";
type BuilderCourseRigor = "light" | "balanced" | "rigorous" | "unknown";
type LeadershipLevel = "none" | "some" | "meaningful";
type ServiceRange = "none" | "1_50" | "50_100" | "100_plus";
type AwardLevel = "none" | "school" | "regional" | "state_national";
type ProjectLevel = "none" | "class" | "independent" | "research" | "creative";
type ApplicationMaterial = "resume" | "essay" | "transcript" | "none";
type AdvisorGoal =
  | "college_applications"
  | "scholarships"
  | "summer_opportunities"
  | "improve_grades"
  | "build_leadership"
  | "find_direction"
  | "portfolio_project"
  | "organize_materials"
  | "not_sure";
type BuilderErrors = Partial<Record<"name" | "interests" | "gpaRange" | "form", string>>;
type FeedbackChoice = "yes" | "mostly" | "not_really";

type BuilderForm = {
  name: string;
  grade: string;
  location: string;
  advisorGoal: AdvisorGoal;
  interests: string[];
  gpaRange: GpaRange;
  courseRigor: BuilderCourseRigor;
  activities: string;
  leadership: LeadershipLevel;
  service: ServiceRange;
  awards: AwardLevel;
  project: ProjectLevel;
  applicationMaterials: ApplicationMaterial[];
};

const demoStudents = [
  { id: "sarah", label: "Sarah" },
  { id: "jake", label: "Jake" },
  { id: "emma", label: "Emma" },
  { id: "max", label: "Max" },
  { id: "ava", label: "Ava" },
  { id: "leo", label: "Leo" },
  { id: "mia", label: "Mia" },
  { id: "lily", label: "Lily" },
] satisfies { id: DemoStudent; label: string }[];

const interestOptions = [
  "STEM",
  "Engineering",
  "Medicine",
  "Business",
  "Writing",
  "Art",
  "Law",
  "Service",
  "Sports",
  "Undecided",
];

const advisorGoalOptions = [
  ["Build stronger college applications", "college_applications"],
  ["Find scholarships", "scholarships"],
  ["Find summer opportunities", "summer_opportunities"],
  ["Improve grades", "improve_grades"],
  ["Build leadership", "build_leadership"],
  ["Find a direction", "find_direction"],
  ["Build a portfolio/project", "portfolio_project"],
  ["Organize application materials", "organize_materials"],
  ["Not sure", "not_sure"],
] satisfies Array<[string, AdvisorGoal]>;

const initialBuilderForm: BuilderForm = {
  name: "",
  grade: "11",
  location: "New Jersey",
  advisorGoal: "not_sure",
  interests: [],
  gpaRange: "3_5_3_7",
  courseRigor: "balanced",
  activities: "",
  leadership: "none",
  service: "none",
  awards: "none",
  project: "none",
  applicationMaterials: ["none"],
};

const summaryItems = [
  {
    title: "Academics",
    detail: "3.85 GPA · rigorous coursework",
    status: "Strong foundation",
    icon: GraduationCap,
    color: "bg-emerald-100 text-emerald-700",
  },
  {
    title: "Activities",
    detail: "clubs, leadership, sports, volunteering",
    status: "Well-rounded involvement",
    icon: Users,
    color: "bg-sky-100 text-sky-700",
  },
  {
    title: "Awards",
    detail: "12 awards and honors",
    status: "Recognized achievement",
    icon: Trophy,
    color: "bg-amber-100 text-amber-700",
  },
  {
    title: "Community",
    detail: "120+ volunteer hours",
    status: "Meaningful impact",
    icon: HeartHandshake,
    color: "bg-rose-100 text-rose-700",
  },
  {
    title: "Research",
    detail: "limited original work so far",
    status: "Growth opportunity",
    icon: FlaskConical,
    color: "bg-violet-100 text-violet-700",
  },
];

const navItems = [
  { id: "home", label: "Home", icon: Home },
  { id: "profile", label: "My Atlas", icon: UserRound },
  { id: "add", label: "Add", icon: Plus },
  { id: "chat", label: "Chat", icon: MessageCircle },
  { id: "you", label: "You", icon: Sparkles },
] satisfies { id: Screen; label: string; icon: typeof Home }[];

export default function AtlasApp() {
  const [screen, setScreen] = useState<Screen>("home");

  return (
    <main className="flex min-h-screen items-center justify-center px-3 py-4 sm:px-6">
      <AppShell screen={screen} onNavigate={setScreen} />
    </main>
  );
}

function AppShell({
  screen,
  onNavigate,
}: {
  screen: Screen;
  onNavigate: (screen: Screen) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
    window.scrollTo({ top: 0 });
  }, [screen]);

  return (
    <section className="mx-auto flex h-[calc(100vh-2rem)] max-h-[860px] min-h-[640px] w-full max-w-[430px] flex-col overflow-hidden rounded-[2.15rem] border border-white/90 bg-[#fffdf7]/82 shadow-bubble backdrop-blur-xl">
      <div ref={scrollRef} className="flex-1 overflow-y-auto phone-safe-top">
        {screen === "home" && <HomeScreen />}
        {screen === "profile" && <ProfileScreen />}
        {screen === "chat" && <ChatScreen />}
        {screen === "add" && <AddSoonScreen />}
        {screen === "you" && <YouSoonScreen />}
      </div>
      <BottomNav activeScreen={screen} onNavigate={onNavigate} />
    </section>
  );
}

function BottomNav({
  activeScreen,
  onNavigate,
}: {
  activeScreen: Screen;
  onNavigate: (screen: Screen) => void;
}) {
  return (
    <nav className="phone-safe-bottom border-t border-white/80 bg-white/90 px-4 pt-3 backdrop-blur">
      <div className="grid grid-cols-5 gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = activeScreen === item.id;
          return (
            <button
              key={item.id}
              className={`flex h-[58px] flex-col items-center justify-center gap-1 rounded-[1.15rem] text-[0.72rem] font-extrabold transition ${
                active
                  ? "bg-[#20233a] text-white shadow-soft"
                  : "text-slate-400 hover:bg-[#fff7df] hover:text-[#20233a]"
              }`}
              onClick={() => onNavigate(item.id)}
              type="button"
            >
              <Icon size={21} strokeWidth={2.6} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function HomeScreen() {
  const [analysis, setAnalysis] = useState<AtlasAnalysisResponse | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<DemoStudent>("sarah");
  const [demoProfilesOpen, setDemoProfilesOpen] = useState(false);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [builderForm, setBuilderForm] = useState<BuilderForm>(initialBuilderForm);
  const [builderErrors, setBuilderErrors] = useState<BuilderErrors>({});
  const [isBuilding, setIsBuilding] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentProfile, setCurrentProfile] = useState<StudentProfile | null>(null);
  const [resources, setResources] = useState<AtlasResourceCard[]>([]);
  const [isFindingResources, setIsFindingResources] = useState(false);
  const [feedbackChoice, setFeedbackChoice] = useState<FeedbackChoice | null>(null);
  const [feedbackText, setFeedbackText] = useState("");

  useEffect(() => {
    let isCurrent = true;

    async function loadAnalysis() {
      try {
        const response = await fetch(`/api/analyze-student?student=${selectedStudent}`);
        if (!response.ok) {
          throw new Error("Unable to analyze student");
        }
        const data = (await response.json()) as AtlasAnalysisResponse;
        if (isCurrent) {
          setAnalysis(data);
          setCurrentProfile(null);
          setResources([]);
          setFeedbackChoice(null);
          setFeedbackText("");
        }
      } catch {
        if (isCurrent) {
          setAnalysis(null);
        }
      }
    }

    loadAnalysis();

    return () => {
      isCurrent = false;
    };
  }, [selectedStudent]);

  async function submitBuilder() {
    const errors = validateBuilderForm(builderForm);
    setBuilderErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    setIsBuilding(true);
    try {
      const profile = builderFormToProfile(builderForm);
      const response = await fetch("/api/analyze-student", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(profile),
      });

      if (!response.ok) {
        throw new Error("Unable to analyze profile");
      }

      const nextAnalysis = (await response.json()) as AtlasAnalysisResponse;
      setBuilderOpen(false);
      setIsAnalyzing(true);
      await wait(1200);
      setAnalysis(nextAnalysis);
      setCurrentProfile(profile);
      setResources([]);
      setFeedbackChoice(null);
      setFeedbackText("");
    } catch {
      setBuilderErrors({
        form: "Tell Atlas a little more so I can help.",
      });
    } finally {
      setIsBuilding(false);
      setIsAnalyzing(false);
    }
  }

  async function findResources() {
    if (!analysis) {
      return;
    }

    setIsFindingResources(true);
    try {
      const response = await fetch("/api/find-resources", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          student: currentProfile ? undefined : selectedStudent,
          profile: currentProfile ?? undefined,
          recommendationCategory: analysis.nextBestMove.category,
          location: currentProfile?.location,
          interests: currentProfile?.interests,
        }),
      });

      if (!response.ok) {
        throw new Error("Unable to find resources");
      }

      const data = (await response.json()) as { resources: AtlasResourceCard[] };
      setResources(data.resources);
    } finally {
      setIsFindingResources(false);
    }
  }

  return (
    <div className="space-y-5 px-5 pb-6">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-[1.55rem] font-black leading-none text-[#20233a]">
            Atlas ✨
          </p>
          <p className="mt-3 text-[2rem] font-black leading-none tracking-normal">
            Hey {analysis?.studentName ?? selectedStudentLabel(selectedStudent)} 👋
          </p>
          <p className="mt-2 text-[1rem] font-extrabold leading-snug text-slate-500">
            I reviewed everything you uploaded ✅
          </p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-[1.15rem] bg-white text-[#20233a] shadow-soft">
          <Bot size={25} />
        </div>
      </header>

      <div>
        <button
          className="text-sm font-black text-slate-400 underline decoration-slate-300 underline-offset-4"
          onClick={() => setDemoProfilesOpen((open) => !open)}
          type="button"
        >
          {demoProfilesOpen ? "Hide Demo Profiles" : "View Demo Profiles"}
        </button>
        {demoProfilesOpen && (
          <div className="mt-3">
            <DemoStudentSelector
              selectedStudent={selectedStudent}
              onSelect={setSelectedStudent}
            />
          </div>
        )}
      </div>

      <button
        className="flex h-14 w-full items-center justify-center gap-2 rounded-[1.2rem] bg-[#20233a] px-5 text-[1rem] font-black text-white shadow-soft"
        onClick={() => setBuilderOpen(true)}
        type="button"
      >
        <Sparkles size={19} fill="currentColor" />
        Build My Atlas
      </button>

      {isAnalyzing ? (
        <AnalyzingCard />
      ) : (
        <>
          <HeroRecommendationCard recommendation={analysis?.nextBestMove} />
          {analysis && <RecommendationMetadata analysis={analysis} />}
          <WhyCard why={analysis?.whyAtlasPickedIt} />
          <ActionPlanCard
            actions={analysis?.actionPlan}
            isFindingResources={isFindingResources}
            onFindResources={findResources}
          />
          {analysis && (
            <AtlasFeedbackCard
              choice={feedbackChoice}
              text={feedbackText}
              onSelect={setFeedbackChoice}
              onTextChange={setFeedbackText}
            />
          )}
          {resources.length > 0 && <ResourceList resources={resources} />}
        </>
      )}
      <BottomInput placeholder="Ask Atlas anything..." />
      {builderOpen && (
        <QuickProfileBuilder
          errors={builderErrors}
          form={builderForm}
          isSubmitting={isBuilding}
          onChange={(form) => {
            setBuilderForm(form);
            setBuilderErrors({});
          }}
          onClose={() => setBuilderOpen(false)}
          onSubmit={submitBuilder}
        />
      )}
    </div>
  );
}

function DemoStudentSelector({
  selectedStudent,
  onSelect,
}: {
  selectedStudent: DemoStudent;
  onSelect: (student: DemoStudent) => void;
}) {
  return (
    <div className="rounded-[1.35rem] bg-white/70 p-2 shadow-soft">
      <p className="px-2 pb-1 text-[0.68rem] font-black uppercase tracking-[0.08em] text-slate-400">
        Demo Profiles
      </p>
      <div className="flex gap-1.5 overflow-x-auto">
        {demoStudents.map((student) => {
          const active = selectedStudent === student.id;

          return (
            <button
              key={student.id}
              className={`h-10 shrink-0 rounded-[1rem] px-4 text-sm font-black transition ${
                active
                  ? "bg-[#20233a] text-white"
                  : "bg-transparent text-slate-400 hover:bg-[#fff7df] hover:text-[#20233a]"
              }`}
              onClick={() => onSelect(student.id)}
              type="button"
            >
              {student.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function QuickProfileBuilder({
  errors,
  form,
  isSubmitting,
  onChange,
  onClose,
  onSubmit,
}: {
  errors: BuilderErrors;
  form: BuilderForm;
  isSubmitting: boolean;
  onChange: (form: BuilderForm) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  const update = <K extends keyof BuilderForm>(key: K, value: BuilderForm[K]) => {
    onChange({ ...form, [key]: value });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#20233a]/35 px-3 py-4 backdrop-blur-sm">
      <section className="flex h-[calc(100vh-2rem)] max-h-[860px] w-full max-w-[430px] flex-col overflow-hidden rounded-[2.15rem] bg-[#fffdf7] shadow-bubble">
        <header className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-5">
          <div>
            <p className="text-[0.72rem] font-black uppercase tracking-[0.08em] text-slate-400">
              Quick Profile Builder
            </p>
            <h2 className="mt-1 text-3xl font-black leading-none">
              Build My Atlas
            </h2>
            <p className="mt-2 text-sm font-extrabold leading-snug text-slate-500">
              Share the basics. Atlas will pick one next move.
            </p>
          </div>
          <button
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-[#20233a] shadow-soft"
            onClick={onClose}
            type="button"
            aria-label="Close builder"
          >
            <X size={20} />
          </button>
        </header>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
          {errors.form && (
            <p className="rounded-[1.15rem] bg-[#fff4c8] px-4 py-3 text-sm font-black leading-snug text-[#8a6820]">
              {errors.form}
            </p>
          )}
          <div className="grid grid-cols-[1fr_96px] gap-3">
            <BuilderField error={errors.name} label="Name">
              <input
                className="h-12 w-full rounded-2xl bg-white px-4 text-base font-extrabold outline-none shadow-soft placeholder:text-slate-300"
                placeholder="Your name"
                value={form.name}
                onChange={(event) => update("name", event.target.value)}
              />
            </BuilderField>
            <BuilderField label="Grade">
              <select
                className="h-12 w-full rounded-2xl bg-white px-3 text-base font-extrabold outline-none shadow-soft"
                value={form.grade}
                onChange={(event) => update("grade", event.target.value)}
              >
                {["9", "10", "11", "12"].map((grade) => (
                  <option key={grade} value={grade}>
                    {grade}
                  </option>
                ))}
              </select>
            </BuilderField>
          </div>

          <BuilderField label="Location">
            <input
              className="h-12 w-full rounded-2xl bg-white px-4 text-base font-extrabold outline-none shadow-soft placeholder:text-slate-300"
              placeholder="New Jersey"
              value={form.location}
              onChange={(event) => update("location", event.target.value)}
            />
          </BuilderField>

          <BuilderField label="What are you hoping Atlas helps with most?">
            <ChoiceGrid
              options={advisorGoalOptions.map(([label, value]) => [label, value])}
              value={form.advisorGoal}
              onChange={(value) => update("advisorGoal", value as AdvisorGoal)}
            />
          </BuilderField>

          <BuilderField error={errors.interests} label="Interests">
            <ChipGroup
              options={interestOptions}
              selected={form.interests}
              onToggle={(interest) =>
                update(
                  "interests",
                  form.interests.includes(interest)
                    ? form.interests.filter((item) => item !== interest)
                    : [...form.interests, interest],
                )
              }
            />
          </BuilderField>

          <BuilderField error={errors.gpaRange} label="GPA range">
            <ChoiceGrid
              options={[
                ["Below 3.0", "below_3"],
                ["3.0-3.4", "3_0_3_4"],
                ["3.5-3.7", "3_5_3_7"],
                ["3.8+", "3_8_plus"],
              ]}
              value={form.gpaRange}
              onChange={(value) => update("gpaRange", value as GpaRange)}
            />
          </BuilderField>

          <BuilderField label="Course rigor">
            <ChoiceGrid
              options={[
                ["Light", "light"],
                ["Balanced", "balanced"],
                ["Rigorous", "rigorous"],
                ["Not sure", "unknown"],
              ]}
              value={form.courseRigor}
              onChange={(value) => update("courseRigor", value as BuilderCourseRigor)}
            />
          </BuilderField>

          <BuilderField label="Activities">
            <textarea
              className="min-h-[92px] w-full resize-none rounded-2xl bg-white p-4 text-base font-extrabold leading-snug outline-none shadow-soft placeholder:text-slate-300"
              placeholder="Soccer, biology club, job, theater..."
              value={form.activities}
              onChange={(event) => update("activities", event.target.value)}
            />
          </BuilderField>

          <BuilderField label="Leadership">
            <ChoiceGrid
              options={[
                ["None", "none"],
                ["Some role/title", "some"],
                ["Led something meaningful", "meaningful"],
              ]}
              value={form.leadership}
              onChange={(value) => update("leadership", value as LeadershipLevel)}
            />
          </BuilderField>

          <BuilderField label="Service / volunteer hours">
            <ChoiceGrid
              options={[
                ["None", "none"],
                ["1-50", "1_50"],
                ["50-100", "50_100"],
                ["100+", "100_plus"],
              ]}
              value={form.service}
              onChange={(value) => update("service", value as ServiceRange)}
            />
          </BuilderField>

          <BuilderField label="Awards">
            <ChoiceGrid
              options={[
                ["None", "none"],
                ["School", "school"],
                ["Regional", "regional"],
                ["State/National", "state_national"],
              ]}
              value={form.awards}
              onChange={(value) => update("awards", value as AwardLevel)}
            />
          </BuilderField>

          <BuilderField label="Projects / research / portfolio">
            <ChoiceGrid
              options={[
                ["None yet", "none"],
                ["Class project only", "class"],
                ["Independent project", "independent"],
                ["Research", "research"],
                ["Creative portfolio", "creative"],
              ]}
              value={form.project}
              onChange={(value) => update("project", value as ProjectLevel)}
            />
          </BuilderField>

          <BuilderField label="Application materials">
            <ChipGroup
              options={["Resume", "Essay", "Transcript", "None yet"]}
              selected={form.applicationMaterials.map(materialLabel)}
              onToggle={(label) => {
                const value = applicationMaterialValue(label);
                const next: ApplicationMaterial[] =
                  value === "none"
                    ? ["none"]
                    : form.applicationMaterials.includes(value)
                      ? form.applicationMaterials.filter((item) => item !== value)
                      : [...form.applicationMaterials.filter((item) => item !== "none"), value];
                update("applicationMaterials", next.length > 0 ? next : ["none"]);
              }}
            />
          </BuilderField>
        </div>

        <div className="phone-safe-bottom border-t border-slate-100 bg-white/90 px-5 pt-4">
          <button
            className="h-14 w-full rounded-[1.2rem] bg-[#20233a] px-6 text-[1rem] font-black text-white shadow-soft disabled:opacity-60"
            disabled={isSubmitting}
            onClick={onSubmit}
            type="button"
          >
            {isSubmitting ? "Building..." : "Get my Atlas recommendation"}
          </button>
        </div>
      </section>
    </div>
  );
}

function BuilderField({
  error,
  label,
  children,
}: {
  error?: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="block">
      <span className="mb-2 block text-sm font-black text-slate-500">{label}</span>
      {children}
      {error && (
        <span className="mt-2 block text-sm font-extrabold leading-snug text-[#d04b6a]">
          {error}
        </span>
      )}
    </div>
  );
}

function ChipGroup({
  options,
  selected,
  onToggle,
}: {
  options: string[];
  selected: string[];
  onToggle: (option: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const active = selected.includes(option);
        return (
          <button
            key={option}
            className={`rounded-full px-3.5 py-2 text-sm font-black transition ${
              active ? "bg-[#20233a] text-white" : "bg-white text-slate-500 shadow-soft"
            }`}
            onClick={() => onToggle(option)}
            type="button"
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

function ChoiceGrid({
  options,
  value,
  onChange,
}: {
  options: Array<[string, string]>;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {options.map(([label, optionValue]) => {
        const active = value === optionValue;
        return (
          <button
            key={optionValue}
            className={`min-h-[46px] rounded-2xl px-3 py-2 text-sm font-black leading-tight transition ${
              active ? "bg-[#20233a] text-white" : "bg-white text-slate-500 shadow-soft"
            }`}
            onClick={() => onChange(optionValue)}
            type="button"
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

function AnalyzingCard() {
  return (
    <section className="flex min-h-[340px] flex-col items-center justify-center rounded-[2rem] bg-white p-8 text-center shadow-bubble">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#fff0aa]">
        <div className="h-7 w-7 animate-spin rounded-full border-4 border-[#20233a] border-t-transparent" />
      </div>
      <h2 className="text-3xl font-black leading-none text-[#20233a]">
        Atlas is reviewing your profile...
      </h2>
      <p className="mt-3 max-w-[15rem] text-sm font-extrabold leading-snug text-slate-400">
        Looking for the one move that matters most right now.
      </p>
    </section>
  );
}

function HeroRecommendationCard({
  recommendation,
}: {
  recommendation?: AtlasAnalysisResponse["nextBestMove"];
}) {
  return (
    <section className="relative overflow-hidden rounded-[2rem] bg-[#fff0aa] px-5 pb-5 pt-5 shadow-bubble">
      <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#ffcf7a]/55 to-transparent" />
      <div className="absolute right-0 top-6 h-28 w-28 rounded-bl-[3.5rem] bg-[#9ee9ff]" />
      <div className="absolute bottom-4 right-4 rotate-6">
        <MicroscopeIllustration />
      </div>
      <div className="relative">
        <div className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5 text-[0.72rem] font-black uppercase tracking-[0.08em] text-[#6b5d16]">
          <Zap size={14} fill="currentColor" />
          Atlas Recommendation
        </div>
        <h1 className="max-w-[14rem] text-[2.85rem] font-black leading-[0.88] tracking-normal text-[#20233a]">
          {recommendation?.title ?? "Gain Research Experience"}
        </h1>
        <p className="mt-4 max-w-[13rem] text-[1.02rem] font-extrabold leading-snug text-[#444253]">
          {recommendation?.whyNow ??
            "This is the move that could create the biggest positive impact on your future right now."}
        </p>
        <button
          className="mt-5 inline-flex h-[52px] items-center gap-2 rounded-[1.15rem] bg-[#20233a] px-6 text-[1rem] font-black text-white shadow-soft"
          type="button"
        >
          Show me why
          <ChevronRight size={18} />
        </button>
      </div>
    </section>
  );
}

function RecommendationMetadata({ analysis }: { analysis: AtlasAnalysisResponse }) {
  return (
    <section className="rounded-[1.25rem] bg-white/55 px-4 py-3">
      <p className="text-[0.76rem] font-black leading-snug text-slate-400">
        Atlas detected:
      </p>
      <p className="text-sm font-black leading-snug text-[#20233a]">
        {analysis.archetype.title}
      </p>
      <p className="mt-2 text-[0.76rem] font-black leading-snug text-slate-400">
        Constraint:
      </p>
      <p className="text-sm font-black leading-snug text-[#20233a]">
        {formatConstraint(analysis.archetype.primaryConstraint)}
      </p>
    </section>
  );
}

function MicroscopeIllustration() {
  return (
    <div className="relative h-32 w-28">
      <div className="absolute left-10 top-4 h-14 w-5 -rotate-45 rounded-full bg-[#5b6cff]" />
      <div className="absolute left-4 top-14 h-11 w-11 rounded-full border-[10px] border-[#ff8fb3] bg-white" />
      <div className="absolute bottom-7 left-9 h-12 w-5 rotate-12 rounded-full bg-[#20233a]" />
      <div className="absolute bottom-3 left-2 h-5 w-20 rounded-full bg-[#54d6aa]" />
      <div className="absolute bottom-0 left-0 h-4 w-28 rounded-full bg-white" />
      <div className="absolute right-4 top-0 h-6 w-9 -rotate-45 rounded-full bg-white" />
      <Star
        className="absolute right-0 top-11 text-[#20233a]"
        size={20}
        fill="currentColor"
      />
    </div>
  );
}

function AtlasFeedbackCard({
  choice,
  text,
  onSelect,
  onTextChange,
}: {
  choice: FeedbackChoice | null;
  text: string;
  onSelect: (choice: FeedbackChoice) => void;
  onTextChange: (text: string) => void;
}) {
  const options = [
    { id: "yes", label: "👍 Yes" },
    { id: "mostly", label: "🤔 Mostly" },
    { id: "not_really", label: "❌ Not really" },
  ] satisfies { id: FeedbackChoice; label: string }[];

  return (
    <section className="rounded-[1.75rem] bg-white p-5 shadow-soft">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-[1.15rem] bg-[#fff0aa] text-[#8a6820]">
          <MessageCircle size={21} />
        </div>
        <div>
          <h2 className="text-2xl font-black leading-none">How did Atlas do?</h2>
          <p className="mt-1 text-sm font-extrabold text-slate-400">
            Did Atlas understand you?
          </p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {options.map((option) => {
          const active = choice === option.id;
          return (
            <button
              key={option.id}
              className={`min-h-[46px] rounded-[1rem] px-2 text-sm font-black transition ${
                active ? "bg-[#20233a] text-white" : "bg-[#f7f8fb] text-slate-500"
              }`}
              onClick={() => onSelect(option.id)}
              type="button"
            >
              {option.label}
            </button>
          );
        })}
      </div>
      {choice && (
        <label className="mt-4 block">
          <span className="mb-2 block text-sm font-black text-slate-500">
            What did Atlas miss?
          </span>
          <textarea
            className="min-h-[88px] w-full resize-none rounded-2xl bg-[#f7f8fb] p-4 text-sm font-extrabold leading-snug outline-none placeholder:text-slate-300"
            placeholder="Optional note for testing..."
            value={text}
            onChange={(event) => onTextChange(event.target.value)}
          />
        </label>
      )}
    </section>
  );
}

function WhyCard({
  why,
}: {
  why?: AtlasAnalysisResponse["whyAtlasPickedIt"];
}) {
  const strengths = why?.strengths ?? ["Grades", "Competitions", "Community"];

  return (
    <section className="rounded-[1.75rem] bg-white p-5 shadow-soft">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-[1.15rem] bg-[#e0f7ff] text-[#1686a8]">
          <Lightbulb size={21} />
        </div>
        <div>
          <h2 className="text-2xl font-black leading-none">
            {why?.title ?? "Why this move?"}
          </h2>
          <p className="mt-1 text-sm font-extrabold text-slate-400">
            {why?.subtitle ?? "Atlas noticed the pattern."}
          </p>
        </div>
      </div>
      <div className="space-y-4">
        <div className="rounded-[1.35rem] bg-[#f3fffb] p-4">
          <p className="mb-3 text-sm font-black text-[#087d66]">
            {why?.strengthLabel ?? "You’re already strong in:"}
          </p>
          <div className="flex flex-wrap gap-2">
            {strengths.map((item) => (
              <span
                key={item}
                className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-2 text-sm font-black text-slate-700"
              >
                <Check size={15} strokeWidth={3} className="text-[#087d66]" />
                {item}
              </span>
            ))}
          </div>
        </div>
        <div className="rounded-[1.35rem] bg-[#fff4c8] p-4">
          <p className="mb-2 text-sm font-black text-[#8a6820]">
            {why?.missingProofLabel ?? "The missing proof:"}
          </p>
          <PillRow
            icon={Sparkles}
            text={
              why?.missingProof ??
              "Original work, research, or a project you can proudly explain."
            }
            tone="warm"
          />
        </div>
      </div>
    </section>
  );
}

function ActionPlanCard({
  actions,
  isFindingResources,
  onFindResources,
}: {
  actions?: RecommendationAction[];
  isFindingResources: boolean;
  onFindResources: () => void;
}) {
  const plans = actions ?? [
    {
      label: "Start here",
      title: "Rutgers Summer Research Program",
      impact: "high",
      priority: 1,
      type: "program",
    },
    {
      label: "Also great",
      title: "NJ Governor’s STEM Scholars",
      impact: "high",
      priority: 2,
      type: "program",
    },
    {
      label: "Do this now",
      title: "Independent Research Project",
      impact: "medium",
      priority: 3,
      type: "project",
    },
  ];

  return (
    <section className="rounded-[1.75rem] bg-[#e7f7ff] p-5 shadow-soft">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-[1.15rem] bg-white text-[#2d71d8]">
          <BookOpen size={21} />
        </div>
        <div>
          <h2 className="text-2xl font-black leading-none">Your action plan</h2>
          <p className="mt-1 text-sm font-extrabold text-[#527284]">
            Small moves. Real momentum.
          </p>
        </div>
      </div>
      <div className="space-y-3.5">
        {plans.map((plan, index) => (
          <button
            key={plan.title}
            className={`flex w-full items-center gap-3 rounded-[1.35rem] p-4 text-left shadow-[0_6px_18px_rgba(69,103,128,0.08)] ${
              index === 0 ? "bg-[#20233a] text-white" : "bg-white text-[#20233a]"
            }`}
            type="button"
          >
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-black ${
                index === 0 ? "bg-[#fff0aa] text-[#20233a]" : "bg-[#f3f7fb] text-slate-500"
              }`}
            >
              {index + 1}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[1rem] font-black leading-tight">
                {plan.title}
              </span>
              <span
                className={`mt-1 block text-[0.7rem] font-black uppercase tracking-[0.08em] ${
                  index === 0 ? "text-[#fff0aa]" : "text-slate-400"
                }`}
              >
                {plan.label}
              </span>
            </span>
            <span
              className={`shrink-0 rounded-full px-3 py-1 text-[0.68rem] font-black ${impactTone(
                plan.impact,
              )}`}
            >
              {formatImpact(plan.impact)}
            </span>
          </button>
        ))}
      </div>
      <button
        className="mt-4 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-[1.15rem] bg-white px-5 text-[1rem] font-black text-[#20233a] shadow-soft disabled:opacity-60"
        disabled={isFindingResources}
        onClick={onFindResources}
        type="button"
      >
        <Sparkles size={18} fill="currentColor" />
        {isFindingResources ? "Finding..." : "Find Resources"}
      </button>
    </section>
  );
}

function ResourceList({ resources }: { resources: AtlasResourceCard[] }) {
  return (
    <section className="rounded-[1.75rem] bg-white p-5 shadow-soft">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-[1.15rem] bg-[#fff0aa] text-[#8a6820]">
          <Sparkles size={21} fill="currentColor" />
        </div>
        <div>
          <h2 className="text-2xl font-black leading-none">Resources to try</h2>
          <p className="mt-1 text-sm font-extrabold text-slate-400">
            Pick one and keep moving.
          </p>
        </div>
      </div>
      <div className="space-y-3">
        {resources.map((resource) => (
          <article
            key={`${resource.title}-${resource.type}`}
            className="rounded-[1.35rem] bg-[#f7f8fb] p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[1rem] font-black leading-tight text-[#20233a]">
                  {resource.title}
                </p>
                <p className="mt-1 text-[0.72rem] font-black uppercase tracking-[0.08em] text-slate-400">
                  {resource.type}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full px-3 py-1 text-[0.68rem] font-black ${impactTone(
                  resource.impact,
                )}`}
              >
                {formatImpact(resource.impact)}
              </span>
            </div>
            <p className="mt-3 text-sm font-extrabold leading-snug text-slate-600">
              {resource.whyItFits}
            </p>
            <button
              className="mt-4 h-10 rounded-[1rem] bg-white px-4 text-sm font-black text-[#20233a] shadow-soft"
              type="button"
            >
              {resource.nextStepLabel}
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

function impactTone(impact: RecommendationAction["impact"]) {
  if (impact === "high") {
    return "bg-[#e5fbef] text-[#197847]";
  }

  if (impact === "medium") {
    return "bg-[#fff1c9] text-[#8a6820]";
  }

  return "bg-[#eef2ff] text-[#5366d8]";
}

function formatImpact(impact: RecommendationAction["impact"]) {
  return `${impact.charAt(0).toUpperCase()}${impact.slice(1)} Impact`;
}

function selectedStudentLabel(studentId: DemoStudent) {
  return demoStudents.find((student) => student.id === studentId)?.label ?? "Sarah";
}

function validateBuilderForm(form: BuilderForm): BuilderErrors {
  const errors: BuilderErrors = {};
  const message = "Tell Atlas a little more so I can help.";

  if (!form.name.trim()) {
    errors.name = message;
  }

  if (form.interests.length === 0) {
    errors.interests = message;
  }

  if (!form.gpaRange) {
    errors.gpaRange = message;
  }

  if (Object.keys(errors).length > 0) {
    errors.form = message;
  }

  return errors;
}

function wait(milliseconds: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, milliseconds);
  });
}

function formatConstraint(constraint: AtlasAnalysisResponse["archetype"]["primaryConstraint"]) {
  return constraint
    .split("_")
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(" ");
}

function builderFormToProfile(form: BuilderForm): StudentProfile {
  const interests = form.interests.length > 0 ? form.interests : ["Undecided"];
  const activities = parseActivities(form.activities);
  const materialSet = new Set(form.applicationMaterials);

  return {
    name: form.name.trim() || "Student",
    grade: Number(form.grade),
    location: form.location.trim() || "New Jersey",
    interests,
    goals: buildGoals(interests, form.project, form.advisorGoal),
    academics: {
      gpa: gpaFromRange(form.gpaRange),
      trend: "unknown",
      notes: academicNotes(form.gpaRange),
    },
    courseRigor: {
      level: form.courseRigor,
      courses: courseNotes(form.courseRigor),
    },
    activities,
    leadership: leadershipFromLevel(form.leadership),
    service: {
      hours: serviceHours(form.service),
      focusAreas: form.service === "none" ? [] : ["community involvement"],
      notes: serviceNotes(form.service),
    },
    awards: awardsFromLevel(form.awards),
    projects: projectFromLevel(form.project),
    essays: materialSet.has("essay")
      ? [{ title: "Essay draft", status: "drafting" }]
      : [],
    documents: [
      ...(materialSet.has("transcript")
        ? [{ title: "Transcript", type: "transcript" as const }]
        : []),
      ...(materialSet.has("resume")
        ? [{ title: "Resume", type: "resume" as const }]
        : []),
      ...(materialSet.has("essay")
        ? [{ title: "Essay draft", type: "essay" as const }]
        : []),
      ...(form.awards !== "none"
        ? [{ title: "Award note", type: "award" as const }]
        : []),
    ],
  };
}

function parseActivities(text: string): StudentProfile["activities"] {
  return text
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 6)
    .map((name) => ({
      name,
      category: inferActivityCategory(name),
      years: 1,
    }));
}

function inferActivityCategory(name: string) {
  const lower = name.toLowerCase();
  if (lower.includes("theater") || lower.includes("art") || lower.includes("writing")) {
    return "arts";
  }
  if (lower.includes("robot") || lower.includes("bio") || lower.includes("science")) {
    return "STEM";
  }
  if (lower.includes("volunteer") || lower.includes("service")) {
    return "service";
  }
  if (lower.includes("soccer") || lower.includes("basketball") || lower.includes("sport")) {
    return "sports";
  }
  if (lower.includes("business") || lower.includes("deca")) {
    return "business";
  }
  return "activity";
}

function buildGoals(interests: string[], project: ProjectLevel, advisorGoal: AdvisorGoal) {
  const direction = interests.filter((interest) => interest !== "Undecided").join(", ");
  const goals = direction
    ? [`Build a stronger story around ${direction}`]
    : ["Find a clearer direction"];
  goals.push(advisorGoalText(advisorGoal));

  if (project === "none" || project === "class") {
    goals.push("Create stronger proof of original work");
  }

  goals.push("Find the next best move");
  return goals;
}

function advisorGoalText(goal: AdvisorGoal) {
  const labels: Record<AdvisorGoal, string> = {
    college_applications: "Build stronger college applications",
    scholarships: "Find scholarships",
    summer_opportunities: "Find summer opportunities",
    improve_grades: "Improve grades",
    build_leadership: "Build leadership",
    find_direction: "Find a direction",
    portfolio_project: "Build a portfolio or project",
    organize_materials: "Organize application materials",
    not_sure: "Not sure yet",
  };

  return labels[goal];
}

function gpaFromRange(range: GpaRange) {
  const values: Record<GpaRange, number> = {
    below_3: 2.8,
    "3_0_3_4": 3.25,
    "3_5_3_7": 3.6,
    "3_8_plus": 3.9,
  };
  return values[range];
}

function academicNotes(range: GpaRange) {
  if (range === "below_3") {
    return ["Academic foundation needs support"];
  }
  if (range === "3_0_3_4") {
    return ["Academic performance is developing"];
  }
  if (range === "3_5_3_7") {
    return ["Solid academic foundation"];
  }
  return ["Strong grades"];
}

function courseNotes(rigor: BuilderCourseRigor) {
  const courses: Record<BuilderCourseRigor, string[]> = {
    light: ["Current course load is light"],
    balanced: ["Balanced coursework"],
    rigorous: ["Rigorous coursework"],
    unknown: ["Course rigor not sure"],
  };
  return courses[rigor];
}

function leadershipFromLevel(level: LeadershipLevel): StudentProfile["leadership"] {
  if (level === "none") {
    return [];
  }

  return [
    {
      role: level === "meaningful" ? "Led something meaningful" : "Some role or title",
      organization: "Student activity",
    },
  ];
}

function serviceHours(service: ServiceRange) {
  const values: Record<ServiceRange, number> = {
    none: 0,
    "1_50": 25,
    "50_100": 75,
    "100_plus": 125,
  };
  return values[service];
}

function serviceNotes(service: ServiceRange) {
  if (service === "none") {
    return ["No service hours logged yet"];
  }
  if (service === "100_plus") {
    return ["Meaningful service involvement"];
  }
  return ["Some service involvement"];
}

function awardsFromLevel(level: AwardLevel): StudentProfile["awards"] {
  if (level === "none") {
    return [];
  }

  const awardLevel = level === "state_national" ? "state" : level;
  return [
    {
      title:
        level === "school"
          ? "School-level recognition"
          : level === "regional"
            ? "Regional recognition"
            : "State or national recognition",
      level: awardLevel,
    },
  ];
}

function projectFromLevel(level: ProjectLevel): StudentProfile["projects"] {
  if (level === "none") {
    return [];
  }

  const projectMap: Record<Exclude<ProjectLevel, "none">, StudentProfile["projects"][number]> = {
    class: {
      title: "Class project",
      type: "class_project",
      status: "complete",
      notes: "Completed as part of coursework.",
    },
    independent: {
      title: "Independent project",
      type: "original_project",
      status: "in_progress",
      notes: "Independent project in progress.",
    },
    research: {
      title: "Research project",
      type: "research",
      status: "in_progress",
      notes: "Research experience or project in progress.",
    },
    creative: {
      title: "Creative portfolio",
      type: "creative_portfolio",
      status: "in_progress",
      notes: "Creative portfolio or original body of work in progress.",
    },
  };

  return [projectMap[level]];
}

function materialLabel(material: ApplicationMaterial) {
  const labels: Record<ApplicationMaterial, string> = {
    resume: "Resume",
    essay: "Essay",
    transcript: "Transcript",
    none: "None yet",
  };
  return labels[material];
}

function applicationMaterialValue(label: string): ApplicationMaterial {
  const values: Record<string, ApplicationMaterial> = {
    Resume: "resume",
    Essay: "essay",
    Transcript: "transcript",
    "None yet": "none",
  };
  return values[label] ?? "none";
}

function ProfileScreen() {
  return (
    <div className="space-y-6 px-5 pb-6">
      <ScreenHeader
        title="My Atlas"
        subtitle="Everything you’ve done, becoming your story."
        icon={UserRound}
      />
      <Tabs tabs={["Overview", "Academics", "Activities", "Awards", "Essays"]} />
      <ProfileSummaryCard />
      <section className="rounded-[1.75rem] bg-white p-5 shadow-soft">
        <h2 className="mb-4 text-xl font-black">Recent story updates</h2>
        <div className="space-y-3">
          <UpdateRow icon={Medal} title="Science Fair" detail="1st Place" />
          <UpdateRow icon={HeartHandshake} title="Volunteer Hours Update" detail="120+ hours logged" />
        </div>
      </section>
    </div>
  );
}

function ProfileSummaryCard() {
  return (
    <section className="rounded-[1.75rem] bg-[#f7ecff] p-5 shadow-soft">
      <h2 className="mb-4 text-xl font-black">Your Story So Far</h2>
      <div className="space-y-3">
        {summaryItems.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.title}
              className="flex items-start gap-3 rounded-[1.25rem] bg-white p-3.5 shadow-[0_6px_18px_rgba(78,63,107,0.08)]"
            >
              <span
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${item.color}`}
              >
                <Icon size={20} />
              </span>
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  <p className="text-[1rem] font-black leading-tight">{item.title}</p>
                  <p className="text-[0.78rem] font-black leading-tight text-slate-400">
                    {item.status}
                  </p>
                </div>
                <p className="text-sm font-bold leading-snug text-slate-500">
                  {item.detail}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ChatScreen() {
  return (
    <div className="space-y-5 px-5 pb-6">
      <ScreenHeader
        title="Ask Atlas"
        subtitle="Your advisor for choices, goals, and what to do next."
        icon={MessageCircle}
      />
      <div className="ml-auto max-w-[88%] rounded-[1.35rem] rounded-tr-md bg-[#20233a] p-4 text-white shadow-soft">
        <p className="text-[1.05rem] font-extrabold leading-snug">
          Should I take AP Physics or AP Biology next year?
        </p>
      </div>
      <ChatAdvisorCard />
      <BottomInput placeholder="Ask anything about your future..." />
    </div>
  );
}

function ChatAdvisorCard() {
  const reasons = [
    "It fits your STEM direction",
    "It strengthens an engineering path",
    "It shows course rigor",
  ];

  return (
    <section className="rounded-[1.75rem] bg-white p-5 shadow-bubble">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#fff0aa] text-[#20233a]">
          <Sparkles size={24} fill="currentColor" />
        </div>
        <div>
          <p className="text-sm font-black uppercase tracking-[0.08em] text-slate-400">
            Recommendation
          </p>
          <h2 className="text-3xl font-black leading-none">Take AP Physics</h2>
        </div>
      </div>
      <div className="space-y-2">
        {reasons.map((reason) => (
          <PillRow key={reason} icon={Check} text={reason} tone="good" />
        ))}
      </div>
      <div className="mt-5 grid grid-cols-[1fr_auto] gap-3">
        <button
          className="h-12 rounded-2xl bg-[#20233a] px-4 text-sm font-black text-white"
          type="button"
        >
          Yes, find resources
        </button>
        <button
          className="h-12 rounded-2xl bg-slate-100 px-4 text-sm font-black text-slate-600"
          type="button"
        >
          Not right now
        </button>
      </div>
    </section>
  );
}

function AddSoonScreen() {
  return (
    <div className="space-y-5 px-5 pb-6">
      <ScreenHeader
        title="What happened today?"
        subtitle="Capture wins, projects, service, and notes while they’re fresh."
        icon={Plus}
      />
      <QuickAddOptions />
      <button
        className="h-14 w-full rounded-[1.2rem] bg-[#20233a] px-6 text-[1rem] font-black text-white shadow-soft"
        type="button"
      >
        Add update
      </button>
    </div>
  );
}

function QuickAddOptions() {
  const options = [
    { label: "Won an award", icon: Trophy, color: "bg-[#fff1c9] text-[#9d6a00]" },
    { label: "Volunteered", icon: HeartHandshake, color: "bg-[#ffe3ed] text-[#c94770]" },
    { label: "Took a class", icon: GraduationCap, color: "bg-[#dcfbf2] text-[#087d66]" },
    { label: "Completed a project", icon: FlaskConical, color: "bg-[#efe7ff] text-[#7353d9]" },
    { label: "Joined an activity", icon: Users, color: "bg-[#e0f7ff] text-[#1686a8]" },
    { label: "Uploaded a document", icon: FileUp, color: "bg-[#fff0aa] text-[#8a6820]" },
    { label: "Added a note", icon: NotebookPen, color: "bg-[#eef2ff] text-[#5366d8]" },
  ];

  return (
    <section className="grid grid-cols-2 gap-2.5">
      {options.map((option, index) => {
        const Icon = option.icon;
        return (
          <button
            key={option.label}
            className={`flex min-h-[92px] flex-col justify-between rounded-[1.35rem] bg-white p-3.5 text-left shadow-soft ${
              index === options.length - 1 ? "col-span-2" : ""
            }`}
            type="button"
          >
            <span
              className={`flex h-10 w-10 items-center justify-center rounded-[1rem] ${option.color}`}
            >
              <Icon size={21} />
            </span>
            <span className="mt-3 text-[0.98rem] font-black leading-tight text-[#20233a]">
              {option.label}
            </span>
          </button>
        );
      })}
    </section>
  );
}

function YouSoonScreen() {
  return (
    <PlaceholderScreen
      title="You"
      subtitle="Your goals, preferences, and advisor settings will live here."
      icon={Sparkles}
      button="Edit goals"
    />
  );
}

function PlaceholderScreen({
  title,
  subtitle,
  icon: Icon,
  button,
}: {
  title: string;
  subtitle: string;
  icon: typeof Home;
  button: string;
}) {
  return (
    <div className="flex min-h-[680px] flex-col justify-center px-5 pb-6">
      <section className="rounded-[1.75rem] bg-white p-6 text-center shadow-bubble">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-[#fff0aa] text-[#20233a]">
          <Icon size={30} />
        </div>
        <h1 className="text-3xl font-black">{title}</h1>
        <p className="mx-auto mt-2 max-w-[18rem] text-base font-bold leading-snug text-slate-500">
          {subtitle}
        </p>
        <button
          className="mt-6 h-12 rounded-2xl bg-[#20233a] px-6 font-black text-white"
          type="button"
        >
          {button}
        </button>
      </section>
    </div>
  );
}

function ScreenHeader({
  title,
  subtitle,
  icon: Icon,
}: {
  title: string;
  subtitle: string;
  icon: typeof Home;
}) {
  return (
    <header className="flex items-center justify-between">
      <div>
        <h1 className="text-4xl font-black leading-none tracking-normal">{title}</h1>
        <p className="mt-2 text-[1rem] font-bold leading-snug text-slate-500">
          {subtitle}
        </p>
      </div>
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-[#20233a] shadow-soft">
        <Icon size={24} />
      </div>
    </header>
  );
}

function Tabs({ tabs }: { tabs: string[] }) {
  return (
    <div className="-mx-5 overflow-x-auto px-5">
      <div className="flex w-max gap-2">
        {tabs.map((tab, index) => (
          <button
            key={tab}
            className={`h-10 rounded-full px-4 text-sm font-black ${
              index === 0
                ? "bg-[#20233a] text-white"
                : "bg-white text-slate-500 shadow-soft"
            }`}
            type="button"
          >
            {tab}
          </button>
        ))}
      </div>
    </div>
  );
}

function PillRow({
  icon: Icon,
  text,
  tone,
}: {
  icon: typeof Home;
  text: string;
  tone: "good" | "warm";
}) {
  return (
    <div className="flex items-center gap-2 text-[0.95rem] font-extrabold leading-snug text-slate-700">
      <span
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
          tone === "good" ? "bg-[#dcfbf2] text-[#087d66]" : "bg-white text-[#9d6a00]"
        }`}
      >
        <Icon size={15} strokeWidth={3} />
      </span>
      <span>{text}</span>
    </div>
  );
}

function UpdateRow({
  icon: Icon,
  title,
  detail,
}: {
  icon: typeof Home;
  title: string;
  detail: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-[#f6f7fb] p-3">
      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#7353d9]">
        <Icon size={20} />
      </span>
      <div>
        <p className="font-black">{title}</p>
        <p className="text-sm font-bold text-slate-500">{detail}</p>
      </div>
    </div>
  );
}

function BottomInput({ placeholder }: { placeholder: string }) {
  return (
    <div className="flex h-14 items-center gap-2 rounded-[1.25rem] bg-white px-3 shadow-soft">
      <Pencil size={18} className="text-slate-400" />
      <input
        className="min-w-0 flex-1 bg-transparent text-[0.95rem] font-bold outline-none placeholder:text-slate-400"
        placeholder={placeholder}
      />
      <button
        className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#20233a] text-white"
        type="button"
        aria-label="Send"
      >
        <Send size={18} />
      </button>
    </div>
  );
}
