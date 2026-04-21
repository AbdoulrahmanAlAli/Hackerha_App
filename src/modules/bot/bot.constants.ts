export const BOT_SCENES = {
  ENROLL_COURSE: "ENROLL_COURSE",
} as const;

export const UNIVERSITY_BRANCHES = ["دمشق", "حلب"] as const;

export const ACADEMIC_YEARS = [
  "السنة الأولى",
  "السنة الثانية",
  "السنة الثالثة",
  "السنة الرابعة",
  "السنة الخامسة",
] as const;

export const SEMESTERS = ["الفصل الأول", "الفصل الثاني"] as const;

export const BOT_ACTIONS = {
  START: "start_flow",
  BACK_TO_BRANCH: "back_to_branch",
  BACK_TO_YEAR: "back_to_year",
  BACK_TO_SEMESTER: "back_to_semester",
  BACK_TO_COURSES: "back_to_courses",
  CANCEL: "cancel_flow",
  RESTART: "restart_flow",
  HOME: "home_flow",
  ENTER_UNIVERSITY_NUMBER: "enter_university_number",
} as const;