import { test, expect } from '../fixtures/base';

const CAPS_CONTEXT_KEY = 'nahaCapsLearnerContext';
const REQUIREMENT_KEY = 'requirementDraft';
const INTERACTIVE_KEY = 'interactiveModeEnabled';
const PROGRESS_KEY = 'nahaCapsPilotProgress';

const SETTINGS_STORAGE = JSON.stringify({ state: { sidebarCollapsed: false }, version: 0 });

test.describe('CAPS pilot learner flow', () => {
  test.beforeEach(async ({ page, mockApi }) => {
    await page.addInitScript((settings) => {
      localStorage.setItem('maic:account:settings-storage', settings);
      localStorage.removeItem('nahaCapsRevisitContext');
      localStorage.removeItem(CAPS_CONTEXT_KEY);
      localStorage.removeItem(REQUIREMENT_KEY);
      localStorage.removeItem(INTERACTIVE_KEY);
      localStorage.removeItem(PROGRESS_KEY);
    }, SETTINGS_STORAGE);

    await mockApi.setupGenerationMocks();
  });

  test('selects a CAPS class and carries its learning context into the classroom', async ({ page }) => {
    await page.goto('/caps');

    await expect(page.getByRole('heading', { name: 'Start your classroom' })).toBeVisible();
    await page.getByRole('button', { name: 'Grade 10' }).click();
    await page.getByRole('button', { name: 'Physical Sciences' }).click();
    await page.locator('#caps-topic').selectOption('physics-mechanics');
    await page.getByRole('button', { name: 'Explore it with an interactive simulation' }).click();

    await expect(page.getByRole('heading', { name: 'Grade 10 Physical Sciences' })).toBeVisible();
    await expect(page.getByText('Mechanics', { exact: true })).toBeVisible();

    await page.getByRole('button', { name: 'Start class' }).click();
    await page.waitForURL(/\/$/);

    const stored = await page.evaluate((keys) => ({
      context: localStorage.getItem(keys.context),
      requirement: localStorage.getItem(keys.requirement),
      interactive: localStorage.getItem(keys.interactive),
      progress: localStorage.getItem(keys.progress),
    }), {
      context: CAPS_CONTEXT_KEY,
      requirement: REQUIREMENT_KEY,
      interactive: INTERACTIVE_KEY,
      progress: PROGRESS_KEY,
    });

    expect(stored.context).toBeTruthy();
    expect(JSON.parse(stored.context!)).toMatchObject({
      grade: 10,
      subject: 'physical-sciences',
      topicId: 'physics-mechanics',
      goal: 'simulate',
      version: 1,
    });
    expect(stored.requirement).toContain('Grade 10');
    expect(stored.requirement).toContain('Physical Sciences');
    expect(stored.requirement).toContain('Mechanics');
    expect(stored.requirement).toContain('activity-completed');
    expect(stored.interactive).toBe('true');

    expect(stored.progress).toBeTruthy();
    expect(JSON.parse(stored.progress!)).toMatchObject({
      version: 1,
      topics: {
        'physics-mechanics': {
          topicId: 'physics-mechanics',
          activitiesCompleted: 0,
          quizzesCompleted: 0,
        },
      },
    });
  });

  test('progress page exposes the current topic and remains local-only', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem(CAPS_CONTEXT_KEY, JSON.stringify({
        grade: 11,
        subject: 'mathematics',
        topicId: 'math-functions',
        goal: 'practice',
        version: 1,
      }));
      localStorage.setItem(PROGRESS_KEY, JSON.stringify({
        version: 1,
        topics: {
          'math-functions': {
            topicId: 'math-functions',
            activitiesCompleted: 2,
            quizzesCompleted: 1,
            latestQuizScorePercent: 62,
            bestQuizScorePercent: 70,
          },
        },
      }));
    });

    await page.goto('/progress');

    await expect(page.getByText('Grade 11 Mathematics')).toBeVisible();
    await expect(page.getByText('Functions and graphs')).toBeVisible();
    await expect(page.getByText('Developing')).toBeVisible();
    await expect(page.getByText(/browser-local/i)).toBeVisible();
    await expect(page.getByText(/no name, school, or contact details/i)).toBeVisible();
  });
});
