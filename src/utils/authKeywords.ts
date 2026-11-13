import type { LanguageCode, UserRole } from '../types/learnsense';

export const TEACHER_ACCESS_KEYWORDS = ['TEACHER-2026', 'LEARNSENSE-TEACHER', 'FACULTY-SENSE'] as const;
export const ADMIN_ACCESS_KEYWORDS = ['ADMIN-2026', 'LEARNSENSE-ADMIN', 'DEAN-SENSE'] as const;
export const STUDENT_ACCESS_KEYWORDS = ['STUDENT-2026', 'LEARNSENSE-STUDENT'] as const;

export interface KeywordValidationResult {
  valid: boolean;
  matchedClassroomCode?: string;
  error?: string;
}

export function validateRoleLoginKeyword(
  role: UserRole,
  rawKeyword: string,
  availableJoinCodes: string[] = []
): KeywordValidationResult {
  const normalized = rawKeyword.trim().toUpperCase();
  if (!normalized) {
    return {
      valid: false,
      error:
        role === 'teacher'
          ? 'Please enter the Teacher access keyword (e.g., TEACHER-2026).'
          : role === 'admin'
            ? 'Please enter the Administrator access keyword (e.g., ADMIN-2026).'
            : 'Please enter the Student keyword (STUDENT-2026) or a classroom join code (e.g., SCI9A).',
    };
  }

  if (role === 'admin') {
    if ((ADMIN_ACCESS_KEYWORDS as readonly string[]).includes(normalized)) {
      return { valid: true };
    }
    return {
      valid: false,
      error: 'Invalid Administrator access keyword. Use ADMIN-2026 for Administrator access.',
    };
  }

  if (role === 'teacher') {
    if ((TEACHER_ACCESS_KEYWORDS as readonly string[]).includes(normalized)) {
      return { valid: true };
    }
    return {
      valid: false,
      error: 'Invalid Teacher access keyword. Use TEACHER-2026 for Teacher / Admin access.',
    };
  }

  if ((STUDENT_ACCESS_KEYWORDS as readonly string[]).includes(normalized)) {
    return { valid: true };
  }

  const normalizedJoinCodes = availableJoinCodes.map((c) => c.trim().toUpperCase());
  const matchedIdx = normalizedJoinCodes.indexOf(normalized);
  if (matchedIdx >= 0) {
    return {
      valid: true,
      matchedClassroomCode: availableJoinCodes[matchedIdx],
    };
  }

  return {
    valid: false,
    error: 'Invalid Student keyword or join code. Use STUDENT-2026 or an active class code (e.g., SCI9A).',
  };
}

export interface AuthFormInput {
  mode: 'login' | 'register' | 'update';
  role: UserRole;
  fullName: string;
  keyword: string;
  preferredLanguage: LanguageCode;
  availableJoinCodes?: string[];
}

export function validateAuthForm(input: AuthFormInput): KeywordValidationResult {
  if ((input.mode === 'register' || input.mode === 'update') && input.fullName.trim().length < 2) {
    return {
      valid: false,
      error: 'Please enter your full name (at least 2 characters).',
    };
  }

  return validateRoleLoginKeyword(input.role, input.keyword, input.availableJoinCodes);
}
