import type { StudentProfile } from "./types";

export const mockSarahProfile: StudentProfile = {
  name: "Sarah",
  grade: 11,
  location: "New Jersey",
  interests: ["STEM", "engineering", "science research", "community impact"],
  goals: [
    "Build a stronger STEM direction",
    "Find meaningful summer opportunities",
    "Create stronger scholarship and application material",
  ],
  academics: {
    gpa: 3.85,
    trend: "up",
    notes: ["Strong grades", "Consistent performance in science and math"],
  },
  courseRigor: {
    level: "rigorous",
    courses: ["Honors Chemistry", "AP Calculus AB", "AP Computer Science"],
  },
  activities: [
    { name: "Science Olympiad", role: "Team member", category: "competition", years: 2 },
    { name: "Robotics Club", role: "Build team", category: "STEM", years: 2 },
    { name: "Varsity Tennis", category: "sports", years: 2 },
  ],
  leadership: [
    { role: "Volunteer coordinator", organization: "Community STEM tutoring club" },
  ],
  service: {
    hours: 126,
    focusAreas: ["STEM tutoring", "local community events"],
    notes: ["Community involvement", "120+ volunteer hours"],
  },
  awards: [
    { title: "Science Fair - 1st Place", level: "regional" },
    { title: "Math League Honorable Mention", level: "regional" },
    { title: "School Academic Excellence Award", level: "school" },
    { title: "Robotics Design Recognition", level: "regional" },
    { title: "Community Service Honor", level: "school" },
    { title: "Chemistry Department Award", level: "school" },
    { title: "STEM Scholar Nominee", level: "school" },
    { title: "Debate Finalist", level: "school" },
    { title: "Coding Challenge Finalist", level: "regional" },
    { title: "Volunteer Leadership Award", level: "school" },
    { title: "Tennis Scholar Athlete", level: "school" },
    { title: "Science Olympiad Medal", level: "regional" },
  ],
  projects: [
    {
      title: "Class water-quality lab",
      type: "class_project",
      status: "complete",
      notes: "Completed as part of chemistry coursework, but not developed into independent work.",
    },
  ],
  essays: [
    { title: "Personal statement notes", status: "not_started" },
  ],
  documents: [
    { title: "Unofficial transcript", type: "transcript" },
    { title: "Science Fair certificate", type: "award" },
    { title: "Volunteer hours log", type: "other" },
  ],
};

export const mockJakeProfile: StudentProfile = {
  name: "Jake",
  grade: 10,
  location: "New Jersey",
  interests: ["engineering"],
  goals: ["Build confidence in math", "Explore engineering opportunities"],
  academics: {
    gpa: 3.15,
    trend: "flat",
    notes: ["Math performance is still developing", "Academic foundation needs attention"],
  },
  courseRigor: {
    level: "balanced",
    courses: ["Geometry", "Biology", "Intro to Engineering"],
  },
  activities: [
    { name: "Soccer", category: "sports", years: 2 },
    { name: "Robotics Club", role: "Member", category: "STEM", years: 1 },
  ],
  leadership: [],
  service: {
    hours: 20,
    focusAreas: ["school events"],
    notes: ["Some early service involvement"],
  },
  awards: [],
  projects: [],
  essays: [],
  documents: [
    { title: "Unofficial transcript", type: "transcript" },
  ],
};

export const mockEmmaProfile: StudentProfile = {
  name: "Emma",
  grade: 11,
  location: "New Jersey",
  interests: ["medicine", "biology", "service"],
  goals: ["Explore medicine", "Build a stronger biology story", "Serve patients and families"],
  academics: {
    gpa: 3.9,
    trend: "up",
    notes: ["Strong grades", "Consistent performance in biology and chemistry"],
  },
  courseRigor: {
    level: "rigorous",
    courses: ["AP Biology", "Honors Chemistry", "AP Statistics"],
  },
  activities: [
    { name: "Hospital Volunteering", category: "service", years: 2 },
    { name: "Biology Club", role: "Member", category: "STEM", years: 2 },
    { name: "Student Council", role: "Representative", category: "school", years: 1 },
  ],
  leadership: [],
  service: {
    hours: 180,
    focusAreas: ["hospital volunteering", "patient support"],
    notes: ["Service involvement", "180 volunteer hours"],
  },
  awards: [
    { title: "School Honor Roll", level: "school" },
    { title: "Biology Department Recognition", level: "school" },
  ],
  projects: [],
  essays: [
    { title: "Medicine reflection notes", status: "not_started" },
  ],
  documents: [
    { title: "Unofficial transcript", type: "transcript" },
    { title: "Volunteer hours log", type: "other" },
  ],
};

