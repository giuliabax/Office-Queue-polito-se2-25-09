import { jest } from '@jest/globals';

const mockServiceType = {
  create: jest.fn(),
  findAll: jest.fn(),
  findByPk: jest.fn()
};

jest.unstable_mockModule('../../models/service-type.mjs', () => ({
  ServiceType: mockServiceType
}));

const dao = await import('../../dao/service-type-dao.mjs');

describe('service-type-dao', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createServiceType', () => {
    it('should create a service type with name and acronym', async () => {
      const created = { id: 1, name: 'Packages Delivery', acronym: 'PADE' };
      mockServiceType.create.mockResolvedValue(created);

      const result = await dao.createServiceType('Packages Delivery', 'PADE');

      expect(mockServiceType.create).toHaveBeenCalledWith({ name: 'Packages Delivery', acronym: 'PADE' });
      expect(result).toBe(created);
    });

    it('should propagate errors from create', async () => {
      const err = new Error('create failed');
      mockServiceType.create.mockRejectedValue(err);

      await expect(dao.createServiceType('X', 'Y')).rejects.toThrow(err);
    });
  });

  describe('getAllServiceTypes', () => {
    it('should return all service types', async () => {
      const rows = [
        { id: 1, name: 'Docs', acronym: 'DOCS' },
        { id: 2, name: 'Payments', acronym: 'PAY' }
      ];
      mockServiceType.findAll.mockResolvedValue(rows);

      const result = await dao.getAllServiceTypes();

      expect(mockServiceType.findAll).toHaveBeenCalled();
      expect(result).toBe(rows);
    });

    it('should propagate errors from findAll', async () => {
      const err = new Error('findAll failed');
      mockServiceType.findAll.mockRejectedValue(err);

      await expect(dao.getAllServiceTypes()).rejects.toThrow(err);
    });
  });

  describe('getServiceTypeById', () => {
    it('should return service type by id', async () => {
      const st = { id: 10, name: 'General', acronym: 'GEN' };
      mockServiceType.findByPk.mockResolvedValue(st);

      const result = await dao.getServiceTypeById(10);

      expect(mockServiceType.findByPk).toHaveBeenCalledWith(10);
      expect(result).toBe(st);
    });

    it('should propagate errors from findByPk', async () => {
      const err = new Error('findByPk failed');
      mockServiceType.findByPk.mockRejectedValue(err);

      await expect(dao.getServiceTypeById(1)).rejects.toThrow(err);
    });
  });
});
