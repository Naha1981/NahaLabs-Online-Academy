import { describe, expect, it } from 'vitest';
import {
  createEmptyCapsTopicProgress,
  recordCapsProgressEvent,
} from './caps-progress';

describe('CAPS pilot progress', () => {
  const context = {
    grade: 9,
    subject: 'mathematics' as const,
    topicId: 'math-algebra',
    goal: 'learn' as const,
    version: 1 as const,
  };

  it('starts with zero activity', () => {
    expect(createEmptyCapsTopicProgress('math-algebra')).toEqual({
      topicId: 'math-algebra',
      activitiesCompleted: 0,
      quizzesCompleted: 0,
    });
  });

  it('records class starts without collecting learner identity', () => {
    const progress = recordCapsProgressEvent(
      createEmptyCapsTopicProgress(context.topicId),
      { type: 'caps_class_started', at: 1000, context },
    );

    expect(progress.startedAt).toBe(1000);
    expect(progress.activitiesCompleted).toBe(0);
  });

  it('increments activities and quizzes', () => {
    let progress = createEmptyCapsTopicProgress(context.topicId);
    progress = recordCapsProgressEvent(progress, {
      type: 'caps_activity_completed',
      at: 2000,
      context,
    });
    progress = recordCapsProgressEvent(progress, {
      type: 'caps_quiz_completed',
      at: 3000,
      context,
    });

    expect(progress.activitiesCompleted).toBe(1);
    expect(progress.quizzesCompleted).toBe(1);
    expect(progress.lastActivityAt).toBe(3000);
  });
});
