import { Router } from "express";
import {
  createWarrantyInfo,
  deleteWarrantyInfo,
  getCameraById,
  getWarrantyInfo,
} from "../db";

const router = Router();

router.get("/", (req, res) => {
  const { camera_id } = req.query;
  if (camera_id) {
    const camId = Number(camera_id);
    if (!getCameraById(camId)) {
      res.status(404).json({ error: "相机不存在" });
      return;
    }
    res.json(getWarrantyInfo(camId));
    return;
  }
  res.json(getWarrantyInfo());
});

router.post("/", (req, res) => {
  const { camera_id, warranty_expiry_date, warranty_provider, notes } = req.body;
  if (!camera_id || !warranty_expiry_date || !warranty_provider) {
    res.status(400).json({ error: "相机、保修到期日期和保修提供方为必填项" });
    return;
  }
  const record = createWarrantyInfo({
    camera_id: Number(camera_id),
    warranty_expiry_date,
    warranty_provider,
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
  const ok = deleteWarrantyInfo(id);
  if (!ok) {
    res.status(404).json({ error: "保修记录不存在" });
    return;
  }
  res.status(204).send();
});

export default router;
