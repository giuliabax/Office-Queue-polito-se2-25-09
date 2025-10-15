import { jest } from '@jest/globals';

const mockCounter = {
  create: jest.fn(),
  findOne: jest.fn()
};

jest.unstable_mockModule('../../models/counter.mjs', () => ({
  Counter: mockCounter
}));

const dao = await import('../../dao/counter-dao.mjs');

describe('counter-dao', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createCounter', () => {
    it('should create a counter with number', async () => {
      const created = { id: 1, number: 7 };
      mockCounter.create.mockResolvedValue(created);

      const result = await dao.createCounter(7);

      expect(mockCounter.create).toHaveBeenCalledWith({ number: 7 });
      expect(result).toBe(created);
    });

    it('should propagate errors on create', async () => {
      const err = new Error('create failed');
      mockCounter.create.mockRejectedValue(err);

      await expect(dao.createCounter(1)).rejects.toThrow(err);
    });
  });

  describe('getCounterByNumber', () => {
    it('should find counter by number', async () => {
      const counter = { id: 3, number: 10 };
      mockCounter.findOne.mockResolvedValue(counter);

      const result = await dao.getCounterByNumber(10);

      expect(mockCounter.findOne).toHaveBeenCalledWith({ where: { number: 10 } });
      expect(result).toBe(counter);
    });

    it('should propagate errors on findOne', async () => {
      const err = new Error('findOne failed');
      mockCounter.findOne.mockRejectedValue(err);

      await expect(dao.getCounterByNumber(1)).rejects.toThrow(err);
    });
  });
});
