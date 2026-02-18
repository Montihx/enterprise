import { test, expect } from '@playwright/test';

test('register new user', async ({ page }) => {
  await page.goto('/register');
  await page.fill('input[name="email"]', 'testuser@example.com');
  await page.fill('input[name="username"]', 'tester123');
  await page.fill('input[name="password"]', 'Password123!');
  await page.click('button[type="submit"]');
  // Expect redirect to login or presence of Sign in link
  await page.waitForURL('**/login');
  await expect(page).toHaveURL(/.*login.*/);
});
