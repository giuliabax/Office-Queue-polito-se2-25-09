import express from "express";
import cors from "cors";
import { sequelize } from "./models/index.mjs";
import { getAllServiceTypes } from "./dao/service-type-dao.mjs";
import { getServiceTypesByCounterId } from "./dao/service-type-counter-dao.mjs";

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
app.get('/api/service-types', async (req, res) => {
  try {
    const serviceTypes = await getAllServiceTypes();
    res.json(serviceTypes);
  } catch (err) {
    console.error('Error getting service types:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/counters/:counterId/service-types', async (req, res) => {
  try {
    const counterId = req.params.counterId;
    const serviceTypes = await getServiceTypesByCounterId(counterId);
    res.json(serviceTypes);
  } catch (err) {
    console.error('Error getting service types for counter:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

try {
  await sequelize.sync({ force: true });
  app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
  });
} catch (err) {
  console.error("Error during database connection/server bootstrap", err);
}
