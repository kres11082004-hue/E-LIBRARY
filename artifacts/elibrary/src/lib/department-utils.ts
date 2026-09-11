export interface CourseInfo {
  code: string;
  fullName: string;
  department: string;
}

export const DEPARTMENTS = [
  "Department of Information System (BSIS)",
  "Department of Physical Education (BPED)",
] as const;

export const COURSES_LIST: CourseInfo[] = [
  { code: "BSIS", fullName: "Bachelor of Science in Information System", department: "Department of Information System (BSIS)" },
  { code: "BPED", fullName: "Bachelor of Physical Education", department: "Department of Physical Education (BPED)" },
];

export function getCourseInfo(courseRaw?: string | null): CourseInfo {
  if (!courseRaw) {
    return { code: "N/A", fullName: "Unassigned", department: "Other / Unassigned" };
  }

  const clean = courseRaw.trim();
  const lower = clean.toLowerCase();

  if (lower === "bsis" || lower.includes("information system") || lower.includes("is")) {
    return COURSES_LIST[0]; // BSIS
  }
  if (lower === "bped" || lower.includes("physical education") || lower.includes("pe")) {
    return COURSES_LIST[1]; // BPED
  }

  // Fallback default: if user belongs to BSIS vs BPED heuristic
  if (lower.includes("education")) {
    return COURSES_LIST[1]; // BPED
  }

  return COURSES_LIST[0]; // Default to BSIS
}

export function getDepartmentForCourse(courseRaw?: string | null): string {
  return getCourseInfo(courseRaw).department;
}

export function getCourseShortCode(courseRaw?: string | null): string {
  return getCourseInfo(courseRaw).code;
}