export const mockMaxProfile: StudentProfile = {
  name: "Max",
  grade: 11,
  location: "New Jersey",
  interests: ["business", "entrepreneurship"],
  goals: ["Explore entrepreneurship", "Build a business-focused story"],
  academics: {
    gpa: 3.7,
    trend: "flat",
    notes: ["Solid grades", "Consistent performance"],
  },
  courseRigor: {
    level: "balanced",
    courses: ["Precalculus", "Economics", "English Honors"],
  },
  activities: [
    { name: "DECA", role: "Member", category: "business", years: 2 },
    { name: "Part-time job", category: "work", years: 1 },
    { name: "Basketball", category: "sports", years: 2 },
  ],
  leadership: [],
  service: {
    hours: 15,
    focusAreas: ["school events"],
    notes: ["Early service involvement"],
  },
  awards: [
    { title: "DECA School-Level Award", level: "school" },
  ],
  projects: [],
  essays: [
    { title: "Entrepreneurship notes", status: "not_started" },
  ],
  documents: [
    { title: "Unofficial transcript", type: "transcript" },
  ],
};

export const mockAvaProfile: StudentProfile = {
  name: "Ava",
  grade: 12,
  location: "New Jersey",
  interests: ["biology", "medicine", "research"],
  goals: ["Finalize application materials", "Find scholarships", "Tell a strong research story"],
  academics: {
    gpa: 4.0,
    trend: "up",
    notes: ["Excellent academic foundation", "Top performance in biology and chemistry"],
  },
  courseRigor: {
    level: "rigorous",
    courses: ["AP Biology", "AP Chemistry", "AP Calculus BC", "AP Literature"],
  },
  activities: [
    { name: "Biology Club", role: "President", category: "STEM", years: 3 },
    { name: "Hospital Volunteering", role: "Volunteer", category: "service", years: 3 },
    { name: "Research Internship", role: "Intern", category: "research", years: 1 },
  ],
  leadership: [
    { role: "President", organization: "Biology Club" },
    { role: "Volunteer team lead", organization: "Hospital volunteer program" },
  ],
  service: {
    hours: 220,
    focusAreas: ["hospital volunteering", "patient support", "biology outreach"],
    notes: ["Deep service involvement", "Volunteer team leadership"],
  },
  awards: [
    { title: "Regional Biology Research Award", level: "regional" },
    { title: "State Science Symposium Finalist", level: "state" },
    { title: "Hospital Volunteer Recognition", level: "regional" },
    { title: "AP Scholar with Distinction", level: "national" },
  ],
  projects: [
    {
      title: "Completed cancer biomarker research project",
      type: "research",
      status: "complete",
      notes: "Completed a mentored research project and presented findings at a regional symposium.",
    },
  ],
  essays: [
    { title: "Personal statement", status: "revising" },
    { title: "Research supplement", status: "drafting" },
  ],
  documents: [
    { title: "Official transcript", type: "transcript" },
    { title: "Student resume", type: "resume" },
    { title: "Regional research award", type: "award" },
    { title: "Personal statement draft", type: "essay" },
  ],
};

