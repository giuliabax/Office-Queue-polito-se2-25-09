import { jest } from '@jest/globals';

// Mocks
const mockServiceTypeCounter = {
  create: jest.fn()
};

const mockSequelize = {
  query: jest.fn(),
  QueryTypes: { SELECT: 'SELECT' }
};

jest.unstable_mockModule('../../models/service-type-counter.mjs', () => ({
  ServiceTypeCounter: mockServiceTypeCounter
}));

jest.unstable_mockModule('../../models/index.mjs', () => ({
  sequelize: mockSequelize
}));

// Import after mocks
const dao = await import('../../dao/service-type-counter-dao.mjs');


describe('service-type-counter-dao', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('addServiceTypeToCounter', () => {
    it('should create link between service type and counter', async () => {
      mockServiceTypeCounter.create.mockResolvedValue({ serviceTypeId: 1, counterId: 2 });

      const result = await dao.addServiceTypeToCounter(1, 2);

      expect(mockServiceTypeCounter.create).toHaveBeenCalledWith({ serviceTypeId: 1, counterId: 2 });
      expect(result).toEqual({ serviceTypeId: 1, counterId: 2 });
    });

    it('should propagate errors from model.create', async () => {
      const err = new Error('DB error');
      mockServiceTypeCounter.create.mockRejectedValue(err);

      await expect(dao.addServiceTypeToCounter(1, 2)).rejects.toThrow(err);
    });
  });

  describe('getServiceTypesByCounterId', () => {
    it('should query service types by counter id', async () => {
      const rows = [ { id: 1, name: 'Docs', acronym: 'DOCS' } ];
      mockSequelize.query.mockResolvedValue(rows);

      const result = await dao.getServiceTypesByCounterId(3);

      expect(mockSequelize.query).toHaveBeenCalledWith(
        expect.stringContaining('FROM "service-types"'),
        {
          replacements: { counterId: 3 },
          type: mockSequelize.QueryTypes.SELECT,
        }
      );
      expect(result).toBe(rows);
    });

    it('should propagate errors from sequelize.query', async () => {
      const err = new Error('Query failed');
      mockSequelize.query.mockRejectedValue(err);

      await expect(dao.getServiceTypesByCounterId(5)).rejects.toThrow(err);
    });
  });
});
