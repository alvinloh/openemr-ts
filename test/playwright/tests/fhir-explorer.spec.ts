import { test, expect } from '@playwright/test';

test.describe('FHIR Explorer', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.fill('#username', 'admin');
    await page.fill('#password', 'admin');
    await page.click('#loginForm button[type="submit"]');
    await expect(page.locator('#dashboard')).toBeVisible({ timeout: 5000 });
    await page.click('[data-page="fhir"]');
    await expect(page.locator('#page-fhir')).toBeVisible();
  });

  test('should query CapabilityStatement', async ({ page }) => {
    await page.selectOption('#fhirResource', 'metadata');
    await page.click('button:has-text("Query")');
    await expect(page.locator('#fhirResult')).toContainText('CapabilityStatement', { timeout: 5000 });
    await expect(page.locator('#fhirResult')).toContainText('4.0.1');
  });

  test('should query Patient resource', async ({ page }) => {
    await page.selectOption('#fhirResource', 'Patient');
    await page.click('button:has-text("Query")');
    await expect(page.locator('#fhirResult')).toContainText('Bundle', { timeout: 5000 });
    await expect(page.locator('#fhirResult')).toContainText('searchset');
  });

  test('should query with search params', async ({ page }) => {
    await page.selectOption('#fhirResource', 'Patient');
    await page.fill('#fhirParams', 'name=Doe');
    await page.click('button:has-text("Query")');
    await expect(page.locator('#fhirResult')).toContainText('Bundle', { timeout: 5000 });
  });
});
