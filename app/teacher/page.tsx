'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, BookOpenCheck, CheckCircle2, ClipboardList, ShieldCheck, Users, Wifi } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  CAPS_TEACHER_SETTINGS_KEY,
  DEFAULT_CAPS_TEACHER_SETTINGS,
  type CapsTeacherSettings,
  normalizeCapsTeacherSettings,
} from '@/lib/curriculum/teacher-config';
import { CAPS_SOWETO_PILOT } from '@/lib/curriculum/caps';
import {
  getCapsPerformanceBand,
  getCapsReviewRecommendation,
  type CapsPerformanceBand,
  type CapsTopicProgress,
} from '@/lib/curriculum/caps-progress';
import { readCapsProgress, type CapsStoredProgress } from '@/lib/curriculum/caps-storage';

const BAND_LABELS: Record<CapsPerformanceBand, string> = {
  'not-assessed': 'Not assessed',
  'needs-review': 'Needs review',
  developing: 'Developing',
  strong: 'Strong',
};

const BAND_CLASSES: Record<CapsPerformanceBand, string> = {
  'not-assessed': 'border-muted bg-muted/40 text-muted-foreground',
  'needs-review': 'border-destructive/30 bg-destructive/5 text-destructive',
  developing: 'border-amber-500/30 bg-amber-500/5 text-amber-700 dark:text-amber-300',
  strong: 'border-emerald-500/30 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300',
};

function ProgressRow({ topicId, progress }: { topicId: string; progress: CapsTopicProgress }) {
  const topic = CAPS_SOWETO_PILOT.find((item) => item.id === topicId);
  if (!topic) return null;

  const band = getCapsPerformanceBand(progress);
  const recommendation = getCapsReviewRecommendation(progress);
  const latestScore = progress.latestQuizScorePercent;

  return (
    <div className="rounded-xl border p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="font-medium">{topic.label}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Grade {topic.grades.join(', ')} · {topic.subjects.map((subject) => subject === 'physical-sciences' ? 'Physical Sciences' : 'Mathematics').join(' · ')}
          </p>
        </div>
        <span className={`w-fit rounded-full border px-2.5 py-1 text-xs font-medium ${BAND_CLASSES[band]}`}>
          {BAND_LABELS[band]}
        </span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        <div><p className="text-muted-foreground">Activities</p><p className="mt-1 font-semibold">{progress.activitiesCompleted}</p></div>
        <div><p className="text-muted-foreground">Quizzes</p><p className="mt-1 font-semibold">{progress.quizzesCompleted}</p></div>
        <div><p className="text-muted-foreground">Latest</p><p className="mt-1 font-semibold">{latestScore === undefined ? '—' : `${latestScore}%`}</p></div>
        <div><p className="text-muted-foreground">Best</p><p className="mt-1 font-semibold">{progress.bestQuizScorePercent === undefined ? '—' : `${progress.bestQuizScorePercent}%`}</p></div>
      </div>
      <div className="mt-4 flex items-center gap-2 border-t pt-3 text-xs text-muted-foreground">
        <ArrowRight className="size-3.5" />
        <span>{recommendation.label}</span>
      </div>
    </div>
  );
}

