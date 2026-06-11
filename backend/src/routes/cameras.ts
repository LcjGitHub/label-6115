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
  const { status, modelKeyword, brand } = req.query;
  if (status && !VALID_STATUSES.includes(status as CameraStatus)) {
    res.status(400).json({ error: "无效的状态值，可选值为：使用中、维修中、闲置" });
    return;
  }
  res.json(
    getAllCameras({
      status: status as CameraStatus | undefined,
      modelKeyword: modelKeyword as string | undefined,
      brand: brand as string | undefined,
    })
  );
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
  const { brand, model, purchase_date, estimated_shutter_count, notes, status, rated_shutter_life } = req.body;
  if (!brand || !model || !purchase_date) {
    res.status(400).json({ error: "品牌、型号和购入日期为必填项" });
    return;
  }
  if (status && !VALID_STATUSES.includes(status as CameraStatus)) {
    res.status(400).json({ error: "无效的状态值，可选值为：使用中、维修中、闲置" });
    return;
  }
  const camera = createCamera({
    brand,
    model,
    purchase_date,
    estimated_shutter_count: Number(estimated_shutter_count) || 0,
    notes: notes ?? "",
    status: (status as CameraStatus) ?? "使用中",
    rated_shutter_life: Number(rated_shutter_life) || 200000,
  });
  res.status(201).json(camera);
});

router.put("/:id", (req, res) => {
  const id = Number(req.params.id);
  const { brand, model, purchase_date, estimated_shutter_count, notes, status, rated_shutter_life } = req.body;
  if (!brand || !model || !purchase_date) {
    res.status(400).json({ error: "品牌、型号和购入日期为必填项" });
    return;
  }
  if (status && !VALID_STATUSES.includes(status as CameraStatus)) {
    res.status(400).json({ error: "无效的状态值，可选值为：使用中、维修中、闲置" });
    return;
  }
  const camera = updateCamera(id, {
    brand,
    model,
    purchase_date,
    estimated_shutter_count: Number(estimated_shutter_count) || 0,
    notes: notes ?? "",
    status: (status as CameraStatus) ?? "使用中",
    rated_shutter_life: Number(rated_shutter_life) || 200000,
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
