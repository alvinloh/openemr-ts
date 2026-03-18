import { test, expect } from '@playwright/test';

test.describe('Patient Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.fill('#username', 'admin');
    await page.fill('#password', 'admin');
    await page.click('#loginForm button[type="submit"]');
    await expect(page.locator('#dashboard')).toBeVisible({ timeout: 5000 });
  });

  test('should navigate to patients page', async ({ page }) => {
    await page.click('[data-page="patients"]');
    await expect(page.locator('#page-patients')).toBeVisible();
    await expect(page.locator('#patientSearchInput')).toBeVisible();
  });

  test('should create a new patient', async ({ page }) => {
    await page.click('[data-page="patients"]');
    await page.click('button:has-text("New Patient")');
    await expect(page.locator('#newPatientModal')).toBeVisible();

    await page.fill('#newPatientModal input[name="firstName"]', 'Playwright');
    await page.fill('#newPatientModal input[name="lastName"]', 'TestUser');
    await page.fill('#newPatientModal input[name="dateOfBirth"]', '1995-08-20');
    await page.selectOption('#newPatientModal select[name="sex"]', 'Female');
    await page.fill('#newPatientModal input[name="phoneCell"]', '555-PW01');

    await page.click('#newPatientModal button:has-text("Create Patient")');
    await expect(page.locator('#newPatientModal')).not.toBeVisible({ timeout: 3000 });

    // Verify patient appears in list
    await page.fill('#patientSearchInput', 'Playwright');
    await page.click('#page-patients .input-group-append button');
    await expect(page.locator('#patientList')).toContainText('Playwright', { timeout: 3000 });
  });

  test('should view patient detail', async ({ page }) => {
    await page.click('[data-page="patients"]');
    await expect(page.locator('#page-patients')).toBeVisible();

    // Click first patient's View button
    const viewButton = page.locator('#patientList button:has-text("View")').first();
    if (await viewButton.isVisible()) {
      await viewButton.click();
      await expect(page.locator('#page-patient-detail')).toBeVisible({ timeout: 3000 });
      await expect(page.locator('#patientDetailName')).not.toBeEmpty();
    }
  });

  test('should show dashboard stats', async ({ page }) => {
    await expect(page.locator('#statPatients')).not.toHaveText('-', { timeout: 5000 });
  });
});
