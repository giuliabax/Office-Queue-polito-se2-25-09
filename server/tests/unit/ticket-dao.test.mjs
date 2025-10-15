import { jest } from '@jest/globals';

const mockTicketInstance = {
  id: 1,
  number: 7,
  queueId: 2,
  status: 'WAITING',
  save: jest.fn().mockResolvedValue(true)
};

const mockTicket = {
  create: jest.fn(),
  findOne: jest.fn(),
  findByPk: jest.fn()
};

jest.unstable_mockModule('../../models/ticket.mjs', () => ({
  Ticket: mockTicket
}));

const dao = await import('../../dao/ticket-dao.mjs');

describe('ticket-dao', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTicketInstance.status = 'WAITING';
  });

  describe('createTicket', () => {
    it('should create a ticket with number and queueId', async () => {
      const created = { id: 10, number: 5, queueId: 1, status: 'WAITING' };
      mockTicket.create.mockResolvedValue(created);

      const result = await dao.createTicket(5, 1);

      expect(mockTicket.create).toHaveBeenCalledWith({ number: 5, queueId: 1 });
      expect(result).toBe(created);
    });

    it('should propagate errors from create', async () => {
      const err = new Error('DB create failed');
      mockTicket.create.mockRejectedValue(err);

      await expect(dao.createTicket(5, 1)).rejects.toThrow(err);
    });
  });

  describe('setTicketStatus', () => {
    it('should set status and save when ticket exists', async () => {
      mockTicket.findOne.mockResolvedValue(mockTicketInstance);

      const result = await dao.setTicketStatus(7, 'SERVED', 2);

      expect(mockTicket.findOne).toHaveBeenCalledWith({ where: { number: 7, queueId: 2 } });
      expect(mockTicketInstance.status).toBe('SERVED');
      expect(mockTicketInstance.save).toHaveBeenCalled();
      expect(result).toBe(mockTicketInstance);
    });

    it('should return null when ticket not found', async () => {
      mockTicket.findOne.mockResolvedValue(null);

      const result = await dao.setTicketStatus(1, 'SERVED', 1);

      expect(result).toBeNull();
    });

    it('should propagate errors from findOne', async () => {
      const err = new Error('findOne failed');
      mockTicket.findOne.mockRejectedValue(err);

      await expect(dao.setTicketStatus(1, 'SERVED', 1)).rejects.toThrow(err);
    });

    it('should propagate errors from save', async () => {
      mockTicket.findOne.mockResolvedValue({ ...mockTicketInstance, save: jest.fn().mockRejectedValue(new Error('save failed')) });

      await expect(dao.setTicketStatus(7, 'SERVED', 2)).rejects.toThrow('save failed');
    });
  });

  describe('getTicketById', () => {
    it('should return ticket by primary key', async () => {
      const t = { id: 99, number: 3, queueId: 1 };
      mockTicket.findByPk.mockResolvedValue(t);

      const result = await dao.getTicketById(99);

      expect(mockTicket.findByPk).toHaveBeenCalledWith(99);
      expect(result).toBe(t);
    });

    it('should propagate errors from findByPk', async () => {
      const err = new Error('findByPk failed');
      mockTicket.findByPk.mockRejectedValue(err);

      await expect(dao.getTicketById(1)).rejects.toThrow(err);
    });
  });
});
