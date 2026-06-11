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

export interface CameraFormData {
  model: string;
  purchase_date: string;
  estimated_shutter_count: number;
  notes: string;
}

export interface MaintenanceFormData {
  maintenance_date: string;
  content: string;
}

export interface MaintenanceType {
  id: number;
  type_name: string;
  category: string;
  description: string;
}

export interface MaintenanceTypeFormData {
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

export interface ShutterCountFormData {
  camera_id: number;
  record_date: string;
  shutter_increment: number;
  notes: string;
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
