import { authApi } from "@/lib/services/api";
import type {
  CreateGroupData,
  Group,
  GroupListParams,
  GroupListResponse,
  UpdateGroupData,
} from "./groups.types";

export async function createGroup(data: CreateGroupData): Promise<Group> {
  const response = await authApi.post<Group>("/groups", data);
  return response.data;
}

export async function listGroups(params?: GroupListParams): Promise<GroupListResponse> {
  const response = await authApi.get<GroupListResponse>("/groups", {
    params,
  });
  return response.data;
}

export async function getGroupById(id: string): Promise<Group> {
  const response = await authApi.get<Group>(`/groups/${id}`);
  return response.data;
}

export async function updateGroup(data: UpdateGroupData): Promise<Group> {
  const { id, ...updateData } = data;
  const response = await authApi.put<Group>(`/groups/${id}`, updateData);
  return response.data;
}

export async function deleteGroup(id: string): Promise<Group> {
  const response = await authApi.delete<Group>(`/groups/${id}`);
  return response.data;
}
