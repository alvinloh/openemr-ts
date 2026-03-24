#!/usr/bin/env node

/**
 * OpenEMR-TS MCP Server
 *
 * A Model Context Protocol server that exposes OpenEMR-TS capabilities
 * to AI agents (Claude Desktop, Cursor, etc.) via stdio transport.
 *
 * Usage:
 *   OPENEMR_API_URL=http://localhost:3000 OPENEMR_API_KEY=oet_... npx tsx src/mcp-server.ts
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

const API_URL = process.env.OPENEMR_API_URL || 'http://localhost:3000';
let activeApiKey = process.env.OPENEMR_API_KEY || '';

async function apiRequest(method: string, path: string, body?: any, apiKeyOverride?: string): Promise<any> {
  const key = apiKeyOverride || activeApiKey;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (key) {
    headers['x-api-key'] = key;
  }

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }

  if (!response.ok) {
    throw new Error(data?.message || `HTTP ${response.status}: ${text.substring(0, 200)}`);
  }
  return data;
}

const server = new Server(
  {
    name: 'openemr-ts',
    version: '0.1.0',
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

// ── Tool Definitions ──

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'openemr_switch_tenant',
      description:
        'Switch to a different tenant by providing their API key. All subsequent operations will use this tenant context. ' +
        'Use openemr_tenant_info after switching to confirm which tenant is active.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          apiKey: { type: 'string', description: 'The tenant API key (starts with oet_)' },
        },
        required: ['apiKey'],
      },
    },
    {
      name: 'openemr_signup',
      description:
        'Create a new OpenEMR-TS tenant account. Returns an API key and automatically switches to the new tenant.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          organizationName: { type: 'string', description: 'Organization name' },
          email: { type: 'string', description: 'Admin email address' },
          password: { type: 'string', description: 'Account password (min 8 chars)' },
          firstName: { type: 'string', description: 'Admin first name' },
          lastName: { type: 'string', description: 'Admin last name' },
        },
        required: ['organizationName', 'email', 'password', 'firstName', 'lastName'],
      },
    },
    {
      name: 'openemr_tenant_info',
      description: 'Get current tenant details including plan, limits, and status.',
      inputSchema: { type: 'object' as const, properties: {} },
    },
    {
      name: 'openemr_simulate',
      description:
        'Run a clinical workflow simulation that generates HL7 messages at each step. ' +
        'Can target an existing patient by UUID (skips register step) or create new synthetic patients with SIM-* MRN prefix. ' +
        'Scenarios: full-visit (register→checkin→labs→results→followup), lab-only, admit-discharge, pharmacy, referral. ' +
        'Use openemr_simulate_cleanup to remove simulated data.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          scenario: {
            type: 'string',
            description: 'Preset scenario name',
            enum: ['full-visit', 'lab-only', 'admit-discharge', 'pharmacy', 'referral'],
          },
          patientUuid: {
            type: 'string',
            description: 'Target an existing patient by UUID. Skips register step. When set, patientCount is ignored.',
          },
          patientCount: {
            type: 'number',
            description: 'Number of new synthetic patients to simulate (1-100). Ignored if patientUuid is set.',
          },
          labPanels: {
            type: 'array',
            items: { type: 'string' },
            description: 'Lab panels to order: CBC, BMP, CMP, LIPID',
          },
          pacing: {
            type: 'string',
            enum: ['instant', 'realtime'],
            description: 'instant = no delay, realtime = simulated delays between steps',
          },
        },
        required: ['patientCount'],
      },
    },
    {
      name: 'openemr_simulate_cleanup',
      description: 'Delete all simulated (SIM-*) patient data for the current tenant.',
      inputSchema: { type: 'object' as const, properties: {} },
    },
    {
      name: 'openemr_simulate_presets',
      description: 'List available simulation preset scenarios and their steps.',
      inputSchema: { type: 'object' as const, properties: {} },
    },
    {
      name: 'openemr_patient_search',
      description: 'Search for patients by name, MRN, date of birth, or sex.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          search: { type: 'string', description: 'Search query (name or MRN)' },
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          mrn: { type: 'string', description: 'Medical record number' },
          dateOfBirth: { type: 'string', description: 'Date of birth (YYYY-MM-DD)' },
          limit: { type: 'number', description: 'Max results (default 20)' },
        },
      },
    },
    {
      name: 'openemr_patient_get',
      description: 'Get full patient details by UUID.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          uuid: { type: 'string', description: 'Patient UUID' },
        },
        required: ['uuid'],
      },
    },
    {
      name: 'openemr_patient_create',
      description: 'Create a new patient record.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          dateOfBirth: { type: 'string', description: 'YYYY-MM-DD' },
          sex: { type: 'string', enum: ['Male', 'Female', 'Other'] },
          email: { type: 'string' },
          phoneCell: { type: 'string' },
          street: { type: 'string' },
          city: { type: 'string' },
          state: { type: 'string' },
          postalCode: { type: 'string' },
        },
        required: ['firstName', 'lastName', 'dateOfBirth', 'sex'],
      },
    },
    {
      name: 'openemr_fhir_query',
      description:
        'Query FHIR R4 resources. Supports: Patient, Encounter, Observation, MedicationRequest, Condition, AllergyIntolerance, Appointment, DocumentReference. ' +
        'Use "metadata" as resourceType to get the CapabilityStatement.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          resourceType: {
            type: 'string',
            description: 'FHIR resource type',
            enum: ['metadata', 'Patient', 'Encounter', 'Observation', 'MedicationRequest', 'Condition', 'AllergyIntolerance', 'Appointment', 'DocumentReference'],
          },
          id: { type: 'string', description: 'Resource ID for direct read' },
          patient: { type: 'string', description: 'Patient ID filter' },
          name: { type: 'string', description: 'Name search (Patient only)' },
          category: { type: 'string', description: 'Category filter (Observation: vital-signs, laboratory)' },
        },
        required: ['resourceType'],
      },
    },
    {
      name: 'openemr_hl7_generate',
      description: 'Generate an HL7v2 ORM order message for a lab order (does not send it).',
      inputSchema: {
        type: 'object' as const,
        properties: {
          orderUuid: { type: 'string', description: 'Lab order UUID' },
        },
        required: ['orderUuid'],
      },
    },
    {
      name: 'openemr_hl7_send',
      description: 'Generate and send an HL7v2 order message for a lab order to the configured lab system.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          orderUuid: { type: 'string', description: 'Lab order UUID' },
        },
        required: ['orderUuid'],
      },
    },
    {
      name: 'openemr_endpoint_list',
      description: 'List all registered HL7 endpoints for the current tenant.',
      inputSchema: { type: 'object' as const, properties: {} },
    },
    {
      name: 'openemr_endpoint_register',
      description: 'Register an HL7 endpoint where outbound messages will be sent.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          name: { type: 'string', description: 'Endpoint name (e.g. my-lab-system)' },
          transport: { type: 'string', enum: ['MLLP', 'HTTP', 'HTTPS'], description: 'Transport protocol' },
          host: { type: 'string', description: 'MLLP host' },
          port: { type: 'number', description: 'MLLP port' },
          url: { type: 'string', description: 'HTTP/HTTPS URL' },
          messageTypes: { type: 'array', items: { type: 'string' }, description: 'Filter: only route these HL7 message types to this endpoint' },
        },
        required: ['name', 'transport'],
      },
    },
    {
      name: 'openemr_usage',
      description: 'Get current API usage stats: API calls today, HL7 messages this month, FHIR queries, simulations.',
      inputSchema: { type: 'object' as const, properties: {} },
    },
    {
      name: 'openemr_api_key_list',
      description: 'List all API keys for the current tenant.',
      inputSchema: { type: 'object' as const, properties: {} },
    },
    {
      name: 'openemr_api_key_create',
      description: 'Create a new API key with specific scopes. The key is only shown once.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          name: { type: 'string', description: 'Key name' },
          scopes: {
            type: 'array',
            items: { type: 'string' },
            description: 'Scopes: patient:read, patient:write, hl7:send, hl7:receive, fhir:read, fhir:write, simulate:run, etc.',
          },
        },
        required: ['name', 'scopes'],
      },
    },
  ],
}));

// ── Tool Handlers ──

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    let result: any;

    switch (name) {
      case 'openemr_switch_tenant': {
        const newKey = (args as any).apiKey;
        // Validate the key by fetching tenant info
        const tenantInfo = await apiRequest('GET', '/api/tenant', undefined, newKey);
        activeApiKey = newKey;
        result = { switched: true, tenant: tenantInfo };
        break;
      }

      case 'openemr_signup':
        result = await apiRequest('POST', '/api/signup', args);
        // Auto-switch to the new tenant
        if (result.apiKey) {
          activeApiKey = result.apiKey;
          result._note = 'Automatically switched to new tenant. All subsequent operations will use this tenant.';
        }
        break;

      case 'openemr_tenant_info':
        result = await apiRequest('GET', '/api/tenant');
        break;

      case 'openemr_simulate': {
        const simArgs = args as any;
        const simBody: any = {
          scenario: simArgs?.scenario || 'full-visit',
          patientCount: simArgs?.patientCount || 1,
          labPanels: simArgs?.labPanels,
          pacing: simArgs?.pacing || 'instant',
        };
        if (simArgs?.patientUuid) {
          simBody.patientUuid = simArgs.patientUuid;
        }
        result = await apiRequest('POST', '/api/simulate', simBody);
        // Summarize but include HL7 messages
        const sim = result;
        result = {
          simulationId: sim.simulationId,
          scenario: sim.scenario,
          patientsCreated: sim.patientsCreated,
          stepsExecuted: sim.stepsExecuted,
          hl7MessagesGenerated: sim.hl7MessagesGenerated,
          hl7MessagesSent: sim.hl7MessagesSent,
          durationMs: sim.durationMs,
          patients: [...new Set(sim.steps.map((s: any) => `${s.patientMrn} (${s.patientName})`))],
          steps: sim.steps.map((s: any) => ({
            patient: `${s.patientMrn} (${s.patientName})`,
            step: s.step,
            hl7MessageType: s.hl7MessageType,
            status: s.hl7Sent ? 'sent' : s.hl7Message ? 'generated' : s.entityType === 'error' ? 'error' : 'done',
            entityUuid: s.entityUuid,
            hl7Message: s.hl7Message || null,
          })),
        };
        break;
      }

      case 'openemr_simulate_cleanup':
        result = await apiRequest('DELETE', '/api/simulate/cleanup');
        break;

      case 'openemr_simulate_presets':
        result = await apiRequest('GET', '/api/simulate/presets');
        break;

      case 'openemr_patient_search': {
        const params = new URLSearchParams();
        const a = args as any;
        if (a?.search) params.set('search', a.search);
        if (a?.firstName) params.set('firstName', a.firstName);
        if (a?.lastName) params.set('lastName', a.lastName);
        if (a?.mrn) params.set('mrn', a.mrn);
        if (a?.dateOfBirth) params.set('dateOfBirth', a.dateOfBirth);
        params.set('limit', String(a?.limit || 20));
        result = await apiRequest('GET', `/api/patient?${params}`);
        break;
      }

      case 'openemr_patient_get':
        result = await apiRequest('GET', `/api/patient/${(args as any).uuid}`);
        break;

      case 'openemr_patient_create':
        result = await apiRequest('POST', '/api/patient', args);
        break;

      case 'openemr_fhir_query': {
        const a = args as any;
        let path = `/fhir/${a.resourceType}`;
        if (a.id) {
          path += `/${a.id}`;
        } else if (a.resourceType !== 'metadata') {
          const params = new URLSearchParams();
          if (a.patient) params.set('patient', a.patient);
          if (a.name) params.set('name', a.name);
          if (a.category) params.set('category', a.category);
          const qs = params.toString();
          if (qs) path += `?${qs}`;
        }
        result = await apiRequest('GET', path);
        break;
      }

      case 'openemr_hl7_generate':
        result = await apiRequest('GET', `/api/hl7/generate/${(args as any).orderUuid}`);
        break;

      case 'openemr_hl7_send':
        result = await apiRequest('POST', `/api/hl7/send/${(args as any).orderUuid}`);
        break;

      case 'openemr_endpoint_list':
        result = await apiRequest('GET', '/api/tenant/endpoints');
        break;

      case 'openemr_endpoint_register':
        result = await apiRequest('POST', '/api/tenant/endpoints', args);
        break;

      case 'openemr_usage':
        result = await apiRequest('GET', '/api/tenant/usage');
        break;

      case 'openemr_api_key_list':
        result = await apiRequest('GET', '/api/tenant/api-keys');
        break;

      case 'openemr_api_key_create':
        result = await apiRequest('POST', '/api/tenant/api-keys', args);
        break;

      default:
        return {
          content: [{ type: 'text', text: `Unknown tool: ${name}` }],
          isError: true,
        };
    }

    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
  } catch (err: any) {
    return {
      content: [{ type: 'text', text: `Error: ${err.message}` }],
      isError: true,
    };
  }
});

// ── Start Server ──

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('OpenEMR-TS MCP server running on stdio');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
