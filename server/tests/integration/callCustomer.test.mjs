import request from "supertest";
import express from "express";
import { Sequelize, DataTypes, Model } from "sequelize";

// --- DB in-memory ---
const sequelize = new Sequelize("sqlite::memory:", { logging: false });

// --- Modelli minimi ---
class Counter extends Model {}
Counter.init({ number: DataTypes.INTEGER }, { sequelize, modelName: "counter" });

class ServiceType extends Model {}
ServiceType.init({ name: DataTypes.STRING, acronym: DataTypes.STRING }, { sequelize, modelName: "serviceType" });

class ServiceTypeCounter extends Model {}
ServiceTypeCounter.init({}, { sequelize, modelName: "serviceTypeCounter" });

class Queue extends Model {}
Queue.init({}, { sequelize, modelName: "queue" });

class Ticket extends Model {}
Ticket.init({ number: DataTypes.INTEGER, status: DataTypes.STRING, counterId: DataTypes.INTEGER }, { sequelize, modelName: "ticket" });

// --- Associazioni ---
Counter.hasMany(ServiceTypeCounter, { foreignKey: "counterId" });
Counter.hasMany(Ticket, { foreignKey: "counterId" });

ServiceType.hasMany(ServiceTypeCounter, { foreignKey: "serviceTypeId" });
ServiceType.hasMany(Queue, { foreignKey: "serviceTypeId" });

Queue.belongsTo(ServiceType, { foreignKey: "serviceTypeId" });
Queue.hasMany(Ticket, { foreignKey: "queueId" });

Ticket.belongsTo(Queue, { foreignKey: "queueId" });

// --- Express minimale ---
const app = express();
app.use(express.json());

async function handleNextCustomer(req, res) {
  try {
    const counterId = Number(req.params.id);
    const counter = await Counter.findByPk(counterId);
    if (!counter) return res.status(404).json({ message: "Counter not found" });

    const stc = await ServiceTypeCounter.findOne({ where: { counterId } });
    if (!stc) return res.status(404).json({ message: "No service type assigned" });

    const queue = await Queue.findOne({ where: { serviceTypeId: stc.serviceTypeId }, order: [["id", "ASC"]] });
    if (!queue) return res.status(404).json({ message: "No customers in queue" });

    const ticket = await Ticket.findOne({ where: { queueId: queue.id, status: "WAITING" }, order: [["number", "ASC"]] });
    if (!ticket) return res.status(404).json({ message: "No customers in queue" });

    ticket.status = "ON_GOING";
    ticket.counterId = counter.id;
    await ticket.save();

    const remaining = await Ticket.count({ where: { queueId: queue.id, status: "WAITING" } });

    res.json({ customerServed: { number: ticket.number }, remainingInQueue: remaining });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error", message: err.message });
  }
}

app.post("/counters/:id/next", handleNextCustomer);

// --- Setup DB prima di ogni test ---
let counter, serviceType, queue;
beforeEach(async () => {
  await sequelize.sync({ force: true });

  counter = await Counter.create({ number: 1 });
  serviceType = await ServiceType.create({ name: "General", acronym: "GEN" });

  await ServiceTypeCounter.create({ serviceTypeId: serviceType.id, counterId: counter.id });
  queue = await Queue.create({ serviceTypeId: serviceType.id });

  await Ticket.create({ number: 1, status: "WAITING", queueId: queue.id });
  await Ticket.create({ number: 2, status: "WAITING", queueId: queue.id });
});

// --- Test ---
describe("Integration Test - handleNextCustomer", () => {
  it("should serve the first customer and update DB", async () => {
    const res = await request(app).post(`/counters/${counter.id}/next`).send();
    expect(res.status).toBe(200);
    expect(res.body.customerServed.number).toBe(1);
    expect(res.body.remainingInQueue).toBe(1);

    const ticket = await Ticket.findByPk(1);
    expect(ticket.status).toBe("ON_GOING");
    expect(ticket.counterId).toBe(counter.id);
  });

  it("should serve the second customer after the first", async () => {
    await request(app).post(`/counters/${counter.id}/next`).send();
    const res2 = await request(app).post(`/counters/${counter.id}/next`).send();

    expect(res2.status).toBe(200);
    expect(res2.body.customerServed.number).toBe(2);
    expect(res2.body.remainingInQueue).toBe(0);

    const ticket2 = await Ticket.findByPk(2);
    expect(ticket2.status).toBe("ON_GOING");
    expect(ticket2.counterId).toBe(counter.id);
  });

  it("should return 404 if no customers left", async () => {
    await request(app).post(`/counters/${counter.id}/next`).send();
    await request(app).post(`/counters/${counter.id}/next`).send();
    const res = await request(app).post(`/counters/${counter.id}/next`).send();

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("No customers in queue");
  });

  it("should return 404 if counter not found", async () => {
    const res = await request(app).post("/counters/999/next").send();
    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Counter not found");
  });
});

afterAll(async () => {
  await sequelize.close();
});