import { authApi } from "@/lib/services/api";
import type {
  CreatePlanningData,
  Planning,
  PlanningListParams,
  PlanningListResponse,
  UpdatePlanningData,
} from "./planning.types";

export async function createPlanning(data: CreatePlanningData): Promise<Planning> {
  const response = await authApi.post<Planning>("/planning", data);
  return response.data;
}

export async function listPlannings(params?: PlanningListParams): Promise<PlanningListResponse> {
  const response = await authApi.get<PlanningListResponse>("/planning", {
    params,
  });
  return response.data;
}

export async function getPlanningById(id: string): Promise<Planning> {
  const response = await authApi.get<Planning>(`/planning/${id}`);
  return response.data;
}

export async function updatePlanning(data: UpdatePlanningData): Promise<Planning> {
  const { id, ...updateData } = data;
  const response = await authApi.put<Planning>(`/planning/${id}`, updateData);
  return response.data;
}

export async function deletePlanning(id: string): Promise<Planning> {
  const response = await authApi.delete<Planning>(`/planning/${id}`);
  return response.data;
}
