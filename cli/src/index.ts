#!/usr/bin/env node

import { Command } from 'commander';
import { saveConfig, loadConfig } from './config.js';
import { apiRequest } from './api.js';

const program = new Command();

program
  .name('openemr-ts')
  .description('OpenEMR-TS CLI — Healthcare interoperability from the command line')
  .version('0.1.0');

// ── Config ──

program
  .command('login')
  .description('Configure API connection')
  .option('--api-key <key>', 'API key')
  .option('--api-url <url>', 'API base URL (default: http://localhost:3000)')
  .action((opts) => {
    const updates: any = {};
    if (opts.apiKey) updates.apiKey = opts.apiKey;
    if (opts.apiUrl) updates.apiUrl = opts.apiUrl;
    saveConfig(updates);
    console.log('Configuration saved.');
    const config = loadConfig();
    console.log(`  API URL: ${config.apiUrl}`);
    console.log(`  API Key: ${config.apiKey ? config.apiKey.substring(0, 16) + '...' : '(not set)'}`);
  });

program
  .command('whoami')
  .description('Show current tenant info')
  .action(async () => {
    try {
      const tenant = await apiRequest('GET', '/api/tenant');
      console.log(`Tenant: ${tenant.name} (${tenant.slug})`);
      console.log(`Plan:   ${tenant.plan}`);
      console.log(`Status: ${tenant.status}`);
      console.log(`Limits:`);
      console.log(`  API calls/day:    ${tenant.limits.dailyApiLimit}`);
      console.log(`  HL7 messages/mo:  ${tenant.limits.monthlyHl7Limit}`);
      console.log(`  Max endpoints:    ${tenant.limits.maxEndpoints}`);
      console.log(`  Max users:        ${tenant.limits.maxUsers}`);
    } catch (err: any) {
      console.error(`Error: ${err.message}`);
      process.exit(1);
    }
  });

// ── Signup ──

program
  .command('signup')
  .description('Create a new account')
  .requiredOption('--org <name>', 'Organization name')
  .requiredOption('--email <email>', 'Email address')
  .requiredOption('--password <password>', 'Password')
  .requiredOption('--first-name <name>', 'First name')
  .requiredOption('--last-name <name>', 'Last name')
  .option('--api-url <url>', 'API base URL')
  .action(async (opts) => {
    try {
      if (opts.apiUrl) saveConfig({ apiUrl: opts.apiUrl });

      const result = await apiRequest('POST', '/api/signup', {
        organizationName: opts.org,
        email: opts.email,
        password: opts.password,
        firstName: opts.firstName,
        lastName: opts.lastName,
      }, { noAuth: true });

      // Auto-save the API key
      saveConfig({ apiKey: result.apiKey });

      console.log('Account created successfully!\n');
      console.log(`Tenant:  ${result.tenant.name} (${result.tenant.slug})`);
      console.log(`Plan:    ${result.tenant.plan}`);
      console.log(`User:    ${result.user.firstName} ${result.user.lastName}`);
      console.log(`API Key: ${result.apiKey}`);
      console.log('\n⚠ Store your API key securely — it will not be shown again.');
      console.log('Your API key has been saved to ~/.openemr-ts/config.json');
    } catch (err: any) {
      console.error(`Error: ${err.message}`);
      process.exit(1);
    }
  });

// ── Usage ──

program
  .command('usage')
  .description('Show current usage')
  .action(async () => {
    try {
      const usage = await apiRequest('GET', '/api/tenant/usage');
      console.log('Current Usage:');
      console.log(`  API calls today:     ${usage.apiCalls.today} / ${usage.apiCalls.limit}`);
      console.log(`  HL7 messages (month): ${usage.hl7Messages.thisMonth} / ${usage.hl7Messages.limit}`);
      console.log(`  FHIR queries today:  ${usage.fhirQueries.today}`);
      console.log(`  Simulations (month): ${usage.simulations.thisMonth}`);
    } catch (err: any) {
      console.error(`Error: ${err.message}`);
      process.exit(1);
    }
  });

// ── Patient ──

const patient = program.command('patient').description('Patient management');

patient
  .command('list')
  .description('List patients')
  .option('--search <query>', 'Search by name or MRN')
  .option('--limit <n>', 'Results per page', '20')
  .action(async (opts) => {
    try {
      const params = new URLSearchParams();
      if (opts.search) params.set('search', opts.search);
      params.set('limit', opts.limit);
      const result = await apiRequest('GET', `/api/patient?${params}`);
      console.log(`Patients (${result.total} total):\n`);
      for (const p of result.data) {
        console.log(`  ${p.mrn}  ${p.lastName}, ${p.firstName}  DOB: ${p.dateOfBirth}  Sex: ${p.sex}`);
      }
    } catch (err: any) {
      console.error(`Error: ${err.message}`);
      process.exit(1);
    }
  });

