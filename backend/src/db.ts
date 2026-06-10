import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

const dataDir = path.join(__dirname, "..", "data");
const dbPath = path.join(dataDir, "cameras.db");

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath);
db.pragma("journal_mode = WAL");

export interface Camera {
  id: number;
  model: string;
  purchase_date: string;
  estimated_shutter_count: number;
  notes: string;
}

export interface MaintenanceRecord {
  id: number;
  camera_id: number;
  maintenance_date: string;
  content: string;
}

export function initDb(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS cameras (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      model TEXT NOT NULL,
      purchase_date TEXT NOT NULL,
      estimated_shutter_count INTEGER NOT NULL DEFAULT 0,
      notes TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS maintenance_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      camera_id INTEGER NOT NULL,
      maintenance_date TEXT NOT NULL,
      content TEXT NOT NULL,
      FOREIGN KEY (camera_id) REFERENCES cameras(id) ON DELETE CASCADE
    );
  `);

  const count = db.prepare("SELECT COUNT(*) as c FROM cameras").get() as { c: number };
  if (count.c === 0) {
    seedData();
  }
}

function seedData(): void {
  const insertCamera = db.prepare(`
    INSERT INTO cameras (model, purchase_date, estimated_shutter_count, notes)
    VALUES (?, ?, ?, ?)
  `);

  const insertMaintenance = db.prepare(`
    INSERT INTO maintenance_records (camera_id, maintenance_date, content)
    VALUES (?, ?, ?)
  `);

  const seed = db.transaction(() => {
    const cam1 = insertCamera.run("Canon EOS R5", "2022-03-15", 85000, "主力机身，风光拍摄");
    const cam2 = insertCamera.run("Sony A7 IV", "2023-08-20", 42000, "视频与街拍备用机");

    insertMaintenance.run(cam1.lastInsertRowid, "2024-01-10", "传感器清洁 + 固件升级");
    insertMaintenance.run(cam1.lastInsertRowid, "2024-09-05", "快门检测，计数正常");
    insertMaintenance.run(cam2.lastInsertRowid, "2024-02-18", "更换目镜保护膜");
    insertMaintenance.run(cam2.lastInsertRowid, "2024-11-12", "卡口与触点清洁保养");
  });

  seed();
}

export function getAllCameras(): Camera[] {
  return db.prepare("SELECT * FROM cameras ORDER BY id").all() as Camera[];
}

export function getCameraById(id: number): Camera | undefined {
  return db.prepare("SELECT * FROM cameras WHERE id = ?").get(id) as Camera | undefined;
}

export function createCamera(data: Omit<Camera, "id">): Camera {
  const result = db
    .prepare(
      `INSERT INTO cameras (model, purchase_date, estimated_shutter_count, notes)
       VALUES (?, ?, ?, ?)`
    )
    .run(data.model, data.purchase_date, data.estimated_shutter_count, data.notes);
  return getCameraById(Number(result.lastInsertRowid))!;
}

export function updateCamera(id: number, data: Omit<Camera, "id">): Camera | undefined {
  const existing = getCameraById(id);
  if (!existing) return undefined;

  db.prepare(
    `UPDATE cameras SET model = ?, purchase_date = ?, estimated_shutter_count = ?, notes = ?
     WHERE id = ?`
  ).run(data.model, data.purchase_date, data.estimated_shutter_count, data.notes, id);

  return getCameraById(id);
}

export function deleteCamera(id: number): boolean {
  const result = db.prepare("DELETE FROM cameras WHERE id = ?").run(id);
  return result.changes > 0;
}

export function getMaintenanceByCameraId(cameraId: number): MaintenanceRecord[] {
  return db
    .prepare("SELECT * FROM maintenance_records WHERE camera_id = ? ORDER BY maintenance_date DESC")
    .all(cameraId) as MaintenanceRecord[];
}

export function createMaintenance(
  cameraId: number,
  data: { maintenance_date: string; content: string }
): MaintenanceRecord | undefined {
  if (!getCameraById(cameraId)) return undefined;

  const result = db
    .prepare(
      `INSERT INTO maintenance_records (camera_id, maintenance_date, content)
       VALUES (?, ?, ?)`
    )
    .run(cameraId, data.maintenance_date, data.content);

  return db
    .prepare("SELECT * FROM maintenance_records WHERE id = ?")
    .get(result.lastInsertRowid) as MaintenanceRecord;
}

export function deleteMaintenance(id: number): boolean {
  const result = db.prepare("DELETE FROM maintenance_records WHERE id = ?").run(id);
  return result.changes > 0;
}

export default db;
