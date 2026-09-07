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

const INTERACTIVE_COMPLETION_CONTRACT = [
  'When generating an interactive learning activity, include a clear learner-completable action (for example: manipulate a control, complete a short task, or reach a target state).',
  "When that action is genuinely completed, emit window.parent.postMessage({ __maicInteractive: true, kind: 'activity-completed' }, '*').",
  'Do not emit the completion message on page load, iframe mount, or merely because a control is visible.',
  'Emit the completion message at most once for the current activity attempt.',
  "If the learner explicitly resets the activity for another attempt, emit window.parent.postMessage({ __maicInteractive: true, kind: 'activity-reset' }, '*') before allowing a later genuine completion to count.",
  'Never emit activity-reset automatically on page load, iframe mount, visibility changes, or scene navigation.',
];

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
      ...INTERACTIVE_COMPLETION_CONTRACT,
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
