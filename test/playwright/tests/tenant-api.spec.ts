import { test, expect } from '@playwright/test';

let apiKey: string;
const uniqueEmail = `api-test-${Date.now()}@playwright.com`;

test.describe('Tenant API', () => {
  test('should sign up via API and get an API key', async ({ request }) => {
    const response = await request.post('/api/signup', {
      data: {
        organizationName: 'API Test Clinic',
        email: uniqueEmail,
        password: 'password123',
        firstName: 'API',
        lastName: 'Tester',
      },
    });

    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.apiKey).toBeTruthy();
    expect(body.apiKey).toMatch(/^oet_/);
    expect(body.tenant.name).toBe('API Test Clinic');
    expect(body.tenant.plan).toBe('free');
    apiKey = body.apiKey;
  });

  test('should get tenant info with API key', async ({ request }) => {
    const response = await request.get('/api/tenant', {
      headers: { 'x-api-key': apiKey },
    });

    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.name).toBe('API Test Clinic');
    expect(body.plan).toBe('free');
    expect(body.status).toBe('active');
    expect(body.limits).toBeDefined();
    expect(body.limits.dailyApiLimit).toBe(100);
  });

  test('should create and list API keys', async ({ request }) => {
    // Create
    const createRes = await request.post('/api/tenant/api-keys', {
      headers: { 'x-api-key': apiKey },
      data: {
        name: 'Test Key',
        scopes: ['patient:read', 'fhir:read'],
      },
    });
    expect(createRes.ok()).toBeTruthy();
    const created = await createRes.json();
    expect(created.key).toMatch(/^oet_/);
    expect(created.name).toBe('Test Key');

    // List
    const listRes = await request.get('/api/tenant/api-keys', {
      headers: { 'x-api-key': apiKey },
    });
    expect(listRes.ok()).toBeTruthy();
    const keys = await listRes.json();
    expect(keys.length).toBeGreaterThanOrEqual(2); // Default + Test Key
  });

  test('should reject requests without API key', async ({ request }) => {
    const response = await request.get('/api/tenant');
    expect(response.status()).toBe(401);
  });

  test('should reject requests with invalid API key', async ({ request }) => {
    const response = await request.get('/api/tenant', {
      headers: { 'x-api-key': 'oet_invalid_key' },
    });
    expect(response.status()).toBe(401);
  });

  test('should get usage stats', async ({ request }) => {
    const response = await request.get('/api/tenant/usage', {
      headers: { 'x-api-key': apiKey },
    });
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.apiCalls).toBeDefined();
    expect(body.hl7Messages).toBeDefined();
    expect(body.fhirQueries).toBeDefined();
    expect(body.simulations).toBeDefined();
  });
});
