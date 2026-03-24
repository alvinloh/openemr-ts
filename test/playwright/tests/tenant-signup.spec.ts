import { test, expect } from '@playwright/test';

test.describe('Tenant Signup', () => {
  test('should show signup link on login page', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#loginScreen')).toBeVisible();
    const signupLink = page.locator('#loginScreen a:has-text("Sign up")');
    await expect(signupLink).toBeVisible();
  });

  test('should navigate to signup form', async ({ page }) => {
    await page.goto('/');
    await page.locator('#loginScreen a:has-text("Sign up")').click();
    await expect(page.locator('#signupScreen')).toBeVisible();
    await expect(page.locator('#signupOrg')).toBeVisible();
    await expect(page.locator('#signupEmail')).toBeVisible();
    await expect(page.locator('#signupPassword')).toBeVisible();
  });

  test('should create a tenant account via signup form', async ({ page }) => {
    const uniqueEmail = `test-${Date.now()}@playwright.com`;

    await page.goto('/');
    await page.click('text=Sign up');

    await page.fill('#signupOrg', 'Playwright Clinic');
    await page.fill('#signupFirstName', 'Test');
    await page.fill('#signupLastName', 'User');
    await page.fill('#signupEmail', uniqueEmail);
    await page.fill('#signupPassword', 'password123');
    await page.click('#signupForm button[type="submit"]');

    // Should show success with API key
    await expect(page.locator('#signupSuccess')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('#signupSuccess')).toContainText('Account created');
    await expect(page.locator('#signupSuccess')).toContainText('oet_');
  });

  test('should navigate back to login from signup', async ({ page }) => {
    await page.goto('/');
    await page.locator('#loginScreen a:has-text("Sign up")').click();
    await expect(page.locator('#signupScreen')).toBeVisible();
    await page.locator('#signupScreen a:has-text("Sign in")').click();
    await expect(page.locator('#loginScreen')).toBeVisible();
  });
});
