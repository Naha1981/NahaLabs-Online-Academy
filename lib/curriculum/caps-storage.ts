import type { CapsLearningContext } from './caps-generation';
import {
  createEmptyCapsTopicProgress,
  recordCapsProgressEvent,
  type CapsProgressEventType,
  type CapsTopicProgress,
} from './caps-progress';

export const CAPS_CONTEXT_STORAGE_KEY = 'nahaCapsLearnerContext';
export const CAPS_PROGRESS_STORAGE_KEY = 'nahaCapsPilotProgress';

export interface CapsStoredProgress {
  version: 1;
  topics: Record<string, CapsTopicProgress>;
}

export function readCapsContext(): CapsLearningContext | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(CAPS_CONTEXT_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CapsLearningContext) : null;
  } catch {
    return null;
  }
}

export function readCapsProgress(): CapsStoredProgress {
  const empty: CapsStoredProgress = { version: 1, topics: {} };
  if (typeof window === 'undefined') return empty;
  try {
    const raw = window.localStorage.getItem(CAPS_PROGRESS_STORAGE_KEY);
    if (!raw) return empty;
    const parsed = JSON.parse(raw) as CapsStoredProgress;
    if (parsed?.version !== 1 || !parsed.topics || typeof parsed.topics !== 'object') return empty;
    return parsed;
  } catch {
    return empty;
  }
}

export function recordCapsLocalEvent(
  type: CapsProgressEventType,
  context: CapsLearningContext,
  at = Date.now(),
  quizScorePercent?: number,
): CapsStoredProgress {
  const current = readCapsProgress();
  const existing = current.topics[context.topicId] ?? createEmptyCapsTopicProgress(context.topicId);
  const next = recordCapsProgressEvent(existing, {
    type,
    at,
    context,
    quizScorePercent,
  });
  const updated: CapsStoredProgress = {
    version: 1,
    topics: { ...current.topics, [context.topicId]: next },
  };

  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(CAPS_PROGRESS_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Progress remains best-effort and never blocks learning.
    }
  }
  return updated;
}
