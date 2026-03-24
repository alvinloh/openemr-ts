import { test, expect } from '@playwright/test';

let apiKey: string;

test.describe.configure({ mode: 'serial' });

test.describe('FHIR API with API Key Auth', () => {
  test('setup: create tenant and simulate data', async ({ request }) => {
    const ts = Date.now();
    const signupRes = await request.post('/api/signup', {
      data: {
        organizationName: `FHIR Test ${ts}`,
        email: `fhir-test-${ts}@playwright.com`,
        password: 'password123',
        firstName: 'FHIR',
        lastName: 'Tester',
      },
    });
    expect(signupRes.ok()).toBeTruthy();
    const body = await signupRes.json();
    apiKey = body.apiKey;

    await request.post('/api/simulate', {
      headers: { 'x-api-key': apiKey },
      data: { scenario: 'lab-only', patientCount: 1, labPanels: ['CBC'] },
    });
  });

  test('should get CapabilityStatement', async ({ request }) => {
    const response = await request.get('/fhir/metadata', {
      headers: { 'x-api-key': apiKey },
    });
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.resourceType).toBe('CapabilityStatement');
  });

  test('should search FHIR Patient resources', async ({ request }) => {
    const response = await request.get('/fhir/Patient', {
      headers: { 'x-api-key': apiKey },
    });
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.resourceType).toBe('Bundle');
    expect(body.type).toBe('searchset');
    expect(body.total).toBeGreaterThan(0);
    expect(body.entry[0].resource.resourceType).toBe('Patient');
  });

  test('should reject FHIR requests without auth', async ({ request }) => {
    const response = await request.get('/fhir/Patient');
    expect(response.status()).toBe(401);
  });
});
