# LearnSense Firestore Security Specification

## 1. Data Invariants
1. **User Role Integrity**: Every `/users/{userId}` document belongs to `request.auth.uid == userId` with verified email (`request.auth.token.email_verified == true`). Roles (`teacher` | `student`) cannot be changed after registration via client updates, and self-registration as `teacher` requires either the bootstrapped owner email or an entry in `/teacherAllowlist/{emailId}`.
2. **Classroom Ownership & PII Isolation**: Only verified teachers may create classrooms (`teacherUid == request.auth.uid`). Student PII (email, roll number) lives in `/classrooms/{classroomId}/roster/{studentUid}` where a student can read only their own entry and the owning teacher can read/manage the roster.
3. **Answer Key & Draft Isolation**: `/assessments/{assessmentId}` (drafts, unapproved questions, embedded answer keys) is readable and writable **strictly** by the owning teacher. Students read only `/publishedAssessments/{assessmentId}`, which holds only `approved` questions stripped of `correctAnswer` and `explanation`, scoped to enrolled `studentUids`.
4. **Post-Submit Answer Key Gate**: `/assessmentAnswerKeys/{assessmentId}` cannot be listed by students and can be read via `get` by an enrolled student **only after** they have created an immutable `/submissionLocks/{lockId}` committing their submitted answers.
5. **Duplicate Prevention & Immutable Submissions**: `/submissions/{submissionId}` cannot be updated or deleted. When `allowRetakes == false`, deterministic ID `${assessmentId}_${studentUid}` enforces single-submission uniqueness at the database rule level. When `allowRetakes == true`, sequential IDs `${assessmentId}_${studentUid}_att_${attemptNumber}` preserve all historical attempts.
6. **Student Report Isolation**: Students can read (`get`/`list`) only submissions where `studentUid == request.auth.uid`. Teachers can read (`get`/`list`) only submissions for classrooms they own (`teacherUid == request.auth.uid`).
7. **Enrollment-Scoped Communication**: Only verified classroom members (the owning teacher or enrolled students in `classroom.studentUids`) can participate in `/conversations/{conversationId}` and `/conversations/{conversationId}/messages/{messageId}`. Students cannot read or message classrooms they are not enrolled in, and cannot message other students' 1:1 threads.
8. **Teacher-Only Announcements & Recipient-Only Notifications**: Only the owning teacher of a classroom can create, edit, or delete `/announcements/{announcementId}`. Enrolled students may read classroom announcements and update only `acknowledgedBy`. `/notifications/{notificationId}` are readable/updatable strictly by `recipientUid == request.auth.uid`, and creation requires verified sender-classroom membership.

## 2. "Dirty Dozen" + Communication Adversarial Payloads
1. **Role Self-Escalation (Update)**: Student sends `update` to `/users/{studentUid}` changing `role: "teacher"`. -> **DENIED** (`incoming().role == existing().role` and `affectedKeys().hasOnly(['name', 'preferredLanguage'])`).
2. **Unauthorized Teacher Registration (Create)**: Unlisted student account attempts `create` on `/users/{uid}` with `role: "teacher"`. -> **DENIED** (requires `isBootstrappedAdmin()` or `/teacherAllowlist` doc).
3. **Shadow Ghost Field Injection**: Client creates `/submissions/{id}` with extra field `isAdmin: true` or `overrideGrade: 100`. -> **DENIED** (`keys().hasOnly(...)`).
4. **Unverified Email Spoofing**: Request with `email_verified: false` attempts write or admin action. -> **DENIED** (`isVerifiedUser()` enforces `request.auth.token.email_verified == true`).
5. **Cross-Student PII Read**: Student A calls `get` on `/users/{studentB}` or `/classrooms/{cls}/roster/{studentB}`. -> **DENIED**.
6. **Student Reading Draft/Unpublished Assessment**: Student calls `get` or `list` on `/assessments/{assessmentId}`. -> **DENIED** (teacher-only collection).
7. **Student Peeking Answer Key Before Submitting**: Enrolled student calls `get` on `/assessmentAnswerKeys/{assessmentId}` before creating `/submissionLocks/{assessmentId}_{uid}`. -> **DENIED**.
8. **Student Listing All Answer Keys**: Enrolled student calls `list` on `/assessmentAnswerKeys`. -> **DENIED** (`resource.data.teacherUid == request.auth.uid`).
9. **Cross-Classroom Published Assessment Read**: Student not in `classroomB.studentUids` reads `/publishedAssessments/{assessB}`. -> **DENIED**.
10. **Duplicate Submission When Retakes Disabled**: Student creates `/submissions/{assess}_{uid}` twice or uses `_att_2` when `allowRetakes == false`. -> **DENIED**.
11. **Cross-Student Submission Spoofing**: Student A submits `/submissions/{id}` with `studentUid: studentB` or reads Student B's submission. -> **DENIED**.
12. **Resource Poisoning / Path Injection**: Write attempt with 1KB junk document ID or oversized `extractedText` / `studentUids` array (`> 200`). -> **DENIED** (`isValidId()` + `.size()` guards).
13. **Cross-Student Private Message Snooping**: Student A tries `get` or `list` on Student B's direct thread `/conversations/{convId}/messages/{msgId}`. -> **DENIED** (`request.auth.uid in resource.data.participantUids`).
14. **Student Creating Fake Classroom Announcement**: Student tries `create` or `delete` on `/announcements/{id}`. -> **DENIED** (`isTeacherProfile()` + owning classroom check).
15. **Cross-User Notification Read/Tamper**: User tries reading or marking read a notification where `recipientUid != request.auth.uid`. -> **DENIED**.
16. **Student Forging Attendance or Classroom Activity**: Student tries `create`/`update` on `/attendanceSessions/{id}` or `/classroomActivities/{id}`. -> **DENIED** (`isTeacherProfile()` + classroom owner check).
17. **Student Peeking Teacher Question Bank**: Student attempts `get` or `list` on `/questionBank/{id}`. -> **DENIED** (`existing().teacherUid == request.auth.uid && isTeacherProfile()`).
18. **Cross-Student Doubt/Revision/Note Access**: Student A attempts `get`, `list`, `create`, or `update` on Student B's `/tutorDoubts/{id}`, `/revisionTasks/{id}`, `/materialEngagements/{id}`, or `/studentNotes/{id}`. -> **DENIED**.
19. **Non-Owning Teacher Modifying Another Teacher's Lesson Plans**: Teacher B attempts read/write on `/lessonPlans/{id}` owned by Teacher A. -> **DENIED**.
20. **Ghost Field / Oversized Payload Injection on New Collections**: Client injects extra field or >4KB note/doubt payload -> **DENIED** (`keys().hasOnly(...)` + `.size()` guards).
