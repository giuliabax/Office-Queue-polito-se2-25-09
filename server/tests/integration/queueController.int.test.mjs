// tests/integration/queueController.int.test.mjs
import express from "express";
import request from "supertest";
import { sequelize, Ticket, Queue, Counter, ServiceType } from "../../models/index.mjs";
import { handleCompleteCustomer, getQueueList } from "../../controllers/queueController.mjs";

// --- Express app ---
const app = express();
app.use(express.json());

// --- Routes usando i controller reali ---
app.post("/tickets/:ticketId/complete", handleCompleteCustomer);
app.get("/queue", getQueueList);

// --- Variabili globali per i test ---
let counter, serviceType, queue, ticket1, ticket2;

beforeEach(async () => {
  await sequelize.sync({ force: true });

  counter = await Counter.create({ number: 1 });
  serviceType = await ServiceType.create({ name: "General", acronym: "GEN" });
  queue = await Queue.create({ serviceTypeId: serviceType.id });

  ticket1 = await Ticket.create({ number: 1, status: "WAITING", queueId: queue.id });
  ticket2 = await Ticket.create({ number: 2, status: "ON_GOING", queueId: queue.id, counterId: counter.id });
});

describe("Integration Test - handleCompleteCustomer & getQueueList", () => {

  test("should complete an ON_GOING ticket", async () => {
    const res = await request(app).post(`/tickets/${ticket2.id}/complete`).send();

    expect(res.status).toBe(200);
    expect(res.body.ticket.status).toBe("SERVED");
    expect(res.body.ticket.id).toBe(ticket2.id);

    const updatedTicket = await Ticket.findByPk(ticket2.id);
    expect(updatedTicket.status).toBe("SERVED");
    expect(updatedTicket.counterId).toBe(null);
  });

  test("should return 404 if ticket not found", async () => {
    const res = await request(app).post("/tickets/999/complete").send();
    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Ticket not found");
  });

  test("should return 400 if ticket is not ON_GOING", async () => {
    const res = await request(app).post(`/tickets/${ticket1.id}/complete`).send();
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Ticket is not being served");
  });

  test("should get queue list with WAITING and ON_GOING tickets", async () => {
    const res = await request(app).get("/queue").send();

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(2);

    const statuses = res.body.map(t => t.status);
    expect(statuses).toContain("WAITING");
    expect(statuses).toContain("ON_GOING");

    expect(res.body[0].queue.serviceType.name).toBe("General");
    expect(res.body[1].counter.number).toBe(counter.number);
  });
});
