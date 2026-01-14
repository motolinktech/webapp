export interface Deliveryman {
  id: string;
  name: string;
  document: string;
  files: string[];
  phone: string;
  contractType: string;
  mainPixKey: string;
  secondPixKey: string | null;
  thridPixKey: string | null;
  agency: string | null;
  account: string | null;
  vehicleModel: string | null;
  vehiclePlate: string | null;
  vehicleColor: string | null;
  branchId: string;
  regionId: string | null;
  isBlocked: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  branch?: {
    id: string;
    name: string;
  };
  region?: {
    id: string;
    name: string;
  };
}

export interface CreateDeliverymanData {
  name: string;
  document: string;
  phone: string;
  contractType: string;
  mainPixKey: string;
  secondPixKey?: string;
  thridPixKey?: string;
  agency?: string;
  account?: string;
  vehicleModel?: string;
  vehiclePlate?: string;
  vehicleColor?: string;
  regionId?: string;
}

export type UpdateDeliverymanData = { id: string } & Partial<CreateDeliverymanData>;

export interface DeliverymanListParams {
  page?: number;
  limit?: number;
  name?: string;
  document?: string;
  phone?: string;
  contractType?: string;
  regionId?: string;
  isBlocked?: boolean;
  isDeleted?: boolean;
}

export interface DeliverymanListResponse {
  data: Deliveryman[];
  count: number;
}
