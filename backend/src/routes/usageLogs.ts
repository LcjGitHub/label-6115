import { Router } from "express";
import {
  createUsageLog,
  getUsageLogsByCameraId,
} from "../db";

const router = Router();

router.get("/:cameraId", (req, res) => {
  const cameraId = Number(req.params.cameraId);
  res.json(getUsageLogsByCameraId(cameraId));
});

router.post("/:cameraId", (req, res) => {
  const cameraId = Number(req.params.cameraId);
  const { record_date, content, recorder } = req.body;
  if (!record_date || !content || !recorder) {
    res.status(400).json({ error: "日期、内容和记录人为必填项" });
    return;
  }
  const record = createUsageLog(cameraId, { record_date, content, recorder });
  if (!record) {
    res.status(404).json({ error: "相机不存在" });
    return;
  }
  res.status(201).json(record);
});

export default router;
