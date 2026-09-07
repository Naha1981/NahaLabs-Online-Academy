'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, BookOpen, GraduationCap, Sparkles } from 'lucide-react';
import { CAPS_SOWETO_PILOT, type CapsSubject } from '@/lib/curriculum/caps';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const GRADES = [8, 9, 10, 11, 12] as const;
type Grade = (typeof GRADES)[number];

const SUBJECTS: Array<{ id: CapsSubject; label: string; description: string }> = [
  { id: 'mathematics', label: 'Mathematics', description: 'Algebra, functions, geometry, trigonometry and data.' },
  { id: 'physical-sciences', label: 'Physical Sciences', description: 'Mechanics, waves, electricity, matter and reactions.' },
];

const GOALS = [
  'Understand the concept from the beginning',
  'Prepare for a test or exam',
  'Work through practice questions',
  'Explore it with an interactive simulation',
] as const;

export default function CapsOnboardingPage() {
  const router = useRouter();
  const [grade, setGrade] = useState<Grade>(9);
  const [subject, setSubject] = useState<CapsSubject>('mathematics');
  const [topicId, setTopicId] = useState('');
  const [goal, setGoal] = useState<string>(GOALS[0]);

  const topics = useMemo(
    () => CAPS_SOWETO_PILOT.filter((topic) => topic.subjects.includes(subject) && topic.grades.includes(grade)),
    [grade, subject],
  );

  useEffect(() => {
    setTopicId(topics[0]?.id ?? '');
  }, [topics]);

  const selectedTopic = topics.find((topic) => topic.id === topicId);

  const startClass = () => {
    if (!selectedTopic) return;
    const subjectLabel = subject === 'mathematics' ? 'Mathematics' : 'Physical Sciences';
    const requirement = [
      `Grade ${grade} ${subjectLabel}`,
      `Topic: ${selectedTopic.label}`,
      `Learning goal: ${goal}`,
      'Curriculum context: CAPS-aligned Soweto pilot.',
      'Teach step-by-step, check understanding frequently, use a concrete South African example where helpful, and finish with a short formative activity.',
    ].join('\n');

    try {
      localStorage.setItem('requirementDraft', requirement);
      localStorage.setItem('interactiveModeEnabled', 'true');
      localStorage.setItem('nahaCapsLearnerContext', JSON.stringify({ grade, subject, topicId: selectedTopic.id, goal, version: 1 }));
    } catch {
      // The classroom can still be opened if browser storage is unavailable.
    }
    router.push('/');
  };

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-4xl items-center">
        <section className="w-full rounded-3xl border bg-card p-6 shadow-sm sm:p-10">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10"><GraduationCap className="size-6 text-primary" /></div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">NahaLabs Online Academy</p>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Start your classroom</h1>
            </div>
          </div>
          <p className="mb-8 max-w-2xl text-muted-foreground">Choose your grade, subject and goal. We&apos;ll open an interactive classroom with a teacher, classmates, activities and a whiteboard — starting from the CAPS pilot curriculum.</p>

          <div className="grid gap-8 lg:grid-cols-[1.15fr_.85fr]">
            <div className="space-y-7">
              <div>
                <label className="mb-3 block text-sm font-medium">1. Grade</label>
                <div className="grid grid-cols-5 gap-2">
                  {GRADES.map((item) => <button key={item} type="button" onClick={() => setGrade(item)} className={cn('rounded-xl border px-3 py-3 text-sm font-medium transition', grade === item ? 'border-primary bg-primary/10 text-primary' : 'hover:bg-muted')}>Grade {item}</button>)}
                </div>
              </div>
              <div>
                <label className="mb-3 block text-sm font-medium">2. Subject</label>
                <div className="grid gap-3 sm:grid-cols-2">
                  {SUBJECTS.map((item) => <button key={item.id} type="button" onClick={() => setSubject(item.id)} className={cn('rounded-2xl border p-4 text-left transition', subject === item.id ? 'border-primary bg-primary/10' : 'hover:bg-muted')}><div className="mb-1 flex items-center gap-2 font-medium"><BookOpen className="size-4" />{item.label}</div><p className="text-sm text-muted-foreground">{item.description}</p></button>)}
                </div>
              </div>
              <div>
                <label htmlFor="caps-topic" className="mb-3 block text-sm font-medium">3. Topic</label>
                <select id="caps-topic" value={topicId} onChange={(event) => setTopicId(event.target.value)} className="w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30">
                  {topics.length === 0 ? <option value="">No pilot topic yet</option> : topics.map((topic) => <option key={topic.id} value={topic.id}>{topic.label}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-3 block text-sm font-medium">4. What do you want to do?</label>
                <div className="grid gap-2">{GOALS.map((item) => <button key={item} type="button" onClick={() => setGoal(item)} className={cn('rounded-xl border px-4 py-3 text-left text-sm transition', goal === item ? 'border-primary bg-primary/10 text-primary' : 'hover:bg-muted')}>{item}</button>)}</div>
              </div>
            </div>

            <aside className="rounded-2xl border bg-muted/40 p-5">
              <div className="mb-5 flex size-10 items-center justify-center rounded-xl bg-background"><Sparkles className="size-5" /></div>
              <p className="mb-1 text-sm font-medium text-muted-foreground">Your classroom</p>
              <h2 className="text-xl font-semibold">Grade {grade} {subject === 'mathematics' ? 'Mathematics' : 'Physical Sciences'}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{selectedTopic?.label ?? 'Choose a topic'}</p>
              <div className="mt-5 space-y-2 text-sm text-muted-foreground"><p>✓ Step-by-step teaching</p><p>✓ Interactive learning</p><p>✓ Practice and formative checks</p><p>✓ Classmate discussion</p></div>
              <Button className="mt-7 w-full" size="lg" onClick={startClass} disabled={!selectedTopic}>Start interactive class<ArrowRight className="ml-2 size-4" /></Button>
            </aside>
          </div>
        </section>
      </div>
    </main>
  );
}
