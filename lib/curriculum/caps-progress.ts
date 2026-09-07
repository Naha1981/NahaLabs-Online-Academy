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
  quizScorePercent?: number;
}

export type CapsPerformanceBand = 'not-assessed' | 'needs-review' | 'developing' | 'strong';
export type CapsReviewAction = 'assess' | 'review' | 'practice' | 'challenge';

export interface CapsReviewRecommendation {
  band: CapsPerformanceBand;
  action: CapsReviewAction;
  label: string;
  description: string;
}

export interface CapsTopicProgress {
  topicId: string;
  startedAt?: number;
  lastActivityAt?: number;
  activitiesCompleted: number;
  quizzesCompleted: number;
  bestQuizScorePercent?: number;
  latestQuizScorePercent?: number;
}

export function getCapsPerformanceBand(progress: CapsTopicProgress): CapsPerformanceBand {
  const score = progress.latestQuizScorePercent ?? progress.bestQuizScorePercent;
  if (score === undefined) return 'not-assessed';
  if (score < 50) return 'needs-review';
  if (score < 75) return 'developing';
  return 'strong';
}

export function getCapsReviewRecommendation(progress: CapsTopicProgress): CapsReviewRecommendation {
  const band = getCapsPerformanceBand(progress);
  switch (band) {
    case 'needs-review':
      return {
        band,
        action: 'review',
        label: 'Review this topic',
        description: 'Revisit the explanation and worked examples before trying another quiz.',
      };
    case 'developing':
      return {
        band,
        action: 'practice',
        label: 'Practice again',
        description: 'You are building confidence. Work through more questions, then reassess.',
      };
    case 'strong':
      return {
        band,
        action: 'challenge',
        label: 'Try a challenge',
        description: 'Your recent accuracy is strong. Extend the topic with a harder activity.',
      };
    default:
      return {
        band,
        action: 'assess',
        label: 'Take your first quiz',
        description: 'Complete a short formative check so the academy can suggest your next step.',
      };
  }
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
    next.latestQuizScorePercent = event.quizScorePercent;
    if (event.quizScorePercent !== undefined) {
      next.bestQuizScorePercent = Math.max(next.bestQuizScorePercent ?? 0, event.quizScorePercent);
    }
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