export const mockLeoProfile: StudentProfile = {
  name: "Leo",
  grade: 10,
  location: "New Jersey",
  interests: ["engineering", "gaming"],
  goals: ["Improve grades", "Build better study habits", "Explore engineering when school feels steadier"],
  academics: {
    gpa: 2.8,
    trend: "down",
    notes: ["Grades need attention", "Math and science foundation needs support"],
  },
  courseRigor: {
    level: "light",
    courses: ["Algebra II", "Physical Science", "English 10"],
  },
  activities: [
    { name: "Casual Gaming Club", category: "club", years: 1 },
  ],
  leadership: [],
  service: {
    hours: 0,
    focusAreas: [],
    notes: ["No service hours logged yet"],
  },
  awards: [],
  projects: [],
  essays: [],
  documents: [
    { title: "Unofficial transcript", type: "transcript" },
  ],
};

export const mockMiaProfile: StudentProfile = {
  name: "Mia",
  grade: 11,
  location: "New Jersey",
  interests: ["writing", "theater", "art", "media"],
  goals: ["Build a creative portfolio", "Submit writing and media work", "Shape a stronger arts story"],
  academics: {
    gpa: 3.7,
    trend: "flat",
    notes: ["Solid academic foundation", "Strong humanities performance"],
  },
  courseRigor: {
    level: "balanced",
    courses: ["English Honors", "Studio Art", "Media Studies", "US History"],
  },
  activities: [
    { name: "Theater", role: "Assistant director", category: "arts", years: 3 },
    { name: "School Newspaper", role: "Editor", category: "media", years: 2 },
    { name: "Art Club", role: "Member", category: "arts", years: 2 },
  ],
  leadership: [
    { role: "Editor", organization: "School Newspaper" },
    { role: "Assistant director", organization: "Theater program" },
  ],
  service: {
    hours: 40,
    focusAreas: ["arts events", "school community"],
    notes: ["Some service through school arts events"],
  },
  awards: [
    { title: "School Writing Award", level: "school" },
    { title: "Art Showcase Recognition", level: "school" },
  ],
  projects: [
    {
      title: "Creative writing and media portfolio",
      type: "creative_portfolio",
      status: "in_progress",
      notes: "Portfolio includes scripts, essays, artwork, and media pieces.",
    },
  ],
  essays: [
    { title: "Artist statement notes", status: "drafting" },
  ],
  documents: [
    { title: "Unofficial transcript", type: "transcript" },
    { title: "Writing sample", type: "other" },
  ],
};

export const mockLilyProfile: StudentProfile = {
  name: "Lily",
  grade: 11,
  location: "New Jersey",
  interests: ["sports", "leadership", "service"],
  goals: ["Build leadership", "Tell a stronger athletics story"],
  academics: {
    gpa: 3.65,
    trend: "flat",
    notes: ["Solid academic foundation", "Balancing academics with athletics"],
  },
  courseRigor: {
    level: "balanced",
    courses: ["English Honors", "Precalculus", "Biology"],
  },
  activities: [
    { name: "Varsity Soccer", role: "Captain", category: "sports", years: 3 },
    { name: "Basketball", role: "Team member", category: "sports", years: 2 },
    { name: "Youth Soccer Clinic", role: "Volunteer coach", category: "service", years: 1 },
  ],
  leadership: [
    { role: "Captain", organization: "Varsity Soccer" },
  ],
  service: {
    hours: 55,
    focusAreas: ["youth sports", "community coaching"],
    notes: ["Some service through athletics"],
  },
  awards: [
    { title: "Scholar Athlete Award", level: "school" },
  ],
  projects: [],
  essays: [
    { title: "Athletics reflection notes", status: "not_started" },
  ],
  documents: [
    { title: "Unofficial transcript", type: "transcript" },
  ],
};

export const demoStudentProfiles = {
  sarah: mockSarahProfile,
  jake: mockJakeProfile,
  emma: mockEmmaProfile,
  max: mockMaxProfile,
  ava: mockAvaProfile,
  leo: mockLeoProfile,
  mia: mockMiaProfile,
  lily: mockLilyProfile,
};

export type DemoStudentId = keyof typeof demoStudentProfiles;

export function getDemoStudentProfile(student?: string) {
  const id = student?.toLowerCase() as DemoStudentId | undefined;
  return id && id in demoStudentProfiles ? demoStudentProfiles[id] : mockSarahProfile;
}
