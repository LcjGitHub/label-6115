import request from "supertest";
import { describe, it, expect, beforeEach } from "vitest";
import { createApp } from "../index";
import { createTestCamera } from "./setup";
import type { Express } from "express";

describe("保养记录接口集成测试", () => {
  let app: Express;

  beforeEach(() => {
    app = createApp();
  });

  describe("POST /api/cameras/:cameraId/maintenance - 创建保养记录", () => {
    it("正常创建保养记录应返回 201", async () => {
      const camera = createTestCamera();
      const payload = {
        maintenance_date: "2024-06-01",
        content: "传感器清洁保养",
        cost: 200,
      };

      const res = await request(app)
        .post(`/api/cameras/${camera.id}/maintenance`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        camera_id: camera.id,
        maintenance_date: "2024-06-01",
        content: "传感器清洁保养",
        cost: 200,
      });
      expect(res.body.id).toBeDefined();
    });

    it("缺少必填字段 maintenance_date 应返回 400", async () => {
      const camera = createTestCamera();
      const payload = {
        content: "传感器清洁保养",
        cost: 200,
      };

      const res = await request(app)
        .post(`/api/cameras/${camera.id}/maintenance`)
        .send(payload);

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it("缺少必填字段 content 应返回 400", async () => {
      const camera = createTestCamera();
      const payload = {
        maintenance_date: "2024-06-01",
        cost: 200,
      };

      const res = await request(app)
        .post(`/api/cameras/${camera.id}/maintenance`)
        .send(payload);

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it("缺少所有必填字段应返回 400", async () => {
      const camera = createTestCamera();
      const payload = { cost: 200 };

      const res = await request(app)
        .post(`/api/cameras/${camera.id}/maintenance`)
        .send(payload);

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });
  });

  describe("GET /api/cameras/:cameraId/maintenance - 按相机查询保养记录列表", () => {
    it("应返回该相机的所有保养记录", async () => {
      const camera = createTestCamera();

      await request(app)
        .post(`/api/cameras/${camera.id}/maintenance`)
        .send({ maintenance_date: "2024-01-10", content: "传感器清洁", cost: 100 });

      await request(app)
        .post(`/api/cameras/${camera.id}/maintenance`)
        .send({ maintenance_date: "2024-06-15", content: "快门检测", cost: 150 });

      const res = await request(app).get(`/api/cameras/${camera.id}/maintenance`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(2);
      expect(res.body[0].maintenance_date >= res.body[1].maintenance_date).toBe(true);
    });

    it("查询不存在的相机应返回 404", async () => {
      const res = await request(app).get("/api/cameras/99999/maintenance");
      expect(res.status).toBe(404);
      expect(res.body.error).toBeDefined();
    });
  });

  describe("PUT /api/maintenance/:id - 按编号更新保养记录", () => {
    it("更新后字段变化应正确", async () => {
      const camera = createTestCamera();
      const createRes = await request(app)
        .post(`/api/cameras/${camera.id}/maintenance`)
        .send({ maintenance_date: "2024-01-01", content: "初始保养", cost: 100 });

      const recordId = createRes.body.id;
      const updatePayload = {
        maintenance_date: "2024-12-01",
        content: "更新后的保养内容",
        cost: 350,
      };

      const updateRes = await request(app)
        .put(`/api/maintenance/${recordId}`)
        .send(updatePayload);

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.id).toBe(recordId);
      expect(updateRes.body.maintenance_date).toBe("2024-12-01");
      expect(updateRes.body.content).toBe("更新后的保养内容");
      expect(updateRes.body.cost).toBe(350);

      const listRes = await request(app).get(`/api/cameras/${camera.id}/maintenance`);
      const updated = listRes.body.find((r: any) => r.id === recordId);
      expect(updated.maintenance_date).toBe("2024-12-01");
      expect(updated.content).toBe("更新后的保养内容");
      expect(updated.cost).toBe(350);
    });

    it("更新不存在的记录应返回 404", async () => {
      const res = await request(app)
        .put("/api/maintenance/99999")
        .send({ maintenance_date: "2024-06-01", content: "测试", cost: 0 });

      expect(res.status).toBe(404);
      expect(res.body.error).toBeDefined();
    });
  });

  describe("DELETE /api/maintenance/:id - 删除保养记录", () => {
    it("删除后无法再查到该记录", async () => {
      const camera = createTestCamera();
      const createRes = await request(app)
        .post(`/api/cameras/${camera.id}/maintenance`)
        .send({ maintenance_date: "2024-06-01", content: "待删除记录", cost: 50 });

      const recordId = createRes.body.id;

      const beforeDelete = await request(app).get(`/api/cameras/${camera.id}/maintenance`);
      expect(beforeDelete.body.find((r: any) => r.id === recordId)).toBeDefined();

      const deleteRes = await request(app).delete(`/api/maintenance/${recordId}`);
      expect(deleteRes.status).toBe(204);

      const afterDelete = await request(app).get(`/api/cameras/${camera.id}/maintenance`);
      expect(afterDelete.body.find((r: any) => r.id === recordId)).toBeUndefined();
    });

    it("删除不存在的记录应返回 404", async () => {
      const res = await request(app).delete("/api/maintenance/99999");
      expect(res.status).toBe(404);
      expect(res.body.error).toBeDefined();
    });
  });
});
