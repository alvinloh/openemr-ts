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
    const ts = Date.now();

    await page.goto('/');
    await page.locator('#loginScreen a:has-text("Sign up")').click();

    await page.fill('#signupOrg', `Playwright Clinic ${ts}`);
    await page.fill('#signupFirstName', 'Test');
    await page.fill('#signupLastName', 'User');
    await page.fill('#signupEmail', `pw-test-${ts}@playwright.com`);
    await page.fill('#signupPassword', 'password123');
    await page.click('#signupForm button[type="submit"]');

    await expect(page.locator('#signupSuccess')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('#signupSuccess')).toContainText('Account created');
    await expect(page.locator('#signupSuccess')).toContainText('oet_');
  });

  test('should show error on duplicate email signup', async ({ page, request }) => {
    const ts = Date.now();
    const email = `dup-test-${ts}@playwright.com`;

    // Create account via API first
    await request.post('/api/signup', {
      data: {
        organizationName: `Dup Test ${ts}`,
        email,
        password: 'password123',
        firstName: 'Dup',
        lastName: 'Test',
      },
    });

    // Try same email in UI
    await page.goto('/');
    await page.locator('#loginScreen a:has-text("Sign up")').click();
    await page.fill('#signupOrg', `Dup Test Again ${ts}`);
    await page.fill('#signupFirstName', 'Dup');
    await page.fill('#signupLastName', 'Test');
    await page.fill('#signupEmail', email);
    await page.fill('#signupPassword', 'password123');
    await page.click('#signupForm button[type="submit"]');

    await expect(page.locator('#signupError')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('#signupError')).toContainText('already exists');
  });

  test('should navigate back to login from signup', async ({ page }) => {
    await page.goto('/');
    await page.locator('#loginScreen a:has-text("Sign up")').click();
    await expect(page.locator('#signupScreen')).toBeVisible();
    await page.locator('#signupScreen a:has-text("Sign in")').click();
    await expect(page.locator('#loginScreen')).toBeVisible();
  });
});
