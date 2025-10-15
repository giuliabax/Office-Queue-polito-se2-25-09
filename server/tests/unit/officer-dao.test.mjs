import { jest } from '@jest/globals';

const mockOfficer = {
  create: jest.fn(),
  findOne: jest.fn()
};

jest.unstable_mockModule('../../models/officer.mjs', () => ({
  Officer: mockOfficer
}));

const dao = await import('../../dao/officer-dao.mjs');

describe('officer-dao', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createOfficer', () => {
    it('should create an officer with name, surname and counterId', async () => {
      const created = { id: 1, name: 'Alice', surname: 'Doe', counterId: 2 };
      mockOfficer.create.mockResolvedValue(created);

      const result = await dao.createOfficer('Alice', 'Doe', 2);

      expect(mockOfficer.create).toHaveBeenCalledWith({ name: 'Alice', surname: 'Doe', counterId: 2 });
      expect(result).toBe(created);
    });

    it('should propagate errors on create', async () => {
      const err = new Error('create failed');
      mockOfficer.create.mockRejectedValue(err);

      await expect(dao.createOfficer('A', 'B', 1)).rejects.toThrow(err);
    });
  });

  describe('getOfficerByCounterId', () => {
    it('should find officer by counterId', async () => {
      const officer = { id: 3, name: 'Bob', surname: 'Smith', counterId: 4 };
      mockOfficer.findOne.mockResolvedValue(officer);

      const result = await dao.getOfficerByCounterId(4);

      expect(mockOfficer.findOne).toHaveBeenCalledWith({ where: { counterId: 4 } });
      expect(result).toBe(officer);
    });

    it('should propagate errors on findOne', async () => {
      const err = new Error('findOne failed');
      mockOfficer.findOne.mockRejectedValue(err);

      await expect(dao.getOfficerByCounterId(1)).rejects.toThrow(err);
    });
  });
});
