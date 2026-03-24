import { test, expect } from '@playwright/test';

let apiKey: string;

test.describe.configure({ mode: 'serial' });

test.describe('Simulation API', () => {
  test('setup: create tenant', async ({ request }) => {
    const uniqueEmail = `sim-test-${Date.now()}@playwright.com`;
    const response = await request.post('/api/signup', {
      data: {
        organizationName: `Sim Test Clinic ${Date.now()}`,
        email: uniqueEmail,
        password: 'password123',
        firstName: 'Sim',
        lastName: 'Tester',
      },
    });
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    apiKey = body.apiKey;
  });

  test('should list available presets', async ({ request }) => {
    const response = await request.get('/api/simulate/presets');
    expect(response.ok()).toBeTruthy();
    const presets = await response.json();
    expect(presets['full-visit']).toBeDefined();
    expect(presets['lab-only']).toBeDefined();
    expect(presets['admit-discharge']).toBeDefined();
    expect(presets['pharmacy']).toBeDefined();
    expect(presets['referral']).toBeDefined();
  });

  test('should run a lab-only simulation', async ({ request }) => {
    const response = await request.post('/api/simulate', {
      headers: { 'x-api-key': apiKey },
      data: {
        scenario: 'lab-only',
        patientCount: 2,
        labPanels: ['CBC'],
      },
    });

    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.simulationId).toBeTruthy();
    expect(body.patientsCreated).toBe(2);
    expect(body.stepsExecuted).toBeGreaterThan(0);
    expect(body.hl7MessagesGenerated).toBeGreaterThan(0);

    // Verify steps contain HL7 messages
    const registerSteps = body.steps.filter((s: any) => s.step === 'register');
    expect(registerSteps.length).toBe(2);
    for (const step of registerSteps) {
      expect(step.hl7MessageType).toBe('ADT^A04');
      expect(step.hl7Message).toContain('MSH|');
      expect(step.hl7Message).toContain('ADT^A04');
      expect(step.patientMrn).toMatch(/^SIM-/);
    }

    const labSteps = body.steps.filter((s: any) => s.step === 'order-labs');
    expect(labSteps.length).toBe(2);
    for (const step of labSteps) {
      expect(step.hl7MessageType).toBe('ORM^O01');
      expect(step.hl7Message).toContain('ORM^O01');
    }

    const resultSteps = body.steps.filter((s: any) => s.step === 'receive-results');
    expect(resultSteps.length).toBe(2);
    for (const step of resultSteps) {
      expect(step.hl7MessageType).toBe('ORU^R01');
      expect(step.hl7Message).toContain('OBX|');
    }
  });

  test('should run simulation against an existing patient', async ({ request }) => {
    // Create a patient first
    const patientRes = await request.post('/api/patient', {
      headers: { 'x-api-key': apiKey },
      data: {
        firstName: 'Existing',
        lastName: 'Patient',
        dateOfBirth: '1990-05-15',
        sex: 'Female',
      },
    });
    expect(patientRes.ok()).toBeTruthy();
    const patient = await patientRes.json();
    const patientUuid = patient.data.uuid;

    // Run admit-discharge on this patient
    const simRes = await request.post('/api/simulate', {
      headers: { 'x-api-key': apiKey },
      data: {
        scenario: 'admit-discharge',
        patientCount: 1,
        patientUuid: patientUuid,
      },
    });

    expect(simRes.ok()).toBeTruthy();
    const sim = await simRes.json();

    // Should NOT have a register step (patient already exists)
    const registerSteps = sim.steps.filter((s: any) => s.step === 'register');
    expect(registerSteps.length).toBe(0);

    // Should have checkin and discharge
    const checkinSteps = sim.steps.filter((s: any) => s.step === 'checkin');
    expect(checkinSteps.length).toBe(1);
    expect(checkinSteps[0].hl7MessageType).toBe('ADT^A01');

    const dischargeSteps = sim.steps.filter((s: any) => s.step === 'discharge');
    expect(dischargeSteps.length).toBe(1);
    expect(dischargeSteps[0].hl7MessageType).toBe('ADT^A03');

    // Patient MRN should NOT be SIM-*
    expect(checkinSteps[0].patientMrn).not.toMatch(/^SIM-/);
  });

  test('should clean up simulated patients', async ({ request }) => {
    const response = await request.delete('/api/simulate/cleanup', {
      headers: { 'x-api-key': apiKey },
    });

    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.deletedPatients).toBeGreaterThanOrEqual(0);
  });
});
