// tests/integration/NextCustomer.int.test.mjs
import request from "supertest";
import express from "express";
import { Sequelize, DataTypes, Model } from "sequelize";

// Creiamo un DB in-memory
const sequelize = new Sequelize("sqlite::memory:", { logging: false });

// Definiamo i modelli minimi per i test
class Counter extends Model {}
Counter.init({ number: DataTypes.INTEGER }, { sequelize, modelName: "counter" });

class ServiceType extends Model {}
ServiceType.init({ name: DataTypes.STRING, acronym: DataTypes.STRING }, { sequelize, modelName: "serviceType" });

class ServiceTypeCounter extends Model {}
ServiceTypeCounter.init({}, { sequelize, modelName: "serviceTypeCounter" });

class Officer extends Model {}
Officer.init({ name: DataTypes.STRING, surname: DataTypes.STRING }, { sequelize, modelName: "officer" });

class Queue extends Model {}
Queue.init({}, { sequelize, modelName: "queue" });

class Ticket extends Model {}
Ticket.init({ number: DataTypes.INTEGER, status: DataTypes.STRING }, { sequelize, modelName: "ticket" });

// Associazioni semplificate
Counter.hasMany(ServiceTypeCounter, { foreignKey: "counterId" });
Counter.hasMany(Officer, { foreignKey: "counterId" });
Counter.hasMany(Ticket, { foreignKey: "counterId" });

ServiceType.hasMany(ServiceTypeCounter, { foreignKey: "serviceTypeId" });
ServiceType.hasMany(Queue, { foreignKey: "serviceTypeId" });

Queue.belongsTo(ServiceType, { foreignKey: "serviceTypeId" });
Queue.hasMany(Ticket, { foreignKey: "queueId" });

Ticket.belongsTo(Queue, { foreignKey: "queueId" });

// Express minimale per i test
const app = express();
app.use(express.json());

app.post("/counters/:id/next", async (req, res) => {
  try {
    const counter = await Counter.findByPk(req.params.id);
    if (!counter) return res.status(404).json({ message: "Counter not found" });

    const stc = await ServiceTypeCounter.findOne({ where: { counterId: counter.id } });
    if (!stc) return res.status(404).json({ message: "No service type assigned" });

    const queue = await Queue.findOne({ where: { serviceTypeId: stc.serviceTypeId }, order: [["id", "ASC"]] });
    if (!queue) return res.status(404).json({ message: "No customers in queue" });

    const ticket = await Ticket.findOne({ where: { queueId: queue.id, status: "waiting" }, order: [["number", "ASC"]] });
    if (!ticket) return res.status(404).json({ message: "No customers in queue" });

    ticket.status = "served";
    await ticket.save();

    const remaining = await Ticket.count({ where: { queueId: queue.id, status: "waiting" } });

    res.json({ customerServed: { number: ticket.number }, remainingInQueue: remaining });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

// Setup DB prima di ogni test
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
    await request(app).post(`/counters/${counter.id}/next`).send();

    const res = await request(app).post(`/counters/${counter.id}/next`).send();
    expect(res.status).toBe(200);
    expect(res.body.customerServed.number).toBe(2);
    expect(res.body.remainingInQueue).toBe(0);
  });

  it("should return 404 when there are no customers left", async () => {
    await request(app).post(`/counters/${counter.id}/next`).send();
    await request(app).post(`/counters/${counter.id}/next`).send();

    const res = await request(app).post(`/counters/${counter.id}/next`).send();
    expect(res.status).toBe(404);
    expect(res.body.message).toBe("No customers in queue");
  });
});