patient
  .command('get <uuid>')
  .description('Get patient details')
  .action(async (uuid) => {
    try {
      const p = await apiRequest('GET', `/api/patient/${uuid}`);
      console.log(JSON.stringify(p, null, 2));
    } catch (err: any) {
      console.error(`Error: ${err.message}`);
      process.exit(1);
    }
  });

// ── Simulate ──

const simulate = program.command('simulate').description('Run workflow simulations');

simulate
  .command('run')
  .description('Run a simulation scenario')
  .option('--scenario <name>', 'Preset scenario (full-visit, lab-only, admit-discharge, pharmacy, referral)')
  .option('--patients <n>', 'Number of patients', '1')
  .option('--panels <panels>', 'Lab panels (comma-separated)', 'CBC,BMP')
  .option('--pacing <mode>', 'Pacing mode (instant, realtime)', 'instant')
  .action(async (opts) => {
    try {
      console.log(`Running simulation: ${opts.scenario || 'full-visit'} with ${opts.patients} patients...\n`);
      const result = await apiRequest('POST', '/api/simulate', {
        scenario: opts.scenario || 'full-visit',
        patientCount: parseInt(opts.patients),
        labPanels: opts.panels.split(','),
        pacing: opts.pacing,
      });

      console.log(`Simulation complete (${result.durationMs}ms):`);
      console.log(`  Patients created:     ${result.patientsCreated}`);
      console.log(`  Steps executed:       ${result.stepsExecuted}`);
      console.log(`  HL7 messages generated: ${result.hl7MessagesGenerated}`);
      console.log(`  HL7 messages sent:    ${result.hl7MessagesSent}\n`);

      // Group steps by patient
      const byPatient = new Map<string, typeof result.steps>();
      for (const step of result.steps) {
        const key = step.patientMrn;
        if (!byPatient.has(key)) byPatient.set(key, []);
        byPatient.get(key)!.push(step);
      }

      for (const [mrn, steps] of byPatient) {
        console.log(`  ${mrn} (${steps[0].patientName}):`);
        for (const s of steps) {
          const status = s.hl7Sent ? 'sent' : s.hl7Message ? 'generated' : 'done';
          console.log(`    ${s.step} → ${s.hl7MessageType} [${status}] (${s.durationMs}ms)`);
        }
      }
    } catch (err: any) {
      console.error(`Error: ${err.message}`);
      process.exit(1);
    }
  });

simulate
  .command('presets')
  .description('List available simulation presets')
  .action(async () => {
    try {
      const presets = await apiRequest('GET', '/api/simulate/presets');
      console.log('Available presets:\n');
      for (const [name, steps] of Object.entries(presets)) {
        console.log(`  ${name}: ${(steps as string[]).join(' → ')}`);
      }
    } catch (err: any) {
      console.error(`Error: ${err.message}`);
      process.exit(1);
    }
  });

simulate
  .command('cleanup')
  .description('Delete all simulated (SIM-*) patient data')
  .action(async () => {
    try {
      const result = await apiRequest('DELETE', '/api/simulate/cleanup');
      console.log(`Cleaned up ${result.deletedPatients} simulated patients.`);
    } catch (err: any) {
      console.error(`Error: ${err.message}`);
      process.exit(1);
    }
  });

// ── Endpoints ──

const endpoints = program.command('endpoint').description('Manage HL7 endpoints');

endpoints
  .command('list')
  .description('List registered endpoints')
  .action(async () => {
    try {
      const eps = await apiRequest('GET', '/api/tenant/endpoints');
      console.log(`Endpoints (${eps.length}):\n`);
      for (const ep of eps) {
        const health = ep.status === 'active' ? 'healthy' : ep.status;
        console.log(`  ${ep.name} [${ep.transport}] ${ep.destination} — ${health}`);
      }
    } catch (err: any) {
      console.error(`Error: ${err.message}`);
      process.exit(1);
    }
  });

