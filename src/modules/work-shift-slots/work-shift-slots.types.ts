export interface WorkShiftSlotDeliveryman {
  id: string;
  name: string;
}

export interface WorkShiftSlotClient {
  id: string;
  name: string;
}

export interface WorkShiftSlotLog {
  timestamp: string;
  action: string;
  userId?: string;
  details?: string;
}

export interface WorkShiftSlot {
  id: string;
  clientId: string;
  deliverymanId: string | null;
  status: string;
  contractType: string;
  shiftDate: string;
  startTime: string;
  endTime: string;
  period: ("daytime" | "nighttime")[];
  isFreelancer: boolean;
  auditStatus: string;
  deliverymanAmountDay?: number;
  deliverymanAmountNight?: number;
  deliverymanPaymentType?: string;
  deliverymenPaymentValue?: string;
  logs: WorkShiftSlotLog[];
  checkInAt?: string | null;
  checkOutAt?: string | null;
  trackingConnected?: boolean;
  trackingConnectedAt?: string | null;
  inviteToken?: string | null;
  inviteSentAt?: string | null;
  inviteExpiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
  deliveryman?: WorkShiftSlotDeliveryman | null;
  client?: WorkShiftSlotClient;
}

export interface WorkShiftSlotListParams {
  page?: number;
  limit?: number;
  clientId?: string;
  clientIds?: string[];
  deliverymanId?: string;
  status?: string;
  month?: number;
  week?: number;
  startDate?: string;
  endDate?: string;
}

export interface WorkShiftSlotListResponse {
  data: WorkShiftSlot[];
  count: number;
}

export interface WorkShiftSlotGroupedResponse {
  [clientName: string]: WorkShiftSlot[];
}

export interface CreateWorkShiftSlotPayload {
  clientId: string;
  deliverymanId?: string | null;
  contractType: string;
  shiftDate: string;
  startTime: string;
  endTime: string;
  period: ("daytime" | "nighttime")[];
  isFreelancer: boolean;
  auditStatus: string;
  status?: string;
  deliverymanAmountDay?: number;
  deliverymanAmountNight?: number;
  deliverymanPaymentType?: string;
  deliverymenPaymentValue?: string;
  logs?: WorkShiftSlotLog[];
}

export interface UpdateWorkShiftSlotPayload {
  clientId?: string;
  deliverymanId?: string | null;
  status?: string;
  contractType?: string;
  shiftDate?: string;
  startTime?: string;
  endTime?: string;
  period?: ("daytime" | "nighttime")[];
  isFreelancer?: boolean;
  auditStatus?: string;
  deliverymanAmountDay?: number;
  deliverymanAmountNight?: number;
  deliverymanPaymentType?: string;
  deliverymenPaymentValue?: string;
  logs?: WorkShiftSlotLog[];
}

export interface CheckInOutPayload {
  location?: {
    lat: number;
    lng: number;
  };
}

export interface MarkAbsentPayload {
  reason?: string;
}

export interface SendInvitePayload {
  deliverymanId: string;
  expiresInHours?: number;
}

export interface SendInviteResponse {
  inviteToken?: string;
  inviteSentAt?: string;
  inviteExpiresAt?: string;
}
