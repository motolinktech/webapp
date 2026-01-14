export interface CommercialCondition {
  id: string;
  clientId: string;
  paymentForm: string[];
  dailyPeriods: string[];
  guaranteedPeriods: string[];
  deliveryAreaKm: number;
  isMotolinkCovered: boolean;
  guaranteedDay: number;
  guaranteedDayWeekend: number;
  guaranteedNight: number;
  guaranteedNightWeekend: number;
  clientDailyDay: number;
  clientDailyDayWknd: number;
  clientDailyNight: number;
  clientDailyNightWknd: number;
  clientPerDelivery: string;
  clientAdditionalKm: number;
  deliverymanDailyDay: number;
  deliverymanDailyDayWknd: number;
  deliverymanDailyNight: number;
  deliverymanDailyNightWknd: number;
  deliverymanPerDelivery: string;
  deliverymanAdditionalKm: number;
}

export interface Client {
  id: string;
  name: string;
  cnpj: string;
  cep: string;
  street: string;
  number: string;
  complement: string;
  city: string;
  neighborhood: string;
  uf: string;
  contactName: string;
  contactPhone?: string;
  observations?: string;
  branchId: string;
  regionId: string | null;
  groupId: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  branch?: { id: string; name: string };
  region?: { id: string; name: string };
  group?: { id: string; name: string } | null;
  commercialCondition?: CommercialCondition;
}

export interface ClientListParams {
  page?: number;
  limit?: number;
  name?: string;
  cnpj?: string;
  city?: string;
  uf?: string;
  regionId?: string;
  groupId?: string;
  isDeleted?: boolean;
}

export interface ClientListResponse {
  data: Client[];
  count: number;
}

export interface CreateClientPayload {
  name: string;
  cnpj: string;
  cep: string;
  street: string;
  number: string;
  complement: string;
  city: string;
  neighborhood: string;
  uf: string;
  contactName: string;
  contactPhone: string;
  observations?: string;
  regionId?: string;
  groupId?: string;
}

export interface CreateCommercialConditionPayload {
  paymentForm?: string[];
  paymentTermDays?: number;
  deliveryAreaKm?: number;
  isMotolinkCovered?: boolean;
  guaranteedDay?: number;
  guaranteedDayWeekend?: number;
  guaranteedNight?: number;
  guaranteedNightWeekend?: number;
  clientDailyDay?: number;
  clientDailyDayWknd?: number;
  clientDailyNight?: number;
  clientDailyNightWknd?: number;
  clientPerDelivery?: number;
  clientAdditionalKm?: number;
  deliverymanDailyDay?: number;
  deliverymanDailyDayWknd?: number;
  deliverymanDailyNight?: number;
  deliverymanDailyNightWknd?: number;
  deliverymanPerDelivery?: number;
  deliverymanAdditionalKm?: number;
}

export interface CreateClientData {
  client: CreateClientPayload;
  commercialCondition?: CreateCommercialConditionPayload;
}

export interface UpdateClientData {
  clientId: string;
  client?: Partial<CreateClientPayload>;
  commercialCondition?: Partial<CreateCommercialConditionPayload>;
}
