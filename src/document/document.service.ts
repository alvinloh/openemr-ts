import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Document } from './entities/document.entity.js';
import 'multer'; // for Express.Multer.File type
import { createHash } from 'crypto';
import { writeFile, mkdir, readFile, unlink } from 'fs/promises';
import { join, dirname } from 'path';

@Injectable()
export class DocumentService {
  private readonly uploadDir = process.env.UPLOAD_DIR || './uploads';

  constructor(
    @InjectRepository(Document)
    private readonly docRepo: Repository<Document>,
  ) {}

  async upload(
    patientId: number,
    file: Express.Multer.File,
    options?: { encounterId?: number; categoryId?: number; uploadedBy?: number },
  ): Promise<Document> {
    const hash = createHash('sha256').update(file.buffer).digest('hex');
    const storagePath = join(
      String(patientId),
      `${Date.now()}-${file.originalname}`,
    );
    const fullPath = join(this.uploadDir, storagePath);

    await mkdir(dirname(fullPath), { recursive: true });
    await writeFile(fullPath, file.buffer);

    const doc = this.docRepo.create({
      patientId,
      encounterId: options?.encounterId || null,
      categoryId: options?.categoryId || null,
      name: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      hash,
      storagePath,
      uploadedBy: options?.uploadedBy || null,
    });
    return this.docRepo.save(doc);
  }

  async findByPatient(
    patientId: number,
    categoryId?: number,
  ): Promise<Document[]> {
    const where: any = { patientId };
    if (categoryId) where.categoryId = categoryId;
    return this.docRepo.find({ where, order: { createdAt: 'DESC' } });
  }

  async findByUuid(uuid: string, patientId?: number): Promise<Document> {
    const where: any = { uuid };
    if (patientId) where.patientId = patientId;
    const doc = await this.docRepo.findOne({ where });
    if (!doc) throw new NotFoundException('Document not found');
    return doc;
  }

  async getFileBuffer(doc: Document): Promise<Buffer> {
    const fullPath = join(this.uploadDir, doc.storagePath);
    return readFile(fullPath);
  }

  async remove(uuid: string, patientId: number): Promise<void> {
    const doc = await this.findByUuid(uuid, patientId);
    const fullPath = join(this.uploadDir, doc.storagePath);
    try {
      await unlink(fullPath);
    } catch {
      // File already removed from disk
    }
    await this.docRepo.remove(doc);
  }
}
