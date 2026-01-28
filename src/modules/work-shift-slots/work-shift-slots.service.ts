import { authApi } from "@/lib/services/api";
import type {
  CheckInOutPayload,
  CopyWorkShiftSlotsPayload,
  CopyWorkShiftSlotsResponse,
  CreateWorkShiftSlotPayload,
  SendBulkInvitesPayload,
  SendBulkInvitesResponse,
  UpdateWorkShiftSlotPayload,
  WorkShiftSlot,
  WorkShiftSlotGroupedResponse,
  WorkShiftSlotListParams,
  WorkShiftSlotListResponse,
} from "./work-shift-slots.types";

export async function createWorkShiftSlot(
  data: CreateWorkShiftSlotPayload,
): Promise<WorkShiftSlot> {
  const response = await authApi.post<WorkShiftSlot>("/work-shift-slots", data);
  return response.data;
}

export async function listWorkShiftSlots(
  params?: WorkShiftSlotListParams,
): Promise<WorkShiftSlotListResponse> {
  const response = await authApi.get<WorkShiftSlotListResponse>("/work-shift-slots", {
    params,
  });
  return response.data;
}

export async function getWorkShiftSlotById(id: string): Promise<WorkShiftSlot> {
  const response = await authApi.get<WorkShiftSlot>(`/work-shift-slots/${id}`);
  return response.data;
}

export async function getWorkShiftSlotsByGroup(
  groupId: string,
  params?: { startDate?: string; endDate?: string },
): Promise<WorkShiftSlotGroupedResponse> {
  const response = await authApi.get<WorkShiftSlotGroupedResponse>(
    `/work-shift-slots/group/${groupId}`,
    { params },
  );
  return response.data;
}

export async function updateWorkShiftSlot(
  id: string,
  data: UpdateWorkShiftSlotPayload,
): Promise<WorkShiftSlot> {
  const response = await authApi.put<WorkShiftSlot>(`/work-shift-slots/${id}`, data);
  return response.data;
}

export async function checkInWorkShiftSlot(
  id: string,
  data?: CheckInOutPayload,
): Promise<WorkShiftSlot> {
  const response = await authApi.post<WorkShiftSlot>(`/work-shift-slots/${id}/check-in`, data ?? {});
  return response.data;
}

export async function checkOutWorkShiftSlot(
  id: string,
  data?: CheckInOutPayload,
): Promise<WorkShiftSlot> {
  const response = await authApi.post<WorkShiftSlot>(`/work-shift-slots/${id}/check-out`, data ?? {});
  return response.data;
}

export async function markAbsentWorkShiftSlot(id: string): Promise<WorkShiftSlot> {
  const response = await authApi.post<WorkShiftSlot>(`/work-shift-slots/${id}/mark-absent`, {});
  return response.data;
}

export async function connectTrackingWorkShiftSlot(id: string): Promise<WorkShiftSlot> {
  const response = await authApi.post<WorkShiftSlot>(`/work-shift-slots/${id}/connect-tracking`);
  return response.data;
}

export async function confirmCompletionWorkShiftSlot(id: string): Promise<WorkShiftSlot> {
  const response = await authApi.post<WorkShiftSlot>(`/work-shift-slots/${id}/confirm-completion`);
  return response.data;
}

export async function sendWorkShiftSlotInvites(
  data: SendBulkInvitesPayload,
): Promise<SendBulkInvitesResponse> {
  const response = await authApi.post<SendBulkInvitesResponse>(
    "/work-shift-slots/invites",
    data,
  );
  return response.data;
}

export async function deleteWorkShiftSlot(id: string): Promise<void> {
  await authApi.delete<void>(`/work-shift-slots/${id}`);
}

export async function copyWorkShiftSlots(
  data: CopyWorkShiftSlotsPayload,
): Promise<CopyWorkShiftSlotsResponse> {
  const response = await authApi.post<CopyWorkShiftSlotsResponse>(
    "/work-shift-slots/copy",
    data,
  );
  return response.data;
}
