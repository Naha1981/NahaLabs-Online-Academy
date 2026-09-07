import type { QuestionResult } from '@/lib/quiz/grading';
import type { QuizAnswers } from '@/lib/quiz/persistence';
import type { QuizAttemptState, QuizAttemptWriter, QuizDraftInput } from '@/lib/quiz/runtime';
import { readCapsContext, recordCapsLocalEvent } from '@/lib/curriculum/caps-storage';

export type QuizRuntimeGate =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; attemptId: string };

export interface QuizViewLifetime {
  capture(): number;
  invalidate(): void;
  isCurrent(token: number): boolean;
}

export function createQuizViewLifetime(): QuizViewLifetime {
  let generation = 0;
  return {
    capture: () => generation,
    invalidate: () => {
      generation += 1;
    },
    isCurrent: (token) => token === generation,
  };
}

export async function runQuizPersistenceTransition(
  persist: () => Promise<void>,
  lifetime: QuizViewLifetime,
  onSuccess: () => void,
  onError: (error: unknown) => void,
): Promise<void> {
  const token = lifetime.capture();
  try {
    await persist();
  } catch (error) {
    if (lifetime.isCurrent(token)) onError(error);
    return;
  }
  if (lifetime.isCurrent(token)) onSuccess();
}

export function isQuizRuntimeReady(
  gate: QuizRuntimeGate,
): gate is Extract<QuizRuntimeGate, { status: 'ready' }> {
  return gate.status === 'ready';
}

export async function persistQuizRetry(
  input: { stageId: string; sceneId: string; attemptId: string },
  writer: Pick<QuizAttemptWriter, 'recordPhase'>,
): Promise<void> {
  await writer.recordPhase({
    ...input,
    phase: 'draft',
    answers: {},
    startNewAttempt: true,
  });
}

export async function persistQuizSubmission(
  input: QuizDraftInput,
  writer: Pick<QuizAttemptWriter, 'recordPhase'>,
): Promise<void> {
  await writer.recordPhase({ ...input, phase: 'submitted' });
}

export async function persistQuizReview(
  input: QuizDraftInput & { results: QuestionResult[] },
  writer: Pick<QuizAttemptWriter, 'recordPhase'>,
): Promise<void> {
  await writer.recordPhase({ ...input, phase: 'reviewed' });

  // The CAPS pilot keeps learner progress local and anonymous. Only record a
  // completion when a CAPS classroom context is active; normal OpenMAIC usage
  // is untouched. The percentage is question accuracy, not a claim of mastery.
  const capsContext = readCapsContext();
  if (capsContext) {
    const answered = input.results.length;
    const correct = input.results.filter((result) => result.status === 'correct').length;
    const scorePercent = answered > 0 ? Math.round((correct / answered) * 100) : undefined;
    recordCapsLocalEvent('caps_quiz_completed', capsContext, Date.now(), scorePercent);
  }
}

export interface QuizViewHydratedState {
  phase: 'not_started' | 'answering' | 'reviewing';
  answers: QuizAnswers;
  results: QuestionResult[];
}

export function quizViewStateFromAttempt(
  state: QuizAttemptState | undefined,
): QuizViewHydratedState {
  if (!state) return { phase: 'not_started', answers: {}, results: [] };
  if (state.phase === 'reviewed') {
    return {
      phase: 'reviewing',
      answers: state.answers,
      results: state.results ?? [],
    };
  }
  if (state.phase === 'draft' && Object.keys(state.answers).length === 0) {
    return { phase: 'not_started', answers: {}, results: [] };
  }
  return { phase: 'answering', answers: state.answers, results: [] };
}
