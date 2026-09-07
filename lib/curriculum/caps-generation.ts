import { getCapsPilotTopics, type CapsSubject } from './caps';
import {
  buildTeacherGenerationInstructions,
  DEFAULT_CAPS_TEACHER_SETTINGS,
  type CapsTeacherSettings,
} from './teacher-config';

export type CapsLearningGoal =
  | 'learn'
  | 'assess'
  | 'practice'
  | 'simulate';

export interface CapsLearningContext {
  grade: number;
  subject: CapsSubject;
  topicId: string;
  goal: CapsLearningGoal;
  version: 1;
}

export interface CapsGenerationBrief {
  context: CapsLearningContext;
  topicLabel: string;
  instructions: string[];
}

const GOAL_INSTRUCTIONS: Record<CapsLearningGoal, string> = {
  learn: 'Build understanding from first principles, then check understanding before moving on.',
  assess: 'Teach exam-ready reasoning, include worked examples, and finish with a short formative assessment.',
  practice: 'Use guided practice with increasing difficulty and give feedback after each attempt.',
  simulate: 'Prefer an interactive visualisation or simulation where it genuinely improves understanding.',
};

export function buildCapsGenerationBrief(
  context: CapsLearningContext,
  teacherSettings: CapsTeacherSettings = DEFAULT_CAPS_TEACHER_SETTINGS,
): CapsGenerationBrief {
  const topic = getCapsPilotTopics(context.grade, context.subject).find(
    (candidate) => candidate.id === context.topicId,
  );

  if (!topic) {
    throw new Error('Selected topic is not available for this grade and subject in the pilot catalog.');
  }

  const subjectLabel = context.subject === 'mathematics' ? 'Mathematics' : 'Physical Sciences';

  return {
    context,
    topicLabel: topic.label,
    instructions: [
      `Teach Grade ${context.grade} ${subjectLabel}: ${topic.label}.`,
      'Treat the CAPS catalog as a pilot curriculum layer, not an authoritative replacement for official curriculum documents.',
      ...buildTeacherGenerationInstructions(teacherSettings),
      'Teach step-by-step and check understanding frequently.',
      GOAL_INSTRUCTIONS[context.goal],
      'End with a short formative activity and explain what the learner should review next.',
    ],
  };
}

export function buildCapsRequirement(
  context: CapsLearningContext,
  teacherSettings?: CapsTeacherSettings,
): string {
  return buildCapsGenerationBrief(context, teacherSettings).instructions.join('\n');
}
