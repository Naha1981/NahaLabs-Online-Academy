export type CapsSubject = 'mathematics' | 'physical-sciences';

export interface CapsTopic {
  id: string;
  label: string;
  grades: number[];
  subjects: CapsSubject[];
}

/**
 * Starter catalog for the Soweto pilot.
 *
 * This is intentionally a small, reviewable seed catalog. Curriculum wording
 * should be verified against the current official CAPS documents before being
 * used as an authoritative curriculum map.
 */
export const CAPS_SOWETO_PILOT: CapsTopic[] = [
  {
    id: 'math-algebra',
    label: 'Algebra',
    grades: [8, 9, 10, 11, 12],
    subjects: ['mathematics'],
  },
  {
    id: 'math-functions',
    label: 'Functions and graphs',
    grades: [10, 11, 12],
    subjects: ['mathematics'],
  },
  {
    id: 'math-geometry',
    label: 'Geometry',
    grades: [8, 9, 10, 11, 12],
    subjects: ['mathematics'],
  },
  {
    id: 'math-trigonometry',
    label: 'Trigonometry',
    grades: [10, 11, 12],
    subjects: ['mathematics'],
  },
  {
    id: 'math-probability-statistics',
    label: 'Probability and statistics',
    grades: [10, 11, 12],
    subjects: ['mathematics'],
  },
  {
    id: 'physics-mechanics',
    label: 'Mechanics',
    grades: [10, 11, 12],
    subjects: ['physical-sciences'],
  },
  {
    id: 'physics-waves',
    label: 'Waves and sound',
    grades: [10, 11, 12],
    subjects: ['physical-sciences'],
  },
  {
    id: 'physics-electricity',
    label: 'Electricity and circuits',
    grades: [10, 11, 12],
    subjects: ['physical-sciences'],
  },
  {
    id: 'physics-matter',
    label: 'Matter and materials',
    grades: [10, 11, 12],
    subjects: ['physical-sciences'],
  },
  {
    id: 'physics-reactions',
    label: 'Chemical reactions',
    grades: [10, 11, 12],
    subjects: ['physical-sciences'],
  },
];

export function getCapsPilotTopics(grade: number, subject: CapsSubject) {
  return CAPS_SOWETO_PILOT.filter(
    (topic) => topic.grades.includes(grade) && topic.subjects.includes(subject),
  );
}
