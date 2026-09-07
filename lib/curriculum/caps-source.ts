export type CapsSourceStatus = 'pilot-seed' | 'verified';

export interface CapsSource {
  id: string;
  status: CapsSourceStatus;
  authority: 'South African Department of Basic Education';
  title: string;
  grades: number[];
  subject: 'mathematics' | 'physical-sciences';
  url: string;
  notes: string;
}

/**
 * Official DBE entry points and documents used to validate the pilot catalog.
 *
 * The pilot topic labels are intentionally kept separate from this metadata:
 * a source being official does not mean every seed topic has been individually
 * mapped to a page/section yet.
 */
export const CAPS_OFFICIAL_SOURCES: CapsSource[] = [
  {
    id: 'dbe-mathematics-grades-7-9',
    status: 'verified',
    authority: 'South African Department of Basic Education',
    title: 'Curriculum and Assessment Policy Statement: Mathematics Grades 7–9',
    grades: [7, 8, 9],
    subject: 'mathematics',
    url: 'https://www.education.gov.za/LinkClick.aspx?fileticket=uCNqOwfGbmc%3D&forcedownload=true&mid=1629&portalid=0&tabid=573',
    notes: 'Official DBE CAPS document. Use it as the source of truth for Senior Phase Mathematics mapping.',
  },
  {
    id: 'dbe-mathematics-grades-10-12',
    status: 'verified',
    authority: 'South African Department of Basic Education',
    title: 'CAPS for Further Education and Training: Mathematics',
    grades: [10, 11, 12],
    subject: 'mathematics',
    url: 'https://www.education.gov.za/Curriculum/NCSGradesR12/CAPSFET/tabid/570/Default.aspx',
    notes: 'Official DBE FET CAPS index. The exact downloadable Mathematics document should be used for topic-level mapping.',
  },
  {
    id: 'dbe-physical-sciences-grades-10-12',
    status: 'verified',
    authority: 'South African Department of Basic Education',
    title: 'Curriculum and Assessment Policy Statement: Physical Sciences Grades 10–12',
    grades: [10, 11, 12],
    subject: 'physical-sciences',
    url: 'https://www.education.gov.za/Portals/0/CD/National%20Curriculum%20Statements%20and%20Vocational/CAPS%20FET%20%20PHYSICAL%20SCIENCE%20WEB.pdf?ver=2015-01-27-154258-683',
    notes: 'Official DBE CAPS document. Use it as the source of truth for FET Physical Sciences mapping.',
  },
];

export function getCapsSources(subject: CapsSource['subject'], grade: number): CapsSource[] {
  return CAPS_OFFICIAL_SOURCES.filter(
    (source) => source.subject === subject && source.grades.includes(grade),
  );
}
