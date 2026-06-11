import axios from "axios";
import type {
  Camera,
  CameraFormData,
  LensAccessory,
  LensAccessoryFormData,
  MaintenanceFormData,
  MaintenanceRecord,
  MaintenanceType,
  MaintenanceTypeFormData,
  ShutterCountFormData,
  ShutterCountRecord,
  StatisticsOverview,
  UsageLog,
  UsageLogFormData,
} from "../types";

const api = axios.create({ baseURL: "/api" });

export async function fetchCameras(params?: {
  status?: string;
  modelKeyword?: string;
  brand?: string;
}): Promise<Camera[]> {
  const { data } = await api.get<Camera[]>("/cameras", { params: params || {} });
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

export async function fetchMaintenanceTotalCost(cameraId: number): Promise<number> {
  const { data } = await api.get<{ total_cost: number }>(`/cameras/${cameraId}/maintenance/total-cost`);
  return data.total_cost;
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

export async function fetchMaintenanceTypes(): Promise<MaintenanceType[]> {
  const { data } = await api.get<MaintenanceType[]>("/maintenance-types");
  return data;
}

export async function createMaintenanceType(
  payload: MaintenanceTypeFormData
): Promise<MaintenanceType> {
  const { data } = await api.post<MaintenanceType>("/maintenance-types", payload);
  return data;
}

export async function fetchLensAccessories(cameraId?: number): Promise<LensAccessory[]> {
  const params = cameraId ? { camera_id: cameraId } : {};
  const { data } = await api.get<LensAccessory[]>("/lens-accessories", { params });
  return data;
}

export async function createLensAccessory(
  payload: LensAccessoryFormData
): Promise<LensAccessory> {
  const { data } = await api.post<LensAccessory>("/lens-accessories", payload);
  return data;
}

export async function deleteLensAccessory(id: number): Promise<void> {
  await api.delete(`/lens-accessories/${id}`);
}

export async function fetchUsageLogs(cameraId: number): Promise<UsageLog[]> {
  const { data } = await api.get<UsageLog[]>(`/usage-logs/${cameraId}`);
  return data;
}

export async function createUsageLog(
  cameraId: number,
  payload: UsageLogFormData
): Promise<UsageLog> {
  const { data } = await api.post<UsageLog>(`/usage-logs/${cameraId}`, payload);
  return data;
}
