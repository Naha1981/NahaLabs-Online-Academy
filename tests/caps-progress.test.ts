import { describe, expect, it } from 'vitest';
import {
  createEmptyCapsTopicProgress,
  getCapsPerformanceBand,
  getCapsReviewRecommendation,
  recordCapsProgressEvent,
} from '@/lib/curriculum/caps-progress';

const context = { grade: 9 as const, subject: 'mathematics' as const, topicId: 'math-algebra', goal: 'learn' as const, version: 1 as const };

function progressWithScore(score: number) {
  return recordCapsProgressEvent(createEmptyCapsTopicProgress(context.topicId), {
    type: 'caps_quiz_completed',
    at: 1,
    context,
    quizScorePercent: score,
  });
}

describe('CAPS progress', () => {
  it('classifies score bands without calling them mastery', () => {
    expect(getCapsPerformanceBand(createEmptyCapsTopicProgress(context.topicId))).toBe('not-assessed');
    expect(getCapsPerformanceBand(progressWithScore(49))).toBe('needs-review');
    expect(getCapsPerformanceBand(progressWithScore(50))).toBe('developing');
    expect(getCapsPerformanceBand(progressWithScore(74))).toBe('developing');
    expect(getCapsPerformanceBand(progressWithScore(75))).toBe('strong');
  });

  it('recommends an appropriate next learning action', () => {
    expect(getCapsReviewRecommendation(createEmptyCapsTopicProgress(context.topicId)).action).toBe('assess');
    expect(getCapsReviewRecommendation(progressWithScore(40)).action).toBe('review');
    expect(getCapsReviewRecommendation(progressWithScore(60)).action).toBe('practice');
    expect(getCapsReviewRecommendation(progressWithScore(90)).action).toBe('challenge');
  });

  it('keeps the best score while exposing the latest score', () => {
    const first = progressWithScore(80);
    const second = recordCapsProgressEvent(first, {
      type: 'caps_quiz_completed',
      at: 2,
      context,
      quizScorePercent: 55,
    });
    expect(second.bestQuizScorePercent).toBe(80);
    expect(second.latestQuizScorePercent).toBe(55);
    expect(getCapsPerformanceBand(second)).toBe('developing');
  });
});
