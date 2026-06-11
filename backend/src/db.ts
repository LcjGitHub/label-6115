import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

let db: Database.Database;
let currentDbPath: string;

export function initializeDb(customDbPath?: string): Database.Database {
  if (db) {
    return db;
  }

  if (customDbPath) {
    currentDbPath = customDbPath;
  } else {
    const dataDir = path.join(__dirname, "..", "data");
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    currentDbPath = path.join(dataDir, "cameras.db");
  }

  const dbDir = path.dirname(currentDbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  db = new Database(currentDbPath);
  getDb().pragma("journal_mode = WAL");
  getDb().pragma("foreign_keys = ON");

  return db;
}

export function closeDb(): void {
  if (db) {
    getDb().close();
  }
  (db as any) = undefined;
  (currentDbPath as any) = undefined;
}

export function getDb(): Database.Database {
  if (!db) {
    initializeDb();
  }
  return db;
}

initializeDb();

export type CameraStatus = "使用中" | "维修中" | "闲置";

export interface Camera {
  id: number;
  brand: string;
  model: string;
  purchase_date: string;
  estimated_shutter_count: number;
  notes: string;
  status: CameraStatus;
  rated_shutter_life: number;
  shutter_warning: boolean;
}

export interface MaintenanceRecord {
  id: number;
  camera_id: number;
  maintenance_date: string;
  content: string;
  cost: number;
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

export interface RepairServiceProvider {
  id: number;
  provider_name: string;
  phone: string;
  address: string;
  notes: string;
}

export interface WarrantyInfo {
  id: number;
  camera_id: number;
  warranty_expiry_date: string;
  warranty_provider: string;
  notes: string;
}

export function initDb(): void {
  const database = getDb();
  database.exec(`
    CREATE TABLE IF NOT EXISTS cameras (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      brand TEXT NOT NULL,
      model TEXT NOT NULL,
      purchase_date TEXT NOT NULL,
      estimated_shutter_count INTEGER NOT NULL DEFAULT 0,
      notes TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT '使用中',
      rated_shutter_life INTEGER NOT NULL DEFAULT 200000
    );

    CREATE TABLE IF NOT EXISTS maintenance_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      camera_id INTEGER NOT NULL,
      maintenance_date TEXT NOT NULL,
      content TEXT NOT NULL,
      cost REAL NOT NULL DEFAULT 0,
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

    CREATE TABLE IF NOT EXISTS repair_service_providers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      provider_name TEXT NOT NULL,
      phone TEXT NOT NULL DEFAULT '',
      address TEXT NOT NULL DEFAULT '',
      notes TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS warranty_info (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      camera_id INTEGER NOT NULL,
      warranty_expiry_date TEXT NOT NULL,
      warranty_provider TEXT NOT NULL,
      notes TEXT NOT NULL DEFAULT '',
      FOREIGN KEY (camera_id) REFERENCES cameras(id) ON DELETE CASCADE
    );
  `);

  const camColumns = database
    .prepare("PRAGMA table_info(cameras)")
    .all() as { name: string }[];
  const hasBrandColumn = camColumns.some((col) => col.name === "brand");
  if (!hasBrandColumn) {
    database.exec(`
      ALTER TABLE cameras ADD COLUMN brand TEXT NOT NULL DEFAULT '';
    `);
    const backfillBrand = database.prepare("UPDATE cameras SET brand = ? WHERE model = ?");
    backfillBrand.run("佳能", "Canon EOS R5");
    backfillBrand.run("新索尼", "Sony A7 IV");
  }
  const hasStatusColumn = camColumns.some((col) => col.name === "status");
  if (!hasStatusColumn) {
    database.exec(`
      ALTER TABLE cameras ADD COLUMN status TEXT NOT NULL DEFAULT '使用中';
    `);
  }

  const hasRatedShutterLifeColumn = camColumns.some((col) => col.name === "rated_shutter_life");
  if (!hasRatedShutterLifeColumn) {
    database.exec(`
      ALTER TABLE cameras ADD COLUMN rated_shutter_life INTEGER NOT NULL DEFAULT 200000;
    `);
    const backfillRated = database.prepare("UPDATE cameras SET rated_shutter_life = ? WHERE model = ?");
    backfillRated.run(300000, "Canon EOS R5");
    backfillRated.run(200000, "Sony A7 IV");
  }

  const mrColumns = database
    .prepare("PRAGMA table_info(maintenance_records)")
    .all() as { name: string }[];
  const hasCostColumn = mrColumns.some((col) => col.name === "cost");
  if (!hasCostColumn) {
    database.exec(`
      ALTER TABLE maintenance_records ADD COLUMN cost REAL NOT NULL DEFAULT 0;
    `);

    const backfill = database.prepare(
      "UPDATE maintenance_records SET cost = ? WHERE content = ?"
    );
    backfill.run(280, "传感器清洁 + 固件升级");
    backfill.run(150, "快门检测，计数正常");
    backfill.run(50, "更换目镜保护膜");
    backfill.run(120, "卡口与触点清洁保养");
  }

  const camCount = database.prepare("SELECT COUNT(*) as c FROM cameras").get() as { c: number };
  const mtCount = database.prepare("SELECT COUNT(*) as c FROM maintenance_types").get() as { c: number };
  const laCount = database.prepare("SELECT COUNT(*) as c FROM lens_accessories").get() as { c: number };
  const ulCount = database.prepare("SELECT COUNT(*) as c FROM usage_logs").get() as { c: number };
  const rspCount = database.prepare("SELECT COUNT(*) as c FROM repair_service_providers").get() as { c: number };
  const wiCount = database.prepare("SELECT COUNT(*) as c FROM warranty_info").get() as { c: number };
  if (camCount.c === 0 || mtCount.c === 0 || laCount.c === 0 || ulCount.c === 0 || rspCount.c === 0 || wiCount.c === 0) {
    seedData(camCount.c === 0, mtCount.c === 0, laCount.c === 0, ulCount.c === 0, rspCount.c === 0, wiCount.c === 0);
  }
}

function seedData(seedCameras: boolean, seedMaintenanceTypes: boolean, seedLensAccessories: boolean, seedUsageLogs: boolean, seedRepairServiceProviders: boolean, seedWarrantyInfo: boolean): void {
  const database = getDb();
  const insertCamera = database.prepare(`
    INSERT INTO cameras (brand, model, purchase_date, estimated_shutter_count, notes, status, rated_shutter_life)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMaintenance = database.prepare(`
    INSERT INTO maintenance_records (camera_id, maintenance_date, content, cost)
    VALUES (?, ?, ?, ?)
  `);

  const insertShutterCount = database.prepare(`
    INSERT INTO shutter_counts (camera_id, record_date, shutter_increment, notes)
    VALUES (?, ?, ?, ?)
  `);

  const insertMaintenanceType = database.prepare(`
    INSERT INTO maintenance_types (type_name, category, description)
    VALUES (?, ?, ?)
  `);

  const insertLensAccessory = database.prepare(`
    INSERT INTO lens_accessories (camera_id, accessory_name, focal_length_description, purchase_date, notes)
    VALUES (?, ?, ?, ?, ?)
  `);

  const insertUsageLog = database.prepare(`
    INSERT INTO usage_logs (camera_id, record_date, content, recorder)
    VALUES (?, ?, ?, ?)
  `);

  const insertRepairServiceProvider = database.prepare(`
    INSERT INTO repair_service_providers (provider_name, phone, address, notes)
    VALUES (?, ?, ?, ?)
  `);

  const insertWarrantyInfo = database.prepare(`
    INSERT INTO warranty_info (camera_id, warranty_expiry_date, warranty_provider, notes)
    VALUES (?, ?, ?, ?)
  `);

  const seed = database.transaction(() => {
    let cam1Id: number | bigint = 0;
    let cam2Id: number | bigint = 0;

    if (seedCameras) {
      const cam1 = insertCamera.run("佳能", "Canon EOS R5", "2022-03-15", 85000, "主力机身，风光拍摄", "维修中", 300000);
      const cam2 = insertCamera.run("新索尼", "Sony A7 IV", "2023-08-20", 170000, "视频与街拍备用机", "闲置", 200000);
      cam1Id = cam1.lastInsertRowid;
      cam2Id = cam2.lastInsertRowid;

      insertMaintenance.run(cam1Id, "2024-01-10", "传感器清洁 + 固件升级", 280);
      insertMaintenance.run(cam1Id, "2024-09-05", "快门检测，计数正常", 150);
      insertMaintenance.run(cam2Id, "2024-02-18", "更换目镜保护膜", 50);
      insertMaintenance.run(cam2Id, "2024-11-12", "卡口与触点清洁保养", 120);

      insertShutterCount.run(cam1Id, "2024-10-01", 1200, "风光外拍");
      insertShutterCount.run(cam1Id, "2024-11-15", 800, "棚拍");
      insertShutterCount.run(cam2Id, "2024-10-05", 600, "街拍");
      insertShutterCount.run(cam2Id, "2024-12-01", 450, "活动拍摄");
    } else {
      const cameras = database.prepare("SELECT id FROM cameras ORDER BY id LIMIT 2").all() as { id: number }[];
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

    if (seedRepairServiceProviders) {
      insertRepairServiceProvider.run("星辰专业相机维修中心", "400-888-1234", "北京市朝阳区建国路88号", "专注佳能、索尼高端相机维修，官方授权服务商");
      insertRepairServiceProvider.run("光影影像设备维保", "021-6666-7788", "上海市徐汇区漕溪北路100号", "提供镜头清洁、传感器除尘、快门更换等全系列服务");
    }

    if (seedWarrantyInfo && cam1Id && cam2Id) {
      insertWarrantyInfo.run(cam1Id, "2025-03-14", "佳能官方保修", "整机两年质保，含免费清洁服务一次");
      insertWarrantyInfo.run(cam2Id, "2026-08-19", "索尼官方保修", "整机三年质保，含延保服务");
    }
  });

  seed();
}

export function getAllCameras(options?: { status?: CameraStatus; modelKeyword?: string; brand?: string }): Camera[] {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (options?.status) {
    conditions.push("status = ?");
    params.push(options.status);
  }
  if (options?.modelKeyword) {
    conditions.push("model LIKE ?");
    params.push(`%${options.modelKeyword}%`);
  }
  if (options?.brand) {
    conditions.push("brand = ?");
    params.push(options.brand);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const rows = getDb().prepare(`SELECT * FROM cameras ${whereClause} ORDER BY id`).all(...params) as (Omit<Camera, "shutter_warning"> & { rated_shutter_life: number })[];
  return rows.map((row) => ({
    ...row,
    shutter_warning: row.estimated_shutter_count >= row.rated_shutter_life * 0.8,
  }));
}

export function getCameraById(id: number): Camera | undefined {
  const row = getDb().prepare("SELECT * FROM cameras WHERE id = ?").get(id) as (Omit<Camera, "shutter_warning"> & { rated_shutter_life: number }) | undefined;
  if (!row) return undefined;
  return {
    ...row,
    shutter_warning: row.estimated_shutter_count >= row.rated_shutter_life * 0.8,
  };
}

export function createCamera(data: Omit<Camera, "id" | "shutter_warning">): Camera {
  const rated = data.rated_shutter_life ?? 200000;
  const result = db
    .prepare(
      `INSERT INTO cameras (brand, model, purchase_date, estimated_shutter_count, notes, status, rated_shutter_life)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(data.brand, data.model, data.purchase_date, data.estimated_shutter_count, data.notes, data.status ?? "使用中", rated);
  return getCameraById(Number(result.lastInsertRowid))!;
}

export function updateCamera(id: number, data: Omit<Camera, "id" | "shutter_warning">): Camera | undefined {
  const existing = getCameraById(id);
  if (!existing) return undefined;

  getDb().prepare(
    `UPDATE cameras SET brand = ?, model = ?, purchase_date = ?, estimated_shutter_count = ?, notes = ?, status = ?, rated_shutter_life = ?
     WHERE id = ?`
  ).run(data.brand, data.model, data.purchase_date, data.estimated_shutter_count, data.notes, data.status ?? "使用中", data.rated_shutter_life ?? 200000, id);

  return getCameraById(id);
}

export function deleteCamera(id: number): boolean {
  const result = getDb().prepare("DELETE FROM cameras WHERE id = ?").run(id);
  return result.changes > 0;
}

export function getMaintenanceByCameraId(cameraId: number): MaintenanceRecord[] {
  return db
    .prepare("SELECT * FROM maintenance_records WHERE camera_id = ? ORDER BY maintenance_date DESC")
    .all(cameraId) as MaintenanceRecord[];
}

export function createMaintenance(
  cameraId: number,
  data: { maintenance_date: string; content: string; cost?: number }
): MaintenanceRecord | undefined {
  if (!getCameraById(cameraId)) return undefined;

  const result = db
    .prepare(
      `INSERT INTO maintenance_records (camera_id, maintenance_date, content, cost)
       VALUES (?, ?, ?, ?)`
    )
    .run(cameraId, data.maintenance_date, data.content, data.cost ?? 0);

  return db
    .prepare("SELECT * FROM maintenance_records WHERE id = ?")
    .get(result.lastInsertRowid) as MaintenanceRecord;
}

export function deleteMaintenance(id: number): boolean {
  const result = getDb().prepare("DELETE FROM maintenance_records WHERE id = ?").run(id);
  return result.changes > 0;
}

export function updateMaintenance(
  id: number,
  data: { maintenance_date: string; content: string; cost?: number }
): MaintenanceRecord | undefined {
  const existing = getDb().prepare("SELECT * FROM maintenance_records WHERE id = ?").get(id) as
    | MaintenanceRecord
    | undefined;
  if (!existing) return undefined;

  getDb().prepare(
    `UPDATE maintenance_records SET maintenance_date = ?, content = ?, cost = ?
     WHERE id = ?`
  ).run(data.maintenance_date, data.content, data.cost ?? existing.cost, id);

  return getDb().prepare("SELECT * FROM maintenance_records WHERE id = ?").get(id) as MaintenanceRecord;
}

export function getMaintenanceTotalCostByCameraId(cameraId: number): number {
  const row = db
    .prepare("SELECT COALESCE(SUM(cost), 0) as total FROM maintenance_records WHERE camera_id = ?")
    .get(cameraId) as { total: number };
  return row.total;
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
  const result = getDb().prepare("DELETE FROM shutter_counts WHERE id = ?").run(id);
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
    getDb().prepare("SELECT COUNT(*) as c FROM cameras").get() as { c: number }
  ).c;

  const totalMaintenanceRecords = (
    getDb().prepare("SELECT COUNT(*) as c FROM maintenance_records").get() as { c: number }
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
  return getDb().prepare("SELECT * FROM maintenance_types ORDER BY id").all() as MaintenanceType[];
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
  const result = getDb().prepare("DELETE FROM lens_accessories WHERE id = ?").run(id);
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

  return getDb()
    .prepare("SELECT * FROM usage_logs WHERE id = ?")
    .get(result.lastInsertRowid) as UsageLog;
}

export function getAllRepairServiceProviders(): RepairServiceProvider[] {
  return getDb().prepare("SELECT * FROM repair_service_providers ORDER BY id").all() as RepairServiceProvider[];
}

export function createRepairServiceProvider(
  data: { provider_name: string; phone: string; address: string; notes: string }
): RepairServiceProvider {
  const result = db
    .prepare(
      `INSERT INTO repair_service_providers (provider_name, phone, address, notes)
       VALUES (?, ?, ?, ?)`
    )
    .run(data.provider_name.trim(), data.phone ?? "", data.address ?? "", data.notes ?? "");
  return db
    .prepare("SELECT * FROM repair_service_providers WHERE id = ?")
    .get(result.lastInsertRowid) as RepairServiceProvider;
}

export function deleteRepairServiceProvider(id: number): boolean {
  const result = getDb().prepare("DELETE FROM repair_service_providers WHERE id = ?").run(id);
  return result.changes > 0;
}

export function getWarrantyInfo(cameraId?: number): WarrantyInfo[] {
  if (cameraId) {
    return db
      .prepare("SELECT * FROM warranty_info WHERE camera_id = ? ORDER BY warranty_expiry_date DESC")
      .all(cameraId) as WarrantyInfo[];
  }
  return db
    .prepare("SELECT * FROM warranty_info ORDER BY id")
    .all() as WarrantyInfo[];
}

export function createWarrantyInfo(
  data: Omit<WarrantyInfo, "id">
): WarrantyInfo | undefined {
  if (!getCameraById(data.camera_id)) return undefined;

  const result = db
    .prepare(
      `INSERT INTO warranty_info (camera_id, warranty_expiry_date, warranty_provider, notes)
       VALUES (?, ?, ?, ?)`
    )
    .run(
      data.camera_id,
      data.warranty_expiry_date,
      data.warranty_provider,
      data.notes ?? ""
    );

  return db
    .prepare("SELECT * FROM warranty_info WHERE id = ?")
    .get(result.lastInsertRowid) as WarrantyInfo;
}

export function deleteWarrantyInfo(id: number): boolean {
  const result = getDb().prepare("DELETE FROM warranty_info WHERE id = ?").run(id);
  return result.changes > 0;
}

export default getDb();
