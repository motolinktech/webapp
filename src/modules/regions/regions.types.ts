export interface Region {
  id: string;
  name: string;
  description: string | null;
  branchId: string;
  createdAt: string;
  updatedAt: string;
}

export interface RegionListParams {
  page?: number;
  limit?: number;
  name?: string;
}

export interface RegionListResponse {
  data: Region[];
  count: number;
}

export interface CreateRegionData {
  name: string;
  description?: string;
}

export interface UpdateRegionData {
  id: string;
  name?: string;
  description?: string;
}
