import { test, expect } from '@playwright/test';

test.describe('Login', () => {
  test('should show login form', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#loginScreen')).toBeVisible();
    await expect(page.locator('#username')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
  });

  test('should login with valid credentials', async ({ page }) => {
    await page.goto('/');
    await page.fill('#username', 'admin');
    await page.fill('#password', 'admin');
    await page.click('#loginForm button[type="submit"]');

    // Should show dashboard
    await expect(page.locator('#dashboard')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('#currentUser')).toContainText('Administrator');
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/');
    await page.fill('#username', 'admin');
    await page.fill('#password', 'wrongpassword');
    await page.click('#loginForm button[type="submit"]');

    await expect(page.locator('#loginError')).toBeVisible({ timeout: 3000 });
    await expect(page.locator('#loginError')).toContainText('Invalid credentials');
  });
});
