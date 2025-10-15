import { jest } from '@jest/globals';

const mockQueueModel = {
  create: jest.fn(),
  findOne: jest.fn(),
  findAll: jest.fn()
};

const mockServiceTypeModel = {};
const mockTicketModel = {};

jest.unstable_mockModule('../../models/queue.mjs', () => ({
  Queue: mockQueueModel
}));

jest.unstable_mockModule('../../models/index.mjs', () => ({
  ServiceType: mockServiceTypeModel,
  Ticket: mockTicketModel
}));

const dao = await import('../../dao/queue-dao.mjs');

describe('queue-dao', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createQueue', () => {
    it('should create a queue for serviceTypeId', async () => {
      const created = { id: 1, serviceTypeId: 2 };
      mockQueueModel.create.mockResolvedValue(created);

      const result = await dao.createQueue(2);

      expect(mockQueueModel.create).toHaveBeenCalledWith({ serviceTypeId: 2 });
      expect(result).toBe(created);
    });

    it('should propagate errors on create', async () => {
      const err = new Error('create failed');
      mockQueueModel.create.mockRejectedValue(err);

      await expect(dao.createQueue(1)).rejects.toThrow(err);
    });
  });

  describe('getLastIssuedTicketNumberByQueueId', () => {
    it('should return lastIssuedTicketNumber of the queue', async () => {
      const queue = { id: 1, lastIssuedTicketNumber: 42 };
      mockQueueModel.findOne.mockResolvedValue(queue);

      const result = await dao.getLastIssuedTicketNumberByQueueId(1);

      expect(mockQueueModel.findOne).toHaveBeenCalledWith({ where: { queueId: 1 } });
      expect(result).toBe(42);
    });

    it('should throw if findOne fails', async () => {
      const err = new Error('findOne failed');
      mockQueueModel.findOne.mockRejectedValue(err);

      await expect(dao.getLastIssuedTicketNumberByQueueId(1)).rejects.toThrow(err);
    });
  });

  describe('getLastIssuedTicketNumberByServiceTypeId', () => {
    it('should return lastIssuedTicketNumber of the queue for serviceTypeId', async () => {
      const queue = { id: 1, lastIssuedTicketNumber: 5 };
      mockQueueModel.findOne.mockResolvedValue(queue);

      const result = await dao.getLastIssuedTicketNumberByServiceTypeId(2);

      expect(mockQueueModel.findOne).toHaveBeenCalledWith({ where: { serviceTypeId: 2 } });
      expect(result).toBe(5);
    });

    it('should throw if findOne fails', async () => {
      const err = new Error('findOne failed');
      mockQueueModel.findOne.mockRejectedValue(err);

      await expect(dao.getLastIssuedTicketNumberByServiceTypeId(2)).rejects.toThrow(err);
    });
  });

  describe('getQueueByServiceTypeId', () => {
    it('should return queue by serviceTypeId', async () => {
      const queue = { id: 1, serviceTypeId: 3 };
      mockQueueModel.findOne.mockResolvedValue(queue);

      const result = await dao.getQueueByServiceTypeId(3);

      expect(mockQueueModel.findOne).toHaveBeenCalledWith({ where: { serviceTypeId: 3 } });
      expect(result).toBe(queue);
    });

    it('should throw if findOne fails', async () => {
      const err = new Error('findOne failed');
      mockQueueModel.findOne.mockRejectedValue(err);

      await expect(dao.getQueueByServiceTypeId(3)).rejects.toThrow(err);
    });
  });

  describe('getQueuesByServiceTypes', () => {
    it('should return queues including tickets and serviceType', async () => {
      const rows = [{ id: 1 }, { id: 2 }];
      mockQueueModel.findAll.mockResolvedValue(rows);

      const result = await dao.getQueuesByServiceTypes([1, 2]);

      expect(mockQueueModel.findAll).toHaveBeenCalledWith({
        where: { serviceTypeId: [1, 2] },
        include: [
          {
            model: mockTicketModel,
            as: 'tickets',
            where: { status: 'waiting' },
            required: false,
          },
          { model: mockServiceTypeModel, as: 'serviceType' },
        ],
      });
      expect(result).toBe(rows);
    });

    it('should propagate errors from findAll', async () => {
      const err = new Error('findAll failed');
      mockQueueModel.findAll.mockRejectedValue(err);

      await expect(dao.getQueuesByServiceTypes([1])).rejects.toThrow(err);
    });
  });
});
