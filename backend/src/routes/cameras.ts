import { Router } from "express";
import {
  createCamera,
  deleteCamera,
  getAllCameras,
  getCameraById,
  updateCamera,
} from "../db";

const router = Router();

router.get("/", (_req, res) => {
  res.json(getAllCameras());
});

router.get("/:id", (req, res) => {
  const id = Number(req.params.id);
  const camera = getCameraById(id);
  if (!camera) {
    res.status(404).json({ error: "相机不存在" });
    return;
  }
  res.json(camera);
});

router.post("/", (req, res) => {
  const { model, purchase_date, estimated_shutter_count, notes } = req.body;
  if (!model || !purchase_date) {
    res.status(400).json({ error: "型号和购入日期为必填项" });
    return;
  }
  const camera = createCamera({
    model,
    purchase_date,
    estimated_shutter_count: Number(estimated_shutter_count) || 0,
    notes: notes ?? "",
  });
  res.status(201).json(camera);
});

router.put("/:id", (req, res) => {
  const id = Number(req.params.id);
  const { model, purchase_date, estimated_shutter_count, notes } = req.body;
  if (!model || !purchase_date) {
    res.status(400).json({ error: "型号和购入日期为必填项" });
    return;
  }
  const camera = updateCamera(id, {
    model,
    purchase_date,
    estimated_shutter_count: Number(estimated_shutter_count) || 0,
    notes: notes ?? "",
  });
  if (!camera) {
    res.status(404).json({ error: "相机不存在" });
    return;
  }
  res.json(camera);
});

router.delete("/:id", (req, res) => {
  const id = Number(req.params.id);
  const ok = deleteCamera(id);
  if (!ok) {
    res.status(404).json({ error: "相机不存在" });
    return;
  }
  res.status(204).send();
});

export default router;
