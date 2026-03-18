import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { Document } from './entities/document.entity.js';
import { DocumentCategory } from './entities/document-category.entity.js';
import { DocumentService } from './document.service.js';
import { DocumentController } from './document.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Document, DocumentCategory]),
    MulterModule.register({ storage: undefined }), // memory storage
  ],
  controllers: [DocumentController],
  providers: [DocumentService],
  exports: [DocumentService],
})
export class DocumentModule {}
