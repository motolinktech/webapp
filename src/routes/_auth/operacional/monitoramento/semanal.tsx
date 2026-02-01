import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import {
  Ban,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  CirclePlus,
  ClipboardPaste,
  Copy,
  Info,
  MessageSquarePlus,
  Pencil,
  User,
  X,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ContentHeader } from "@/components/composite/content-header";
import {
  AssignDeliverymanForm,
  type AssignDeliverymanFormData,
} from "@/components/forms/assign-deliveryman";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Heading } from "@/components/ui/heading";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { moneyMask } from "@/lib/masks/money-mask";
import { classHelper } from "@/lib/utils/class-helper";
import { BAGS_STATUS, BAGS_STATUS_OPTIONS } from "@/modules/clients/clients.constants";
import { getClientById, listClients } from "@/modules/clients/clients.service";
import type { Client } from "@/modules/clients/clients.types";
import { listGroups } from "@/modules/groups/groups.service";
import {
  copyWorkShiftSlots,
  listWorkShiftSlots,
  markAbsentWorkShiftSlot,
} from "@/modules/work-shift-slots/work-shift-slots.service";
import { listPlannings } from "@/modules/planning/planning.service";
import { getApiErrorMessage } from "@/lib/services/api";
import type { WorkShiftSlot } from "@/modules/work-shift-slots/work-shift-slots.types";
import { toast } from "sonner";
import { hasPermissions } from "@/lib/utils/has-permissions";
import { getStoredUser } from "@/modules/auth/auth.service";

export const Route = createFileRoute("/_auth/operacional/monitoramento/semanal")({
  beforeLoad: () => {
    const user = getStoredUser();
    if (!user || !hasPermissions(user, "operational.view")) {
      toast.error("Você não tem permissão para acessar o monitoramento semanal.");
      throw redirect({ to: "/dashboard" });
    }
  },
  component: MonitoramentoSemanal,
});

// Helper Functions
const WEEKDAY_LABELS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sab", "Dom"];

const WORK_SHIFT_STATUS_MAP: Record<string, { label: string; className: string }> = {
  PENDING: { label: "Pendente", className: "bg-gray-500" },
  CONFIRMED: { label: "Confirmado", className: "bg-blue-500" },
  CHECKED_IN: { label: "Em Andamento", className: "bg-green-500" },
  CHECKED_OUT: { label: "Finalizado", className: "bg-purple-500" },
  ABSENT: { label: "Ausente", className: "bg-red-500" },
  CANCELLED: { label: "Cancelado", className: "bg-yellow-500 text-black" },
  INVITED: { label: "Convidado", className: "bg-orange-500" },
};

type WorkShiftPeriod = WorkShiftSlot["period"][number];

const PERIOD_LABELS: Record<WorkShiftPeriod, string> = {
  daytime: "Diurno",
  nighttime: "Noturno",
};

function getWeekDates(weekOffset = 0): Date[] {
  const today = new Date();
  const dayOfWeek = today.getUTCDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  const monday = new Date(today);
  monday.setUTCDate(today.getUTCDate() + mondayOffset + weekOffset * 7);
  monday.setUTCHours(0, 0, 0, 0);

  const weekDates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(monday);
    date.setUTCDate(monday.getUTCDate() + i);
    weekDates.push(date);
  }

  return weekDates;
}

function isPastDay(date: Date): boolean {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  return date < today;
}

