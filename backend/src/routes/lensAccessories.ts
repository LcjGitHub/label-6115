import { Router } from "express";
import {
  createLensAccessory,
  deleteLensAccessory,
  getLensAccessories,
} from "../db";

const router = Router();

router.get("/", (req, res) => {
  const cameraId = req.query.camera_id ? Number(req.query.camera_id) : undefined;
  res.json(getLensAccessories(cameraId));
});

router.post("/", (req, res) => {
  const { camera_id, accessory_name, focal_length_description, purchase_date, notes } = req.body;
  if (!camera_id || !accessory_name || !purchase_date) {
    res.status(400).json({ error: "关联相机、配件名称和购入日期为必填项" });
    return;
  }
  const accessory = createLensAccessory({
    camera_id: Number(camera_id),
    accessory_name,
    focal_length_description: focal_length_description ?? "",
    purchase_date,
    notes: notes ?? "",
  });
  if (!accessory) {
    res.status(404).json({ error: "关联相机不存在" });
    return;
  }
  res.status(201).json(accessory);
});

router.delete("/:id", (req, res) => {
  const id = Number(req.params.id);
  const ok = deleteLensAccessory(id);
  if (!ok) {
    res.status(404).json({ error: "配件不存在" });
    return;
  }
  res.status(204).send();
});

export default router;
