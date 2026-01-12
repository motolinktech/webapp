import { authApi } from "@/lib/services/api";
import type {
  Client,
  ClientListParams,
  ClientListResponse,
  CreateClientData,
  UpdateClientData,
} from "./clients.types";

export async function createClient(data: CreateClientData): Promise<Client> {
  const response = await authApi.post<Client>("/clients", data);
  return response.data;
}

export async function listClients(params?: ClientListParams): Promise<ClientListResponse> {
  const response = await authApi.get<ClientListResponse>("/clients/complete", {
    params,
  });
  return response.data;
}

export async function getClientById(id: string): Promise<Client> {
  const response = await authApi.get<Client>(`/clients/${id}`);
  return response.data;
}

export async function updateClient(data: UpdateClientData): Promise<Client> {
  const { clientId, ...updateData } = data;
  const response = await authApi.put<Client>(`/clients/${clientId}`, updateData);
  return response.data;
}

export async function deleteClient(id: string): Promise<Client> {
  const response = await authApi.delete<Client>(`/clients/${id}`);
  return response.data;
}
