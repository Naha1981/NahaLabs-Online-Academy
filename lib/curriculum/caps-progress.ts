import type { CapsLearningContext } from './caps-generation';

export type CapsProgressEventType =
  | 'caps_onboarding_started'
  | 'caps_class_started'
  | 'caps_activity_completed'
  | 'caps_quiz_completed';

export interface CapsProgressEvent {
  type: CapsProgressEventType;
  at: number;
  context: CapsLearningContext;
}

export interface CapsTopicProgress {
  topicId: string;
  startedAt?: number;
  lastActivityAt?: number;
  activitiesCompleted: number;
  quizzesCompleted: number;
}

export function recordCapsProgressEvent(
  progress: CapsTopicProgress,
  event: CapsProgressEvent,
): CapsTopicProgress {
  const next = { ...progress };

  if (event.type === 'caps_class_started') {
    next.startedAt ??= event.at;
  }

  if (event.type === 'caps_activity_completed') {
    next.activitiesCompleted += 1;
    next.lastActivityAt = event.at;
  }

  if (event.type === 'caps_quiz_completed') {
    next.quizzesCompleted += 1;
    next.lastActivityAt = event.at;
  }

  return next;
}

export function createEmptyCapsTopicProgress(topicId: string): CapsTopicProgress {
  return {
    topicId,
    activitiesCompleted: 0,
    quizzesCompleted: 0,
  };
}
