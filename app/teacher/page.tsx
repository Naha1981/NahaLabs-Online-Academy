'use client';

import { useEffect, useState } from 'react';
import { BookOpenCheck, ShieldCheck, Users, Wifi } from 'lucide-react';
import { Button } from '@/components/ui/button';

const SETTINGS_KEY = 'nahaCapsTeacherSettings';

type TeacherSettings = {
  pilotMode: boolean;
  requireInteractive: boolean;
  showLocalExamples: boolean;
  dataSaver: boolean;
};

const DEFAULTS: TeacherSettings = {
  pilotMode: true,
  requireInteractive: true,
  showLocalExamples: true,
  dataSaver: true,
};

export default function TeacherPage() {
  const [settings, setSettings] = useState<TeacherSettings>(DEFAULTS);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (raw) setSettings({ ...DEFAULTS, ...(JSON.parse(raw) as Partial<TeacherSettings>) });
    } catch {
      // Defaults are safe if storage is unavailable.
    }
  }, []);

  const update = (key: keyof TeacherSettings) => {
    setSettings((current) => ({ ...current, [key]: !current[key] }));
    setSaved(false);
  };

  const save = () => {
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch { /* best effort */ }
    setSaved(true);
  };

  const controls: Array<{ key: keyof TeacherSettings; title: string; description: string }> = [
    { key: 'pilotMode', title: 'CAPS pilot mode', description: 'Keep classroom generation inside the reviewed Grade 8–12 Mathematics and Physical Sciences pilot catalog.' },
    { key: 'requireInteractive', title: 'Interactive classroom by default', description: 'Start lessons with activities, checks for understanding and interactive classroom elements.' },
    { key: 'showLocalExamples', title: 'Use South African examples', description: 'Prefer relevant local contexts when they improve understanding without making assumptions about a learner.' },
    { key: 'dataSaver', title: 'Data-saver mode', description: 'Prefer lightweight content and avoid unnecessary media for mobile and constrained connections.' },
  ];

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8">
          <p className="mb-2 text-sm text-muted-foreground">NahaLabs Online Academy · Pilot controls</p>
          <h1 className="text-3xl font-semibold tracking-tight">Teacher controls</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">Configure the learning experience for a pilot classroom. These controls are browser-local for now; authenticated school administration comes in the next phase.</p>
        </header>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border bg-card p-5"><BookOpenCheck className="mb-3 size-5" /><p className="font-medium">Curriculum guardrails</p><p className="mt-1 text-sm text-muted-foreground">Pilot catalog only</p></div>
          <div className="rounded-2xl border bg-card p-5"><ShieldCheck className="mb-3 size-5" /><p className="font-medium">Privacy first</p><p className="mt-1 text-sm text-muted-foreground">No learner identity required</p></div>
          <div className="rounded-2xl border bg-card p-5"><Wifi className="mb-3 size-5" /><p className="font-medium">Mobile ready</p><p className="mt-1 text-sm text-muted-foreground">Data-saver controls</p></div>
        </div>

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
          <div className="mt-6 flex items-center justify-between gap-4 border-t pt-5"><span className="text-sm text-muted-foreground">{saved ? 'Settings saved on this device.' : 'Changes are not saved until you choose Save.'}</span><Button onClick={save}>Save controls</Button></div>
        </section>
      </div>
    </main>
  );
}
