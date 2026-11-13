import test from 'node:test';
import assert from 'node:assert/strict';
import { validateAuthForm, validateRoleLoginKeyword } from './authKeywords';

test('validateRoleLoginKeyword differentiates Teacher and Student keywords', () => {
  assert.equal(validateRoleLoginKeyword('teacher', 'teacher-2026').valid, true);
  assert.equal(validateRoleLoginKeyword('teacher', 'STUDENT-2026').valid, false);

  assert.equal(validateRoleLoginKeyword('student', 'student-2026').valid, true);
  assert.equal(validateRoleLoginKeyword('student', 'TEACHER-2026').valid, false);
});

test('validateRoleLoginKeyword accepts active classroom join codes for students', () => {
  const res = validateRoleLoginKeyword('student', 'sci9a', ['SCI9A', 'ALG10']);
  assert.equal(res.valid, true);
  assert.equal(res.matchedClassroomCode, 'SCI9A');
});

test('validateAuthForm enforces full name on register and update modes', () => {
  const missingName = validateAuthForm({
    mode: 'register',
    role: 'teacher',
    fullName: 'A',
    keyword: 'TEACHER-2026',
    preferredLanguage: 'en',
  });
  assert.equal(missingName.valid, false);

  const validUpdate = validateAuthForm({
    mode: 'update',
    role: 'student',
    fullName: 'Aarav Kulkarni',
    keyword: 'SCI9A',
    preferredLanguage: 'kn',
    availableJoinCodes: ['SCI9A'],
  });
  assert.equal(validUpdate.valid, true);
  assert.equal(validUpdate.matchedClassroomCode, 'SCI9A');
});
