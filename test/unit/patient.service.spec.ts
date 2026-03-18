import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PatientService } from '../../src/patient/patient.service.js';
import { Patient } from '../../src/patient/entities/patient.entity.js';

const mockPatient = {
  id: 1,
  uuid: 'test-uuid-1234',
  mrn: '00000001',
  firstName: 'John',
  lastName: 'Doe',
  dateOfBirth: '1985-03-15',
  sex: 'Male',
  status: 'active',
  countryCode: 'US',
  language: 'en',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockRepo = {
  create: jest.fn().mockImplementation((dto) => ({ ...mockPatient, ...dto })),
  save: jest.fn().mockImplementation((entity) =>
    Promise.resolve({ ...mockPatient, ...entity }),
  ),
  findOne: jest.fn(),
  createQueryBuilder: jest.fn(() => ({
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn().mockResolvedValue([[mockPatient], 1]),
    select: jest.fn().mockReturnThis(),
    getRawOne: jest.fn().mockResolvedValue({ maxMrn: '0' }),
  })),
};

describe('PatientService', () => {
  let service: PatientService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PatientService,
        { provide: getRepositoryToken(Patient), useValue: mockRepo },
      ],
    }).compile();

    service = module.get<PatientService>(PatientService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a patient with generated MRN', async () => {
      const dto = {
        firstName: 'Jane',
        lastName: 'Smith',
        dateOfBirth: '1990-01-01',
        sex: 'Female' as const,
      };
      const result = await service.create(dto);
      expect(result.firstName).toBe('Jane');
      expect(mockRepo.create).toHaveBeenCalled();
      expect(mockRepo.save).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return paginated patients', async () => {
      const result = await service.findAll({ page: 1, limit: 20, skip: 0 });
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should search by name', async () => {
      const result = await service.findAll({ page: 1, limit: 20, skip: 0, search: 'Doe' });
      expect(mockRepo.createQueryBuilder).toHaveBeenCalled();
      expect(result.data).toHaveLength(1);
    });
  });

  describe('findByUuid', () => {
    it('should return a patient by UUID', async () => {
      mockRepo.findOne.mockResolvedValue(mockPatient);
      const result = await service.findByUuid('test-uuid-1234');
      expect(result.uuid).toBe('test-uuid-1234');
    });

    it('should throw NotFoundException for invalid UUID', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(service.findByUuid('bad-uuid')).rejects.toThrow('Patient not found');
    });
  });

  describe('update', () => {
    it('should update patient fields', async () => {
      mockRepo.findOne.mockResolvedValue({ ...mockPatient });
      const result = await service.update('test-uuid-1234', { firstName: 'Johnny' });
      expect(mockRepo.save).toHaveBeenCalled();
      expect(result.firstName).toBe('Johnny');
    });
  });
});
