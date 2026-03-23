import { Injectable } from '@nestjs/common';

/**
 * MCP (Model Context Protocol) tool definitions for OpenEMR-TS.
 * These definitions allow AI agents (Claude, Cursor, etc.) to discover
 * and use OpenEMR-TS capabilities natively.
 */

export interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

@Injectable()
export class McpToolsService {
  getToolDefinitions(): McpToolDefinition[] {
    return [
      {
        name: 'openemr_signup',
        description: 'Create a new OpenEMR-TS account. Returns an API key for subsequent operations.',
        inputSchema: {
          type: 'object',
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
        name: 'openemr_simulate',
        description: 'Run a clinical workflow simulation that creates synthetic patients and sends HL7 messages. Scenarios: full-visit, lab-only, admit-discharge, pharmacy, referral.',
        inputSchema: {
          type: 'object',
          properties: {
            scenario: { type: 'string', description: 'Preset scenario name', enum: ['full-visit', 'lab-only', 'admit-discharge', 'pharmacy', 'referral'] },
            patientCount: { type: 'number', description: 'Number of patients (1-100)', minimum: 1, maximum: 100 },
            labPanels: { type: 'array', items: { type: 'string' }, description: 'Lab panels to order (CBC, BMP, CMP, LIPID)' },
            pacing: { type: 'string', enum: ['instant', 'realtime'], description: 'Simulation speed' },
          },
          required: ['patientCount'],
        },
      },
      {
        name: 'openemr_patient_search',
        description: 'Search for patients by name, MRN, date of birth, or sex.',
        inputSchema: {
          type: 'object',
          properties: {
            search: { type: 'string', description: 'Search query (name or MRN)' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            mrn: { type: 'string', description: 'Medical record number' },
            dateOfBirth: { type: 'string', description: 'Date of birth (YYYY-MM-DD)' },
            limit: { type: 'number', description: 'Results per page', default: 20 },
          },
        },
      },
      {
        name: 'openemr_patient_get',
        description: 'Get full patient details by UUID.',
        inputSchema: {
          type: 'object',
          properties: {
            uuid: { type: 'string', description: 'Patient UUID' },
          },
          required: ['uuid'],
        },
      },
      {
        name: 'openemr_fhir_query',
        description: 'Query FHIR R4 resources. Supports Patient, Encounter, Observation, MedicationRequest, Condition, AllergyIntolerance, Appointment, DocumentReference.',
        inputSchema: {
          type: 'object',
          properties: {
            resourceType: {
              type: 'string',
              description: 'FHIR resource type',
              enum: ['Patient', 'Encounter', 'Observation', 'MedicationRequest', 'Condition', 'AllergyIntolerance', 'Appointment', 'DocumentReference'],
            },
            id: { type: 'string', description: 'Resource ID (for read)' },
            patient: { type: 'string', description: 'Patient ID filter' },
            name: { type: 'string', description: 'Name search (Patient only)' },
            category: { type: 'string', description: 'Category filter (Observation: vital-signs, laboratory)' },
          },
          required: ['resourceType'],
        },
      },
      {
        name: 'openemr_hl7_send',
        description: 'Generate and send an HL7v2 order message for a lab order.',
        inputSchema: {
          type: 'object',
          properties: {
            orderUuid: { type: 'string', description: 'Lab order UUID' },
            labProviderId: { type: 'number', description: 'Target lab provider ID (optional)' },
          },
          required: ['orderUuid'],
        },
      },
      {
        name: 'openemr_endpoint_register',
        description: 'Register an HL7 endpoint where messages will be sent.',
        inputSchema: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Endpoint name' },
            transport: { type: 'string', enum: ['MLLP', 'HTTP', 'HTTPS'] },
            host: { type: 'string', description: 'MLLP host' },
            port: { type: 'number', description: 'MLLP port' },
            url: { type: 'string', description: 'HTTP/HTTPS URL' },
            messageTypes: { type: 'array', items: { type: 'string' }, description: 'HL7 message types to route here' },
          },
          required: ['name', 'transport'],
        },
      },
      {
        name: 'openemr_endpoint_list',
        description: 'List all registered HL7 endpoints for the current tenant.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'openemr_usage',
        description: 'Get current API usage statistics including API calls, HL7 messages, and FHIR queries.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'openemr_api_keys_list',
        description: 'List all API keys for the current tenant.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'openemr_api_key_create',
        description: 'Create a new API key with specific scopes.',
        inputSchema: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Key name' },
            scopes: {
              type: 'array',
              items: { type: 'string' },
              description: 'Permission scopes (e.g., patient:read, hl7:send, fhir:read)',
            },
          },
          required: ['name', 'scopes'],
        },
      },
      {
        name: 'openemr_simulation_cleanup',
        description: 'Delete all simulated (SIM-*) patient data.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
    ];
  }
}
