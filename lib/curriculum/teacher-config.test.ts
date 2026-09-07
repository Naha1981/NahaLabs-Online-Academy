import { describe, expect, it } from 'vitest';
import {
  buildTeacherGenerationInstructions,
  DEFAULT_CAPS_TEACHER_SETTINGS,
  normalizeCapsTeacherSettings,
} from './teacher-config';

describe('teacher config', () => {
  it('fills missing settings from safe pilot defaults', () => {
    expect(normalizeCapsTeacherSettings({ dataSaver: false })).toEqual({
      ...DEFAULT_CAPS_TEACHER_SETTINGS,
      dataSaver: false,
    });
  });

  it('builds only the instructions enabled by the teacher', () => {
    const instructions = buildTeacherGenerationInstructions({
      pilotMode: true,
      requireInteractive: false,
      showLocalExamples: false,
      dataSaver: true,
    });

    expect(instructions).toHaveLength(2);
    expect(instructions[0]).toContain('pilot catalog');
    expect(instructions[1]).toContain('lightweight');
    expect(instructions.join('\n')).not.toContain('interactive classroom flow');
    expect(instructions.join('\n')).not.toContain('South African contexts');
  });
});
