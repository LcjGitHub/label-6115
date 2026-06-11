import { Router } from "express";
import { createRepairServiceProvider, deleteRepairServiceProvider, getAllRepairServiceProviders } from "../db";

const router = Router();

router.get("/", (_req, res) => {
  res.json(getAllRepairServiceProviders());
});

router.post("/", (req, res) => {
  const { provider_name, phone, address, notes } = req.body;
  if (!provider_name || !provider_name.trim()) {
    res.status(400).json({ error: "服务商名称为必填项" });
    return;
  }
  const result = createRepairServiceProvider({
    provider_name: provider_name.trim(),
    phone: phone ?? "",
    address: address ?? "",
    notes: notes ?? "",
  });
  res.status(201).json(result);
});

router.delete("/:id", (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "无效的编号" });
    return;
  }
  const success = deleteRepairServiceProvider(id);
  if (!success) {
    res.status(404).json({ error: "记录不存在" });
    return;
  }
  res.status(204).send();
});

export default router;
