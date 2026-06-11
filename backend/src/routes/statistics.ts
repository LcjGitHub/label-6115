import { Router } from "express";
import { getStatisticsOverview } from "../db";

const router = Router();

router.get("/overview", (_req, res) => {
  res.json(getStatisticsOverview());
});

export default router;
