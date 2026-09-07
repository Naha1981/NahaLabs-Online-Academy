'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, BookOpen, CheckCircle2, Clock3, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CAPS_SOWETO_PILOT } from '@/lib/curriculum/caps';
import { buildCapsGenerationBrief } from '@/lib/curriculum/caps-generation';
import { readCapsContext, readCapsProgress, type CapsStoredProgress } from '@/lib/curriculum/caps-storage';
import { getCapsReviewRecommendation } from '@/lib/curriculum/caps-progress';

function saveRevisitContext(topicId: string, action: string, context: ReturnType<typeof readCapsContext>) {
  const topic = CAPS_SOWETO_PILOT.find((item) => item.id === topicId);
  if (!topic || typeof window === 'undefined') return;
  const subject = topic.subjects[0];
  const grade = context && topic.grades.includes(context.grade) ? context.grade : topic.grades[0];
  const goal = action === 'review' ? 'learn' : action === 'challenge' || action === 'practice' ? 'practice' : 'assess';
  try {
    localStorage.setItem('nahaCapsRevisitContext', JSON.stringify({ grade, subject, topicId, goal }));
  } catch {
    // Revisit is an enhancement; the normal onboarding flow remains available.
  }
}

export default function CapsProgressPage() {
  const [progress, setProgress] = useState<CapsStoredProgress>({ version: 1, topics: {} });
  const [context, setContext] = useState<ReturnType<typeof readCapsContext>>(null);

  useEffect(() => {
    setProgress(readCapsProgress());
    setContext(readCapsContext());
  }, []);

  const rows = useMemo(() => CAPS_SOWETO_PILOT.map((topic) => ({ topic, progress: progress.topics[topic.id] })), [progress]);
  const activeBrief = context ? (() => { try { return buildCapsGenerationBrief(context); } catch { return null; } })() : null;

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div><div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground"><GraduationCap className="size-4" /> NahaLabs Online Academy</div><h1 className="text-3xl font-semibold tracking-tight">My learning progress</h1><p className="mt-2 max-w-2xl text-muted-foreground">A private, browser-local view of your CAPS pilot learning. No name, school or contact details are required.</p></div>
          <Button asChild><a href="/caps">Start another class<ArrowRight className="ml-2 size-4" /></a></Button>
        </header>

        {activeBrief && context ? <section className="mb-8 rounded-2xl border bg-card p-5"><p className="text-sm text-muted-foreground">Current classroom</p><h2 className="mt-1 text-xl font-semibold">Grade {context.grade} · {context.subject === 'mathematics' ? 'Mathematics' : 'Physical Sciences'}</h2><p className="mt-1 text-sm text-muted-foreground">{activeBrief.topicLabel}</p></section> : null}

        <section className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border bg-card p-5"><BookOpen className="mb-3 size-5" /><p className="text-2xl font-semibold">{Object.keys(progress.topics).length}</p><p className="text-sm text-muted-foreground">Topics started</p></div>
          <div className="rounded-2xl border bg-card p-5"><CheckCircle2 className="mb-3 size-5" /><p className="text-2xl font-semibold">{Object.values(progress.topics).reduce((sum, item) => sum + item.activitiesCompleted, 0)}</p><p className="text-sm text-muted-foreground">Activities completed</p></div>
          <div className="rounded-2xl border bg-card p-5"><Clock3 className="mb-3 size-5" /><p className="text-2xl font-semibold">{Object.values(progress.topics).reduce((sum, item) => sum + item.quizzesCompleted, 0)}</p><p className="text-sm text-muted-foreground">Quizzes completed</p></div>
        </section>

        <section className="mt-8 rounded-2xl border bg-card p-5 sm:p-6">
          <div><h2 className="text-lg font-semibold">Pilot topics</h2><p className="mt-1 text-sm text-muted-foreground">Performance bands are based on recent question accuracy, not a claim of mastery.</p></div>
          <div className="mt-4 divide-y">
            {rows.map(({ topic, progress: item }) => {
              const recommendation = item ? getCapsReviewRecommendation(item) : null;
              return <div key={topic.id} className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0"><p className="font-medium">{topic.label}</p><p className="text-sm text-muted-foreground">{topic.subjects.includes('mathematics') ? 'Mathematics' : 'Physical Sciences'} · Grades {topic.grades.join(', ')}</p>{item && recommendation ? <p className="mt-2 text-sm text-muted-foreground"><span className="font-medium text-foreground">{recommendation.band.replace('-', ' ')}</span>{item.latestQuizScorePercent !== undefined ? ` · ${item.latestQuizScorePercent}% latest accuracy` : ''}{' · '}{recommendation.description}</p> : null}</div>
                <div className="flex shrink-0 items-center gap-3"><div className="text-right text-sm text-muted-foreground">{item ? `${item.activitiesCompleted} activities · ${item.quizzesCompleted} quizzes` : 'Not started'}</div>{item && recommendation ? <Button asChild variant="outline" size="sm" onClick={() => saveRevisitContext(topic.id, recommendation.action, context)}><a href="/caps">{recommendation.label}<ArrowRight className="ml-2 size-4" /></a></Button> : null}</div>
              </div>;
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
