import { Controller, Get, Param, Query, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';
import { DocumentService } from '../document/document.service.js';
import { join } from 'path';

@ApiTags('DICOM')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('api/dicom')
export class DicomController {
  constructor(private readonly documentService: DocumentService) {}

  @Get('viewer')
  @ApiOperation({ summary: 'DICOM viewer page' })
  getViewer(@Res() res: Response) {
    // Serve the DWV viewer HTML page
    res.sendFile(join(process.cwd(), 'public', 'dicom-viewer.html'));
  }

  @Get('file/:uuid')
  @ApiOperation({ summary: 'Get DICOM file for viewer' })
  async getDicomFile(
    @Param('uuid') uuid: string,
    @Query('patientId') patientId: string,
    @Res() res: Response,
  ) {
    const doc = await this.documentService.findByUuid(uuid, Number(patientId));
    const buffer = await this.documentService.getFileBuffer(doc);
    res.set({
      'Content-Type': 'application/dicom',
      'Content-Length': buffer.length,
      'Access-Control-Allow-Origin': '*',
    });
    res.end(buffer);
  }
}
