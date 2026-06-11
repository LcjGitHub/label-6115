import { Router } from "express";
import { createMaintenanceType, getAllMaintenanceTypes } from "../db";

const router = Router();

router.get("/", (_req, res) => {
  res.json(getAllMaintenanceTypes());
});

router.post("/", (req, res) => {
  const { type_name, category, description } = req.body;
  if (!type_name || !type_name.trim()) {
    res.status(400).json({ error: "类型名称为必填项" });
    return;
  }
  const result = createMaintenanceType({
    type_name: type_name.trim(),
    category: category ?? "",
    description: description ?? "",
  });
  if ("error" in result) {
    res.status(409).json({ error: result.error });
    return;
  }
  res.status(201).json(result);
});

export default router;