export default function TeacherPage() {
  const [settings, setSettings] = useState<CapsTeacherSettings>(DEFAULT_CAPS_TEACHER_SETTINGS);
  const [progress, setProgress] = useState<CapsStoredProgress>({ version: 1, topics: {} });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CAPS_TEACHER_SETTINGS_KEY);
      if (raw) setSettings(normalizeCapsTeacherSettings(JSON.parse(raw)));
    } catch {
      // Defaults are safe if storage is unavailable or malformed.
    }
    setProgress(readCapsProgress());
  }, []);

  const update = (key: keyof CapsTeacherSettings) => {
    setSettings((current) => ({ ...current, [key]: !current[key] }));
    setSaved(false);
  };

  const save = () => {
    try {
      localStorage.setItem(CAPS_TEACHER_SETTINGS_KEY, JSON.stringify(settings));
    } catch {
      // Best effort: learning should not be blocked by local storage failures.
    }
    setSaved(true);
  };

  const topicRows = useMemo(
    () => CAPS_SOWETO_PILOT
      .map((topic) => ({ topic, progress: progress.topics[topic.id] }))
      .filter(({ progress: item }) => item && (item.activitiesCompleted > 0 || item.quizzesCompleted > 0))
      .sort((a, b) => (b.progress?.lastActivityAt ?? 0) - (a.progress?.lastActivityAt ?? 0)),
    [progress],
  );

  const needsReview = topicRows.filter(({ progress: item }) => item && getCapsPerformanceBand(item) === 'needs-review').length;
  const developing = topicRows.filter(({ progress: item }) => item && getCapsPerformanceBand(item) === 'developing').length;
  const strong = topicRows.filter(({ progress: item }) => item && getCapsPerformanceBand(item) === 'strong').length;
  const activities = topicRows.reduce((sum, { progress: item }) => sum + (item?.activitiesCompleted ?? 0), 0);
  const quizzes = topicRows.reduce((sum, { progress: item }) => sum + (item?.quizzesCompleted ?? 0), 0);

  const controls: Array<{ key: keyof CapsTeacherSettings; title: string; description: string }> = [
    { key: 'pilotMode', title: 'CAPS pilot mode', description: 'Keep classroom generation inside the reviewed Grade 8–12 Mathematics and Physical Sciences pilot catalog.' },
    { key: 'requireInteractive', title: 'Interactive classroom by default', description: 'Start lessons with activities, checks for understanding and interactive classroom elements.' },
    { key: 'showLocalExamples', title: 'Use South African examples', description: 'Prefer relevant local contexts when they improve understanding without making assumptions about a learner.' },
    { key: 'dataSaver', title: 'Data-saver mode', description: 'Prefer lightweight content and avoid unnecessary media for mobile and constrained connections.' },
  ];

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8">
          <p className="mb-2 text-sm text-muted-foreground">NahaLabs Online Academy · Pilot control plane</p>
          <h1 className="text-3xl font-semibold tracking-tight">Teacher dashboard</h1>
          <p className="mt-2 max-w-3xl text-muted-foreground">Configure the classroom and review formative progress. This pilot intentionally avoids learner names and contact details.</p>
        </header>

        <section className="mb-6 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 sm:p-5">
          <div className="flex gap-3">
            <ShieldCheck className="mt-0.5 size-5 shrink-0" />
            <div>
              <p className="font-medium">Local pilot data</p>
              <p className="mt-1 text-sm text-muted-foreground">The progress below is stored in this browser only. It is not a shared class register and should not be treated as a multi-learner school report. Server-backed school administration is a later phase.</p>
            </div>
          </div>
        </section>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border bg-card p-5"><Users className="mb-3 size-5" /><p className="text-sm text-muted-foreground">Topics active</p><p className="mt-1 text-2xl font-semibold">{topicRows.length}</p></div>
          <div className="rounded-2xl border bg-card p-5"><CheckCircle2 className="mb-3 size-5" /><p className="text-sm text-muted-foreground">Activities completed</p><p className="mt-1 text-2xl font-semibold">{activities}</p></div>
          <div className="rounded-2xl border bg-card p-5"><ClipboardList className="mb-3 size-5" /><p className="text-sm text-muted-foreground">Quiz attempts</p><p className="mt-1 text-2xl font-semibold">{quizzes}</p></div>
          <div className="rounded-2xl border bg-card p-5"><BookOpenCheck className="mb-3 size-5" /><p className="text-sm text-muted-foreground">Needs review</p><p className="mt-1 text-2xl font-semibold">{needsReview}</p></div>
        </div>

        <section className="mt-6 rounded-2xl border bg-card p-5 sm:p-6">
          <div className="mb-5 flex items-center gap-3"><Users className="size-5" /><div><h2 className="text-lg font-semibold">Pilot learning signals</h2><p className="text-sm text-muted-foreground">Topic-level formative signals from this browser.</p></div></div>
          <div className="mb-5 grid grid-cols-3 gap-3 text-sm">
            <div className="rounded-xl border p-3"><p className="text-muted-foreground">Needs review</p><p className="mt-1 font-semibold">{needsReview}</p></div>
            <div className="rounded-xl border p-3"><p className="text-muted-foreground">Developing</p><p className="mt-1 font-semibold">{developing}</p></div>
            <div className="rounded-xl border p-3"><p className="text-muted-foreground">Strong</p><p className="mt-1 font-semibold">{strong}</p></div>
          </div>
          {topicRows.length > 0 ? (
            <div className="space-y-3">
              {topicRows.map(({ topic, progress: item }) => <ProgressRow key={topic.id} topicId={topic.id} progress={item!} />)}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed p-6 text-center">
              <p className="font-medium">No pilot progress recorded yet</p>
              <p className="mt-1 text-sm text-muted-foreground">Start a CAPS classroom, complete an activity or finish a quiz. The dashboard will reflect those signals on this device.</p>
            </div>
          )}
        </section>

        <section className="mt-6 rounded-2xl border bg-card p-5 sm:p-6">
          <div className="mb-5 flex items-center gap-3"><Users className="size-5" /><h2 className="text-lg font-semibold">Classroom behaviour</h2></div>
          <div className="divide-y">
            {controls.map((control) => (
              <label key={control.key} className="flex cursor-pointer items-start justify-between gap-5 py-5 first:pt-0 last:pb-0">
                <span><span className="block font-medium">{control.title}</span><span className="mt-1 block text-sm text-muted-foreground">{control.description}</span></span>
                <input aria-label={control.title} type="checkbox" checked={settings[control.key]} onChange={() => update(control.key)} className="mt-1 size-5 shrink-0 accent-current" />
              </label>
            ))}
          </div>
          <div className="mt-6 flex flex-col gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between"><span className="text-sm text-muted-foreground">{saved ? 'Settings saved on this device.' : 'Changes are not saved until you choose Save.'}</span><Button onClick={save}>Save controls</Button></div>
        </section>

        <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground"><Wifi className="size-3.5" /> Data-saver remains a generation preference; it does not disable core classroom functionality.</div>
      </div>
    </main>
  );
}
