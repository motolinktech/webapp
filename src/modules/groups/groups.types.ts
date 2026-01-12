export interface Group {
  id: string;
  name: string;
  description: string | null;
  branchId: string;
  createdAt: string;
  updatedAt: string;
}

export interface GroupListParams {
  page?: number;
  limit?: number;
  name?: string;
}

export interface GroupListResponse {
  data: Group[];
  count: number;
}

export interface CreateGroupData {
  name: string;
  description?: string;
}

export interface UpdateGroupData {
  id: string;
  name?: string;
  description?: string;
}
