import { authApi } from "@/lib/services/api";
import type {
  WorkShiftSlot,
  WorkShiftSlotListParams,
  WorkShiftSlotListResponse,
  WorkShiftSlotGroupedResponse,
  CreateWorkShiftSlotPayload,
  UpdateWorkShiftSlotPayload,
} from "./work-shift-slots.types";

export async function createWorkShiftSlot(data: CreateWorkShiftSlotPayload): Promise<WorkShiftSlot> {
  const response = await authApi.post<WorkShiftSlot>("/work-shift-slots", data);
  return response.data;
}

export async function listWorkShiftSlots(params?: WorkShiftSlotListParams): Promise<WorkShiftSlotListResponse> {
  const response = await authApi.get<WorkShiftSlotListResponse>("/work-shift-slots", {
    params,
  });
  return response.data;
}

export async function getWorkShiftSlotById(id: string): Promise<WorkShiftSlot> {
  const response = await authApi.get<WorkShiftSlot>(`/work-shift-slots/${id}`);
  return response.data;
}

export async function getWorkShiftSlotsByGroup(groupId: string): Promise<WorkShiftSlotGroupedResponse> {
  const response = await authApi.get<WorkShiftSlotGroupedResponse>(`/work-shift-slots/group/${groupId}`);
  return response.data;
}

export async function updateWorkShiftSlot(id: string, data: UpdateWorkShiftSlotPayload): Promise<WorkShiftSlot> {
  const response = await authApi.put<WorkShiftSlot>(`/work-shift-slots/${id}`, data);
  return response.data;
}
