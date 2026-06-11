import cors from "cors";
import express from "express";
import { initDb } from "./db";
import camerasRouter from "./routes/cameras";
import lensAccessoriesRouter from "./routes/lensAccessories";
import maintenanceRouter from "./routes/maintenance";
import maintenancePlansRouter from "./routes/maintenancePlans";
import maintenanceTypesRouter from "./routes/maintenanceTypes";
import repairServiceProvidersRouter from "./routes/repairServiceProviders";
import shutterCountsRouter from "./routes/shutterCounts";
import statisticsRouter from "./routes/statistics";
import usageLogsRouter from "./routes/usageLogs";
import warrantyInfoRouter from "./routes/warrantyInfo";

export function createApp(): express.Express {
  initDb();

  const app = express();
  app.use(cors());
  app.use(express.json());

  app.use("/api/cameras", camerasRouter);
  app.use("/api/lens-accessories", lensAccessoriesRouter);
  app.use("/api", maintenanceRouter);
  app.use("/api/maintenance-plans", maintenancePlansRouter);
  app.use("/api/maintenance-types", maintenanceTypesRouter);
  app.use("/api/repair-service-providers", repairServiceProvidersRouter);
  app.use("/api/shutter-counts", shutterCountsRouter);
  app.use("/api/statistics", statisticsRouter);
  app.use("/api/usage-logs", usageLogsRouter);
  app.use("/api/warranty-info", warrantyInfoRouter);

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  return app;
}

if (require.main === module) {
  const PORT = 6000;
  const app = createApp();
  app.listen(PORT, () => {
    console.log(`Backend running at http://localhost:${PORT}`);
  });
}
