import { Router } from "express";
import {
  createShutterCount,
  deleteShutterCount,
  getShutterCounts,
} from "../db";

const router = Router();

router.get("/", (req, res) => {
  const cameraId = req.query.camera_id ? Number(req.query.camera_id) : undefined;
  res.json(getShutterCounts(cameraId));
});

router.post("/", (req, res) => {
  const { camera_id, record_date, shutter_increment, notes } = req.body;
  if (!camera_id || !record_date || shutter_increment == null) {
    res.status(400).json({ error: "相机、日期和快门增量为必填项" });
    return;
  }
  const record = createShutterCount({
    camera_id: Number(camera_id),
    record_date,
    shutter_increment: Number(shutter_increment),
    notes: notes ?? "",
  });
  if (!record) {
    res.status(404).json({ error: "相机不存在" });
    return;
  }
  res.status(201).json(record);
});

router.delete("/:id", (req, res) => {
  const id = Number(req.params.id);
  const ok = deleteShutterCount(id);
  if (!ok) {
    res.status(404).json({ error: "快门记录不存在" });
    return;
  }
  res.status(204).send();
});

export default router;
