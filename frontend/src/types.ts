export type CameraStatus = "使用中" | "维修中" | "闲置";

export const CAMERA_STATUSES: CameraStatus[] = ["使用中", "维修中", "闲置"];

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

export interface CameraFormData {
  brand: string;
  model: string;
  purchase_date: string;
  estimated_shutter_count: number;
  notes: string;
  status: CameraStatus;
  rated_shutter_life: number;
}

export interface MaintenanceFormData {
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

export interface LensAccessory {
  id: number;
  camera_id: number;
  accessory_name: string;
  focal_length_description: string;
  purchase_date: string;
  notes: string;
}

export interface LensAccessoryFormData {
  camera_id: number;
  accessory_name: string;
  focal_length_description: string;
  purchase_date: string;
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

export interface UsageLog {
  id: number;
  camera_id: number;
  record_date: string;
  content: string;
  recorder: string;
}

export interface UsageLogFormData {
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

export interface RepairServiceProviderFormData {
  provider_name: string;
  phone: string;
  address: string;
  notes: string;
}
