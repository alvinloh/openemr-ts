import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Encounter } from './entities/encounter.entity.js';
import { EncounterDiagnosis } from './entities/encounter-diagnosis.entity.js';
import { Vitals } from './entities/vitals.entity.js';
import { Condition } from './entities/condition.entity.js';
import { Allergy } from './entities/allergy.entity.js';
import { CreateEncounterDto } from './dto/create-encounter.dto.js';
import { UpdateEncounterDto } from './dto/update-encounter.dto.js';
import { CreateVitalsDto } from './dto/create-vitals.dto.js';
import { PaginationDto } from '../common/dto/pagination.dto.js';

@Injectable()
export class EncounterService {
  constructor(
    @InjectRepository(Encounter)
    private readonly encounterRepo: Repository<Encounter>,
    @InjectRepository(EncounterDiagnosis)
    private readonly diagnosisRepo: Repository<EncounterDiagnosis>,
    @InjectRepository(Vitals)
    private readonly vitalsRepo: Repository<Vitals>,
    @InjectRepository(Condition)
    private readonly conditionRepo: Repository<Condition>,
    @InjectRepository(Allergy)
    private readonly allergyRepo: Repository<Allergy>,
  ) {}

  // ── Encounters ──

  async createEncounter(
    patientId: number,
    dto: CreateEncounterDto,
  ): Promise<Encounter> {
    const encounter = this.encounterRepo.create({
      patientId,
      providerId: dto.providerId,
      facilityId: dto.facilityId || null,
      encounterDate: new Date(dto.encounterDate),
      encounterDateEnd: dto.encounterDateEnd
        ? new Date(dto.encounterDateEnd)
        : null,
      classCode: dto.classCode || 'AMB',
      reasonForVisit: dto.reasonForVisit || null,
      billingNote: dto.billingNote || null,
      supervisorId: dto.supervisorId || null,
      posCode: dto.posCode || null,
    });
    const saved = await this.encounterRepo.save(encounter);

    if (dto.diagnoses?.length) {
      const diagnoses = dto.diagnoses.map((d) =>
        this.diagnosisRepo.create({
          encounterId: saved.id,
          code: d.code,
          codeSystem: d.codeSystem || 'ICD-10',
          description: d.description,
          isPrimary: d.isPrimary || false,
        }),
      );
      await this.diagnosisRepo.save(diagnoses);
    }

    return saved;
  }

  async findEncountersByPatient(
    patientId: number,
    pagination: PaginationDto,
  ): Promise<{ data: Encounter[]; total: number }> {
    const [data, total] = await this.encounterRepo.findAndCount({
      where: { patientId },
      order: { encounterDate: 'DESC' },
      skip: pagination.skip,
      take: pagination.limit,
    });
    return { data, total };
  }

  async findEncounterByUuid(
    uuid: string,
    patientId?: number,
  ): Promise<Encounter> {
    const where: any = { uuid };
    if (patientId) where.patientId = patientId;
    const encounter = await this.encounterRepo.findOne({ where });
    if (!encounter) throw new NotFoundException('Encounter not found');
    return encounter;
  }

  async updateEncounter(
    uuid: string,
    patientId: number,
    dto: UpdateEncounterDto,
  ): Promise<Encounter> {
    const encounter = await this.findEncounterByUuid(uuid, patientId);
    const updateData: any = { ...dto };
    if (dto.encounterDate)
      updateData.encounterDate = new Date(dto.encounterDate);
    if (dto.encounterDateEnd)
      updateData.encounterDateEnd = new Date(dto.encounterDateEnd);
    delete updateData.diagnoses;
    Object.assign(encounter, updateData);
    return this.encounterRepo.save(encounter);
  }

  async getDiagnoses(encounterId: number): Promise<EncounterDiagnosis[]> {
    return this.diagnosisRepo.find({ where: { encounterId } });
  }

  // ── Vitals ──

  async createVitals(
    encounterId: number,
    patientId: number,
    userId: number | null,
    dto: CreateVitalsDto,
  ): Promise<Vitals> {
    const { observedAt, ...rest } = dto;
    const vitals = this.vitalsRepo.create({
      ...rest,
      encounterId,
      patientId,
      userId,
      observedAt: new Date(observedAt),
    });
    return this.vitalsRepo.save(vitals);
  }

  async getVitals(encounterId: number): Promise<Vitals[]> {
    return this.vitalsRepo.find({
      where: { encounterId },
      order: { observedAt: 'DESC' },
    });
  }

  // ── Conditions ──

  async createCondition(
    patientId: number,
    data: Partial<Condition>,
  ): Promise<Condition> {
    const condition = this.conditionRepo.create({ ...data, patientId });
    return this.conditionRepo.save(condition);
  }

  async getConditions(patientId: number): Promise<Condition[]> {
    return this.conditionRepo.find({
      where: { patientId },
      order: { createdAt: 'DESC' },
    });
  }

  // ── Allergies ──

  async createAllergy(
    patientId: number,
    data: Partial<Allergy>,
  ): Promise<Allergy> {
    const allergy = this.allergyRepo.create({ ...data, patientId });
    return this.allergyRepo.save(allergy);
  }

  async getAllergies(patientId: number): Promise<Allergy[]> {
    return this.allergyRepo.find({
      where: { patientId },
      order: { createdAt: 'DESC' },
    });
  }
}
