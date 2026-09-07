export const CAPS_TEACHER_SETTINGS_KEY = 'nahaCapsTeacherSettings';

export interface CapsTeacherSettings {
  pilotMode: boolean;
  requireInteractive: boolean;
  showLocalExamples: boolean;
  dataSaver: boolean;
}

export const DEFAULT_CAPS_TEACHER_SETTINGS: CapsTeacherSettings = {
  pilotMode: true,
  requireInteractive: true,
  showLocalExamples: true,
  dataSaver: true,
};

export function normalizeCapsTeacherSettings(
  value: Partial<CapsTeacherSettings> | null | undefined,
): CapsTeacherSettings {
  return {
    ...DEFAULT_CAPS_TEACHER_SETTINGS,
    ...(value ?? {}),
  };
}

export function buildTeacherGenerationInstructions(
  settings: CapsTeacherSettings,
): string[] {
  const instructions: string[] = [];

  if (settings.pilotMode) {
    instructions.push(
      'Stay inside the selected Grade 8–12 Mathematics or Physical Sciences pilot catalog and do not present the pilot seed as authoritative CAPS coverage.',
    );
  }

  if (settings.requireInteractive) {
    instructions.push(
      'Prefer an interactive classroom flow with checks for understanding and learner participation.',
    );
  }

  if (settings.showLocalExamples) {
    instructions.push(
      'Use relevant South African contexts when they improve understanding; never assume a learner has a particular background.',
    );
  }

  if (settings.dataSaver) {
    instructions.push(
      'Prefer lightweight text, diagrams and compact activities; avoid unnecessary media or large downloads.',
    );
  }

  return instructions;
}
