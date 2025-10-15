import express from "express";
import cors from "cors";
import { sequelize } from "./models/index.mjs";
import { getAllServiceTypes } from "./dao/service-type-dao.mjs";
import { getServiceTypesByCounterId } from "./dao/service-type-counter-dao.mjs";
//import { handleNextCustomer } from "./controllers/queueController.mjs";
import seedDatabase from "./seed.mjs";
import { getTicket } from "./controllers/ticketController.mjs";
import { getAllCounters } from "./dao/counter-dao.mjs";
import { getTicketById } from "./dao/ticket-dao.mjs";
import { handleNextCustomer, getQueueList } from './controllers/queueController.mjs';


const app = express();

app.use(express.json());

const corsOptions = {
  origin: "http://localhost:5173",
  optionsSuccessStatus: 200,
  //credentials: true,
};

app.use(cors(corsOptions));

const port = 3001;

// Routes
app.get("/api/service-types", async (req, res) => {
  try {
    const serviceTypes = await getAllServiceTypes();
    res.json(serviceTypes);
  } catch (err) {
    console.error("Error getting service types:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/counters", async (req, res) => {
  try {
    const counters = await getAllCounters();
    
    // Trasforma i dati per il frontend
    const formattedCounters = counters.map(counter => ({
      id: counter.id,
      counterNumber: counter.number,
      serviceTypes: counter.serviceTypes || []
    }));
    
    res.json(formattedCounters);
  } catch (err) {
    console.error("Error getting counters:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/counters/:counterId/service-types", async (req, res) => {
  try {
    const counterId = req.params.counterId;
    const serviceTypes = await getServiceTypesByCounterId(counterId);
    res.json(serviceTypes);
  } catch (err) {
    console.error("Error getting service types for counter:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/* get ticket API*/
app.post("/api/tickets", async (req, res) => {
  try {
    await getTicket(req, res);
  } catch (err) {
    console.error("Error getting ticket:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/tickets/:id", async (req, res) => {
  try {
    const ticketId = req.params.id;
    const ticket = await getTicketById(ticketId);

    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    res.json(ticket);
  } catch (err) {
    console.error("Error getting ticket:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Route per ottenere la lista della coda
app.get('/api/queue', getQueueList);

app.post("/api/counters/:counterId/next", handleNextCustomer);

try {
  await sequelize.sync({ force: true });
  await seedDatabase();
  app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
  });
} catch (err) {
  console.error("Error during database connection/server bootstrap", err);
}
