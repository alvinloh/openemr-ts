import { test, expect } from '@playwright/test';

let apiKey: string;

test.describe.configure({ mode: 'serial' });

test.describe('Patient Search', () => {
  test('setup: create tenant and patient', async ({ request }) => {
    const ts = Date.now();
    const signupRes = await request.post('/api/signup', {
      data: {
        organizationName: `Search Test ${ts}`,
        email: `search-test-${ts}@playwright.com`,
        password: 'password123',
        firstName: 'Search',
        lastName: 'Tester',
      },
    });
    expect(signupRes.ok()).toBeTruthy();
    const body = await signupRes.json();
    apiKey = body.apiKey;

    const patientRes = await request.post('/api/patient', {
      headers: { 'x-api-key': apiKey },
      data: {
        firstName: 'Jane',
        lastName: 'Smithson',
        dateOfBirth: '1985-03-15',
        sex: 'Female',
      },
    });
    expect(patientRes.ok()).toBeTruthy();
  });

  test('should find patient by first name', async ({ request }) => {
    const response = await request.get('/api/patient?search=Jane', {
      headers: { 'x-api-key': apiKey },
    });
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.data.length).toBeGreaterThan(0);
    expect(body.data.some((p: any) => p.firstName === 'Jane')).toBeTruthy();
  });

  test('should find patient by last name', async ({ request }) => {
    const response = await request.get('/api/patient?search=Smithson', {
      headers: { 'x-api-key': apiKey },
    });
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.data.length).toBeGreaterThan(0);
    expect(body.data.some((p: any) => p.lastName === 'Smithson')).toBeTruthy();
  });

  test('should find patient by full name (space-split search)', async ({ request }) => {
    const response = await request.get('/api/patient?search=Jane%20Smithson', {
      headers: { 'x-api-key': apiKey },
    });
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.data.length).toBeGreaterThan(0);
  });

  test('should find patient by reversed full name', async ({ request }) => {
    const response = await request.get('/api/patient?search=Smithson%20Jane', {
      headers: { 'x-api-key': apiKey },
    });
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.data.length).toBeGreaterThan(0);
  });

  test('should return empty for non-existent patient', async ({ request }) => {
    const response = await request.get('/api/patient?search=Zzzznonexistent', {
      headers: { 'x-api-key': apiKey },
    });
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.data.length).toBe(0);
  });
});
