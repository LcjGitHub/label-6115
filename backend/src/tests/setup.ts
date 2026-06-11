import fs from "fs";
import path from "path";
import os from "os";
import { beforeAll, afterAll, beforeEach } from "vitest";
import { initializeDb, closeDb, initDb, getDb, createCamera } from "../db";

let tempDbPath: string;

beforeAll(() => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "camera-test-"));
  tempDbPath = path.join(tempDir, "test.db");
  closeDb();
  initializeDb(tempDbPath);
  initDb();
});

afterAll(() => {
  closeDb();
  const dbDir = path.dirname(tempDbPath);
  try {
    fs.rmSync(dbDir, { recursive: true, force: true });
  } catch (_) {
    // ignore cleanup errors
  }
});

beforeEach(() => {
  const db = getDb();
  db.exec("DELETE FROM maintenance_records; DELETE FROM usage_logs; DELETE FROM shutter_counts; DELETE FROM lens_accessories; DELETE FROM maintenance_types; DELETE FROM cameras;");
  db.exec("DELETE FROM sqlite_sequence WHERE name IN ('maintenance_records', 'usage_logs', 'shutter_counts', 'lens_accessories', 'maintenance_types', 'cameras');");
});

export function createTestCamera() {
  return createCamera({
    brand: "测试品牌",
    model: "Test Model X1",
    purchase_date: "2024-01-01",
    estimated_shutter_count: 0,
    notes: "测试用相机",
    status: "使用中",
    rated_shutter_life: 200000,
  });
}
