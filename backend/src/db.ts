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

export interface MaintenanceType {
  id: number;
  type_name: string;
  category: string;
  description: string;
}

export interface ShutterCountRecord {
  id: number;
  camera_id: number;
  record_date: string;
  shutter_increment: number;
  notes: string;
}

export interface LensAccessory {
  id: number;
  camera_id: number;
  accessory_name: string;
  focal_length_description: string;
  purchase_date: string;
  notes: string;
}

export interface UsageLog {
  id: number;
  camera_id: number;
  record_date: string;
  content: string;
  recorder: string;
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

    CREATE TABLE IF NOT EXISTS maintenance_types (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type_name TEXT NOT NULL UNIQUE,
      category TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS shutter_counts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      camera_id INTEGER NOT NULL,
      record_date TEXT NOT NULL,
      shutter_increment INTEGER NOT NULL,
      notes TEXT NOT NULL DEFAULT '',
      FOREIGN KEY (camera_id) REFERENCES cameras(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS lens_accessories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      camera_id INTEGER NOT NULL,
      accessory_name TEXT NOT NULL,
      focal_length_description TEXT NOT NULL DEFAULT '',
      purchase_date TEXT NOT NULL,
      notes TEXT NOT NULL DEFAULT '',
      FOREIGN KEY (camera_id) REFERENCES cameras(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS usage_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      camera_id INTEGER NOT NULL,
      record_date TEXT NOT NULL,
      content TEXT NOT NULL,
      recorder TEXT NOT NULL,
      FOREIGN KEY (camera_id) REFERENCES cameras(id) ON DELETE CASCADE
    );
  `);

  const camCount = db.prepare("SELECT COUNT(*) as c FROM cameras").get() as { c: number };
  const mtCount = db.prepare("SELECT COUNT(*) as c FROM maintenance_types").get() as { c: number };
  const laCount = db.prepare("SELECT COUNT(*) as c FROM lens_accessories").get() as { c: number };
  const ulCount = db.prepare("SELECT COUNT(*) as c FROM usage_logs").get() as { c: number };
  if (camCount.c === 0 || mtCount.c === 0 || laCount.c === 0 || ulCount.c === 0) {
    seedData(camCount.c === 0, mtCount.c === 0, laCount.c === 0, ulCount.c === 0);
  }
}

function seedData(seedCameras: boolean, seedMaintenanceTypes: boolean, seedLensAccessories: boolean, seedUsageLogs: boolean): void {
  const insertCamera = db.prepare(`
    INSERT INTO cameras (model, purchase_date, estimated_shutter_count, notes)
    VALUES (?, ?, ?, ?)
  `);

  const insertMaintenance = db.prepare(`
    INSERT INTO maintenance_records (camera_id, maintenance_date, content)
    VALUES (?, ?, ?)
  `);

  const insertShutterCount = db.prepare(`
    INSERT INTO shutter_counts (camera_id, record_date, shutter_increment, notes)
    VALUES (?, ?, ?, ?)
  `);

  const insertMaintenanceType = db.prepare(`
    INSERT INTO maintenance_types (type_name, category, description)
    VALUES (?, ?, ?)
  `);

  const insertLensAccessory = db.prepare(`
    INSERT INTO lens_accessories (camera_id, accessory_name, focal_length_description, purchase_date, notes)
    VALUES (?, ?, ?, ?, ?)
  `);

  const insertUsageLog = db.prepare(`
    INSERT INTO usage_logs (camera_id, record_date, content, recorder)
    VALUES (?, ?, ?, ?)
  `);

  const seed = db.transaction(() => {
    let cam1Id: number | bigint = 0;
    let cam2Id: number | bigint = 0;

    if (seedCameras) {
      const cam1 = insertCamera.run("Canon EOS R5", "2022-03-15", 85000, "主力机身，风光拍摄");
      const cam2 = insertCamera.run("Sony A7 IV", "2023-08-20", 42000, "视频与街拍备用机");
      cam1Id = cam1.lastInsertRowid;
      cam2Id = cam2.lastInsertRowid;

      insertMaintenance.run(cam1Id, "2024-01-10", "传感器清洁 + 固件升级");
      insertMaintenance.run(cam1Id, "2024-09-05", "快门检测，计数正常");
      insertMaintenance.run(cam2Id, "2024-02-18", "更换目镜保护膜");
      insertMaintenance.run(cam2Id, "2024-11-12", "卡口与触点清洁保养");

      insertShutterCount.run(cam1Id, "2024-10-01", 1200, "风光外拍");
      insertShutterCount.run(cam1Id, "2024-11-15", 800, "棚拍");
      insertShutterCount.run(cam2Id, "2024-10-05", 600, "街拍");
      insertShutterCount.run(cam2Id, "2024-12-01", 450, "活动拍摄");
    } else {
      const cameras = db.prepare("SELECT id FROM cameras ORDER BY id LIMIT 2").all() as { id: number }[];
      if (cameras.length >= 2) {
        cam1Id = cameras[0].id;
        cam2Id = cameras[1].id;
      }
    }

    if (seedMaintenanceTypes) {
      insertMaintenanceType.run("传感器清洁", "清洁", "使用专业工具清洁相机传感器上的灰尘与污渍");
      insertMaintenanceType.run("镜头清洁", "清洁", "清洁镜头前后组镜片及滤镜螺纹");
      insertMaintenanceType.run("快门检测", "检测", "检测快门寿命与响应精度，评估快门组件状态");
      insertMaintenanceType.run("固件升级", "维修", "升级相机固件至最新版本，修复已知问题");
      insertMaintenanceType.run("卡口保养", "维修", "清洁与维护镜头卡口触点，确保通信稳定");
      insertMaintenanceType.run("防霉处理", "检测", "检查并处理镜头与机身内部霉变问题");
    }

    if (seedLensAccessories && cam1Id && cam2Id) {
      insertLensAccessory.run(cam1Id, "RF 24-70mm F2.8 L IS USM", "24-70mm f/2.8 标准变焦", "2022-04-10", "日常挂机头，风光人像通吃");
      insertLensAccessory.run(cam2Id, "FE 85mm F1.4 GM", "85mm f/1.4 定焦人像", "2023-09-15", "大光圈人像镜头，虚化效果出色");
    }

    if (seedUsageLogs && cam1Id && cam2Id) {
      insertUsageLog.run(cam1Id, "2024-06-15", "西藏风光采风，使用高海拔拍摄模式", "张三");
      insertUsageLog.run(cam1Id, "2024-12-20", "室内人像棚拍，配合闪光灯使用", "李四");
      insertUsageLog.run(cam2Id, "2024-07-08", "城市街拍活动，全程手持拍摄", "王五");
      insertUsageLog.run(cam2Id, "2024-11-25", "视频短剧拍摄，使用稳定器辅助", "赵六");
    }
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

export function getShutterCounts(cameraId?: number): ShutterCountRecord[] {
  if (cameraId) {
    return db
      .prepare("SELECT * FROM shutter_counts WHERE camera_id = ? ORDER BY record_date DESC")
      .all(cameraId) as ShutterCountRecord[];
  }
  return db
    .prepare("SELECT * FROM shutter_counts ORDER BY record_date DESC")
    .all() as ShutterCountRecord[];
}

export function createShutterCount(
  data: { camera_id: number; record_date: string; shutter_increment: number; notes?: string }
): ShutterCountRecord | undefined {
  if (!getCameraById(data.camera_id)) return undefined;

  const result = db
    .prepare(
      `INSERT INTO shutter_counts (camera_id, record_date, shutter_increment, notes)
       VALUES (?, ?, ?, ?)`
    )
    .run(data.camera_id, data.record_date, data.shutter_increment, data.notes ?? "");

  return db
    .prepare("SELECT * FROM shutter_counts WHERE id = ?")
    .get(result.lastInsertRowid) as ShutterCountRecord;
}

export function deleteShutterCount(id: number): boolean {
  const result = db.prepare("DELETE FROM shutter_counts WHERE id = ?").run(id);
  return result.changes > 0;
}

export interface ModelCount {
  model: string;
  count: number;
}

export interface StatisticsOverview {
  totalCameras: number;
  totalMaintenanceRecords: number;
  highShutterCameras: number;
  camerasByModel: ModelCount[];
}

export function getStatisticsOverview(): StatisticsOverview {
  const totalCameras = (
    db.prepare("SELECT COUNT(*) as c FROM cameras").get() as { c: number }
  ).c;

  const totalMaintenanceRecords = (
    db.prepare("SELECT COUNT(*) as c FROM maintenance_records").get() as { c: number }
  ).c;

  const highShutterCameras = (
    db
      .prepare("SELECT COUNT(*) as c FROM cameras WHERE estimated_shutter_count > 50000")
      .get() as { c: number }
  ).c;

  const camerasByModel = db
    .prepare(
      "SELECT model, COUNT(*) as count FROM cameras GROUP BY model ORDER BY count DESC, model ASC"
    )
    .all() as ModelCount[];

  return {
    totalCameras,
    totalMaintenanceRecords,
    highShutterCameras,
    camerasByModel,
  };
}

export function getAllMaintenanceTypes(): MaintenanceType[] {
  return db.prepare("SELECT * FROM maintenance_types ORDER BY id").all() as MaintenanceType[];
}

export function createMaintenanceType(
  data: { type_name: string; category: string; description: string }
): MaintenanceType | { error: string } {
  const existing = db
    .prepare("SELECT id FROM maintenance_types WHERE type_name = ?")
    .get(data.type_name);
  if (existing) {
    return { error: "类型名称已存在" };
  }
  const result = db
    .prepare(
      `INSERT INTO maintenance_types (type_name, category, description)
       VALUES (?, ?, ?)`
    )
    .run(data.type_name, data.category, data.description);
  return db
    .prepare("SELECT * FROM maintenance_types WHERE id = ?")
    .get(result.lastInsertRowid) as MaintenanceType;
}

export function getLensAccessories(cameraId?: number): LensAccessory[] {
  if (cameraId) {
    return db
      .prepare("SELECT * FROM lens_accessories WHERE camera_id = ? ORDER BY id")
      .all(cameraId) as LensAccessory[];
  }
  return db
    .prepare("SELECT * FROM lens_accessories ORDER BY id")
    .all() as LensAccessory[];
}

export function createLensAccessory(
  data: Omit<LensAccessory, "id">
): LensAccessory | undefined {
  if (!getCameraById(data.camera_id)) return undefined;

  const result = db
    .prepare(
      `INSERT INTO lens_accessories (camera_id, accessory_name, focal_length_description, purchase_date, notes)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run(
      data.camera_id,
      data.accessory_name,
      data.focal_length_description ?? "",
      data.purchase_date,
      data.notes ?? ""
    );

  return db
    .prepare("SELECT * FROM lens_accessories WHERE id = ?")
    .get(result.lastInsertRowid) as LensAccessory;
}

export function deleteLensAccessory(id: number): boolean {
  const result = db.prepare("DELETE FROM lens_accessories WHERE id = ?").run(id);
  return result.changes > 0;
}

export function getUsageLogsByCameraId(cameraId: number): UsageLog[] {
  return db
    .prepare("SELECT * FROM usage_logs WHERE camera_id = ? ORDER BY record_date DESC, id DESC")
    .all(cameraId) as UsageLog[];
}

export function createUsageLog(
  cameraId: number,
  data: { record_date: string; content: string; recorder: string }
): UsageLog | undefined {
  if (!getCameraById(cameraId)) return undefined;

  const result = db
    .prepare(
      `INSERT INTO usage_logs (camera_id, record_date, content, recorder)
       VALUES (?, ?, ?, ?)`
    )
    .run(cameraId, data.record_date, data.content, data.recorder);

  return db
    .prepare("SELECT * FROM usage_logs WHERE id = ?")
    .get(result.lastInsertRowid) as UsageLog;
}

export default db;
