import cors from "cors";
import express from "express";
import { initDb } from "./db";
import camerasRouter from "./routes/cameras";
import maintenanceRouter from "./routes/maintenance";
import shutterCountsRouter from "./routes/shutterCounts";
import statisticsRouter from "./routes/statistics";

const PORT = 6000;

initDb();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/cameras", camerasRouter);
app.use("/api", maintenanceRouter);
app.use("/api/shutter-counts", shutterCountsRouter);
app.use("/api/statistics", statisticsRouter);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});
