import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';

// Structural checks for the gach.work replica. Assertions use roles and text
// rather than pixels, so they are unaffected by font loading or animations.
test.describe('gach.work replica chrome', () => {
  test('header, nav menu and footer appear on every page', async ({ page }) => {
    const routes: Array<[string, string]> = [
      ['/', 'Home'],
      ['/skill', 'Technical Skill'],
      ['/framework', 'Framework'],
      ['/resume', 'Resume'],
      ['/portfolio', 'Portfolio'],
    ];

    for (const [route, active] of routes) {
      await page.goto(`${BASE}${route}`);

      await expect(page.getByRole('heading', { level: 1, name: 'Tech Portfolio', exact: true })).toBeVisible();

      const nav = page.getByRole('navigation', { name: 'Main navigation' });
      for (const label of ['Home', 'Technical Skill', 'Framework', 'Resume', 'Portfolio']) {
        await expect(nav.getByRole('link', { name: label })).toBeVisible();
      }
      await expect(nav.getByRole('link', { name: active })).toHaveAttribute('aria-current', 'page');

      await expect(page.getByText(/^Copyright \d{4}/)).toBeVisible();
      await expect(page.getByRole('link', { name: 'BootstrapMade' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Open chat' })).toBeVisible();
    }
  });

  test('home hero shows the name, typed role line and social links', async ({ page }) => {
    await page.goto(`${BASE}/`);
    await expect(page.getByRole('heading', { level: 2, name: /Jordan Lee/ })).toBeVisible();
    await expect(page.getByText(/AI\/GenAI Product/)).toBeVisible();
    await expect(page.locator('.typed-cursor')).toHaveCount(1);

    const hero = page.locator('.hero');
    await expect(hero.getByRole('link', { name: 'LinkedIn' })).toBeVisible();
    await expect(hero.getByRole('link', { name: 'GitHub' })).toBeVisible();
  });

  test('typewriter keeps typing', async ({ page }) => {
    await page.goto(`${BASE}/`);
    const typed = page.locator('.typed');
    const first = (await typed.innerText()).replace('|', '');
    await page.waitForTimeout(1500);
    const later = (await typed.innerText()).replace('|', '');
    expect(first).not.toEqual(later);
  });

  test('header becomes translucent and the scroll-top appears after scrolling', async ({
    page,
  }) => {
    await page.goto(`${BASE}/`);
    await expect(page.locator('.site-header')).not.toHaveClass(/is-scrolled/);

    await page.evaluate(() => window.scrollTo(0, 400));
    await expect(page.locator('.site-header')).toHaveClass(/is-scrolled/);
    await expect(page.locator('.scroll-top')).toHaveClass(/is-visible/);
  });
});

test.describe('replica page sections', () => {
  test('technical skill lists groups of feature tiles', async ({ page }) => {
    await page.goto(`${BASE}/skill`);
    await expect(page.getByRole('heading', { level: 1, name: 'Technical Skill', exact: true })).toBeVisible();

    const titles = page.locator('.section-title h2');
    await expect(titles).toHaveCount(3);
    await expect(titles.nth(0)).toHaveText('Tech Stack');

    expect(await page.locator('.features-item').count()).toBeGreaterThan(20);
    await expect(page.getByRole('heading', { level: 3, name: 'ReactJS' })).toBeVisible();
  });

  test('framework lists service cards with accent icon tiles', async ({ page }) => {
    await page.goto(`${BASE}/framework`);
    await expect(page.getByRole('heading', { level: 1, name: 'Framework', exact: true })).toBeVisible();
    expect(await page.locator('.service-item').count()).toBeGreaterThanOrEqual(10);
    await expect(page.getByRole('heading', { level: 3, name: 'SWOT Analysis' })).toBeVisible();
  });

  test('resume lists both timeline columns', async ({ page }) => {
    await page.goto(`${BASE}/resume`);
    await expect(page.getByRole('heading', { level: 3, name: 'Summary' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 3, name: 'Professional Experience' })).toBeVisible();
    expect(await page.locator('.resume-item').count()).toBeGreaterThanOrEqual(7);
  });

  test('portfolio filters narrow the project grid', async ({ page }) => {
    await page.goto(`${BASE}/portfolio`);
    await expect(page.getByRole('heading', { level: 1, name: 'Portfolio', exact: true })).toBeVisible();

    const all = await page.locator('.portfolio-content').count();
    expect(all).toBeGreaterThan(0);

    await page.getByRole('button', { name: 'Management' }).click();
    const management = await page.locator('.portfolio-content').count();
    await page.getByRole('button', { name: 'Application' }).click();
    const application = await page.locator('.portfolio-content').count();

    expect(management).toBeGreaterThan(0);
    expect(application).toBeGreaterThan(0);
    expect(management + application).toEqual(all);
  });
});
