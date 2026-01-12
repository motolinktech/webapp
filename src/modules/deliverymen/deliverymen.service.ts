import { authApi } from "@/lib/services/api";
import type {
  CreateDeliverymanData,
  Deliveryman,
  DeliverymanListParams,
  DeliverymanListResponse,
  UpdateDeliverymanData,
} from "./deliverymen.types";

export async function createDeliveryman(data: CreateDeliverymanData): Promise<Deliveryman> {
  const response = await authApi.post<Deliveryman>("/deliverymen", data);
  return response.data;
}

export async function listDeliverymen(params?: DeliverymanListParams): Promise<DeliverymanListResponse> {
  const response = await authApi.get<DeliverymanListResponse>("/deliverymen", {
    params,
  });
  return response.data;
}

export async function getDeliverymanById(id: string): Promise<Deliveryman> {
  const response = await authApi.get<Deliveryman>(`/deliverymen/${id}`);
  return response.data;
}

export async function updateDeliveryman(data: UpdateDeliverymanData): Promise<Deliveryman> {
  const { id, ...updateData } = data;
  const response = await authApi.put<Deliveryman>(`/deliverymen/${id}`, updateData);
  return response.data;
}

export async function toggleBlockDeliveryman(id: string): Promise<Deliveryman> {
  const response = await authApi.patch<Deliveryman>(`/deliverymen/${id}/toggle-block`);
  return response.data;
}

export async function deleteDeliveryman(id: string): Promise<Deliveryman> {
  const response = await authApi.delete<Deliveryman>(`/deliverymen/${id}`);
  return response.data;
}
