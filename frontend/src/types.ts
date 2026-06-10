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
