import { jest } from "@jest/globals";

const mockCounter = {
  findByPk: jest.fn(),
};

const mockTicketInstance = {
  id: 1,
  number: 10,
  queueId: 2,
  status: "waiting",
  save: jest.fn().mockResolvedValue(true),
  queue: { serviceType: { name: 'ServiceA' } }
};

const mockTicket = {
  findOne: jest.fn(),
  count: jest.fn(),
};

const mockOfficer = {};
const mockServiceType = {};
const mockQueue = {};

const mockQueueDao = {
  getQueuesByServiceTypes: jest.fn(),
};

jest.unstable_mockModule("../../models/counter.mjs", () => ({
  Counter: mockCounter,
}));

jest.unstable_mockModule("../../models/index.mjs", () => ({
  Ticket: mockTicket,
  Officer: mockOfficer,
  ServiceType: mockServiceType,
  Queue: mockQueue,
}));

jest.unstable_mockModule("../../dao/queue-dao.mjs", () => ({
  getQueuesByServiceTypes: mockQueueDao.getQueuesByServiceTypes,
}));

const { nextCustomer } = await import("../../services/queueService.js");

describe("queueService - nextCustomer", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTicketInstance.status = "waiting";
  });

  it("should return object with empty customer if counter not found", async () => {
  mockCounter.findByPk.mockResolvedValue(null);

  const result = await nextCustomer(1);

  expect(result).toBeNull();
});

  it("should return object with empty services if counter has no services", async () => {
    mockCounter.findByPk.mockResolvedValue({ serviceTypes: [], officer: { name: "A", surname: "B" } });

    const result = await nextCustomer(1);

    expect(result).toEqual({ customerServed: null, remainingInQueue: 0, services: [], officer: 'A B', id: undefined });
  });

  it("should mark current serving ticket as served", async () => {
    const counter = { 
      serviceTypes: [{ id: 1, name: "ServiceA" }], 
      officer: { name: "John", surname: "Doe" }, 
      id: 1 
    };
    mockCounter.findByPk.mockResolvedValue(counter);

    const servingTicket = { ...mockTicketInstance, status: "SERVING", save: jest.fn().mockResolvedValue(true) };
    mockTicket.findOne.mockResolvedValueOnce(servingTicket).mockResolvedValueOnce(null); // currentServing, nextTicket
    mockQueueDao.getQueuesByServiceTypes.mockResolvedValue([{ id: 2, serviceType: { name: "ServiceA" } }]);
    mockTicket.count.mockResolvedValue(5);

    const result = await nextCustomer(1);

    expect(servingTicket.status).toBe("SERVED");
    expect(servingTicket.save).toHaveBeenCalled();
  });

  it("should mark next waiting ticket as serving and return info", async () => {
    const counter = { 
      serviceTypes: [{ id: 1, name: "ServiceA" }], 
      officer: { name: "John", surname: "Doe" }, 
      id: 1 
    };
    mockCounter.findByPk.mockResolvedValue(counter);

    mockTicket.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(mockTicketInstance); // currentServing null, nextTicket
    mockQueueDao.getQueuesByServiceTypes.mockResolvedValue([{ id: 2, serviceType: { name: "ServiceA" } }]);
    mockTicket.count.mockResolvedValue(5);

    const result = await nextCustomer(1);

    expect(mockTicketInstance.status).toBe("ON_GOING");
    expect(mockTicketInstance.save).toHaveBeenCalled();
    expect(result.customerServed.ticketNumber).toBe(mockTicketInstance.number);
    expect(result.customerServed.serviceType).toBe("ServiceA");
    expect(result.remainingInQueue).toBe(5);
  });

  it("should return customerServed null if no waiting ticket", async () => {
    const counter = { 
      serviceTypes: [{ id: 1, name: "ServiceA" }], 
      officer: { name: "John", surname: "Doe" }, 
      id: 1 
    };
    mockCounter.findByPk.mockResolvedValue(counter);

    mockTicket.findOne.mockResolvedValue(null); // no currentServing, no nextTicket
    mockQueueDao.getQueuesByServiceTypes.mockResolvedValue([{ id: 2, serviceType: { name: "ServiceA" } }]);
    mockTicket.count.mockResolvedValue(0);

    const result = await nextCustomer(1);

    expect(result.customerServed).toBeNull();
    expect(result.remainingInQueue).toBe(0);
  });

  it("should propagate errors", async () => {
    const err = new Error("DB error");
    mockCounter.findByPk.mockRejectedValue(err);

    await expect(nextCustomer(1)).rejects.toThrow(err);
  });
});
