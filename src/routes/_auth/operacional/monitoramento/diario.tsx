import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import {
  Ban,
  CalendarIcon,
  CheckCircle,
  ChevronsUpDown,
  CircleDotDashed,
  ClipboardPaste,
  Clock,
  Copy,
  Eye,
  Info,
  MessageSquarePlus,
  MoreHorizontal,
  Pencil,
  Send,
  Trash,
  UserPlus,
  X,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ContentHeader } from "@/components/composite/content-header";
import { hasPermissions } from "@/lib/utils/has-permissions";
import { getStoredUser } from "@/modules/auth/auth.service";
import {
  AssignDeliverymanForm,
  type AssignDeliverymanFormData,
} from "@/components/forms/assign-deliveryman";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardHeader } from "@/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Field, FieldLabel } from "@/components/ui/field";
import { Heading } from "@/components/ui/heading";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Text } from "@/components/ui/text";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { hourMask } from "@/lib/masks/hour-mask";
import { moneyMask } from "@/lib/masks/money-mask";
import { getApiErrorMessage } from "@/lib/services/api";
import { classHelper } from "@/lib/utils/class-helper";
import { BAGS_STATUS, BAGS_STATUS_OPTIONS } from "@/modules/clients/clients.constants";
import { getClientById, listClients } from "@/modules/clients/clients.service";
import type { Client } from "@/modules/clients/clients.types";
import { listGroups } from "@/modules/groups/groups.service";
import { listPlannings } from "@/modules/planning/planning.service";
import {
  checkInWorkShiftSlot,
  checkOutWorkShiftSlot,
  confirmCompletionWorkShiftSlot,
  connectTrackingWorkShiftSlot,
  copyWorkShiftSlots,
  deleteWorkShiftSlot,
  listWorkShiftSlots,
  markAbsentWorkShiftSlot,
  sendWorkShiftSlotInvites,
  updateWorkShiftSlot,
} from "@/modules/work-shift-slots/work-shift-slots.service";
import type { WorkShiftSlot } from "@/modules/work-shift-slots/work-shift-slots.types";

export const Route = createFileRoute("/_auth/operacional/monitoramento/diario")({
  beforeLoad: () => {
    const user = getStoredUser();
    if (!user || !hasPermissions(user, "operational.view")) {
      toast.error("Você não tem permissão para acessar o monitoramento diário.");
      throw redirect({ to: "/dashboard" });
    }
  },
  component: MonitoramentoDiario,
});

// Helper Functions & Constants
const WORK_SHIFT_STATUS_MAP: Record<string, { label: string; className: string; description: string }> = {
  OPEN: { label: "Aberto", className: "bg-gray-500", description: "Aguardando atribuição de entregador" },
  INVITED: { label: "Convidado", className: "bg-orange-500", description: "Convite enviado ao entregador" },
  CONFIRMED: { label: "Confirmado", className: "bg-blue-500", description: "Confirmado pelo entregador" },
  CHECKED_IN: { label: "Em Andamento", className: "bg-green-500", description: "Entregador presente no local" },
  PENDING_COMPLETION: { label: "Aguardando Conclusão", className: "bg-amber-500", description: "Check-out realizado, aguardando confirmação de conclusão" },
  COMPLETED: { label: "Finalizado", className: "bg-purple-500", description: "Turno finalizado com sucesso" },
  ABSENT: { label: "Ausente", className: "bg-red-500", description: "Entregador não compareceu" },
  CANCELLED: { label: "Cancelado", className: "bg-red-500", description: "Turno cancelado" },
};

type WorkShiftPeriod = WorkShiftSlot["period"][number];

const PERIOD_LABELS: Record<WorkShiftPeriod, string> = {
  daytime: "Diurno",
  nighttime: "Noturno",
};

const PAYMENT_FORM_LABELS: Record<NonNullable<WorkShiftSlot["paymentForm"]>, string> = {
  DAILY: "Diária",
  GUARANTEED: "Garantida",
};