endpoints
  .command('add')
  .description('Register a new endpoint')
  .requiredOption('--name <name>', 'Endpoint name')
  .requiredOption('--transport <type>', 'Transport type (MLLP, HTTP, HTTPS)')
  .option('--host <host>', 'MLLP host')
  .option('--port <port>', 'MLLP port')
  .option('--url <url>', 'HTTP/HTTPS URL')
  .option('--auth <header>', 'Authorization header value')
  .option('--types <types>', 'HL7 message types (comma-separated)')
  .action(async (opts) => {
    try {
      const body: any = {
        name: opts.name,
        transport: opts.transport,
      };
      if (opts.host) body.host = opts.host;
      if (opts.port) body.port = parseInt(opts.port);
      if (opts.url) body.url = opts.url;
      if (opts.auth) body.authHeader = opts.auth;
      if (opts.types) body.messageTypes = opts.types.split(',');

      const result = await apiRequest('POST', '/api/tenant/endpoints', body);
      console.log(`Endpoint created: ${result.name} [${result.transport}] ${result.destination}`);
    } catch (err: any) {
      console.error(`Error: ${err.message}`);
      process.exit(1);
    }
  });

// ── HL7 ──

const hl7 = program.command('hl7').description('HL7 message operations');

hl7
  .command('send <orderUuid>')
  .description('Send HL7 order message for a lab order')
  .action(async (orderUuid) => {
    try {
      const result = await apiRequest('POST', `/api/hl7/send/${orderUuid}`);
      console.log(`HL7 ${result.success ? 'sent' : 'failed'}: ${result.protocol} → ${result.destination}`);
      if (result.ack) console.log(`ACK: ${result.ack.substring(0, 200)}`);
      if (result.error) console.log(`Error: ${result.error}`);
    } catch (err: any) {
      console.error(`Error: ${err.message}`);
      process.exit(1);
    }
  });

hl7
  .command('generate <orderUuid>')
  .description('Generate HL7 message without sending')
  .action(async (orderUuid) => {
    try {
      const result = await apiRequest('GET', `/api/hl7/generate/${orderUuid}`);
      console.log(result.hl7Message);
    } catch (err: any) {
      console.error(`Error: ${err.message}`);
      process.exit(1);
    }
  });

// ── API Keys ──

const apiKeys = program.command('api-key').description('Manage API keys');

apiKeys
  .command('list')
  .description('List API keys')
  .action(async () => {
    try {
      const keys = await apiRequest('GET', '/api/tenant/api-keys');
      console.log(`API Keys (${keys.length}):\n`);
      for (const k of keys) {
        const status = k.active ? 'active' : 'revoked';
        console.log(`  ${k.keyPrefix}... — "${k.name}" [${status}] scopes: ${k.scopes.length}`);
      }
    } catch (err: any) {
      console.error(`Error: ${err.message}`);
      process.exit(1);
    }
  });

apiKeys
  .command('create')
  .description('Create a new API key')
  .requiredOption('--name <name>', 'Key name')
  .option('--scopes <scopes>', 'Comma-separated scopes', 'patient:read,fhir:read')
  .action(async (opts) => {
    try {
      const result = await apiRequest('POST', '/api/tenant/api-keys', {
        name: opts.name,
        scopes: opts.scopes.split(','),
      });
      console.log(`API Key created: ${result.key}`);
      console.log(`\n⚠ Store this key securely — it will not be shown again.`);
    } catch (err: any) {
      console.error(`Error: ${err.message}`);
      process.exit(1);
    }
  });

apiKeys
  .command('revoke <uuid>')
  .description('Revoke an API key')
  .action(async (uuid) => {
    try {
      await apiRequest('DELETE', `/api/tenant/api-keys/${uuid}`);
      console.log('API key revoked.');
    } catch (err: any) {
      console.error(`Error: ${err.message}`);
      process.exit(1);
    }
  });

// ── FHIR ──

const fhir = program.command('fhir').description('Query FHIR resources');

fhir
  .command('get <resourceType> [id]')
  .description('Get a FHIR resource or search (e.g., fhir get Patient, fhir get Patient <id>)')
  .option('--patient <id>', 'Filter by patient ID')
  .option('--name <name>', 'Search by name (Patient only)')
  .option('--category <cat>', 'Category filter (Observation only)')
  .action(async (resourceType, id, opts) => {
    try {
      let path = `/fhir/${resourceType}`;
      if (id) {
        path += `/${id}`;
      } else {
        const params = new URLSearchParams();
        if (opts.patient) params.set('patient', opts.patient);
        if (opts.name) params.set('name', opts.name);
        if (opts.category) params.set('category', opts.category);
        const qs = params.toString();
        if (qs) path += `?${qs}`;
      }
      const result = await apiRequest('GET', path);
      console.log(JSON.stringify(result, null, 2));
    } catch (err: any) {
      console.error(`Error: ${err.message}`);
      process.exit(1);
    }
  });

program.parse();
