import cors from "cors";
import express from "express";
import { initDb } from "./db";
import camerasRouter from "./routes/cameras";
import maintenanceRouter from "./routes/maintenance";

const PORT = 6000;

initDb();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/cameras", camerasRouter);
app.use("/api", maintenanceRouter);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});
