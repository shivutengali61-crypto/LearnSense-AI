import type { StudentRosterEntry } from '../types/learnsense';

const CODE_REGEX = /^[A-Z0-9-]{4,16}$/;

export function normalizeJoinCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '');
}

export function generateUniqueClassroomCode(
  subject: string,
  existingCodes: string[],
  randomFn: () => number = Math.random
): string {
  const existingSet = new Set(existingCodes.map((c) => c.trim().toUpperCase()));
  const prefix =
    subject
      .replace(/[^a-zA-Z]/g, '')
      .slice(0, 3)
      .toUpperCase() || 'CLS';

  for (let attempt = 0; attempt < 50; attempt += 1) {
    const digits = Math.floor(10 + randomFn() * 89);
    const suffix = attempt >= 10 ? String(Math.floor(100 + randomFn() * 899)) : String(digits);
    const candidate = `${prefix}${suffix}`;
    if (!existingSet.has(candidate)) {
      return candidate;
    }
  }

  return `${prefix}${Date.now().toString().slice(-4)}`;
}

export function validateJoinCode(
  rawCode: string,
  existingCodes: string[],
  currentClassroomCode?: string
): { valid: boolean; normalized: string; error?: string } {
  const normalized = normalizeJoinCode(rawCode);
  if (!CODE_REGEX.test(normalized)) {
    return {
      valid: false,
      normalized,
      error: 'Classroom code must be 4 to 16 letters, numbers, or hyphens.',
    };
  }

  const currentUpper = currentClassroomCode?.trim().toUpperCase();
  const collision = existingCodes.some((c) => {
    const upper = c.trim().toUpperCase();
    return upper === normalized && upper !== currentUpper;
  });

  if (collision) {
    return {
      valid: false,
      normalized,
      error: `Classroom code "${normalized}" is already in use by another classroom.`,
    };
  }

  return { valid: true, normalized };
}

export function validateRosterStudentInput(
  input: { name: string; email: string; rollNumber?: string },
  existingStudents: StudentRosterEntry[],
  excludeStudentUid?: string
): { valid: boolean; error?: string } {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();

  if (name.length < 2 || name.length > 120) {
    return { valid: false, error: 'Student full name must be between 2 and 120 characters.' };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { valid: false, error: 'Enter a valid student email address.' };
  }

  const duplicateEmail = existingStudents.some(
    (s) => s.uid !== excludeStudentUid && s.email.trim().toLowerCase() === email
  );
  if (duplicateEmail) {
    return { valid: false, error: 'A student with this email is already enrolled in this classroom.' };
  }

  return { valid: true };
}

export function filterRosterStudents(
  students: StudentRosterEntry[],
  searchQuery: string
): StudentRosterEntry[] {
  const q = searchQuery.trim().toLowerCase();
  if (!q) return students;
  return students.filter(
    (s) =>
      s.name.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      (s.rollNumber && s.rollNumber.toLowerCase().includes(q))
  );
}

export function buildStudentInviteMessage(params: {
  classroomName: string;
  subject: string;
  gradeLevel: string;
  joinCode: string;
  teacherName: string;
}): string {
  return [
    `Join ${params.classroomName} (${params.subject} · ${params.gradeLevel}) on LearnSense.`,
    `Teacher: ${params.teacherName}`,
    `Classroom Invite Code: ${params.joinCode}`,
    `Select the Student role on the LearnSense sign-in screen and enter "${params.joinCode}" in the Student Keyword or Class Join Code field.`,
  ].join('\n');
}