function formatDate(date: Date): string {
  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${day}/${month}`;
}

function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getUTCDate() === today.getUTCDate() &&
    date.getUTCMonth() === today.getUTCMonth() &&
    date.getUTCFullYear() === today.getUTCFullYear()
  );
}

function toDateKey(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function startOfDay(date: Date): Date {
  const next = new Date(date);
  next.setUTCHours(0, 0, 0, 0);
  return next;
}

function endOfDay(date: Date): Date {
  const next = new Date(date);
  next.setUTCHours(23, 59, 59, 999);
  return next;
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

function formatTime(isoString?: string | null): string {
  if (!isoString) return "N/A";
  return new Date(isoString).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Uses UTC methods to match how dates are created in getWeekDates()
function formatDateYYYYMMDD(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

// Main Component
function MonitoramentoSemanal() {
  const queryClient = useQueryClient();

  // Filter state
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [clientSearchOpen, setClientSearchOpen] = useState(false);
  const [clientSearch, setClientSearch] = useState("");
  const [debouncedClientSearch, setDebouncedClientSearch] = useState("");
  const [searchClientsResults, setSearchClientsResults] = useState<Client[]>([]);
  const [weekOffset, setWeekOffset] = useState(0);

  // Dialog state
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [clientForAssign, setClientForAssign] = useState<Client | null>(null);
  const [dateForAssign, setDateForAssign] = useState<Date | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<WorkShiftSlot | null>(null);
  const [logDialogOpen, setLogDialogOpen] = useState(false);
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [editModeActive, setEditModeActive] = useState(false);

  // Copy mode state - tracks which client/date is being copied
  // Key: clientId, Value: source date string (YYYY-MM-DD)
  const [copyModeMap, setCopyModeMap] = useState<Map<string, string>>(new Map());

  // Week dates
  const weekDates = useMemo(() => getWeekDates(weekOffset), [weekOffset]);

  const goToPreviousWeek = () => setWeekOffset((prev) => prev - 1);
  const goToNextWeek = () => setWeekOffset((prev) => prev + 1);

  const weekRangeLabel = useMemo(() => {
    const start = formatDate(weekDates[0]);
    const end = formatDate(weekDates[6]);
    return `${start} - ${end}`;
  }, [weekDates]);

  const startDate = useMemo(() => startOfDay(weekDates[0]).toISOString(), [weekDates]);
  const endDate = useMemo(() => endOfDay(weekDates[6]).toISOString(), [weekDates]);

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
    queryKey: ["client", clientForAssign?.id],
    queryFn: () => (clientForAssign ? getClientById(clientForAssign.id) : Promise.resolve(null)),
    enabled: !!clientForAssign?.id,
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
  });

  const { data: planningsData } = useQuery({
    queryKey: ["plannings", { selectedClientId, selectedGroupId, startDate, endDate }],
    queryFn: () =>
      listPlannings({
        startDate,
        endDate,
        clientId: selectedClientId || undefined,
        groupId: !selectedClientId && selectedGroupId ? selectedGroupId : undefined,
        limit: 1000,
      }),
    enabled: !!selectedClientId || !!selectedGroupId,
  });

  const { data: clientForEditSlot, isLoading: isLoadingClientForEdit } = useQuery({
    queryKey: ["client", selectedSlot?.clientId],
    queryFn: () => (selectedSlot ? getClientById(selectedSlot.clientId) : Promise.resolve(null)),
    enabled: !!selectedSlot?.clientId && detailsDialogOpen && editModeActive,
  });

  // Mutations
  const { mutate: markAbsent, isPending: isMarkingAbsent } = useMutation({
    mutationFn: (id: string) => markAbsentWorkShiftSlot(id),
    onSuccess: () => {
      toast.success("Ausência marcada com sucesso!");
      setDetailsDialogOpen(false);
      setSelectedSlot(null);
      queryClient.invalidateQueries({ queryKey: workShiftSlotsQueryKey });
    },
    onError: (error) => toast.error("Erro ao marcar ausência", { description: error.message }),
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
      queryClient.invalidateQueries({ queryKey: workShiftSlotsQueryKey });
      setCopyModeMap(new Map());
    },
    onError: (error) => {
      toast.error("Erro ao copiar turnos", { description: getApiErrorMessage(error) });
    },
  });

  // Derived data
  const groups = groupsData?.data || [];
  const clients = useMemo(() => {
    if (selectedClientId && selectedClientData) return [selectedClientData];
    return clientsData?.data || [];
  }, [selectedClientId, selectedClientData, clientsData?.data]);

  // Group work shifts by client and date
  const workShiftsByClientAndDate = useMemo(() => {
    const map = new Map<string, WorkShiftSlot[]>();
    const slots = workShiftSlotsData?.data || [];
    for (const slot of slots) {
      if (slot.status === "CANCELLED") continue;
      const slotDate = new Date(slot.shiftDate);
      const dateKey = toDateKey(slotDate);
      const key = `${slot.clientId}-${dateKey}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(slot);
    }
    return map;
  }, [workShiftSlotsData?.data]);

  // Group plannings by client and date
  const planningsByClientAndDate = useMemo(() => {
    const map = new Map<string, { daytime: number; nighttime: number }>();
    const plannings = planningsData?.data || [];
    for (const planning of plannings) {
      const dateKey = planning.plannedDate.slice(0, 10); // "YYYY-MM-DD"
      const key = `${planning.clientId}-${dateKey}`;
      if (!map.has(key)) map.set(key, { daytime: 0, nighttime: 0 });
      const counts = map.get(key)!;
      counts[planning.period] += planning.plannedCount;
    }
    return map;
  }, [planningsData?.data]);

  // Copy mode helper functions
  function isInCopyMode(clientId: string): boolean {
    return copyModeMap.has(clientId);
  }

  function getCopySourceDate(clientId: string): string | undefined {
    return copyModeMap.get(clientId);
  }

  function handleCopyClick(clientId: string, dateKey: string) {
    setCopyModeMap((prev) => {
      const next = new Map(prev);
      if (next.get(clientId) === dateKey) {
        // Cancel copy mode
        next.delete(clientId);
      } else {
        // Enter copy mode
        next.set(clientId, dateKey);
      }
      return next;
    });
  }

  function handlePasteClick(clientId: string, targetDateKey: string) {
    const sourceDate = copyModeMap.get(clientId);
    if (!sourceDate) return;

    copyShifts({
      sourceDate,
      targetDate: targetDateKey,
      clientId,
    });
  }

  function handleAssignSubmit(_data: AssignDeliverymanFormData) {
    // Form handles the API call, we just need to close dialog and refresh data
    toast.success("Entregador atribuído com sucesso!");
    setAssignDialogOpen(false);
    queryClient.invalidateQueries({ queryKey: workShiftSlotsQueryKey });
  }

  function openAssignDialog(client: Client, date: Date) {
    setClientForAssign(client);
    setDateForAssign(date);
    setAssignDialogOpen(true);
  }

  function openDetailsDialog(slot: WorkShiftSlot) {
    setSelectedSlot(slot);
    setEditModeActive(false);
    setDetailsDialogOpen(true);
  }

  return (
    <TooltipProvider>
      <div className="flex flex-1 flex-col">
        <ContentHeader
          breadcrumbItems={[
            { title: "Operacional", href: "/operacional" },
            { title: "Monitoramento", href: "/operacional/monitoramento" },
            { title: "Semanal" },
          ]}
        />

        <div className="flex flex-1 flex-col gap-6 p-6">
          <div>
            <h1 className="text-2xl font-bold">Monitoramento Semanal</h1>
            <p className="text-muted-foreground mt-2">
              Acompanhe o planejamento semanal dos clientes.
            </p>
          </div>

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
                        onClick={(e) => {
                          e.stopPropagation();
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
              <Button variant="outline" size="icon" onClick={goToPreviousWeek}>
                <ChevronLeft className="size-4" />
              </Button>
              <span className="min-w-[120px] text-center text-sm font-medium">{weekRangeLabel}</span>
              <Button variant="outline" size="icon" onClick={goToNextWeek}>
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>

          {/* No filter alert */}
          {!hasActiveFilter && (
            <Alert className="w-full">
              <Info className="size-4" />
              <AlertTitle>Nenhum filtro selecionado</AlertTitle>
              <AlertDescription>
                Selecione um grupo ou busque um cliente para visualizar o monitoramento semanal.
              </AlertDescription>
            </Alert>
          )}

          {/* No clients alert */}
          {hasActiveFilter &&
            !isLoadingClients &&
            !isLoadingSelectedClient &&
            clients.length === 0 && (
              <Alert className="w-full">
                <Info className="size-4" />
                <AlertTitle>Nenhum cliente encontrado</AlertTitle>
                <AlertDescription>
                  {selectedGroupId
                    ? "Não há clientes cadastrados neste grupo."
                    : "Cliente não encontrado."}
                </AlertDescription>
              </Alert>
            )}

          {/* Client cards */}
          {hasActiveFilter && (isLoadingClients || isLoadingSelectedClient || clients.length > 0) && (
            <div className="flex flex-col gap-4">
              {isLoadingClients || isLoadingSelectedClient
                ? [...Array(3)].map((_, i) => <Skeleton key={i} className="h-48 w-full" />)
                : clients.map((client) => {
                    const bagsInfo = formatBagsInfo(client);
                    const deliverymanConditions = formatDeliverymanConditions(client);
                    const perDeliveryInfo = formatPerDeliveryInfo(client);

                    return (
                      <Card key={client.id}>
                        <CardHeader className="space-y-4">
                          {/* Client Info */}
                          <div className="space-y-1">
                            <Heading variant="h4">{client.name}</Heading>
                            <Text variant="muted" className="text-xs">
                              {formatCompactAddress(client)}
                            </Text>
                            <Text variant="muted">{formatMealInfo(client)}</Text>
                            {bagsInfo && <Text variant="muted">{bagsInfo}</Text>}
                            {deliverymanConditions && (
                              <Text variant="muted">{deliverymanConditions}</Text>
                            )}
                            {perDeliveryInfo && (
                              <Text variant="muted">{perDeliveryInfo}</Text>
                            )}
                          </div>

                          {/* Weekly Grid */}
                          {isLoadingWorkShiftSlots ? (
                            <Skeleton className="h-20 w-full" />
                          ) : (
                            <div className="grid grid-cols-7 gap-2">
                              {weekDates.map((date, index) => {
                                const dateKey = toDateKey(date);
                                const key = `${client.id}-${dateKey}`;
                                const daySlots = workShiftsByClientAndDate.get(key) || [];
                                const isPast = isPastDay(date);
                                const today = isToday(date);

                                // Planning counts for this day
                                const plannedCounts = planningsByClientAndDate.get(key) || { daytime: 0, nighttime: 0 };
                                const totalPlanned = plannedCounts.daytime + plannedCounts.nighttime;

                                // Assigned counts (excluding cancelled - already filtered)
                                const assignedCounts = { daytime: 0, nighttime: 0 };
                                daySlots.forEach((slot) => {
                                  slot.period.forEach((p) => {
                                    assignedCounts[p] += 1;
                                  });
                                });
                                const totalAssigned = assignedCounts.daytime + assignedCounts.nighttime;

                                // Unassigned placeholder count
                                const remainingDiurno = Math.max(0, plannedCounts.daytime - assignedCounts.daytime);
                                const remainingNoturno = Math.max(0, plannedCounts.nighttime - assignedCounts.nighttime);
                                const unassignedSlots = [
                                  ...Array.from({ length: remainingDiurno }, () => "daytime" as const),
                                  ...Array.from({ length: remainingNoturno }, () => "nighttime" as const),
                                ];

                                return (
                                  <div
                                    key={date.toISOString()}
                                    className={classHelper(
                                      "flex flex-col rounded-md border p-3 min-h-28",
                                      today && "border-primary bg-primary/5",
                                      isPast && "opacity-50",
                                      getCopySourceDate(client.id) === dateKey && "border-primary border-2 bg-primary/10",
                                    )}
                                  >
                                    {/* Day header with copy/paste buttons */}
                                    <div className="flex items-center justify-between mb-1">
                                      <div>
                                        <span className="text-xs font-medium">{WEEKDAY_LABELS[index]}</span>
                                        <span
                                          className={classHelper(
                                            "text-xs ml-1",
                                            today ? "font-bold text-primary" : "text-muted-foreground",
                                          )}
                                        >
                                          {formatDate(date)}
                                        </span>
                                        {totalPlanned > 0 && (
                                          <span className="ml-1 text-xs text-muted-foreground">
                                            ({totalAssigned}/{totalPlanned})
                                          </span>
                                        )}
                                      </div>

                                      {/* Copy/Paste Button */}
                                      {!isPast && (
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            {isInCopyMode(client.id) && getCopySourceDate(client.id) !== dateKey ? (
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                className="size-6"
                                                disabled={isCopyingShifts}
                                                onClick={() => handlePasteClick(client.id, dateKey)}
                                              >
                                                <ClipboardPaste className="size-3.5" />
                                              </Button>
                                            ) : (
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                className={classHelper(
                                                  "size-6",
                                                  getCopySourceDate(client.id) === dateKey && "bg-primary/20",
                                                )}
                                                disabled={daySlots.length === 0}
                                                onClick={() => handleCopyClick(client.id, dateKey)}
                                              >
                                                <Copy className="size-3.5" />
                                              </Button>
                                            )}
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            {isInCopyMode(client.id) && getCopySourceDate(client.id) !== dateKey
                                              ? "Colar turnos aqui"
                                              : getCopySourceDate(client.id) === dateKey
                                                ? "Clique para cancelar"
                                                : daySlots.length === 0
                                                  ? "Nenhum turno para copiar"
                                                  : "Copiar turnos deste dia"}
                                          </TooltipContent>
                                        </Tooltip>
                                      )}
                                    </div>

                                    {/* Avatars + Unassigned + Add button */}
                                    <div className="flex flex-wrap items-center gap-1">
                                      {/* Existing assigned slots */}
                                      {daySlots.map((slot) => (
                                        <Tooltip key={slot.id}>
                                          <TooltipTrigger asChild>
                                            <button
                                              type="button"
                                              onClick={() => openDetailsDialog(slot)}
                                              className="cursor-pointer"
                                            >
                                              <Avatar className="size-7">
                                                <AvatarImage src={undefined} />
                                                <AvatarFallback className="text-xs">
                                                  {getInitials(slot.deliveryman?.name || "?")}
                                                </AvatarFallback>
                                              </Avatar>
                                            </button>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p>{slot.deliveryman?.name || "N/A"}</p>
                                            <p className="text-xs text-muted-foreground">
                                              {slot.period
                                                .map((p) => PERIOD_LABELS[p] ?? p)
                                                .join(", ")}
                                            </p>
                                          </TooltipContent>
                                        </Tooltip>
                                      ))}

                                      {/* Unassigned placeholder buttons */}
                                      {!isPast && unassignedSlots.map((period, idx) => (
                                        <Tooltip key={`unassigned-${period}-${idx}`}>
                                          <TooltipTrigger asChild>
                                            <button
                                              type="button"
                                              onClick={() => openAssignDialog(client, date)}
                                              className="cursor-pointer"
                                            >
                                              <Avatar className="size-7 border-2 border-dashed border-muted-foreground/50">
                                                <AvatarFallback className="text-xs bg-muted">
                                                  <User className="size-3.5 text-muted-foreground" />
                                                </AvatarFallback>
                                              </Avatar>
                                            </button>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p>Vaga {PERIOD_LABELS[period]} não preenchida</p>
                                            <p className="text-xs text-muted-foreground">Clique para atribuir</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      ))}

                                      {/* Add button */}
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="size-7"
                                            disabled={isPast}
                                            onClick={() => openAssignDialog(client, date)}
                                          >
                                            <CirclePlus className="size-5" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          {isPast
                                            ? "Não é possível adicionar em datas passadas"
                                            : "Adicionar entregador"}
                                        </TooltipContent>
                                      </Tooltip>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </CardHeader>
                      </Card>
                    );
                  })}
            </div>
          )}
        </div>

        {/* Assign Deliveryman Dialog */}
        <Dialog
          open={assignDialogOpen}
          onOpenChange={(open) => {
            setAssignDialogOpen(open);
            if (!open) {
              setClientForAssign(null);
              setDateForAssign(null);
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Selecionar Entregador</DialogTitle>
              {clientForDialogData && dateForAssign && (
                <DialogDescription>
                  Selecione um entregador para {clientForDialogData.name} em{" "}
                  {formatDate(dateForAssign)}.
                </DialogDescription>
              )}
            </DialogHeader>
            {isLoadingClientForDialog && <Skeleton className="h-40 w-full" />}
            {!isLoadingClientForDialog && clientForDialogData && dateForAssign && (
              <AssignDeliverymanForm
                client={clientForDialogData}
                period={null}
                onSubmit={handleAssignSubmit}
                selectedDate={formatDateYYYYMMDD(dateForAssign)}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Deliveryman Details Dialog */}
        <Dialog
          open={detailsDialogOpen}
          onOpenChange={(open) => {
            setDetailsDialogOpen(open);
            if (!open) {
              setSelectedSlot(null);
              setEditModeActive(false);
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editModeActive ? "Editar Turno" : "Detalhes do Entregador"}
              </DialogTitle>
            </DialogHeader>
            {selectedSlot && !editModeActive && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar className="size-12">
                    <AvatarImage src={undefined} />
                    <AvatarFallback>
                      {getInitials(selectedSlot.deliveryman?.name || "?")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <Heading variant="h4">{selectedSlot.deliveryman?.name || "N/A"}</Heading>
                    <Text variant="muted" className="text-sm">
                      {selectedSlot.period.map((p) => PERIOD_LABELS[p] ?? p).join(", ")}
                    </Text>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Text variant="muted">Status</Text>
                    <Badge
                      className={
                        WORK_SHIFT_STATUS_MAP[selectedSlot.status]?.className || "bg-gray-500"
                      }
                    >
                      {WORK_SHIFT_STATUS_MAP[selectedSlot.status]?.label || selectedSlot.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <Text variant="muted">Periodo</Text>
                    <Text>{selectedSlot.period.map((p) => PERIOD_LABELS[p] ?? p).join(", ")}</Text>
                  </div>
                  <div className="flex justify-between">
                    <Text variant="muted">Horario</Text>
                    <Text>
                      {formatTime(selectedSlot.startTime)} - {formatTime(selectedSlot.endTime)}
                    </Text>
                  </div>
                  <div className="flex justify-between">
                    <Text variant="muted">Tipo de Contrato</Text>
                    <Text className="capitalize">{selectedSlot.contractType.toLowerCase()}</Text>
                  </div>
                  {(selectedSlot.deliverymanAmountDay || selectedSlot.deliverymanAmountNight) && (
                    <div className="flex justify-between">
                      <Text variant="muted">Valor</Text>
                      <Text>
                        {formatMoney(
                          selectedSlot.deliverymanAmountDay || selectedSlot.deliverymanAmountNight,
                        )}
                      </Text>
                    </div>
                  )}
                </div>

                <Separator />

                <div className="flex flex-col gap-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => setEditModeActive(true)}
                  >
                    <Pencil className="mr-2 size-4" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => {
                      setDetailsDialogOpen(false);
                      setLogDialogOpen(true);
                    }}
                  >
                    <MessageSquarePlus className="mr-2 size-4" />
                    Adicionar Log
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    disabled={selectedSlot.status === "ABSENT" || isMarkingAbsent}
                    onClick={() => markAbsent(selectedSlot.id)}
                  >
                    <XCircle className={classHelper("mr-2 size-4", selectedSlot.status === "ABSENT" && "text-red-500")} />
                    {isMarkingAbsent ? "Marcando..." : "Marcar Ausencia"}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-destructive hover:text-destructive"
                    onClick={() => {
                      setDetailsDialogOpen(false);
                      setBanDialogOpen(true);
                    }}
                  >
                    <Ban className="mr-2 size-4" />
                    Banir do Restaurante
                  </Button>
                </div>
              </div>
            )}
            {selectedSlot && editModeActive && (
              <>
                {isLoadingClientForEdit && <Skeleton className="h-40 w-full" />}
                {!isLoadingClientForEdit && clientForEditSlot && (
                  <AssignDeliverymanForm
                    client={clientForEditSlot}
                    period={null}
                    selectedDate={formatDateYYYYMMDD(new Date(selectedSlot.shiftDate))}
                    editMode={true}
                    workShiftSlot={selectedSlot}
                    onSubmit={() => {
                      toast.success("Turno atualizado com sucesso!");
                      setDetailsDialogOpen(false);
                      setEditModeActive(false);
                      queryClient.invalidateQueries({ queryKey: workShiftSlotsQueryKey });
                    }}
                  />
                )}
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Add Log Dialog */}
        <Dialog
          open={logDialogOpen}
          onOpenChange={(open) => {
            setLogDialogOpen(open);
            if (!open) setSelectedSlot(null);
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Log</DialogTitle>
              <DialogDescription>
                Adicione uma observação para o turno de {selectedSlot?.deliveryman?.name || "N/A"}.
              </DialogDescription>
            </DialogHeader>
            <Textarea placeholder="Digite sua observação aqui..." />
            <Button
              onClick={() => {
                toast.info("Funcionalidade de log ainda não implementada.");
                setLogDialogOpen(false);
                setSelectedSlot(null);
              }}
            >
              Salvar Log
            </Button>
          </DialogContent>
        </Dialog>

        {/* Ban Deliveryman AlertDialog */}
        <AlertDialog
          open={banDialogOpen}
          onOpenChange={(open) => {
            setBanDialogOpen(open);
            if (!open) setSelectedSlot(null);
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Banimento</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja banir o entregador{" "}
                <strong>{selectedSlot?.deliveryman?.name || "N/A"}</strong> deste cliente? Esta ação
                não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  toast.info("Funcionalidade de banir ainda não implementada.");
                  setBanDialogOpen(false);
                  setSelectedSlot(null);
                }}
              >
                Confirmar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
}
