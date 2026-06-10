import { Router } from "express";
import {
  createMaintenance,
  deleteMaintenance,
  getCameraById,
  getMaintenanceByCameraId,
} from "../db";

const router = Router();

router.get("/cameras/:cameraId/maintenance", (req, res) => {
  const cameraId = Number(req.params.cameraId);
  if (!getCameraById(cameraId)) {
    res.status(404).json({ error: "相机不存在" });
    return;
  }
  res.json(getMaintenanceByCameraId(cameraId));
});

router.post("/cameras/:cameraId/maintenance", (req, res) => {
  const cameraId = Number(req.params.cameraId);
  const { maintenance_date, content } = req.body;
  if (!maintenance_date || !content) {
    res.status(400).json({ error: "日期和内容为必填项" });
    return;
  }
  const record = createMaintenance(cameraId, { maintenance_date, content });
  if (!record) {
    res.status(404).json({ error: "相机不存在" });
    return;
  }
  res.status(201).json(record);
});

router.delete("/maintenance/:id", (req, res) => {
  const id = Number(req.params.id);
  const ok = deleteMaintenance(id);
  if (!ok) {
    res.status(404).json({ error: "保养记录不存在" });
    return;
  }
  res.status(204).send();
});

export default router;
