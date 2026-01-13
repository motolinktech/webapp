import { authApi } from "@/lib/services/api";
import type {
  ChangePasswordData,
  CreateUserData,
  UpdateUserData,
  User,
  UserListParams,
  UserListResponse,
} from "./users.types";

export async function listUsers(params?: UserListParams): Promise<UserListResponse> {
  const response = await authApi.get<UserListResponse>("/users", {
    params,
  });
  return response.data;
}

export async function getUserById(id: string): Promise<User> {
  const response = await authApi.get<User>(`/users/${id}`);
  return response.data;
}

export async function createUser(data: CreateUserData): Promise<User> {
  const response = await authApi.post<User>("/users", data);
  return response.data;
}

export async function updateUser(data: UpdateUserData): Promise<User> {
  const { id, ...updateData } = data;
  const response = await authApi.put<User>(`/users/${id}`, updateData);
  return response.data;
}

export async function deleteUser(id: string): Promise<User> {
  const response = await authApi.delete<User>(`/users/${id}`);
  return response.data;
}

export async function changePassword(data: ChangePasswordData): Promise<User> {
  const { id, ...payload } = data;
  const response = await authApi.post<User>(`/users/${id}/change-password`, payload);
  return response.data;
}
