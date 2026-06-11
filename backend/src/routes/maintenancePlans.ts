import { Router } from "express";
import {
  createMaintenancePlan,
  deleteMaintenancePlan,
  getMaintenancePlans,
} from "../db";

const router = Router();

router.get("/", (req, res) => {
  const { camera_id } = req.query;
  const cameraId = camera_id ? Number(camera_id) : undefined;
  res.json(getMaintenancePlans(cameraId));
});

router.post("/", (req, res) => {
  const { camera_id, plan_name, next_maintenance_date, reminder_notes } = req.body;
  if (!camera_id || !plan_name || !next_maintenance_date) {
    res.status(400).json({ error: "相机、计划名称和下次保养日期为必填项" });
    return;
  }
  const record = createMaintenancePlan({
    camera_id: Number(camera_id),
    plan_name: String(plan_name).trim(),
    next_maintenance_date: String(next_maintenance_date),
    reminder_notes: String(reminder_notes ?? "").trim(),
  });
  if (!record) {
    res.status(404).json({ error: "相机不存在" });
    return;
  }
  res.status(201).json(record);
});

router.delete("/:id", (req, res) => {
  const id = Number(req.params.id);
  const ok = deleteMaintenancePlan(id);
  if (!ok) {
    res.status(404).json({ error: "保养计划不存在" });
    return;
  }
  res.status(204).send();
});

export default router;
