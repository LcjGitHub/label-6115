import { Router } from "express";
import {
  createCamera,
  deleteCamera,
  getAllCameras,
  getCameraById,
  updateCamera,
  type CameraStatus,
} from "../db";

const router = Router();

const VALID_STATUSES: CameraStatus[] = ["使用中", "维修中", "闲置"];

router.get("/", (req, res) => {
  const { status } = req.query;
  if (status && !VALID_STATUSES.includes(status as CameraStatus)) {
    res.status(400).json({ error: "无效的状态值，可选值为：使用中、维修中、闲置" });
    return;
  }
  res.json(getAllCameras(status as CameraStatus | undefined));
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
  const { model, purchase_date, estimated_shutter_count, notes, status } = req.body;
  if (!model || !purchase_date) {
    res.status(400).json({ error: "型号和购入日期为必填项" });
    return;
  }
  if (status && !VALID_STATUSES.includes(status as CameraStatus)) {
    res.status(400).json({ error: "无效的状态值，可选值为：使用中、维修中、闲置" });
    return;
  }
  const camera = createCamera({
    model,
    purchase_date,
    estimated_shutter_count: Number(estimated_shutter_count) || 0,
    notes: notes ?? "",
    status: (status as CameraStatus) ?? "使用中",
  });
  res.status(201).json(camera);
});

router.put("/:id", (req, res) => {
  const id = Number(req.params.id);
  const { model, purchase_date, estimated_shutter_count, notes, status } = req.body;
  if (!model || !purchase_date) {
    res.status(400).json({ error: "型号和购入日期为必填项" });
    return;
  }
  if (status && !VALID_STATUSES.includes(status as CameraStatus)) {
    res.status(400).json({ error: "无效的状态值，可选值为：使用中、维修中、闲置" });
    return;
  }
  const camera = updateCamera(id, {
    model,
    purchase_date,
    estimated_shutter_count: Number(estimated_shutter_count) || 0,
    notes: notes ?? "",
    status: (status as CameraStatus) ?? "使用中",
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
