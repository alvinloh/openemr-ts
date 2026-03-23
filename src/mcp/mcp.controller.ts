import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { McpToolsService } from './mcp-tools.service.js';

/**
 * MCP (Model Context Protocol) discovery endpoint.
 * AI agents use this to discover available tools and capabilities.
 */
@ApiTags('MCP')
@Controller('mcp')
export class McpController {
  constructor(private readonly mcpTools: McpToolsService) {}

  @Get('tools')
  @ApiOperation({
    summary: 'List available MCP tools for AI agent integration',
    description:
      'Returns tool definitions compatible with Model Context Protocol. ' +
      'AI agents use this endpoint to discover what operations OpenEMR-TS supports.',
  })
  getTools() {
    return {
      tools: this.mcpTools.getToolDefinitions(),
      serverInfo: {
        name: 'openemr-ts',
        version: '0.1.0',
        description: 'Healthcare interoperability API — FHIR R4, HL7v2, clinical workflows',
        capabilities: [
          'Patient management (CRUD)',
          'FHIR R4 resource queries (8 resource types)',
          'HL7v2 message generation and sending (ADT, ORM, ORU, SIU, RDE, MDM)',
          'Clinical workflow simulation with synthetic data',
          'Custom endpoint registration for HL7 routing',
          'Usage metering and plan management',
        ],
      },
    };
  }
}
