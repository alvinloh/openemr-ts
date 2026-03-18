import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Medication } from './entities/medication.entity.js';
import { CreateMedicationDto } from './dto/create-medication.dto.js';
import { UpdateMedicationDto } from './dto/update-medication.dto.js';

@Injectable()
export class MedicationService {
  constructor(
    @InjectRepository(Medication)
    private readonly medRepo: Repository<Medication>,
  ) {}

  async create(patientId: number, dto: CreateMedicationDto): Promise<Medication> {
    const med = this.medRepo.create({ ...dto, patientId });
    return this.medRepo.save(med);
  }

  async findByPatient(patientId: number): Promise<Medication[]> {
    return this.medRepo.find({
      where: { patientId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(patientId: number, uuid: string): Promise<Medication> {
    const med = await this.medRepo.findOne({ where: { uuid, patientId } });
    if (!med) throw new NotFoundException('Medication not found');
    return med;
  }

  async update(
    patientId: number,
    uuid: string,
    dto: UpdateMedicationDto,
  ): Promise<Medication> {
    const med = await this.findOne(patientId, uuid);
    Object.assign(med, dto);
    return this.medRepo.save(med);
  }

  async remove(patientId: number, uuid: string): Promise<void> {
    const med = await this.findOne(patientId, uuid);
    await this.medRepo.remove(med);
  }
}
