import { join } from 'node:path'
import { expect, type Page, test } from '@playwright/test'

async function sample(page: Page) {
  await page.goto('/welcome/')
  await page.getByRole('button', { name: 'Explore with sample data' }).click()
  await page.waitForURL('/')
  // Stores persist to IndexedDB after a short debounce; let it land before hard navigations.
  await page.waitForTimeout(1200)
}

test('first run goes to Welcome, and onboarding reaches Home', async ({ page }) => {
  await page.goto('/')
  await page.waitForURL('**/welcome/')
  await page.getByRole('link', { name: 'Create your profile' }).click()
  await page.getByLabel('Name').fill('Asha Rao')
  await page.getByRole('button', { name: 'Continue' }).click()
  await page.waitForURL('**/signup/lock/')
  await page.getByRole('button', { name: 'Skip for now' }).click()
  await page.waitForURL('**/onboarding/body/')
  await page.getByRole('button', { name: 'Female' }).click()
  await page.getByRole('button', { name: 'Next: how you eat' }).click()
  await page.waitForURL('**/onboarding/eating/')
  await page
    .getByRole('radio', { name: /Vegetarian/ })
    .first()
    .click()
  await page.getByRole('button', { name: 'Set your target physique' }).click()
  await page.waitForURL('**/goal/**')
  await page.getByRole('radio', { name: /Lean muscle/ }).click()
  await page.getByRole('button', { name: 'Save targets' }).click()
  await page.waitForURL('**/onboarding/training/')
  await page.getByRole('button', { name: 'Continue' }).click()
  await page.getByRole('radio', { name: /Home dumbbells/ }).click()
  await page.getByRole('button', { name: 'Continue' }).click()
  await page.getByRole('button', { name: 'Continue' }).click()
  await page.getByRole('button', { name: 'Build my plan' }).click()
  await page.waitForURL('**/plan/preview/**')
  await page.getByRole('button', { name: 'Save plan' }).click()
  await page.waitForURL('/')
  await expect(page.getByRole('heading', { name: /Asha/ })).toBeVisible()
  await expect(page.getByLabel('Energy balance')).toBeVisible()
})

test('Home shows real numbers from sample data', async ({ page }) => {
  await sample(page)
  await expect(page.getByText('kcal net balance')).toBeVisible()
  await expect(page.getByText('Readiness')).toBeVisible()
  await page.getByRole('button', { name: '7D' }).click()
  await expect(page.getByText('avg kcal / day')).toBeVisible()
})

test('Scan a sample plate, review and log it to a meal', async ({ page }) => {
  await sample(page)
  await page.goto('/scan/?slot=dinner')
  await page.getByRole('button', { name: 'Try a sample plate' }).click()
  await expect(page.getByLabel('Scan result')).toContainText('821')
  await page.getByRole('button', { name: /Review/ }).click()
  await page.waitForURL('**/meal/review/')
  await page.getByRole('button', { name: 'More Roti' }).click()
  await expect(page.getByText('+1 added')).toBeVisible()
  await page.getByRole('button', { name: /1 katori dahi/ }).click()
  await page.getByRole('button', { name: /Log to dinner/ }).click()
  await page.waitForURL('**/food/')
  const dinner = page.getByRole('link', { name: /Dinner/ })
  await expect(dinner).toContainText(/thali · scanned/i)
  await expect(dinner).toContainText('+1 dahi later')
})

test('Quick add understands a sentence offline and adds it', async ({ page }) => {
  await sample(page)
  await page.goto('/food/')
  await page.getByRole('link', { name: 'Add food to dinner' }).click()
  await page.waitForURL('**/meal/add/**')
  await page.getByPlaceholder(/2 more roti/).fill('2 roti and a katori of dahi')
  await page.getByRole('button', { name: 'Understand this sentence' }).click()
  await expect(page.getByText(/2 foods · 3 portions/)).toBeVisible()
  await page.getByRole('button', { name: 'Add to dinner' }).click()
  await page.waitForURL('**/food/')
  await expect(page.getByRole('link', { name: /Dinner/ })).toContainText(/Roti/)
})

test('Water tracker adds and removes glasses', async ({ page }) => {
  await sample(page)
  await page.goto('/food/')
  const water = page.getByLabel('Water')
  await expect(water).toContainText('2.25')
  await page.getByRole('button', { name: /250 ml glass/ }).click()
  await expect(water).toContainText('2.50')
  await page.getByRole('button', { name: 'Remove one glass' }).click()
  await expect(water).toContainText('2.25')
})

test('Run a workout from the plan and save it', async ({ page }) => {
  await sample(page)
  await page.goto('/plan/')
  const today = page.getByLabel('Day routine')
  const start = today.getByRole('button', { name: /Start session|Resume session/ })
  if (!(await start.isVisible())) {
    await page.getByRole('button', { name: 'Routine options' }).click()
    await page.getByRole('button', { name: /Change routine|Add a routine/ }).click()
    await page.getByRole('button', { name: /Push Day/ }).click()
    await page
      .getByRole('button', { name: 'Close' })
      .first()
      .click({ trial: true })
      .catch(() => {})
  }
  await page.goto('/plan/')
  await page.getByRole('button', { name: /Start session|Resume session/ }).click()
  await page.waitForURL('**/workout/')
  await page.getByRole('button', { name: /Mark set 1 done/ }).click()
  await expect(page.getByText('REST', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Skip' }).click()
  await page.getByRole('button', { name: 'Finish' }).click()
  await page.getByRole('button', { name: 'Finish and save' }).click()
  await page.waitForURL('**/workout/summary/**')
  await expect(page.getByText('Session saved')).toBeVisible()
})

test('Coach demo thread renders with action chips', async ({ page }) => {
  await sample(page)
  await page.goto('/coach/chat/?id=demo-dinner')
  await expect(page.getByText('How can I help today?')).toBeVisible()
  await page.getByRole('button', { name: /Log 1 scoop whey/ }).click()
  await expect(page.getByText(/Logged 1 × Whey/)).toBeVisible()
})

test('Asks for a day-one photo, saves it from the gallery, then compares', async ({ page }) => {
  await sample(page)
  await page.getByRole('link', { name: /Take your day-one photo/ }).click()
  await page.waitForURL('**/progress/photo/**')
  await expect(page.getByText('NO FLEX', { exact: true })).toBeVisible()
  const chooser = page.waitForEvent('filechooser')
  await page.getByRole('button', { name: 'Choose from gallery' }).click()
  await (await chooser).setFiles(join(__dirname, '../../../docs/banner.png'))
  await page.getByRole('button', { name: 'Save photo' }).click()
  await page.waitForURL('**/progress/')
  await expect(page.getByText(/Take your day-one photo/)).toHaveCount(0)
  await page.getByRole('link', { name: /Day one, .*Compare/ }).click()
  await expect(page.getByText(/This is your starting point/)).toBeVisible()
})

test('Every screen renders without errors', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  await sample(page)
  for (const r of [
    '/food/',
    '/plan/',
    '/stats/',
    '/recovery/',
    '/progress/',
    '/library/',
    '/coach/',
    '/goal/',
    '/settings/',
    '/settings/ai/',
    '/history/',
    '/routine/',
    '/exercise/guide/?ex=2330',
    '/coach/checkin/',
    '/progress/photo/',
    '/progress/compare/',
  ]) {
    await page.goto(r)
    await page.waitForTimeout(250)
  }
  expect(errors).toEqual([])
})
