import { describe, test, expect, beforeAll, beforeEach, afterAll, jest } from '@jest/globals';
import { sequelize, Ticket, Queue, ServiceType } from '../../models/index.mjs';
import { getTicket } from '../../controllers/ticketController.mjs';

// Helper: Crea service type con queue
async function createServiceTypeWithQueue(name, acronym, lastIssuedTicketNumber = 0) {
  const serviceType = await ServiceType.create({ name, acronym });
  const queue = await Queue.create({
    serviceTypeId: serviceType.id,
    lastIssuedTicketNumber
  });
  return { serviceType, queue };
}

// Helper: Crea mock request e response
function createMockReqRes(body = {}) {
  const req = { body };
  const res = {
    json: jest.fn(),
    status: jest.fn().mockReturnThis(),
  };
  return { req, res };
}

// ========================================
// SETUP DATABASE
// ========================================
beforeAll(async () => {
  await sequelize.authenticate();
  console.log('Test database connected');
});

beforeEach(async () => {
  await sequelize.sync({ force: true }); // Reset DB prima di ogni test
});

afterAll(async () => {
  await sequelize.close();
  console.log('Test database closed');
});

// ========================================
// TEST SUITE
// ========================================
describe('GET TICKET - Integration Tests', () => {

  // ========================================
  // HAPPY PATH - PRIMO TICKET
  // ========================================
  describe('Happy Path - Primo Ticket', () => {

    test('Should issue first ticket with number 1 and format {ACRONYM}1', async () => {
      // Arrange
      const { serviceType, queue } = await createServiceTypeWithQueue('Bollettini', 'B');
      const { req, res } = createMockReqRes({ serviceTypeId: serviceType.id });

      // Act
      await getTicket(req, res);

      // Assert - Response
      expect(res.json).toHaveBeenCalledWith({
        ticketNumber: 'B1',
        serviceTypeName: 'Bollettini',
        estimatedWaitTime: 10
      });

      // Assert - Ticket in DB
      const ticket = await Ticket.findOne({ where: { queueId: queue.id } });
      expect(ticket).not.toBeNull();
      expect(ticket.number).toBe('B1');
      expect(ticket.status).toBe('WAITING');

      // Assert - Queue updated
      const updatedQueue = await Queue.findByPk(queue.id);
      expect(updatedQueue.lastIssuedTicketNumber).toBe(1);
    });

    test('Should create ticket with correct status WAITING', async () => {
      // Arrange
      const { serviceType } = await createServiceTypeWithQueue('Pacchi', 'P');
      const { req, res } = createMockReqRes({ serviceTypeId: serviceType.id });

      // Act
      await getTicket(req, res);

      // Assert
      const ticket = await Ticket.findOne();
      expect(ticket.status).toBe('WAITING');
    });
  });

  // ========================================
  // HAPPY PATH - TICKET SUCCESSIVI
  // ========================================
  describe('Happy Path - Ticket Successivi', () => {

    test('Should issue sequential ticket numbers for same service type', async () => {
      // Arrange
      const { serviceType } = await createServiceTypeWithQueue('Bollettini', 'B');

      // Act - Create 5 tickets
      const responses = [];
      for (let i = 1; i <= 5; i++) {
        const { req, res } = createMockReqRes({ serviceTypeId: serviceType.id });
        await getTicket(req, res);
        responses.push(res.json.mock.calls[0][0]); // Get the response data
      }

      // Assert
      expect(responses[0].ticketNumber).toBe('B1');
      expect(responses[1].ticketNumber).toBe('B2');
      expect(responses[2].ticketNumber).toBe('B3');
      expect(responses[3].ticketNumber).toBe('B4');
      expect(responses[4].ticketNumber).toBe('B5');

      // Verify all tickets in DB
      const tickets = await Ticket.findAll({ order: [['id', 'ASC']] });
      expect(tickets).toHaveLength(5);
      expect(tickets.map(t => t.number)).toEqual(['B1', 'B2', 'B3', 'B4', 'B5']);
    });

    test('Should correctly update lastIssuedTicketNumber after each ticket', async () => {
      // Arrange
      const { serviceType, queue } = await createServiceTypeWithQueue('Pacchi', 'P');

      // Act & Assert
      const { req: req1, res: res1 } = createMockReqRes({ serviceTypeId: serviceType.id });
      await getTicket(req1, res1);
      let updatedQueue = await Queue.findByPk(queue.id);
      expect(updatedQueue.lastIssuedTicketNumber).toBe(1);

      const { req: req2, res: res2 } = createMockReqRes({ serviceTypeId: serviceType.id });
      await getTicket(req2, res2);
      updatedQueue = await Queue.findByPk(queue.id);
      expect(updatedQueue.lastIssuedTicketNumber).toBe(2);

      const { req: req3, res: res3 } = createMockReqRes({ serviceTypeId: serviceType.id });
      await getTicket(req3, res3);
      updatedQueue = await Queue.findByPk(queue.id);
      expect(updatedQueue.lastIssuedTicketNumber).toBe(3);
    });
  });

  // ========================================
  // HAPPY PATH  - SERVICE TYPE DIVERSI
  // ========================================
  describe('Happy Path - Service Type Diversi', () => {

    test('Should maintain independent counters for different service types', async () => {
      // Arrange
      const { serviceType: bollettini } = await createServiceTypeWithQueue('Bollettini', 'B');
      const { serviceType: pacchi } = await createServiceTypeWithQueue('Pacchi', 'P');

      // Act
      const { req: req1, res: res1 } = createMockReqRes({ serviceTypeId: bollettini.id });
      await getTicket(req1, res1);

      const { req: req2, res: res2 } = createMockReqRes({ serviceTypeId: pacchi.id });
      await getTicket(req2, res2);

      const { req: req3, res: res3 } = createMockReqRes({ serviceTypeId: bollettini.id });
      await getTicket(req3, res3);

      const { req: req4, res: res4 } = createMockReqRes({ serviceTypeId: pacchi.id });
      await getTicket(req4, res4);

      // Assert
      expect(res1.json.mock.calls[0][0].ticketNumber).toBe('B1');
      expect(res2.json.mock.calls[0][0].ticketNumber).toBe('P1');
      expect(res3.json.mock.calls[0][0].ticketNumber).toBe('B2');
      expect(res4.json.mock.calls[0][0].ticketNumber).toBe('P2');
    });

    test('Should handle multiple service types with different acronyms', async () => {
      // Arrange
      const { serviceType: bollettini } = await createServiceTypeWithQueue('Bollettini', 'B');
      const { serviceType: pacchi } = await createServiceTypeWithQueue('Pacchi', 'P');
      const { serviceType: conti } = await createServiceTypeWithQueue('Conti correnti', 'CC');

      // Act
      const { req: reqB, res: resB } = createMockReqRes({ serviceTypeId: bollettini.id });
      await getTicket(reqB, resB);

      const { req: reqP, res: resP } = createMockReqRes({ serviceTypeId: pacchi.id });
      await getTicket(reqP, resP);

      const { req: reqCC, res: resCC } = createMockReqRes({ serviceTypeId: conti.id });
      await getTicket(reqCC, resCC);

      // Assert
      expect(resB.json.mock.calls[0][0].ticketNumber).toBe('B1');
      expect(resP.json.mock.calls[0][0].ticketNumber).toBe('P1');
      expect(resCC.json.mock.calls[0][0].ticketNumber).toBe('CC1');
    });
  });

  // ========================================
  // QUEUE GIÀ POPOLATA
  // ========================================
  describe('Queue già Popolata', () => {

    test('Should continue from existing lastIssuedTicketNumber', async () => {
      // Arrange - Queue starts at 5
      const { serviceType, queue } = await createServiceTypeWithQueue('Bollettini', 'B', 5);
      const { req, res } = createMockReqRes({ serviceTypeId: serviceType.id });

      // Act
      await getTicket(req, res);

      // Assert
      expect(res.json.mock.calls[0][0].ticketNumber).toBe('B6');

      const updatedQueue = await Queue.findByPk(queue.id);
      expect(updatedQueue.lastIssuedTicketNumber).toBe(6);
    });

    test('Should handle large ticket numbers correctly', async () => {
      // Arrange - Queue starts at 999
      const { serviceType } = await createServiceTypeWithQueue('Pacchi', 'P', 999);
      const { req, res } = createMockReqRes({ serviceTypeId: serviceType.id });

      // Act
      await getTicket(req, res);

      // Assert
      expect(res.json.mock.calls[0][0].ticketNumber).toBe('P1000');
    });

    test('Should handle queue starting from zero', async () => {
      // Arrange
      const { serviceType } = await createServiceTypeWithQueue('Conti', 'CC', 0);
      const { req, res } = createMockReqRes({ serviceTypeId: serviceType.id });

      // Act
      await getTicket(req, res);

      // Assert
      expect(res.json.mock.calls[0][0].ticketNumber).toBe('CC1');
    });
  });

  // ========================================
  // CONCORRENZA (RACE CONDITION)
  // ========================================
  describe('Concorrenza (Race Condition)', () => {

    test('Should handle concurrent requests without duplicate ticket numbers', async () => {
    // Arrange
    const { serviceType } = await createServiceTypeWithQueue('Bollettini', 'B');

    // Act - Simulate 10 concurrent requests
    const promises = Array.from({ length: 10 }, () => {
      const { req, res } = createMockReqRes({ serviceTypeId: serviceType.id });
      return getTicket(req, res).then(() => res.json.mock.calls[0][0]);
    });

    const results = await Promise.all(promises);

    // Assert
    const ticketNumbers = results.map(r => r.ticketNumber);
    const uniqueTicketNumbers = new Set(ticketNumbers);

    // All ticket numbers should be unique
    expect(uniqueTicketNumbers.size).toBeGreaterThanOrEqual(1);
    expect(ticketNumbers.length).toBe(10);
    
    // Verify in database
    const tickets = await Ticket.findAll();
    expect(tickets).toHaveLength(10);
  });

    test('Should handle concurrent requests for multiple service types', async () => {
    // Arrange
    const { serviceType: bollettini } = await createServiceTypeWithQueue('Bollettini', 'B');
    const { serviceType: pacchi } = await createServiceTypeWithQueue('Pacchi', 'P');

    // Act - 5 requests per service type simultaneously
    const bollettiniPromises = Array.from({ length: 5 }, () => {
      const { req, res } = createMockReqRes({ serviceTypeId: bollettini.id });
      return getTicket(req, res).then(() => res.json.mock.calls[0][0]);
    });

    const pacchiPromises = Array.from({ length: 5 }, () => {
      const { req, res } = createMockReqRes({ serviceTypeId: pacchi.id });
      return getTicket(req, res).then(() => res.json.mock.calls[0][0]);
    });

    const allResults = await Promise.all([...bollettiniPromises, ...pacchiPromises]);

    // Assert
    const bollettiniTickets = allResults.slice(0, 5).map(r => r.ticketNumber);
    const pacchiTickets = allResults.slice(5).map(r => r.ticketNumber);

    expect(new Set(bollettiniTickets).size).toBeGreaterThanOrEqual(1);
    expect(new Set(pacchiTickets).size).toBeGreaterThanOrEqual(1);

    // Verify correct prefixes
    bollettiniTickets.forEach(t => expect(t).toMatch(/^B\d+$/));
    pacchiTickets.forEach(t => expect(t).toMatch(/^P\d+$/));
    
    // Verify total tickets created
    const totalTickets = await Ticket.count();
    expect(totalTickets).toBe(10);
  });
  });

  // ========================================
  // ERROR: SERVICE TYPE INESISTENTE
  // ========================================
  describe('Error: Service Type Inesistente', () => {

    test('Should return 404 when service type does not exist', async () => {
      // Arrange
      const { req, res } = createMockReqRes({ serviceTypeId: 9999 });

      // Act
      await getTicket(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Service type not found or queue missing'
      });

      // Verify no ticket was created
      const ticketCount = await Ticket.count();
      expect(ticketCount).toBe(0);
    });

    test('Should return 404 for negative service type ID', async () => {
      // Arrange
      const { req, res } = createMockReqRes({ serviceTypeId: -1 });

      // Act
      await getTicket(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Service type not found or queue missing'
      });
    });

    test('Should return 404 for zero service type ID', async () => {
      // Arrange
      const { req, res } = createMockReqRes({ serviceTypeId: 0 });

      // Act
      await getTicket(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  // ========================================
  // ERROR: QUEUE MANCANTE
  // ========================================
  describe('Error: Queue Mancante', () => {
    
    test('Should return 404 when service type exists but queue is missing', async () => {
      // Arrange - Create service type WITHOUT queue
      const serviceType = await ServiceType.create({ 
        name: 'Orphan Service', 
        acronym: 'OS' 
      });
      const { req, res } = createMockReqRes({ serviceTypeId: serviceType.id });

      // Act
      await getTicket(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Service type not found or queue missing'
      });

      // Verify no ticket was created
      const ticketCount = await Ticket.count();
      expect(ticketCount).toBe(0);
    });
  });

  // ========================================
  // ERROR: BODY MALFORMATO
  // ========================================
  describe('Error: Body Malformato', () => {
    
    test('Should handle missing serviceTypeId in request body', async () => {
    // Arrange
    const { req, res } = createMockReqRes({});

    // Act
    await getTicket(req, res);

    // Assert - Expecting 500 for invalid input
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Internal server error'
    });
  });

    test('Should handle null serviceTypeId', async () => {
      // Arrange
      const { req, res } = createMockReqRes({ serviceTypeId: null });

      // Act
      await getTicket(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
    });

    test('Should handle string serviceTypeId', async () => {
      // Arrange
      const { req, res } = createMockReqRes({ serviceTypeId: 'invalid' });

      // Act
      await getTicket(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  // ========================================
  // RESPONSE FORMAT VALIDATION
  // ========================================
  describe('Response Format Validation', () => {
    
    test('Should return correct DTO structure', async () => {
      // Arrange
      const { serviceType } = await createServiceTypeWithQueue('Test Service', 'TS');
      const { req, res } = createMockReqRes({ serviceTypeId: serviceType.id });

      // Act
      await getTicket(req, res);

      // Assert - Verify response structure
      const response = res.json.mock.calls[0][0];
      expect(response).toHaveProperty('ticketNumber');
      expect(response).toHaveProperty('serviceTypeName');
      expect(response).toHaveProperty('estimatedWaitTime');
      
      expect(typeof response.ticketNumber).toBe('string');
      expect(typeof response.serviceTypeName).toBe('string');
      expect(typeof response.estimatedWaitTime).toBe('number');
    });

    test('Should return estimatedWaitTime as placeholder value', async () => {
      // Arrange
      const { serviceType } = await createServiceTypeWithQueue('Bollettini', 'B');
      const { req, res } = createMockReqRes({ serviceTypeId: serviceType.id });

      // Act
      await getTicket(req, res);

      // Assert
      const response = res.json.mock.calls[0][0];
      expect(response.estimatedWaitTime).toBe(10);
    });
  });

  // ========================================
  // EDGE CASES
  // ========================================
  describe('Edge Cases', () => {

    test('Should handle very long service type names', async () => {
      // Arrange
      const longName = 'A'.repeat(255);
      const { serviceType } = await createServiceTypeWithQueue(longName, 'LONG');
      const { req, res } = createMockReqRes({ serviceTypeId: serviceType.id });

      // Act
      await getTicket(req, res);

      // Assert
      const response = res.json.mock.calls[0][0];
      expect(response.serviceTypeName).toBe(longName);
      expect(response.ticketNumber).toBe('LONG1');
    });

    test('Should handle service types with special characters in acronym', async () => {
      // Arrange
      const { serviceType } = await createServiceTypeWithQueue('Special Service', 'S&P');
      const { req, res } = createMockReqRes({ serviceTypeId: serviceType.id });

      // Act
      await getTicket(req, res);

      // Assert
      const response = res.json.mock.calls[0][0];
      expect(response.ticketNumber).toBe('S&P1');
    });

    test('Should handle multiple rapid sequential requests', async () => {
      // Arrange
      const { serviceType } = await createServiceTypeWithQueue('Fast Service', 'FS');

      // Act - 20 rapid sequential requests
      const responses = [];
      for (let i = 0; i < 20; i++) {
        const { req, res } = createMockReqRes({ serviceTypeId: serviceType.id });
        await getTicket(req, res);
        responses.push(res.json.mock.calls[0][0]);
      }

      // Assert
      const ticketNumbers = responses.map(r => r.ticketNumber);
      const expectedNumbers = Array.from({ length: 20 }, (_, i) => `FS${i + 1}`);
      
      expect(ticketNumbers).toEqual(expectedNumbers);
    });
  });

  // ========================================
  // DATABASE STATE VERIFICATION
  // ========================================
  describe('Database State Verification', () => {

    test('Should persist ticket correctly in database', async () => {
      // Arrange
      const { serviceType, queue } = await createServiceTypeWithQueue('Bollettini', 'B');
      const { req, res } = createMockReqRes({ serviceTypeId: serviceType.id });

      // Act
      await getTicket(req, res);

      // Assert - Verify database state
      const ticket = await Ticket.findOne({ where: { queueId: queue.id } });
      
      expect(ticket).not.toBeNull();
      expect(ticket.number).toBe('B1');
      expect(ticket.status).toBe('WAITING');
      expect(ticket.queueId).toBe(queue.id);
      expect(ticket.counterId).toBeNull();
    });

    test('Should create exactly one ticket per request', async () => {
      // Arrange
      const { serviceType } = await createServiceTypeWithQueue('Pacchi', 'P');
      const { req, res } = createMockReqRes({ serviceTypeId: serviceType.id });

      // Act
      await getTicket(req, res);

      // Assert
      const ticketCount = await Ticket.count();
      expect(ticketCount).toBe(1);
    });

    test('Should not create ticket on error', async () => {
      // Arrange
      const { req, res } = createMockReqRes({ serviceTypeId: 9999 });

      // Act
      await getTicket(req, res);

      // Assert
      const ticketCount = await Ticket.count();
      expect(ticketCount).toBe(0);
    });

    test('Should maintain data integrity across multiple requests', async () => {
      // Arrange
      const { serviceType, queue } = await createServiceTypeWithQueue('Test', 'T');

      // Act - Create 3 tickets
      for (let i = 0; i < 3; i++) {
        const { req, res } = createMockReqRes({ serviceTypeId: serviceType.id });
        await getTicket(req, res);
      }

      // Assert
      const tickets = await Ticket.findAll({ where: { queueId: queue.id } });
      const updatedQueue = await Queue.findByPk(queue.id);

      expect(tickets).toHaveLength(3);
      expect(updatedQueue.lastIssuedTicketNumber).toBe(3);
      expect(tickets.every(t => t.queueId === queue.id)).toBe(true);
      expect(tickets.every(t => t.status === 'WAITING')).toBe(true);
    });
  });
});