function formatDateLabel(date: Date): string {
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTime(isoString?: string | null): string {
  if (!isoString) return "N/A";
  return new Date(isoString).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function extractTimeFromIso(isoString?: string | null): string {
  if (!isoString) return "";
  const date = new Date(isoString);
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function formatCheckInCheckOut(checkInAt?: string | null, checkOutAt?: string | null): string {
  const checkIn = checkInAt ? formatTime(checkInAt) : null;
  const checkOut = checkOutAt ? formatTime(checkOutAt) : null;

  if (!checkIn && !checkOut) return "-";
  if (checkIn && checkOut) return `${checkIn} - ${checkOut}`;
  return checkIn || checkOut || "-";
}

function formatCompactAddress(client: Client): string {
  const streetLine = [client.street, client.number].filter(Boolean).join(", ");
  const complement = client.complement ? `- ${client.complement}` : "";
  const addressLine = [streetLine, complement].filter(Boolean).join(" ");
  const cityUf = [client.city, client.uf].filter(Boolean).join("/");
  const parts = [addressLine, client.neighborhood, cityUf].filter(Boolean);
  return parts.join(" - ") || "Endereço não informado.";
}

function formatMoney(value?: number | string): string {
  if (value === null || value === undefined) return "N/A";
  if (typeof value === "number") {
    return moneyMask(String(Math.round(value * 100)));
  }
  const normalized = value.replace(",", ".");
  const parsed = Number.parseFloat(normalized);
  if (!Number.isNaN(parsed)) {
    return moneyMask(String(Math.round(parsed * 100)));
  }
  const digits = value.replace(/\D/g, "");
  if (!digits) return "N/A";
  return moneyMask(digits);
}

function parseMoneyValue(value?: number | string | null): number | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value === "number") {
    return Number.isNaN(value) ? undefined : value;
  }
  const normalized = value.replace(",", ".");
  const parsed = Number.parseFloat(normalized);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function formatBagsInfo(client: Client): string | null {
  const condition = client.commercialCondition;
  if (!condition?.bagsStatus) return null;
  const statusOption = BAGS_STATUS_OPTIONS.find((opt) => opt.value === condition.bagsStatus);
  if (!statusOption) return null;
  if (condition.bagsStatus === BAGS_STATUS.COMPANY && condition.bagsAllocated) {
    return `${statusOption.label} (${condition.bagsAllocated})`;
  }
  return statusOption.label;
}

function formatDeliverymanConditions(client: Client): string | null {
  const condition = client.commercialCondition;
  if (!condition) return null;
  const parts: string[] = [];
  const paymentForm = condition.paymentForm || [];
  const dailyPeriods = condition.dailyPeriods || [];
  const guaranteedPeriods = condition.guaranteedPeriods || [];

  if (paymentForm.includes("DAILY") && dailyPeriods.length > 0) {
    const dailyValues: string[] = [];
    if (dailyPeriods.includes("WEEK_DAY") && condition.deliverymanDailyDay) {
      dailyValues.push(`Sem/D: ${formatMoney(condition.deliverymanDailyDay)}`);
    }
    if (dailyPeriods.includes("WEEK_NIGHT") && condition.deliverymanDailyNight) {
      dailyValues.push(`Sem/N: ${formatMoney(condition.deliverymanDailyNight)}`);
    }
    if (dailyPeriods.includes("WEEKEND_DAY") && condition.deliverymanDailyDayWknd) {
      dailyValues.push(`Fds/D: ${formatMoney(condition.deliverymanDailyDayWknd)}`);
    }
    if (dailyPeriods.includes("WEEKEND_NIGHT") && condition.deliverymanDailyNightWknd) {
      dailyValues.push(`Fds/N: ${formatMoney(condition.deliverymanDailyNightWknd)}`);
    }
    if (dailyValues.length > 0) parts.push(`Diaria: ${dailyValues.join(", ")}`);
  }

  if (paymentForm.includes("GUARANTEED") && guaranteedPeriods.length > 0) {
    const guaranteedValues: string[] = [];
    if (guaranteedPeriods.includes("WEEK_DAY") && condition.guaranteedDay) {
      guaranteedValues.push(`Sem/D: ${condition.guaranteedDay}`);
    }
    if (guaranteedPeriods.includes("WEEK_NIGHT") && condition.guaranteedNight) {
      guaranteedValues.push(`Sem/N: ${condition.guaranteedNight}`);
    }
    if (guaranteedPeriods.includes("WEEKEND_DAY") && condition.guaranteedDayWeekend) {
      guaranteedValues.push(`Fds/D: ${condition.guaranteedDayWeekend}`);
    }
    if (guaranteedPeriods.includes("WEEKEND_NIGHT") && condition.guaranteedNightWeekend) {
      guaranteedValues.push(`Fds/N: ${condition.guaranteedNightWeekend}`);
    }
    if (guaranteedValues.length > 0) parts.push(`Qt. Garantida: ${guaranteedValues.join(", ")}`);
  }
  return parts.length > 0 ? parts.join(" | ") : null;
}

function formatPerDeliveryInfo(client: Client): string | null {
  const condition = client.commercialCondition;
  if (!condition?.deliverymanPerDelivery) return null;

  const perDelivery = `Por entrega: ${formatMoney(condition.deliverymanPerDelivery)}`;

  if (condition.deliveryAreaKm && condition.deliveryAreaKm > 0 && condition.deliverymanAdditionalKm) {
    const extraKm = `${formatMoney(condition.deliverymanAdditionalKm)} (> ${condition.deliveryAreaKm}km)`;
    return `${perDelivery} | ${extraKm}`;
  }

  return perDelivery;
}

function formatMealInfo(client: Client): string {
  return client.provideMeal ? "Fornece Refeição" : "Não fornece refeição";
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function getPaymentFormLabel(paymentForm?: WorkShiftSlot["paymentForm"]): string {
  if (!paymentForm) return PAYMENT_FORM_LABELS.DAILY;
  return PAYMENT_FORM_LABELS[paymentForm] ?? paymentForm;
}

type PaymentBreakdownLine = {
  label: string;
  value: string;
};

function buildPaymentBreakdown(slot: WorkShiftSlot): { lines: PaymentBreakdownLine[]; total?: number } {
  const lines: PaymentBreakdownLine[] = [];
  let total = 0;
  let hasTotal = false;

  const addLine = (period: WorkShiftPeriod, value: string) => {
    lines.push({
      label: `Pagamento ${PERIOD_LABELS[period] ?? period}`,
      value,
    });
  };

  const addDailyLine = (period: WorkShiftPeriod, amountRaw?: number | string) => {
    const amount = parseMoneyValue(amountRaw);
    if (amount === undefined) {
      addLine(period, "Não informado");
      return;
    }
    total += amount;
    hasTotal = true;
    addLine(period, formatMoney(amount));
  };

  const addGuaranteedLine = (
    period: WorkShiftPeriod,
    quantity?: number,
    perDeliveryRaw?: number | string,
  ) => {
    const perDelivery = parseMoneyValue(perDeliveryRaw);
    if (quantity === undefined && perDelivery === undefined) {
      addLine(period, "Não informado");
      return;
    }
    if (quantity === undefined || perDelivery === undefined) {
      const quantityLabel =
        quantity === undefined ? "Qtd. garantida não informada" : `Qtd. garantida ${quantity}`;
      const perDeliveryLabel =
        perDelivery === undefined
          ? "Valor por entrega não informado"
          : `Valor por entrega ${formatMoney(perDelivery)}`;
      addLine(period, `${quantityLabel} · ${perDeliveryLabel}`);
      return;
    }
    const amount = quantity * perDelivery;
    total += amount;
    hasTotal = true;
    addLine(period, `Qtd. garantida ${quantity} x ${formatMoney(perDelivery)} = ${formatMoney(amount)}`);
  };

  if (slot.paymentForm === "GUARANTEED") {
    if (slot.period.includes("daytime")) {
      addGuaranteedLine("daytime", slot.guaranteedQuantityDay, slot.deliverymanPerDeliveryDay);
    }
    if (slot.period.includes("nighttime")) {
      addGuaranteedLine("nighttime", slot.guaranteedQuantityNight, slot.deliverymanPerDeliveryNight);
    }
    return { lines, total: hasTotal ? total : undefined };
  }

  if (slot.period.includes("daytime")) {
    addDailyLine("daytime", slot.deliverymanAmountDay);
  }
  if (slot.period.includes("nighttime")) {
    addDailyLine("nighttime", slot.deliverymanAmountNight);
  }

  return { lines, total: hasTotal ? total : undefined };
}

function calculateShiftValue(slot: WorkShiftSlot): number | undefined {
  let total = 0;
  let hasTotal = false;

  if (slot.paymentForm === "GUARANTEED") {
    if (slot.period.includes("daytime")) {
      const perDelivery = parseMoneyValue(slot.deliverymanPerDeliveryDay);
      if (slot.guaranteedQuantityDay !== undefined && perDelivery !== undefined) {
        total += slot.guaranteedQuantityDay * perDelivery;
        hasTotal = true;
      }
    }
    if (slot.period.includes("nighttime")) {
      const perDelivery = parseMoneyValue(slot.deliverymanPerDeliveryNight);
      if (slot.guaranteedQuantityNight !== undefined && perDelivery !== undefined) {
        total += slot.guaranteedQuantityNight * perDelivery;
        hasTotal = true;
      }
    }
    return hasTotal ? total : undefined;
  }

  if (slot.period.includes("daytime")) {
    const amount = parseMoneyValue(slot.deliverymanAmountDay);
    if (amount !== undefined) {
      total += amount;
      hasTotal = true;
    }
  }
  if (slot.period.includes("nighttime")) {
    const amount = parseMoneyValue(slot.deliverymanAmountNight);
    if (amount !== undefined) {
      total += amount;
      hasTotal = true;
    }
  }

  return hasTotal ? total : undefined;
}

function formatDateYYYYMMDD(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDateDDMMYYYYFromISO(dateString: string): string {
  const normalized = dateString.slice(0, 10);
  const [year, month, day] = normalized.split("-");
  if (!year || !month || !day) return dateString;
  return `${day}/${month}/${year}`;
}

function parseLocalDateFromYYYYMMDD(dateString: string): Date {
  const [year, month, day] = dateString.split("-").map((value) => Number(value));
  return new Date(year, month - 1, day);
}

// Main Component
function MonitoramentoDiario() {
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [clientSearchOpen, setClientSearchOpen] = useState(false);
  const [clientSearch, setClientSearch] = useState("");
  const [debouncedClientSearch, setDebouncedClientSearch] = useState("");
  const [searchClientsResults, setSearchClientsResults] = useState<Client[]>([]);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => formatDateYYYYMMDD(new Date()));

  useEffect(() => {
    console.log("[monitoramento-diario] selectedDate changed:", selectedDate);
  }, [selectedDate]);

  // Dialog states
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [clientForAssignDialog, setClientForAssignDialog] = useState<Client | null>(null);
  const [periodForAssignDialog, setPeriodForAssignDialog] = useState<WorkShiftPeriod | null>(
    null,
  );
  const [logDialogOpen, setLogDialogOpen] = useState(false);
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [absentDialogOpen, setAbsentDialogOpen] = useState(false);
  const [selectedSlotForAction, setSelectedSlotForAction] = useState<WorkShiftSlot | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [editModeActive, setEditModeActive] = useState(false);
  const [editTimesDialogOpen, setEditTimesDialogOpen] = useState(false);
  const [editCheckInTime, setEditCheckInTime] = useState("");
  const [editCheckOutTime, setEditCheckOutTime] = useState("");

  // Copy mode state - tracks which client/date is being copied
  // Key: clientId, Value: source date string (YYYY-MM-DD)
  const [copyModeMap, setCopyModeMap] = useState<Map<string, string>>(new Map());

  const queryClient = useQueryClient();

  const startDate = useMemo(() => selectedDate, [selectedDate]);
  const endDate = useMemo(() => selectedDate, [selectedDate]);
  const dateLabel = useMemo(
    () => formatDateLabel(parseLocalDateFromYYYYMMDD(selectedDate)),
    [selectedDate],
  );

  const selectedSlotPayment = useMemo(() => {
    if (!selectedSlotForAction) return null;
    return {
      paymentFormLabel: getPaymentFormLabel(selectedSlotForAction.paymentForm),
      breakdown: buildPaymentBreakdown(selectedSlotForAction),
    };
  }, [selectedSlotForAction]);

  const normalizedClientSearch = useMemo(() => {
    return clientSearch.trim().replace(/\s+/g, " ");
  }, [clientSearch]);

  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedClientSearch(normalizedClientSearch);
    }, 500);
    return () => clearTimeout(handle);
  }, [normalizedClientSearch]);

  const clientSearchEnabled = debouncedClientSearch.length >= 3;

  // Queries
  const { data: groupsData, isLoading: isLoadingGroups } = useQuery({
    queryKey: ["groups"],
    queryFn: () => listGroups({ limit: 100 }),
  });

  const { data: searchClientsData, isFetching: isFetchingSearchClients } = useQuery({
    queryKey: ["clients-search", debouncedClientSearch],
    queryFn: () =>
      listClients({
        limit: 20,
        name: debouncedClientSearch,
      }),
    enabled: clientSearchOpen && clientSearchEnabled,
  });

  const { data: selectedClientData, isLoading: isLoadingSelectedClient } = useQuery({
    queryKey: ["client", selectedClientId],
    queryFn: () => getClientById(selectedClientId),
    enabled: !!selectedClientId,
  });

  const { data: clientForDialogData, isLoading: isLoadingClientForDialog } = useQuery({
    queryKey: ["client", clientForAssignDialog?.id],
    queryFn: () =>
      clientForAssignDialog ? getClientById(clientForAssignDialog.id) : Promise.resolve(null),
    enabled: !!clientForAssignDialog?.id,
  });

  const { data: clientsData, isLoading: isLoadingClients } = useQuery({
    queryKey: ["clients", selectedGroupId],
    queryFn: () => listClients({ groupId: selectedGroupId, limit: 100 }),
    enabled: !!selectedGroupId && !selectedClientId,
  });

  const hasActiveFilter = !!selectedGroupId || !!selectedClientId;

  useEffect(() => {
    if (searchClientsData) {
      setSearchClientsResults(searchClientsData.data);
    }
  }, [searchClientsData]);

  const isSearchingClients = clientSearchEnabled && isFetchingSearchClients;

  const workShiftSlotsQueryKey = useMemo(
    () => [
      "work-shift-slots",
      {
        clientId: selectedClientId || undefined,
        groupId: !selectedClientId && selectedGroupId ? selectedGroupId : undefined,
        startDate,
        endDate,
      },
    ],
    [selectedClientId, selectedGroupId, startDate, endDate],
  );

  const { data: workShiftSlotsData, isLoading: isLoadingWorkShiftSlots } = useQuery({
    queryKey: workShiftSlotsQueryKey,
    queryFn: () =>
      listWorkShiftSlots({
        clientId: selectedClientId || undefined,
        groupId: !selectedClientId && selectedGroupId ? selectedGroupId : undefined,
        startDate,
        endDate,
        limit: 1000,
      }),
    enabled: hasActiveFilter,
    refetchInterval: 30000, // Refetch every 30 seconds
    refetchIntervalInBackground: false, // Only refetch when tab is active
  });

  const invalidateWorkShiftSlots = () => {
    queryClient.invalidateQueries({ queryKey: workShiftSlotsQueryKey });
  };

  const { data: planningsData, isLoading: isLoadingPlannings } = useQuery({
    queryKey: ["plannings", { selectedClientId, startDate, endDate }],
    queryFn: () => listPlannings({ startDate, endDate, clientId: selectedClientId, limit: 1000 }),
    enabled: !!selectedClientId,
  });

  const { data: clientForDetailsDialog, isLoading: isLoadingClientForDetails } = useQuery({
    queryKey: ["client", selectedSlotForAction?.clientId],
    queryFn: () =>
      selectedSlotForAction ? getClientById(selectedSlotForAction.clientId) : Promise.resolve(null),
    enabled: !!selectedSlotForAction?.clientId && detailsDialogOpen && editModeActive,
  });

  // Mutations

  const { mutate: updateTimes, isPending: isUpdatingTimes } = useMutation({
    mutationFn: ({
      slot,
      checkInAt,
      checkOutAt,
    }: {
      slot: WorkShiftSlot;
      checkInAt?: string | null;
      checkOutAt?: string | null;
    }) =>
      updateWorkShiftSlot(slot.id, {
        clientId: slot.clientId,
        contractType: slot.contractType,
        shiftDate: slot.shiftDate,
        startTime: slot.startTime,
        endTime: slot.endTime,
        period: slot.period,
        auditStatus: slot.auditStatus,
        deliverymanId: slot.deliverymanId,
        status: slot.status,
        isFreelancer: slot.isFreelancer,
        checkInAt,
        checkOutAt,
      }),
    onSuccess: () => {
      toast.success("Horários atualizados com sucesso!");
      invalidateWorkShiftSlots();
      setEditTimesDialogOpen(false);
      setSelectedSlotForAction(null);
    },
    onError: (error) => toast.error("Erro ao atualizar horários", {
      description: getApiErrorMessage(error)
    }),
  });

  const { mutate: checkIn, isPending: isCheckingIn } = useMutation({
    mutationFn: (id: string) => checkInWorkShiftSlot(id),
    onSuccess: () => {
      toast.success("Check-in realizado com sucesso!");
      invalidateWorkShiftSlots();
    },
    onError: (error) => toast.error("Erro ao realizar check-in", { description: getApiErrorMessage(error) }),
  });

  const { mutate: checkOut, isPending: isCheckingOut } = useMutation({
    mutationFn: (id: string) => checkOutWorkShiftSlot(id),
    onSuccess: () => {
      toast.success("Check-out realizado com sucesso!");
      invalidateWorkShiftSlots();
    },
    onError: (error) => toast.error("Erro ao realizar check-out", { description: getApiErrorMessage(error) }),
  });

  const { mutate: markAbsent, isPending: isMarkingAbsent } = useMutation({
    mutationFn: (id: string) => markAbsentWorkShiftSlot(id),
    onSuccess: () => {
      toast.success("Ausência marcada com sucesso!");
      invalidateWorkShiftSlots();
    },
    onError: (error) => toast.error("Erro ao marcar ausência", { description: getApiErrorMessage(error) }),
  });

  const { mutate: connectTracking, isPending: isConnecting } = useMutation({
    mutationFn: (id: string) => connectTrackingWorkShiftSlot(id),
    onSuccess: () => {
      toast.success("Tracking conectado com sucesso!");
      invalidateWorkShiftSlots();
    },
    onError: (error) => toast.error("Erro ao conectar tracking", { description: getApiErrorMessage(error) }),
  });

  const { mutate: deleteSlot, isPending: isDeleting } = useMutation({
    mutationFn: (id: string) => deleteWorkShiftSlot(id),
    onSuccess: () => {
      toast.success("Turno excluído com sucesso!");
      invalidateWorkShiftSlots();
      setDeleteDialogOpen(false);
      setSelectedSlotForAction(null);
    },
    onError: (error) => toast.error("Erro ao excluir turno", { description: getApiErrorMessage(error) }),
  });

  const { mutate: sendInvites, isPending: isSendingInvite } = useMutation({
    mutationFn: (data: {
      date: string;
      workShiftSlotId?: string;
      clientId?: string;
      groupId?: string;
    }) => sendWorkShiftSlotInvites(data),
    onSuccess: (response) => {
      if (response.sent > 0 && response.failed === 0) {
        toast.success("Convite enviado com sucesso!");
      } else if (response.sent > 0 && response.failed > 0) {
        toast.warning("Convites enviados com avisos", {
          description: `${response.sent} enviados, ${response.failed} falharam.`,
        });
      } else {
        toast.error("Erro ao enviar convite", {
          description: response.errors?.[0]?.reason || "Não foi possível enviar o convite.",
        });
      }
      invalidateWorkShiftSlots();
    },
    onError: (error) =>
      toast.error("Erro ao enviar convite", { description: getApiErrorMessage(error) }),
  });

  const { mutate: confirmCompletion, isPending: isConfirmingCompletion } = useMutation({
    mutationFn: (id: string) => confirmCompletionWorkShiftSlot(id),
    onSuccess: () => {
      toast.success("Turno concluído com sucesso!");
      invalidateWorkShiftSlots();
    },
    onError: (error) =>
      toast.error("Erro ao confirmar conclusão", { description: getApiErrorMessage(error) }),
  });

  const { mutate: acceptInvite, isPending: isAcceptingInvite } = useMutation({
    mutationFn: (slot: WorkShiftSlot) =>
      updateWorkShiftSlot(slot.id, {
        clientId: slot.clientId,
        contractType: slot.contractType,
        shiftDate: slot.shiftDate,
        startTime: slot.startTime,
        endTime: slot.endTime,
        period: slot.period,
        auditStatus: slot.auditStatus,
        deliverymanId: slot.deliverymanId,
        status: "CONFIRMED",
        isFreelancer: slot.isFreelancer,
      }),
    onSuccess: () => {
      toast.success("Convite aceito com sucesso!");
      invalidateWorkShiftSlots();
    },
    onError: (error) =>
      toast.error("Erro ao aceitar convite", { description: getApiErrorMessage(error) }),
  });

  const { mutate: copyShifts, isPending: isCopyingShifts } = useMutation({
    mutationFn: copyWorkShiftSlots,
    onSuccess: (data) => {
      toast.success("Turnos copiados com sucesso!");
      if (data.warnings) {
        toast.warning("Alguns turnos foram copiados com avisos", {
          description: data.warnings.message,
        });
      }
      invalidateWorkShiftSlots();
      setCopyModeMap(new Map());
    },
    onError: (error) => {
      toast.error("Erro ao copiar turnos", { description: getApiErrorMessage(error) });
    },
  });

  const planningsByClientList = useMemo(() => {
    const plannings = planningsData?.data || [];
    const byClient: Record<string, typeof plannings> = {};
    for (const planning of plannings) {
      if (!byClient[planning.clientId]) byClient[planning.clientId] = [];
      byClient[planning.clientId].push(planning);
    }
    return byClient;
  }, [planningsData?.data]);

  const groups = groupsData?.data || [];
  const clients = useMemo(() => {
    if (selectedClientId && selectedClientData) return [selectedClientData];
    return clientsData?.data || [];
  }, [selectedClientId, selectedClientData, clientsData?.data]);

  // Normalize work shift slots data from both query formats
  const allWorkShiftSlots = useMemo(() => {
    return workShiftSlotsData?.data || [];
  }, [workShiftSlotsData]);

  function handleAssignSubmit(_data: AssignDeliverymanFormData) {
    // Form handles the API call, we just need to close dialog and refresh data
    toast.success("Entregador atribuído com sucesso!");
    setAssignDialogOpen(false);
    invalidateWorkShiftSlots();
  }

  // Copy mode helper functions
  function isInCopyMode(clientId: string): boolean {
    return copyModeMap.has(clientId);
  }

  function getCopySourceDate(clientId: string): string | undefined {
    return copyModeMap.get(clientId);
  }

  function handleCopyClick(clientId: string) {
    const currentDateKey = selectedDate;
    setCopyModeMap((prev) => {
      const next = new Map(prev);
      if (next.get(clientId) === currentDateKey) {
        // Cancel copy mode
        next.delete(clientId);
      } else {
        // Enter copy mode
        next.set(clientId, currentDateKey);
      }
      return next;
    });
  }

  function handlePasteClick(clientId: string) {
    const sourceDate = copyModeMap.get(clientId);
    if (!sourceDate) return;
    const targetDate = selectedDate;

    copyShifts({
      sourceDate,
      targetDate,
      clientId,
    });
  }

  // Render Logic
  return (
    <TooltipProvider>
      <div className="flex flex-1 flex-col">
        <ContentHeader
          breadcrumbItems={[
            { title: "Operacional", href: "/operacional" },
            { title: "Monitoramento", href: "/operacional/monitoramento" },
            { title: "Diário" },
          ]}
        />

        <div className="flex flex-1 flex-col gap-6 p-6">
          <Heading variant="h2">
            Monitoramento Diário
          </Heading>

          {/* Filters */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Select
                value={selectedGroupId}
                onValueChange={(value) => {
                  setSelectedGroupId(value);
                  setSelectedClientId("");
                }}
              >
                <SelectTrigger className="w-56">
                  <SelectValue placeholder="Selecione um grupo" />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingGroups ? (
                    <div className="p-2">
                      <Skeleton className="h-6 w-full" />
                    </div>
                  ) : (
                    groups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>

              <Popover open={clientSearchOpen} onOpenChange={setClientSearchOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={clientSearchOpen}
                    className="w-56 justify-between"
                  >
                    <span className="truncate">
                      {selectedClientId && selectedClientData
                        ? selectedClientData.name
                        : "Buscar cliente..."}
                    </span>
                    {selectedClientId ? (
                      <X
                        className="ml-2 size-4 shrink-0 opacity-50 hover:opacity-100"
                        onClick={(event) => {
                          event.stopPropagation();
                          setSelectedClientId("");
                        }}
                      />
                    ) : (
                      <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-0">
                  <Command>
                    <CommandInput
                      placeholder="Buscar cliente..."
                      value={clientSearch}
                      onValueChange={setClientSearch}
                    />
                    <CommandList>
                      {!clientSearchEnabled && (
                        <div className="px-2 py-2 text-sm text-muted-foreground">
                          Digite ao menos 3 letras para buscar.
                        </div>
                      )}
                      {clientSearchEnabled && !isSearchingClients && searchClientsResults.length === 0 && (
                        <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                      )}
                      {isSearchingClients && (
                        <div className="flex items-center gap-2 px-2 py-2 text-sm text-muted-foreground">
                          <Spinner className="size-3" />
                          Buscando clientes...
                        </div>
                      )}
                      <CommandGroup>
                        {searchClientsResults.map((client) => (
                          <CommandItem
                            key={client.id}
                            value={client.name}
                            onSelect={() => {
                              setSelectedClientId(client.id);
                              setSelectedGroupId("");
                              setClientSearchOpen(false);
                            }}
                          >
                            {client.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex items-center gap-2">
              {selectedGroupId && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Enviar convites do grupo"
                      disabled={isSendingInvite}
                      onClick={() => {
                        sendInvites({
                          groupId: selectedGroupId,
                          date: formatDateDDMMYYYYFromISO(selectedDate),
                        });
                      }}
                    >
                      <Send className="size-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    Enviar convites para todos os turnos convidados do grupo selecionado na data escolhida.
                  </TooltipContent>
                </Tooltip>
              )}

              <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={classHelper(
                      "w-44 justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 size-4" />
                    {dateLabel}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    selected={parseLocalDateFromYYYYMMDD(selectedDate)}
                    onSelect={(date) => {
                      if (!date) return;
                      setSelectedDate(formatDateYYYYMMDD(date));
                      setDatePickerOpen(false);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Content Area */}
          {!hasActiveFilter && (
            <Alert>
              <Info className="size-4" />
              <AlertTitle>Nenhum filtro selecionado</AlertTitle>
              <AlertDescription>
                Selecione um grupo ou busque um cliente para visualizar o monitoramento.
              </AlertDescription>
            </Alert>
          )}

          {hasActiveFilter &&
            !isLoadingClients &&
            !isLoadingSelectedClient &&
            clients.length === 0 && (
              <Alert>
                <Info className="size-4" />
                <AlertTitle>Nenhum cliente encontrado</AlertTitle>
              </Alert>
            )}

          {hasActiveFilter && (isLoadingClients || isLoadingSelectedClient || clients.length > 0) && (
            <div
              className="flex flex-col gap-4"
              aria-busy={isLoadingPlannings || isLoadingWorkShiftSlots}
            >
              {isLoadingClients || isLoadingSelectedClient
                ? [...Array(3)].map((_, i) => <Skeleton key={i} className="h-48 w-full" />)
                : clients.map((client) => {
                  const clientWorkShifts =
                    allWorkShiftSlots.filter((slot) => slot.clientId === client.id);
                  const clientPlannings = planningsByClientList[client.id] || [];

                  const planningCounts: Record<WorkShiftPeriod, number> = {
                    daytime: 0,
                    nighttime: 0,
                  };
                  clientPlannings.forEach((p) => {
                    planningCounts[p.period] += p.plannedCount;
                  });

                  const assignedCounts: Record<WorkShiftPeriod, number> = {
                    daytime: 0,
                    nighttime: 0,
                  };
                  clientWorkShifts.forEach((s) => {
                    if (s.status === "CANCELLED") return;
                    s.period.forEach((p) => {
                      assignedCounts[p] += 1;
                    });
                  });

                  const remainingDiurno = Math.max(
                    0,
                    planningCounts.daytime - assignedCounts.daytime,
                  );
                  const remainingNoturno = Math.max(
                    0,
                    planningCounts.nighttime - assignedCounts.nighttime,
                  );
                  const unassignedRows = [
                    ...Array.from({ length: remainingDiurno }, () => ({
                      period: "daytime" as const,
                    })),
                    ...Array.from({ length: remainingNoturno }, () => ({
                      period: "nighttime" as const,
                    })),
                  ];

                  const activeWorkShifts = clientWorkShifts.filter((s) => s.status !== "CANCELLED");
                  const cancelledWorkShifts = clientWorkShifts.filter((s) => s.status === "CANCELLED");

                  const hasData = activeWorkShifts.length > 0 || cancelledWorkShifts.length > 0 || unassignedRows.length > 0;

                  return (
                    <Card
                      key={client.id}
                      className={classHelper(
                        isInCopyMode(client.id) && "border-primary border-2",
                      )}
                    >
                      <CardHeader className="space-y-4">
                        {/* Client Info */}
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <Heading variant="h4">{client.name}</Heading>
                            <Text variant="muted" className="text-xs">
                              {formatCompactAddress(client)}
                            </Text>
                            <Text variant="muted">{formatMealInfo(client)}</Text>
                            {formatBagsInfo(client) && (
                              <Text variant="muted">{formatBagsInfo(client)}</Text>
                            )}
                            {formatDeliverymanConditions(client) && (
                              <Text variant="muted">{formatDeliverymanConditions(client)}</Text>
                            )}
                            {formatPerDeliveryInfo(client) && (
                              <Text variant="muted">{formatPerDeliveryInfo(client)}</Text>
                            )}
                          </div>

                          {/* Copy/Paste and Bulk Invite buttons */}
                          <div className="flex items-center gap-2">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-8"
                                  aria-label="Enviar convites do cliente"
                                  disabled={isSendingInvite}
                                  onClick={() => {
                                    sendInvites({
                                      clientId: client.id,
                                      date: formatDateDDMMYYYYFromISO(selectedDate),
                                    });
                                  }}
                                >
                                  <Send className="size-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                Enviar convites para todos os turnos convidados deste cliente na data escolhida.
                              </TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                {isInCopyMode(client.id) && getCopySourceDate(client.id) !== startDate ? (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={isCopyingShifts}
                                    onClick={() => handlePasteClick(client.id)}
                                  >
                                    <ClipboardPaste className="mr-2 size-4" />
                                    Colar
                                  </Button>
                                ) : (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className={classHelper(
                                      "size-8",
                                      getCopySourceDate(client.id) === startDate && "bg-primary/20",
                                    )}
                                    disabled={activeWorkShifts.length === 0}
                                    onClick={() => handleCopyClick(client.id)}
                                  >
                                    <Copy className="size-4" />
                                  </Button>
                                )}
                              </TooltipTrigger>
                              <TooltipContent>
                                {isInCopyMode(client.id) && getCopySourceDate(client.id) !== startDate
                                  ? "Colar turnos aqui"
                                  : getCopySourceDate(client.id) === startDate
                                    ? "Clique para cancelar"
                                    : activeWorkShifts.length === 0
                                      ? "Nenhum turno para copiar"
                                      : "Copiar turnos deste dia"}
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </div>

                        {isLoadingPlannings || isLoadingWorkShiftSlots ? (
                          <Skeleton className="h-40 w-full" />
                        ) : !hasData ? (
                          <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => {
                              setClientForAssignDialog(client);
                              setPeriodForAssignDialog(null);
                              setAssignDialogOpen(true);
                            }}
                          >
                            Nenhum planejamento para hoje. Deseja selecionar um entregador?
                          </Button>
                        ) : (
                          <div className="rounded-md border">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="w-[18%]">Entregador</TableHead>
                                  <TableHead className="w-[10%]">Contrato</TableHead>
                                  <TableHead className="w-[10%]">Horário</TableHead>
                                  <TableHead className="w-[12%]">Check-in/Check-out</TableHead>
                                  <TableHead className="w-[15%]">Status Atual</TableHead>
                                  <TableHead className="w-[15%]">Próxima Ação</TableHead>
                                  <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {/* Active Assigned Rows */}
                                {activeWorkShifts.map((slot) => {
                                  const statusInfo =
                                    WORK_SHIFT_STATUS_MAP[slot.status] ||
                                    WORK_SHIFT_STATUS_MAP.OPEN;
                                  const isAbsent = slot.status === "ABSENT";
                                  let nextAction = null;
                                  if (slot.status === "INVITED") {
                                    nextAction = (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={isAcceptingInvite}
                                        onClick={() => acceptInvite(slot)}
                                      >
                                        {isAcceptingInvite ? (
                                          <Spinner className="mr-2 size-4" />
                                        ) : (
                                          <CheckCircle className="mr-2 size-4" />
                                        )}
                                        Marcar aceite
                                      </Button>
                                    );
                                  } else if (slot.status === "CONFIRMED") {
                                    nextAction = (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={isCheckingIn}
                                        onClick={() => checkIn(slot.id)}
                                      >
                                        {isCheckingIn ? (
                                          <Spinner className="mr-2 size-4" />
                                        ) : (
                                          <CheckCircle className="mr-2 size-4" />
                                        )}
                                        Check-in
                                      </Button>
                                    );
                                  } else if (slot.status === "CHECKED_IN") {
                                    nextAction = (
                                      <div className="flex items-center gap-1">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          disabled={isCheckingOut}
                                          onClick={() => checkOut(slot.id)}
                                        >
                                          {isCheckingOut ? (
                                            <Spinner className="mr-2 size-4" />
                                          ) : (
                                            <CheckCircle className="mr-2 size-4" />
                                          )}
                                          Check-out
                                        </Button>
                                        {!slot.trackingConnected && (
                                          <Popover>
                                            <PopoverTrigger asChild>
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                className="size-8"
                                                disabled={isConnecting}
                                              >
                                                {isConnecting ? (
                                                  <Spinner className="size-4" />
                                                ) : (
                                                  <CircleDotDashed className="size-4" />
                                                )}
                                              </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-3">
                                              <div className="space-y-2">
                                                <p className="text-sm">Conectar rastreamento?</p>
                                                <Button
                                                  size="sm"
                                                  disabled={isConnecting}
                                                  onClick={() => connectTracking(slot.id)}
                                                >
                                                  {isConnecting ? (
                                                    <Spinner className="mr-2 size-4" />
                                                  ) : null}
                                                  Conectar
                                                </Button>
                                              </div>
                                            </PopoverContent>
                                          </Popover>
                                        )}
                                      </div>
                                    );
                                  } else if (slot.status === "PENDING_COMPLETION") {
                                    nextAction = (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={isConfirmingCompletion}
                                        onClick={() => confirmCompletion(slot.id)}
                                      >
                                        {isConfirmingCompletion ? (
                                          <Spinner className="mr-2 size-4" />
                                        ) : (
                                          <CheckCircle className="mr-2 size-4" />
                                        )}
                                        Confirmar Conclusão
                                      </Button>
                                    );
                                  }

                                  return (
                                    <TableRow
                                      key={slot.id}
                                      className={classHelper(
                                        isAbsent && "bg-red-100 hover:bg-red-200 dark:bg-red-950/50 dark:hover:bg-red-950/70",
                                      )}
                                    >
                                      <TableCell className="font-medium">
                                        <div className="flex flex-col">
                                          <span>{slot.deliveryman?.name || "N/A"}</span>
                                          <span className="text-xs text-muted-foreground">
                                            {slot.period
                                              .map((p) => PERIOD_LABELS[p] ?? p)
                                              .join(", ")}{" "}
                                            - {formatMoney(calculateShiftValue(slot))}
                                          </span>
                                        </div>
                                      </TableCell>
                                      <TableCell className="capitalize">
                                        {slot.contractType.toLowerCase()}
                                      </TableCell>
                                      <TableCell>
                                        {`${formatTime(slot.startTime)} - ${formatTime(
                                          slot.endTime,
                                        )}`}
                                      </TableCell>
                                      <TableCell className="text-sm">
                                        {formatCheckInCheckOut(slot.checkInAt, slot.checkOutAt)}
                                      </TableCell>
                                      <TableCell>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Badge className={classHelper(statusInfo.className, "cursor-help")}>
                                              {slot.status === "CHECKED_IN" && slot.trackingConnected
                                                ? "Em Andamento (conectado)"
                                                : statusInfo.label}
                                            </Badge>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            {slot.status === "CHECKED_IN" && slot.trackingConnected
                                              ? "Entregador presente e rastreamento conectado"
                                              : statusInfo.description}
                                          </TooltipContent>
                                        </Tooltip>
                                      </TableCell>
                                      <TableCell>{nextAction || "N/A"}</TableCell>
                                      <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-1">
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                className="size-7"
                                                onClick={() => {
                                                  setSelectedSlotForAction(slot);
                                                  setEditModeActive(false);
                                                  setDetailsDialogOpen(true);
                                                }}
                                              >
                                                <Eye className="size-4" />
                                              </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>Ver Detalhes</TooltipContent>
                                          </Tooltip>
                                          {(slot.status === "OPEN" || slot.status === "INVITED") &&
                                            slot.deliverymanId && (
                                              <Tooltip>
                                                <TooltipTrigger asChild>
                                                  <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="size-7"
                                                    disabled={isSendingInvite}
                                                    onClick={() => {
                                                      if (!slot.deliverymanId) {
                                                        toast.error(
                                                          "Nenhum entregador atribuído a este turno.",
                                                        );
                                                        return;
                                                      }
                                                      sendInvites({
                                                        workShiftSlotId: slot.id,
                                                        date: formatDateDDMMYYYYFromISO(selectedDate),
                                                      });
                                                    }}
                                                  >
                                                    <Send className="size-4" />
                                                  </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>Enviar Convite</TooltipContent>
                                              </Tooltip>
                                            )}
                                          <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                className="size-7"
                                              >
                                                <MoreHorizontal className="size-4" />
                                              </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                              <DropdownMenuItem
                                                onClick={() => {
                                                  setSelectedSlotForAction(slot);
                                                  setLogDialogOpen(true);
                                                }}
                                              >
                                                <MessageSquarePlus className="size-4" />
                                                Adicionar Log
                                              </DropdownMenuItem>
                                              <DropdownMenuItem
                                                onClick={() => {
                                                  setSelectedSlotForAction(slot);
                                                  setEditModeActive(true);
                                                  setDetailsDialogOpen(true);
                                                }}
                                              >
                                                <Pencil className="size-4" />
                                                Editar Turno
                                              </DropdownMenuItem>
                                              <DropdownMenuItem
                                                onClick={() => {
                                                  setSelectedSlotForAction(slot);
                                                  setEditCheckInTime(extractTimeFromIso(slot.checkInAt));
                                                  setEditCheckOutTime(extractTimeFromIso(slot.checkOutAt));
                                                  setEditTimesDialogOpen(true);
                                                }}
                                              >
                                                <Clock className="size-4" />
                                                Editar horários
                                              </DropdownMenuItem>
                                              <DropdownMenuSeparator />
                                              <DropdownMenuItem
                                                disabled={isAbsent || isMarkingAbsent}
                                                onClick={() => {
                                                  setSelectedSlotForAction(slot);
                                                  setAbsentDialogOpen(true);
                                                }}
                                              >
                                                <XCircle
                                                  className={classHelper(
                                                    "size-4",
                                                    isAbsent && "text-red-500",
                                                  )}
                                                />
                                                Marcar Ausencia
                                              </DropdownMenuItem>
                                              <DropdownMenuItem
                                                variant="destructive"
                                                onClick={() => {
                                                  setSelectedSlotForAction(slot);
                                                  setDeleteDialogOpen(true);
                                                }}
                                              >
                                                <Trash className="size-4" />
                                                Excluir turno
                                              </DropdownMenuItem>
                                              <DropdownMenuItem
                                                variant="destructive"
                                                onClick={() => {
                                                  setSelectedSlotForAction(slot);
                                                  setBanDialogOpen(true);
                                                }}
                                              >
                                                <Ban className="size-4" />
                                                Banir Entregador
                                              </DropdownMenuItem>
                                            </DropdownMenuContent>
                                          </DropdownMenu>
                                        </div>
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}

                                {/* Unassigned Rows */}
                                {unassignedRows.map(({ period }, index) => (
                                  <TableRow
                                    key={`unassigned-${client.id}-${period}-${index}`}
                                    className="bg-muted/30 hover:bg-muted/50"
                                  >
                                    <TableCell>
                                      <div className="flex flex-col">
                                        <span className="text-muted-foreground">Vago</span>
                                        <span className="text-xs text-muted-foreground">
                                          {PERIOD_LABELS[period] ?? period}
                                        </span>
                                      </div>
                                    </TableCell>
                                    <TableCell colSpan={5}>
                                      <Text variant="muted">N/A</Text>
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          setClientForAssignDialog(client);
                                          setPeriodForAssignDialog(period);
                                          setAssignDialogOpen(true);
                                        }}
                                      >
                                        <UserPlus className="mr-2 size-4" />
                                        Selecionar
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))}
                                {/* Add new deliveryman row */}
                                <TableRow className="hover:bg-muted/30">
                                  <TableCell colSpan={6}>
                                    <Button
                                      variant="ghost"
                                      className="w-full"
                                      onClick={() => {
                                        setClientForAssignDialog(client);
                                        setPeriodForAssignDialog(null);
                                        setAssignDialogOpen(true);
                                      }}
                                    >
                                      <UserPlus className="mr-2 size-4" />
                                      Adicionar Entregador
                                    </Button>
                                  </TableCell>
                                </TableRow>

                                {/* Cancelled Rows */}
                                {cancelledWorkShifts.map((slot) => {
                                  const statusInfo = WORK_SHIFT_STATUS_MAP[slot.status];
                                  return (
                                    <TableRow
                                      key={slot.id}
                                      className="opacity-50"
                                    >
                                      <TableCell className="font-medium">
                                        <div className="flex flex-col">
                                          <span>{slot.deliveryman?.name || "N/A"}</span>
                                          <span className="text-xs text-muted-foreground">
                                            {slot.period
                                              .map((p) => PERIOD_LABELS[p] ?? p)
                                              .join(", ")}{" "}
                                            - {formatMoney(calculateShiftValue(slot) ?? undefined)}
                                          </span>
                                        </div>
                                      </TableCell>
                                      <TableCell className="capitalize">
                                        {slot.contractType.toLowerCase()}
                                      </TableCell>
                                      <TableCell>
                                        {`${formatTime(slot.startTime)} - ${formatTime(
                                          slot.endTime,
                                        )}`}
                                      </TableCell>
                                      <TableCell className="text-sm">
                                        {formatCheckInCheckOut(slot.checkInAt, slot.checkOutAt)}
                                      </TableCell>
                                      <TableCell>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Badge className={classHelper(statusInfo.className, "cursor-help")}>
                                              {statusInfo.label}
                                            </Badge>
                                          </TooltipTrigger>
                                          <TooltipContent>{statusInfo.description}</TooltipContent>
                                        </Tooltip>
                                      </TableCell>
                                      <TableCell>N/A</TableCell>
                                      <TableCell className="text-right">
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              className="size-7"
                                              onClick={() => {
                                                setSelectedSlotForAction(slot);
                                                setEditModeActive(false);
                                                setDetailsDialogOpen(true);
                                              }}
                                            >
                                              <Eye className="size-4" />
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>Ver Detalhes</TooltipContent>
                                        </Tooltip>
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          </div>
                        )}
                      </CardHeader>
                    </Card>
                  );
                })}
            </div>
          )}
        </div>

        {/* Dialogs */}
        <Dialog
          open={assignDialogOpen}
          onOpenChange={(open) => {
            setAssignDialogOpen(open);
            if (!open) {
              setClientForAssignDialog(null);
              setPeriodForAssignDialog(null);
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Selecionar Entregador</DialogTitle>
              {clientForDialogData && (
                <DialogDescription>
                  Selecione um entregador para o cliente {clientForDialogData.name}.
                </DialogDescription>
              )}
            </DialogHeader>
            {isLoadingClientForDialog && <Spinner className="mx-auto" />}
            {!isLoadingClientForDialog && clientForDialogData && (
              <AssignDeliverymanForm
                client={clientForDialogData}
                period={periodForAssignDialog}
                onSubmit={handleAssignSubmit}
                selectedDate={selectedDate}
              />
            )}
          </DialogContent>
        </Dialog>

        <Dialog
          open={logDialogOpen}
          onOpenChange={(open) => {
            setLogDialogOpen(open);
            if (!open) setSelectedSlotForAction(null);
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Log</DialogTitle>
              <DialogDescription>
                Adicione uma observação para o turno de{" "}
                {selectedSlotForAction?.deliveryman?.name || "N/A"}.
              </DialogDescription>
            </DialogHeader>
            <Textarea placeholder="Digite sua observação aqui..." />
            <Button
              onClick={() => {
                toast.info("Funcionalidade de log ainda não implementada.");
                setLogDialogOpen(false);
              }}
            >
              Salvar Log
            </Button>
          </DialogContent>
        </Dialog>

        <AlertDialog
          open={banDialogOpen}
          onOpenChange={(open) => {
            setBanDialogOpen(open);
            if (!open) setSelectedSlotForAction(null);
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Banimento</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja banir o entregador{" "}
                <strong>{selectedSlotForAction?.deliveryman?.name || "N/A"}</strong> deste cliente?
                Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  toast.info("Funcionalidade de banir ainda não implementada.");
                  setBanDialogOpen(false);
                }}
              >
                Confirmar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog
          open={deleteDialogOpen}
          onOpenChange={(open) => {
            setDeleteDialogOpen(open);
            if (!open) setSelectedSlotForAction(null);
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir Turno</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir o turno do entregador {" "}
                <strong>{selectedSlotForAction?.deliveryman?.name || "N/A"}</strong>? Esta ação
                não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                disabled={isDeleting}
                onClick={() => {
                  if (!selectedSlotForAction?.id) return;
                  deleteSlot(selectedSlotForAction.id);
                }}
              >
                {isDeleting ? "Excluindo..." : "Confirmar"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog
          open={absentDialogOpen}
          onOpenChange={(open) => {
            setAbsentDialogOpen(open);
            if (!open) setSelectedSlotForAction(null);
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Marcar Ausência</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja marcar o entregador{" "}
                <strong>{selectedSlotForAction?.deliveryman?.name || "N/A"}</strong> como ausente?
                Esta ação indicará que o entregador não compareceu ao turno.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                disabled={isMarkingAbsent}
                onClick={() => {
                  if (!selectedSlotForAction?.id) return;
                  markAbsent(selectedSlotForAction.id);
                  setAbsentDialogOpen(false);
                  setSelectedSlotForAction(null);
                }}
              >
                {isMarkingAbsent ? "Marcando..." : "Confirmar Ausência"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Dialog
          open={detailsDialogOpen}
          onOpenChange={(open) => {
            setDetailsDialogOpen(open);
            if (!open) {
              setSelectedSlotForAction(null);
              setEditModeActive(false);
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editModeActive ? "Editar Turno" : "Detalhes do Turno"}
              </DialogTitle>
            </DialogHeader>
            {selectedSlotForAction && !editModeActive && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar className="size-12">
                    <AvatarImage src={undefined} />
                    <AvatarFallback>
                      {getInitials(selectedSlotForAction.deliveryman?.name || "?")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <Heading variant="h4">
                      {selectedSlotForAction.deliveryman?.name || "N/A"}
                    </Heading>
                    <Text variant="muted" className="text-sm">
                      {selectedSlotForAction.period
                        .map((p) => PERIOD_LABELS[p] ?? p)
                        .join(", ")}
                    </Text>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Text variant="muted">Status</Text>
                    <Badge
                      className={
                        WORK_SHIFT_STATUS_MAP[selectedSlotForAction.status]?.className ||
                        "bg-gray-500"
                      }
                    >
                      {WORK_SHIFT_STATUS_MAP[selectedSlotForAction.status]?.label ||
                        selectedSlotForAction.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <Text variant="muted">Periodo</Text>
                    <Text>
                      {selectedSlotForAction.period
                        .map((p) => PERIOD_LABELS[p] ?? p)
                        .join(", ")}
                    </Text>
                  </div>
                  <div className="flex justify-between">
                    <Text variant="muted">Horario</Text>
                    <Text>
                      {formatTime(selectedSlotForAction.startTime)} -{" "}
                      {formatTime(selectedSlotForAction.endTime)}
                    </Text>
                  </div>
                  <div className="flex justify-between">
                    <Text variant="muted">Check-in/Check-out</Text>
                    <Text>{formatCheckInCheckOut(selectedSlotForAction.checkInAt, selectedSlotForAction.checkOutAt)}</Text>
                  </div>
                  <div className="flex justify-between">
                    <Text variant="muted">Tipo de Contrato</Text>
                    <Text className="capitalize">
                      {selectedSlotForAction.contractType.toLowerCase()}
                    </Text>
                  </div>
                  {selectedSlotPayment && (
                    <>
                      <div className="flex justify-between">
                        <Text variant="muted">Forma de Pagamento</Text>
                        <Text>{selectedSlotPayment.paymentFormLabel}</Text>
                      </div>
                      {selectedSlotPayment.breakdown.lines.length > 0 ? (
                        selectedSlotPayment.breakdown.lines.map((line) => (
                          <div key={line.label} className="flex justify-between">
                            <Text variant="muted">{line.label}</Text>
                            <Text className="text-right">{line.value}</Text>
                          </div>
                        ))
                      ) : (
                        <div className="flex justify-between">
                          <Text variant="muted">Pagamento</Text>
                          <Text>Não informado</Text>
                        </div>
                      )}
                      {selectedSlotPayment.breakdown.total !== undefined && (
                        <div className="flex justify-between">
                          <Text variant="muted">Total pago</Text>
                          <Text className="font-medium">
                            {formatMoney(selectedSlotPayment.breakdown.total)}
                          </Text>
                        </div>
                      )}
                    </>
                  )}
                </div>

                <Separator />

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setEditModeActive(true)}
                >
                  <Pencil className="mr-2 size-4" />
                  Editar
                </Button>
              </div>
            )}
            {selectedSlotForAction && editModeActive && (
              <>
                {isLoadingClientForDetails && <Skeleton className="h-40 w-full" />}
                {!isLoadingClientForDetails && clientForDetailsDialog && (
                  <AssignDeliverymanForm
                    client={clientForDetailsDialog}
                    period={null}
                    selectedDate={formatDateYYYYMMDD(new Date(selectedSlotForAction.shiftDate))}
                    editMode={true}
                    workShiftSlot={selectedSlotForAction}
                    onSubmit={() => {
                      toast.success("Turno atualizado com sucesso!");
                      setDetailsDialogOpen(false);
                      setEditModeActive(false);
                      invalidateWorkShiftSlots();
                    }}
                  />
                )}
              </>
            )}
          </DialogContent>
        </Dialog>

        <Dialog
          open={editTimesDialogOpen}
          onOpenChange={(open) => {
            setEditTimesDialogOpen(open);
            if (!open) {
              setSelectedSlotForAction(null);
              setEditCheckInTime("");
              setEditCheckOutTime("");
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Horários</DialogTitle>
              <DialogDescription>
                Edite os horários de check-in e check-out do turno de{" "}
                {selectedSlotForAction?.deliveryman?.name || "N/A"}.
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="editCheckIn">Check-in</FieldLabel>
                <Input
                  id="editCheckIn"
                  placeholder="00:00"
                  value={editCheckInTime}
                  onChange={(e) => setEditCheckInTime(hourMask(e.target.value))}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="editCheckOut">Check-out</FieldLabel>
                <Input
                  id="editCheckOut"
                  placeholder="00:00"
                  value={editCheckOutTime}
                  onChange={(e) => setEditCheckOutTime(hourMask(e.target.value))}
                />
              </Field>
            </div>
            <Button
              disabled={isUpdatingTimes}
              onClick={() => {
                if (!selectedSlotForAction) return;

                const shiftDate = new Date(selectedSlotForAction.shiftDate);

                let checkInAt: string | null = null;
                if (editCheckInTime && /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(editCheckInTime)) {
                  const [hours, minutes] = editCheckInTime.split(":").map(Number);
                  const checkInDate = new Date(shiftDate);
                  checkInDate.setHours(hours, minutes, 0, 0);
                  checkInAt = checkInDate.toISOString();
                }

                let checkOutAt: string | null = null;
                if (editCheckOutTime && /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(editCheckOutTime)) {
                  const [hours, minutes] = editCheckOutTime.split(":").map(Number);
                  const checkOutDate = new Date(shiftDate);
                  checkOutDate.setHours(hours, minutes, 0, 0);
                  checkOutAt = checkOutDate.toISOString();
                }

                updateTimes({
                  slot: selectedSlotForAction,
                  checkInAt,
                  checkOutAt,
                });
              }}
            >
              {isUpdatingTimes ? "Salvando..." : "Salvar"}
            </Button>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
