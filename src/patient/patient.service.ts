import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Patient } from './entities/patient.entity.js';
import { CreatePatientDto } from './dto/create-patient.dto.js';
import { UpdatePatientDto } from './dto/update-patient.dto.js';
import { PatientQueryDto } from './dto/patient-query.dto.js';
import { encrypt } from '../common/utils/crypto.util.js';

@Injectable()
export class PatientService {
  constructor(
    @InjectRepository(Patient)
    private readonly patientRepo: Repository<Patient>,
  ) {}

  async create(dto: CreatePatientDto & { mrn?: string; tenantId?: number }): Promise<Patient> {
    const mrn = dto.mrn || (await this.generateMrn());
    const patient = this.patientRepo.create({
      ...dto,
      mrn,
      ssnEncrypted: dto.ssn
        ? encrypt(dto.ssn, process.env.ENCRYPTION_KEY || '')
        : null,
    });
    return this.patientRepo.save(patient);
  }

  async findAll(
    query: PatientQueryDto,
  ): Promise<{ data: Patient[]; total: number }> {
    const qb = this.patientRepo.createQueryBuilder('p');

    if (query.search) {
      const terms = query.search.trim().split(/\s+/);
      if (terms.length >= 2) {
        // "Ronald Hall" → match firstName=Ronald + lastName=Hall or vice versa
        qb.andWhere(
          '((p.firstName LIKE :term1 AND p.lastName LIKE :term2) OR (p.firstName LIKE :term2 AND p.lastName LIKE :term1) OR p.mrn LIKE :full)',
          { term1: `%${terms[0]}%`, term2: `%${terms[1]}%`, full: `%${query.search}%` },
        );
      } else {
        qb.andWhere(
          '(p.firstName LIKE :search OR p.lastName LIKE :search OR p.mrn LIKE :search)',
          { search: `%${query.search}%` },
        );
      }
    }
    if (query.firstName) {
      qb.andWhere('p.firstName LIKE :firstName', {
        firstName: `%${query.firstName}%`,
      });
    }
    if (query.lastName) {
      qb.andWhere('p.lastName LIKE :lastName', {
        lastName: `%${query.lastName}%`,
      });
    }
    if (query.mrn) {
      qb.andWhere('p.mrn = :mrn', { mrn: query.mrn });
    }
    if (query.dateOfBirth) {
      qb.andWhere('p.dateOfBirth = :dob', { dob: query.dateOfBirth });
    }
    if (query.sex) {
      qb.andWhere('p.sex = :sex', { sex: query.sex });
    }

    qb.orderBy('p.lastName', 'ASC')
      .addOrderBy('p.firstName', 'ASC')
      .skip(query.skip)
      .take(query.limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }

  async findByUuid(uuid: string): Promise<Patient> {
    const patient = await this.patientRepo.findOne({ where: { uuid } });
    if (!patient) throw new NotFoundException('Patient not found');
    return patient;
  }

  async findById(id: number): Promise<Patient> {
    const patient = await this.patientRepo.findOne({ where: { id } });
    if (!patient) throw new NotFoundException('Patient not found');
    return patient;
  }

  async update(uuid: string, dto: UpdatePatientDto): Promise<Patient> {
    const patient = await this.findByUuid(uuid);
    const updateData: any = { ...dto };

    if (dto.ssn !== undefined) {
      updateData.ssnEncrypted = dto.ssn
        ? encrypt(dto.ssn, process.env.ENCRYPTION_KEY || '')
        : null;
      delete updateData.ssn;
    }

    Object.assign(patient, updateData);
    return this.patientRepo.save(patient);
  }

  async deleteByMrnPrefix(prefix: string, tenantId?: number): Promise<number> {
    const qb = this.patientRepo
      .createQueryBuilder()
      .delete()
      .where('mrn LIKE :prefix', { prefix: `${prefix}%` });
    if (tenantId) {
      qb.andWhere('tenantId = :tenantId', { tenantId });
    }
    const result = await qb.execute();
    return result.affected || 0;
  }

  private async generateMrn(): Promise<string> {
    const result = await this.patientRepo
      .createQueryBuilder('p')
      .select('MAX(CAST(p.mrn AS UNSIGNED))', 'maxMrn')
      .getRawOne();
    const next = (parseInt(result?.maxMrn || '0', 10) + 1)
      .toString()
      .padStart(8, '0');
    return next;
  }
}
