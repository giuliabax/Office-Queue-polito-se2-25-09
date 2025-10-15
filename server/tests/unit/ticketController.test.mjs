import { jest } from '@jest/globals';

// Mock all DAO modules before importing the controller
const mockQueueDAO = {
  getQueueByServiceTypeId: jest.fn()
};

const mockTicketDAO = {
  createTicket: jest.fn()
};

const mockServiceTypeDAO = {
  getServiceTypeById: jest.fn()
};

// Mock the modules
jest.unstable_mockModule('../../dao/queue-dao.mjs', () => mockQueueDAO);
jest.unstable_mockModule('../../dao/ticket-dao.mjs', () => mockTicketDAO);
jest.unstable_mockModule('../../dao/service-type-dao.mjs', () => mockServiceTypeDAO);

// Import controller after mocking
const { getTicket } = await import('../../controllers/ticketController.mjs');

describe('TicketController - getTicket', () => {
  let mockReq;
  let mockRes;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    // Setup mock request and response objects
    mockReq = {
      body: {
        serviceTypeId: 1
      }
    };

    mockRes = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };
  });

  describe('Successful ticket creation', () => {
    test('should create and return a ticket when queue exists', async () => {
      // Arrange
      const mockQueue = {
        id: 1,
        serviceTypeId: 1,
        lastIssuedTicketNumber: 5,
        save: jest.fn().mockResolvedValue(true)
      };

      const mockTicket = {
        id: 10,
        number: 6,
        queueId: 1,
        status: 'WAITING'
      };

      const mockServiceType = {
        id: 1,
        name: 'Package Delivery',
        acronym: 'PADE'
      };

      mockQueueDAO.getQueueByServiceTypeId.mockResolvedValue(mockQueue);
      mockTicketDAO.createTicket.mockResolvedValue(mockTicket);
      mockServiceTypeDAO.getServiceTypeById.mockResolvedValue(mockServiceType);

      // Act
      await getTicket(mockReq, mockRes);

      // Assert
      expect(mockQueueDAO.getQueueByServiceTypeId).toHaveBeenCalledWith(1);
      expect(mockTicketDAO.createTicket).toHaveBeenCalledWith(6, 1);
      expect(mockQueue.save).toHaveBeenCalled();
      expect(mockQueue.lastIssuedTicketNumber).toBe(6);
      expect(mockServiceTypeDAO.getServiceTypeById).toHaveBeenCalledWith(1);
      
      expect(mockRes.json).toHaveBeenCalledWith({
        ticketNumber: 6,
        serviceTypeName: 'Package Delivery',
        estimatedWaitTime: 10
      });
    });

    test('should increment ticket number correctly', async () => {
      // Arrange
      const mockQueue = {
        id: 2,
        serviceTypeId: 2,
        lastIssuedTicketNumber: 0,
        save: jest.fn().mockResolvedValue(true)
      };

      const mockTicket = {
        id: 1,
        number: 1,
        queueId: 2,
        status: 'WAITING'
      };

      const mockServiceType = {
        id: 2,
        name: 'Document Service',
        acronym: 'DOCS'
      };

      mockQueueDAO.getQueueByServiceTypeId.mockResolvedValue(mockQueue);
      mockTicketDAO.createTicket.mockResolvedValue(mockTicket);
      mockServiceTypeDAO.getServiceTypeById.mockResolvedValue(mockServiceType);

      // Act
      await getTicket(mockReq, mockRes);

      // Assert
      expect(mockTicketDAO.createTicket).toHaveBeenCalledWith(1, 2);
      expect(mockQueue.lastIssuedTicketNumber).toBe(1);
      expect(mockRes.json).toHaveBeenCalledWith({
        ticketNumber: 1,
        serviceTypeName: 'Document Service',
        estimatedWaitTime: 10
      });
    });
  });

  describe('Error handling', () => {
    test('should return 404 when queue not found', async () => {
      // Arrange
      mockQueueDAO.getQueueByServiceTypeId.mockResolvedValue(null);

      // Act
      await getTicket(mockReq, mockRes);

      // Assert
      expect(mockQueueDAO.getQueueByServiceTypeId).toHaveBeenCalledWith(1);
      expect(mockTicketDAO.createTicket).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ 
        error: 'Service type not found or queue missing' 
      });
    });

    test('should return 404 when queue is undefined', async () => {
      // Arrange
      mockQueueDAO.getQueueByServiceTypeId.mockResolvedValue(undefined);

      // Act
      await getTicket(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ 
        error: 'Service type not found or queue missing' 
      });
    });

    test('should return 500 when queueDAO throws error', async () => {
      // Arrange
      const error = new Error('Database connection failed');
      mockQueueDAO.getQueueByServiceTypeId.mockRejectedValue(error);

      // Spy on console.error to verify error logging
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      // Act
      await getTicket(mockReq, mockRes);

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error in getTicket:', error);
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ 
        error: 'Internal server error' 
      });

      // Cleanup
      consoleErrorSpy.mockRestore();
    });

    test('should return 500 when ticketDAO.createTicket fails', async () => {
      // Arrange
      const mockQueue = {
        id: 1,
        serviceTypeId: 1,
        lastIssuedTicketNumber: 5,
        save: jest.fn()
      };

      const error = new Error('Failed to create ticket');
      mockQueueDAO.getQueueByServiceTypeId.mockResolvedValue(mockQueue);
      mockTicketDAO.createTicket.mockRejectedValue(error);

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      // Act
      await getTicket(mockReq, mockRes);

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error in getTicket:', error);
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ 
        error: 'Internal server error' 
      });

      consoleErrorSpy.mockRestore();
    });

    test('should return 500 when queue.save() fails', async () => {
      // Arrange
      const mockQueue = {
        id: 1,
        serviceTypeId: 1,
        lastIssuedTicketNumber: 5,
        save: jest.fn().mockRejectedValue(new Error('Save failed'))
      };

      const mockTicket = {
        id: 10,
        number: 6,
        queueId: 1,
        status: 'WAITING'
      };

      mockQueueDAO.getQueueByServiceTypeId.mockResolvedValue(mockQueue);
      mockTicketDAO.createTicket.mockResolvedValue(mockTicket);

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      // Act
      await getTicket(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ 
        error: 'Internal server error' 
      });

      consoleErrorSpy.mockRestore();
    });

    test('should return 500 when serviceTypeDAO fails', async () => {
      // Arrange
      const mockQueue = {
        id: 1,
        serviceTypeId: 1,
        lastIssuedTicketNumber: 5,
        save: jest.fn().mockResolvedValue(true)
      };

      const mockTicket = {
        id: 10,
        number: 6,
        queueId: 1,
        status: 'WAITING'
      };

      const error = new Error('Service type not found in DB');
      mockQueueDAO.getQueueByServiceTypeId.mockResolvedValue(mockQueue);
      mockTicketDAO.createTicket.mockResolvedValue(mockTicket);
      mockServiceTypeDAO.getServiceTypeById.mockRejectedValue(error);

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      // Act
      await getTicket(mockReq, mockRes);

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error in getTicket:', error);
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ 
        error: 'Internal server error' 
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Request validation', () => {
    test('should handle invalid request body gracefully', async () => {
      // Arrange
      mockReq.body = {}; // Missing serviceTypeId

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      // Act
      await getTicket(mockReq, mockRes);

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ 
        error: 'Internal server error' 
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Integration of components', () => {
    test('should correctly use QueueInfo to calculate next ticket number', async () => {
      // Arrange
      const mockQueue = {
        id: 3,
        serviceTypeId: 3,
        lastIssuedTicketNumber: 99,
        save: jest.fn().mockResolvedValue(true)
      };

      const mockTicket = {
        id: 100,
        number: 100,
        queueId: 3,
        status: 'WAITING'
      };

      const mockServiceType = {
        id: 3,
        name: 'Emergency Service',
        acronym: 'EMER'
      };

      mockQueueDAO.getQueueByServiceTypeId.mockResolvedValue(mockQueue);
      mockTicketDAO.createTicket.mockResolvedValue(mockTicket);
      mockServiceTypeDAO.getServiceTypeById.mockResolvedValue(mockServiceType);

      // Act
      await getTicket(mockReq, mockRes);

      // Assert - verify QueueInfo.getNextTicketNumber logic (lastIssuedTicketNumber + 1)
      expect(mockTicketDAO.createTicket).toHaveBeenCalledWith(100, 3);
      expect(mockQueue.lastIssuedTicketNumber).toBe(100);
    });

    test('should correctly build TicketDTO response', async () => {
      // Arrange
      const mockQueue = {
        id: 1,
        serviceTypeId: 1,
        lastIssuedTicketNumber: 10,
        save: jest.fn().mockResolvedValue(true)
      };

      const mockTicket = {
        id: 11,
        number: 11,
        queueId: 1,
        status: 'WAITING'
      };

      const mockServiceType = {
        id: 1,
        name: 'General Service',
        acronym: 'GENE'
      };

      mockQueueDAO.getQueueByServiceTypeId.mockResolvedValue(mockQueue);
      mockTicketDAO.createTicket.mockResolvedValue(mockTicket);
      mockServiceTypeDAO.getServiceTypeById.mockResolvedValue(mockServiceType);

      // Act
      await getTicket(mockReq, mockRes);

      // Assert - verify TicketDTO structure
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          ticketNumber: expect.any(Number),
          serviceTypeName: expect.any(String),
          estimatedWaitTime: expect.any(Number)
        })
      );
    });
  });
});

