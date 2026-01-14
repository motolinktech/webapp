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
  auditStatus: string;
  logs: WorkShiftSlotLog[];
  createdAt: string;
  updatedAt: string;
  deliveryman?: WorkShiftSlotDeliveryman | null;
  client?: WorkShiftSlotClient;
}

export interface WorkShiftSlotListParams {
  page?: number;
  limit?: number;
  clientId?: string;
  deliverymanId?: string;
  status?: string;
  month?: number;
  week?: number;
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
  status: string;
  contractType: string;
  shiftDate: string;
  startTime: string;
  endTime: string;
  auditStatus: string;
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
  auditStatus?: string;
  logs?: WorkShiftSlotLog[];
}
