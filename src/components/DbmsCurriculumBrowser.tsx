import React, { useMemo, useState } from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import { DBMS_CURRICULUM_ID } from '../utils/curriculumProgress';
import { CurriculumModule, type SampleStudentProgressOption } from './CurriculumModule';
import type { DbmsUnit } from '../data/dbmsCurriculum';
import type { LanguageCode, Question } from '../types/learnsense';

interface DbmsCurriculumBrowserProps {
  initialLanguage?: LanguageCode;
  onGenerateNotes?: (topicTitle: string, unitContext: string) => void;
  onAskTutor?: (topicTitle: string, promptContext: string) => void;
  onPublishUnitToCourse?: (unit: DbmsUnit) => Promise<void> | void;
  publishingUnitNumber?: number | null;
  publishStatusMessage?: string | null;
}

export const DbmsCurriculumBrowser: React.FC<DbmsCurriculumBrowserProps> = ({
  initialLanguage = 'en',
  onGenerateNotes,
  onAskTutor,
  onPublishUnitToCourse,
  publishingUnitNumber = null,
  publishStatusMessage = null,
}) => {
  const {
    user,
    isDemoMode,
    workspace,
    toggleCurriculumTopicCompleted,
    setLastViewedCurriculumTopic,
    saveToQuestionBank,
  } = useWorkspace();

  const [togglingTopicId, setTogglingTopicId] = useState<string | null>(null);
  const [selectedSampleStudentUid, setSelectedSampleStudentUid] = useState<string>(
    'demo_stu_aarav'
  );

  const sampleStudents = useMemo<SampleStudentProgressOption[] | undefined>(() => {
    if (!isDemoMode || (user?.role !== 'teacher' && user?.role !== 'admin')) {
      return undefined;
    }
    const rosterMap = new Map<string, string>();
    for (const cls of workspace.classrooms) {
      for (const stu of cls.students) {
        if (!rosterMap.has(stu.uid)) {
          rosterMap.set(stu.uid, stu.name);
        }
      }
    }
    for (const prog of workspace.curriculumProgress) {
      if (!rosterMap.has(prog.studentUid)) {
        rosterMap.set(prog.studentUid, prog.studentUid);
      }
    }
    return Array.from(rosterMap.entries()).map(([uid, name]) => {
      const rec = workspace.curriculumProgress.find(
        (p) => p.studentUid === uid && p.curriculumId === DBMS_CURRICULUM_ID
      );
      return {
        uid,
        name,
        completedCount: rec?.completedTopicIds.length ?? 0,
      };
    });
  }, [isDemoMode, user?.role, workspace.classrooms, workspace.curriculumProgress]);

  const effectiveStudentUid = useMemo(() => {
    if (
      isDemoMode &&
      (user?.role === 'teacher' || user?.role === 'admin') &&
      sampleStudents &&
      sampleStudents.length > 0
    ) {
      return selectedSampleStudentUid || sampleStudents[0].uid;
    }
    return user?.uid ?? '';
  }, [isDemoMode, user?.role, user?.uid, sampleStudents, selectedSampleStudentUid]);

  const activeProgressRecord = useMemo(
    () =>
      workspace.curriculumProgress.find(
        (p) => p.studentUid === effectiveStudentUid && p.curriculumId === DBMS_CURRICULUM_ID
      ),
    [workspace.curriculumProgress, effectiveStudentUid]
  );

  const handleToggleTopic = async (topicId: string) => {
    setTogglingTopicId(topicId);
    try {
      await toggleCurriculumTopicCompleted(topicId, effectiveStudentUid || undefined);
    } finally {
      setTogglingTopicId(null);
    }
  };

  const handleSelectTopic = async (topicId: string) => {
    await setLastViewedCurriculumTopic(topicId, effectiveStudentUid || undefined);
  };

  const handleSaveGeneratedQuestion =
    user?.role === 'teacher'
      ? async (subject: string, question: Question) => {
          await saveToQuestionBank({ subject, question });
        }
      : undefined;

  return (
    <CurriculumModule
      initialLanguage={initialLanguage}
      completedTopicIds={activeProgressRecord?.completedTopicIds ?? []}
      lastViewedTopicId={activeProgressRecord?.lastViewedTopicId}
      onToggleTopicComplete={handleToggleTopic}
      onSelectTopic={handleSelectTopic}
      togglingTopicId={togglingTopicId}
      isDemoMode={isDemoMode}
      userRole={user?.role}
      sampleStudents={sampleStudents}
      selectedSampleStudentUid={effectiveStudentUid}
      onSelectSampleStudentUid={setSelectedSampleStudentUid}
      onGenerateNotes={onGenerateNotes}
      onAskTutor={onAskTutor}
      onPublishUnitToCourse={onPublishUnitToCourse}
      publishingUnitNumber={publishingUnitNumber}
      publishStatusMessage={publishStatusMessage}
      onSaveGeneratedQuestion={handleSaveGeneratedQuestion}
    />
  );
};
