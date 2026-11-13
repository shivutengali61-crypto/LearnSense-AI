import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildStudentInviteMessage,
  filterRosterStudents,
  generateUniqueClassroomCode,
  validateJoinCode,
  validateRosterStudentInput,
} from './classroomManager';

test('generateUniqueClassroomCode avoids existing code collisions', () => {
  const existing = ['SCI10', 'SCI11'];
  let calls = 0;
  const deterministicRandom = () => {
    calls += 1;
    return calls === 1 ? 0 : 0.5;
  };
  const code = generateUniqueClassroomCode('Science', existing, deterministicRandom);
  assert.equal(existing.includes(code), false);
  assert.equal(code.startsWith('SCI'), true);
});

test('validateJoinCode enforces format and uniqueness across classrooms', () => {
  const existing = ['SCI9A', 'ALG10'];
  assert.equal(validateJoinCode('bio', existing).valid, false);
  assert.equal(validateJoinCode('SCI9A', existing).valid, false);
  assert.equal(validateJoinCode('SCI9A', existing, 'SCI9A').valid, true);

  const ok = validateJoinCode('bio-10b', existing);
  assert.equal(ok.valid, true);
  assert.equal(ok.normalized, 'BIO-10B');
});

test('validateRosterStudentInput prevents invalid emails and duplicate enrollment', () => {
  const roster = [
    { uid: 'stu_1', name: 'Aarav Kulkarni', email: 'aarav.k@learnsense.edu', rollNumber: '9A-01' },
  ];

  assert.equal(
    validateRosterStudentInput({ name: 'A', email: 'a@b.com' }, roster).valid,
    false
  );
  assert.equal(
    validateRosterStudentInput({ name: 'Diya', email: 'not-an-email' }, roster).valid,
    false
  );
  assert.equal(
    validateRosterStudentInput({ name: 'Aarav', email: 'AARAV.K@learnsense.edu' }, roster).valid,
    false
  );
  assert.equal(
    validateRosterStudentInput({ name: 'Aarav Updated', email: 'aarav.k@learnsense.edu' }, roster, 'stu_1').valid,
    true
  );
  assert.equal(
    validateRosterStudentInput({ name: 'Meera Nair', email: 'meera@school.edu' }, roster).valid,
    true
  );
});

test('filterRosterStudents matches by name, email, or roll number', () => {
  const roster = [
    { uid: '1', name: 'Aarav Kulkarni', email: 'aarav@school.edu', rollNumber: '9A-01' },
    { uid: '2', name: 'Meera Nair', email: 'meera@school.edu', rollNumber: '9A-04' },
  ];
  assert.equal(filterRosterStudents(roster, '9A-04').length, 1);
  assert.equal(filterRosterStudents(roster, 'aarav').length, 1);
  assert.equal(filterRosterStudents(roster, '').length, 2);
});

test('buildStudentInviteMessage includes classroom name and unique join code', () => {
  const msg = buildStudentInviteMessage({
    classroomName: 'Grade 10 Biology',
    subject: 'Biology',
    gradeLevel: 'Grade 10',
    joinCode: 'BIO42',
    teacherName: 'Dr. Kavitha Rao',
  });
  assert.equal(msg.includes('BIO42'), true);
  assert.equal(msg.includes('Grade 10 Biology'), true);
});
