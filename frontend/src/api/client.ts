import axios from "axios";
import type {
  Camera,
  CameraFormData,
  MaintenanceFormData,
  MaintenanceRecord,
  ShutterCountFormData,
  ShutterCountRecord,
  StatisticsOverview,
} from "../types";

const api = axios.create({ baseURL: "/api" });

export async function fetchCameras(): Promise<Camera[]> {
  const { data } = await api.get<Camera[]>("/cameras");
  return data;
}

export async function fetchCamera(id: number): Promise<Camera> {
  const { data } = await api.get<Camera>(`/cameras/${id}`);
  return data;
}

export async function createCamera(payload: CameraFormData): Promise<Camera> {
  const { data } = await api.post<Camera>("/cameras", payload);
  return data;
}

export async function updateCamera(id: number, payload: CameraFormData): Promise<Camera> {
  const { data } = await api.put<Camera>(`/cameras/${id}`, payload);
  return data;
}

export async function deleteCamera(id: number): Promise<void> {
  await api.delete(`/cameras/${id}`);
}

export async function fetchMaintenance(cameraId: number): Promise<MaintenanceRecord[]> {
  const { data } = await api.get<MaintenanceRecord[]>(`/cameras/${cameraId}/maintenance`);
  return data;
}

export async function createMaintenance(
  cameraId: number,
  payload: MaintenanceFormData
): Promise<MaintenanceRecord> {
  const { data } = await api.post<MaintenanceRecord>(`/cameras/${cameraId}/maintenance`, payload);
  return data;
}

export async function deleteMaintenance(id: number): Promise<void> {
  await api.delete(`/maintenance/${id}`);
}

export async function fetchShutterCounts(cameraId?: number): Promise<ShutterCountRecord[]> {
  const params = cameraId ? { camera_id: cameraId } : {};
  const { data } = await api.get<ShutterCountRecord[]>("/shutter-counts", { params });
  return data;
}

export async function createShutterCount(payload: ShutterCountFormData): Promise<ShutterCountRecord> {
  const { data } = await api.post<ShutterCountRecord>("/shutter-counts", payload);
  return data;
}

export async function deleteShutterCount(id: number): Promise<void> {
  await api.delete(`/shutter-counts/${id}`);
}

export async function fetchStatisticsOverview(): Promise<StatisticsOverview> {
  const { data } = await api.get<StatisticsOverview>("/statistics/overview");
  return data;
}
