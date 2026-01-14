export interface Planning {
  id: string;
  clientId: string;
  branchId: string;
  plannedDate: string;
  plannedCount: number;
  createdAt: string;
  updatedAt: string;
  client?: {
    id: string;
    name: string;
  };
}

export interface PlanningListParams {
  page?: number;
  limit?: number;
  clientId?: string;
  branchId?: string;
  startDate?: string;
  endDate?: string;
}

export interface PlanningListResponse {
  data: Planning[];
  count: number;
}

export interface CreatePlanningData {
  clientId: string;
  branchId: string;
  plannedDate: string;
  plannedCount: number;
}

export interface UpdatePlanningData {
  id: string;
  clientId?: string;
  branchId?: string;
  plannedDate?: string;
  plannedCount?: number;
}
