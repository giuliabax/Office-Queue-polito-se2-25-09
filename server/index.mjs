import express from "express";
import cors from "cors";
import { sequelize } from "./models/index.mjs";
import { handleNextCustomer } from "./controllers/queueController.mjs";

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
app.post("/counters/:counterId/next", handleNextCustomer);

try {
  await sequelize.sync({ force: true });
  app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
  });
} catch (err) {
  console.error("Error during database connection/server bootstrap", err);
}
