// tests/integration/NextCustomer.int.test.mjs
import request from "supertest";
import express from "express";

// Import dei modelli dal progetto
import { Sequelize } from "sequelize";
import { initCounter, Counter } from "../../models/counter.mjs";
import { initOfficer, Officer } from "../../models/officer.mjs";
import { initQueue, Queue } from "../../models/queue.mjs";
import { initServiceType, ServiceType } from "../../models/service-type.mjs";
import { initServiceTypeCounter, ServiceTypeCounter } from "../../models/service-type-counter.mjs";
import { initTicket, Ticket } from "../../models/ticket.mjs";

// Creiamo un DB in-memory per i test
const sequelize = new Sequelize("sqlite::memory:", { logging: false });

// Inizializzazione modelli
initCounter(sequelize);
initOfficer(sequelize);
initQueue(sequelize);
initServiceType(sequelize);
initServiceTypeCounter(sequelize);
initTicket(sequelize);

// Associazioni
Counter.associate({ ServiceType, ServiceTypeCounter, Officer });
Officer.associate({ Counter });
Queue.associate({ ServiceType, Ticket });
ServiceType.associate({ Counter, Queue, ServiceTypeCounter });
Ticket.associate({ Queue });

// Creiamo un'app Express minimale per i test
const app = express();
app.use(express.json());

// Endpoint "next customer" simulato
app.post("/counters/:id/next", async (req, res) => {
  try {
    const counter = await Counter.findByPk(req.params.id);
    if (!counter) return res.status(404).json({ message: "Counter not found" });

    // Trova la prima coda del counter
    const serviceTypeCounter = await ServiceTypeCounter.findOne({ where: { counterId: counter.id } });
    if (!serviceTypeCounter) return res.status(404).json({ message: "No service type assigned" });

    const queue = await Queue.findOne({ where: { serviceTypeId: serviceTypeCounter.serviceTypeId }, order: [["id", "ASC"]] });
    if (!queue) return res.status(404).json({ message: "No customers in queue" });

    // Prendi il primo ticket in waiting
    const ticket = await Ticket.findOne({ where: { queueId: queue.id, status: "waiting" }, order: [["number", "ASC"]] });
    if (!ticket) return res.status(404).json({ message: "No customers in queue" });

    // Servi il cliente
    ticket.status = "served";
    await ticket.save();

    // Conta rimanenti
    const remaining = await Ticket.count({ where: { queueId: queue.id, status: "waiting" } });

    res.json({ customerServed: { number: ticket.number }, remainingInQueue: remaining });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

let counter, serviceType, queue;

beforeEach(async () => {
  await sequelize.sync({ force: true });

  counter = await Counter.create({ number: 1 });
  serviceType = await ServiceType.create({ name: "General", acronym: "GEN" });

  await ServiceTypeCounter.create({ serviceTypeId: serviceType.id, counterId: counter.id });
  await Officer.create({ name: "Mario", surname: "Rossi", counterId: counter.id });

  queue = await Queue.create({ serviceTypeId: serviceType.id });
  await Ticket.create({ number: 1, status: "waiting", queueId: queue.id });
  await Ticket.create({ number: 2, status: "waiting", queueId: queue.id });
});

describe("Integration Test - Next Customer Story", () => {
  it("should serve the first customer correctly", async () => {
    const res = await request(app).post(`/counters/${counter.id}/next`).send();
    expect(res.status).toBe(200);
    expect(res.body.customerServed.number).toBe(1);
    expect(res.body.remainingInQueue).toBe(1);
  });

  it("should serve the second customer correctly", async () => {
    // Serviamo il primo
    await request(app).post(`/counters/${counter.id}/next`).send();

    const res = await request(app).post(`/counters/${counter.id}/next`).send();
    expect(res.status).toBe(200);
    expect(res.body.customerServed.number).toBe(2);
    expect(res.body.remainingInQueue).toBe(0);
  });

  it("should return 404 when there are no customers left", async () => {
    // Serviamo entrambi
    await request(app).post(`/counters/${counter.id}/next`).send();
    await request(app).post(`/counters/${counter.id}/next`).send();

    const res = await request(app).post(`/counters/${counter.id}/next`).send();
    expect(res.status).toBe(404);
    expect(res.body.message).toBe("No customers in queue");
  });
});
