import { test, expect, setupGuest } from './support/fixtures'

test.describe('Authentication', () => {
  test('guests are redirected to the login screen', async ({ page }) => {
    await setupGuest(page)
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login$/)
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()
  })

  test('a user can sign in and land on the dashboard', async ({ page }) => {
    await setupGuest(page)
    await page.goto('/login')

    await page.getByLabel('Email').fill('jordan@diaz.dev')
    await page.getByLabel('Password').fill('supersecret')
    await page.getByRole('button', { name: 'Sign in', exact: true }).click()

    await expect(page).toHaveURL(/\/dashboard$/)
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
  })

  test('the register screen creates a session', async ({ page }) => {
    await setupGuest(page)
    await page.goto('/register')

    await page.getByLabel('Full name').fill('New User')
    await page.getByLabel('Email').fill('new@user.dev')
    await page.getByLabel('Password').fill('supersecret')
    await page.getByRole('checkbox').check()
    await page.getByRole('button', { name: 'Create account' }).click()

    await expect(page).toHaveURL(/\/dashboard$/)
  })
})
