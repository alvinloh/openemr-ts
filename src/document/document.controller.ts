import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Res,
  ParseIntPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { Response } from 'express';
import 'multer'; // for Express.Multer.File type
import { DocumentService } from './document.service.js';
import { UuidValidationPipe } from '../common/pipes/uuid-validation.pipe.js';
import { ApiResponse } from '../common/dto/api-response.dto.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';

@ApiTags('Document')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('api/patient/:pid/document')
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  @Get()
  @ApiOperation({ summary: 'List patient documents' })
  async findAll(
    @Param('pid', ParseIntPipe) pid: number,
    @Query('categoryId') categoryId?: string,
  ) {
    return ApiResponse.ok(
      await this.documentService.findByPatient(
        pid,
        categoryId ? Number(categoryId) : undefined,
      ),
    );
  }

  @Post()
  @ApiOperation({ summary: 'Upload document' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @Param('pid', ParseIntPipe) pid: number,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser('id') userId: number,
    @Query('encounterId') encounterId?: string,
    @Query('categoryId') categoryId?: string,
  ) {
    const doc = await this.documentService.upload(pid, file, {
      encounterId: encounterId ? Number(encounterId) : undefined,
      categoryId: categoryId ? Number(categoryId) : undefined,
      uploadedBy: userId,
    });
    return ApiResponse.ok(doc);
  }

  @Get(':duuid')
  @ApiOperation({ summary: 'Download document' })
  async download(
    @Param('pid', ParseIntPipe) pid: number,
    @Param('duuid', UuidValidationPipe) duuid: string,
    @Res() res: Response,
  ) {
    const doc = await this.documentService.findByUuid(duuid, pid);
    const buffer = await this.documentService.getFileBuffer(doc);
    res.set({
      'Content-Type': doc.mimeType,
      'Content-Disposition': `attachment; filename="${doc.name}"`,
      'Content-Length': buffer.length,
      'Cache-Control': 'no-cache',
    });
    res.end(buffer);
  }
}
