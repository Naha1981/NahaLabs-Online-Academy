import { describe, expect, it } from 'vitest';
import { buildCapsGenerationBrief } from '@/lib/curriculum/caps-generation';

describe('CAPS generation', () => {
  it('includes a genuine interactive completion contract', () => {
    const brief = buildCapsGenerationBrief({
      grade: 10,
      subject: 'mathematics',
      topicId: 'math-functions',
      goal: 'simulate',
      version: 1,
    });

    expect(brief.instructions).toContain(
      "When that action is genuinely completed, emit window.parent.postMessage({ __maicInteractive: true, kind: 'activity-completed' }, '*').",
    );
    expect(brief.instructions).toContain(
      'Do not emit the completion message on page load, iframe mount, or merely because a control is visible.',
    );
  });
});
