import { describe, expect, it } from 'vitest';
import { buildCapsGenerationBrief, buildCapsRequirement } from './caps-generation';

describe('CAPS generation contract', () => {
  it('builds a structured brief for a valid pilot topic', () => {
    const brief = buildCapsGenerationBrief({
      grade: 9,
      subject: 'mathematics',
      topicId: 'math-algebra',
      goal: 'learn',
      version: 1,
    });

    expect(brief.topicLabel).toBe('Algebra');
    expect(brief.instructions[0]).toContain('Grade 9 Mathematics: Algebra');
    expect(brief.instructions).toContain(
      'Build understanding from first principles, then check understanding before moving on.',
    );
  });

  it('rejects a topic that is not available for the selected grade and subject', () => {
    expect(() =>
      buildCapsGenerationBrief({
        grade: 8,
        subject: 'physical-sciences',
        topicId: 'physics-mechanics',
        goal: 'practice',
        version: 1,
      }),
    ).toThrow('Selected topic is not available');
  });

  it('produces a requirement that can be handed to the classroom generator', () => {
    const requirement = buildCapsRequirement({
      grade: 11,
      subject: 'physical-sciences',
      topicId: 'physics-electricity',
      goal: 'simulate',
      version: 1,
    });

    expect(requirement).toContain('Grade 11 Physical Sciences: Electricity and circuits');
    expect(requirement).toContain('interactive visualisation or simulation');
    expect(requirement.split('\n').length).toBeGreaterThanOrEqual(5);
  });
});
