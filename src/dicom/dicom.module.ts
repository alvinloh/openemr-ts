import { Module } from '@nestjs/common';
import { DicomController } from './dicom.controller.js';
import { DocumentModule } from '../document/document.module.js';

@Module({
  imports: [DocumentModule],
  controllers: [DicomController],
})
export class DicomModule {}
