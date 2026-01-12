import { authApi } from "@/lib/services/api";
import type {
  CreateRegionData,
  Region,
  RegionListParams,
  RegionListResponse,
  UpdateRegionData,
} from "./regions.types";

export async function createRegion(data: CreateRegionData): Promise<Region> {
  const response = await authApi.post<Region>("/regions", data);
  return response.data;
}

export async function listRegions(params?: RegionListParams): Promise<RegionListResponse> {
  const response = await authApi.get<RegionListResponse>("/regions", {
    params,
  });
  return response.data;
}

export async function getRegionById(id: string): Promise<Region> {
  const response = await authApi.get<Region>(`/regions/${id}`);
  return response.data;
}

export async function updateRegion(data: UpdateRegionData): Promise<Region> {
  const { id, ...updateData } = data;
  const response = await authApi.put<Region>(`/regions/${id}`, updateData);
  return response.data;
}

export async function deleteRegion(id: string): Promise<Region> {
  const response = await authApi.delete<Region>(`/regions/${id}`);
  return response.data;
}
