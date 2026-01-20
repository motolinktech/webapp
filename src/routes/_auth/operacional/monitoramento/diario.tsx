import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  Ban,
  CalendarIcon,
  CheckCircle,
  ChevronsUpDown,
  CircleDotDashed,
  Eye,
  Info,
  MessageSquarePlus,
  MoreHorizontal,
  Pencil,
  Send,
  SquareCheck,
  UserPlus,
  X,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ContentHeader } from "@/components/composite/content-header";
import {
  AssignDeliverymanForm,
  type AssignDeliverymanFormData,
} from "@/components/forms/assign-deliveryman";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { Heading } from "@/components/ui/heading";
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
import { moneyMask } from "@/lib/masks/money-mask";
import { classHelper } from "@/lib/utils/class-helper";
import { BAGS_STATUS, BAGS_STATUS_OPTIONS } from "@/modules/clients/clients.constants";
import { getClientById, listClients } from "@/modules/clients/clients.service";
import type { Client } from "@/modules/clients/clients.types";
import { listGroups } from "@/modules/groups/groups.service";
import { listPlannings } from "@/modules/planning/planning.service";
import {
  checkInWorkShiftSlot,
  checkOutWorkShiftSlot,
  connectTrackingWorkShiftSlot,
  listWorkShiftSlots,
  markAbsentWorkShiftSlot,
} from "@/modules/work-shift-slots/work-shift-slots.service";
import type { WorkShiftSlot } from "@/modules/work-shift-slots/work-shift-slots.types";

export const Route = createFileRoute("/_auth/operacional/monitoramento/diario")({
  component: MonitoramentoDiario,
});

// Helper Functions & Constants
const WORK_SHIFT_STATUS_MAP: Record<string, { label: string; className: string; description: string }> = {
  OPEN: { label: "Aberto", className: "bg-gray-500", description: "Aguardando atribuição de entregador" },
  INVITED: { label: "Convidado", className: "bg-orange-500", description: "Convite enviado ao entregador" },
  CONFIRMED: { label: "Confirmado", className: "bg-blue-500", description: "Confirmado pelo entregador" },
  CHECKED_IN: { label: "Em Andamento", className: "bg-green-500", description: "Entregador presente no local" },
  COMPLETED: { label: "Finalizado", className: "bg-purple-500", description: "Turno finalizado com sucesso" },
  ABSENT: { label: "Ausente", className: "bg-red-500", description: "Entregador não compareceu" },
  CANCELLED: { label: "Cancelado", className: "bg-yellow-500 text-black", description: "Turno cancelado" },
};

type WorkShiftPeriod = WorkShiftSlot["period"][number];

const PERIOD_LABELS: Record<WorkShiftPeriod, string> = {
  daytime: "Diurno",
  nighttime: "Noturno",
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

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function startOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function endOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
}

// Main Component
function MonitoramentoDiario() {
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [clientSearchOpen, setClientSearchOpen] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => startOfDay(new Date()));

  // Dialog states
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [clientForAssignDialog, setClientForAssignDialog] = useState<Client | null>(null);
  const [periodForAssignDialog, setPeriodForAssignDialog] = useState<WorkShiftPeriod | null>(
    null,
  );
  const [logDialogOpen, setLogDialogOpen] = useState(false);
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [finishServiceDialogOpen, setFinishServiceDialogOpen] = useState(false);
  const [selectedSlotForAction, setSelectedSlotForAction] = useState<WorkShiftSlot | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [editModeActive, setEditModeActive] = useState(false);

  const queryClient = useQueryClient();

  const startDate = useMemo(() => startOfDay(selectedDate).toISOString(), [selectedDate]);
  const endDate = useMemo(() => endOfDay(selectedDate).toISOString(), [selectedDate]);
  const dateLabel = useMemo(() => formatDateLabel(selectedDate), [selectedDate]);

  // Queries
  const { data: groupsData, isLoading: isLoadingGroups } = useQuery({
    queryKey: ["groups"],
    queryFn: () => listGroups({ limit: 100 }),
  });

  const { data: searchClientsData } = useQuery({
    queryKey: ["clients-search"],
    queryFn: () => listClients({ limit: 20 }),
    enabled: clientSearchOpen,
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

  const clientIds = useMemo(() => {
    if (selectedClientId) return [selectedClientId];
    return clientsData?.data?.map((client) => client.id) || [];
  }, [selectedClientId, clientsData?.data]);

  const hasActiveFilter = !!selectedGroupId || !!selectedClientId;

  const workShiftSlotsQueryKey = useMemo(
    () => ["work-shift-slots", { clientIds, startDate, endDate }],
    [clientIds, startDate, endDate],
  );

  const { data: workShiftSlotsData, isLoading: isLoadingWorkShiftSlots } = useQuery({
    queryKey: workShiftSlotsQueryKey,
    queryFn: () => listWorkShiftSlots({ clientIds, startDate, endDate, limit: 1000 }),
    enabled: hasActiveFilter && clientIds.length > 0,
  });

  const { data: planningsData, isLoading: isLoadingPlannings } = useQuery({
    queryKey: ["plannings", { clientIds, startDate, endDate }],
    queryFn: () => listPlannings({ startDate, endDate, clientId: clientIds[0], limit: 1000 }),
    enabled: hasActiveFilter && clientIds.length > 0,
  });

  const { data: clientForDetailsDialog, isLoading: isLoadingClientForDetails } = useQuery({
    queryKey: ["client", selectedSlotForAction?.clientId],
    queryFn: () =>
      selectedSlotForAction ? getClientById(selectedSlotForAction.clientId) : Promise.resolve(null),
    enabled: !!selectedSlotForAction?.clientId && detailsDialogOpen && editModeActive,
  });

  // Mutations

  const { mutate: checkIn, isPending: isCheckingIn } = useMutation({
    mutationFn: (id: string) => checkInWorkShiftSlot(id),
    onSuccess: () => {
      toast.success("Check-in realizado com sucesso!");
      queryClient.invalidateQueries({ queryKey: workShiftSlotsQueryKey });
    },
    onError: (error) => toast.error("Erro ao realizar check-in", { description: error.message }),
  });

  const { mutate: checkOut, isPending: isCheckingOut } = useMutation({
    mutationFn: (id: string) => checkOutWorkShiftSlot(id),
    onSuccess: () => {
      toast.success("Check-out realizado com sucesso!");
      queryClient.invalidateQueries({ queryKey: workShiftSlotsQueryKey });
    },
    onError: (error) => toast.error("Erro ao realizar check-out", { description: error.message }),
  });

  const { mutate: markAbsent, isPending: isMarkingAbsent } = useMutation({
    mutationFn: (id: string) => markAbsentWorkShiftSlot(id),
    onSuccess: () => {
      toast.success("Ausência marcada com sucesso!");
      queryClient.invalidateQueries({ queryKey: workShiftSlotsQueryKey });
    },
    onError: (error) => toast.error("Erro ao marcar ausência", { description: error.message }),
  });

  const { mutate: connectTracking, isPending: isConnecting } = useMutation({
    mutationFn: (id: string) => connectTrackingWorkShiftSlot(id),
    onSuccess: () => {
      toast.success("Tracking conectado com sucesso!");
      queryClient.invalidateQueries({ queryKey: workShiftSlotsQueryKey });
    },
    onError: (error) => toast.error("Erro ao conectar tracking", { description: error.message }),
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

  function handleAssignSubmit(_data: AssignDeliverymanFormData) {
    // Form handles the API call, we just need to close dialog and refresh data
    toast.success("Entregador atribuído com sucesso!");
    setAssignDialogOpen(false);
    queryClient.invalidateQueries({ queryKey: workShiftSlotsQueryKey });
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
                    <CommandInput placeholder="Buscar cliente..." />
                    <CommandList>
                      <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                      <CommandGroup>
                        {searchClientsData?.data?.map((client) => (
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
                  selected={selectedDate}
                  onSelect={(date) => {
                    if (!date) return;
                    setSelectedDate(startOfDay(date));
                    setDatePickerOpen(false);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
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
                    workShiftSlotsData?.data.filter((slot) => slot.clientId === client.id) || [];
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

                  const hasData = clientWorkShifts.length > 0 || unassignedRows.length > 0;

                  return (
                    <Card key={client.id}>
                      <CardHeader className="space-y-4">
                        {/* Client Info */}
                        <div className="space-y-1">
                          <Heading variant="h4">{client.name}</Heading>
                          <Text variant="muted" className="text-xs">
                            {formatCompactAddress(client)}
                          </Text>
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
                                  <TableHead className="w-[20%]">Entregador</TableHead>
                                  <TableHead className="w-[10%]">Contrato</TableHead>
                                  <TableHead className="w-[10%]">Horário</TableHead>
                                  <TableHead className="w-[15%]">Status Atual</TableHead>
                                  <TableHead className="w-[15%]">Próxima Ação</TableHead>
                                  <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {/* Assigned Rows */}
                                {clientWorkShifts.map((slot) => {
                                  const statusInfo =
                                    WORK_SHIFT_STATUS_MAP[slot.status] ||
                                    WORK_SHIFT_STATUS_MAP.OPEN;
                                  const isAbsent = slot.status === "ABSENT";
                                  let nextAction = null;
                                  if (slot.status === "CONFIRMED") {
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
                                  } else if (
                                    slot.status === "CHECKED_IN" &&
                                    !slot.trackingConnected
                                  ) {
                                    nextAction = (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={isConnecting}
                                        onClick={() => connectTracking(slot.id)}
                                      >
                                        {isConnecting ? (
                                          <Spinner className="mr-2 size-4" />
                                        ) : (
                                          <CircleDotDashed className="mr-2 size-4" />
                                        )}
                                        Conectar
                                      </Button>
                                    );
                                  } else if (
                                    slot.status === "CHECKED_IN" &&
                                    slot.trackingConnected
                                  ) {
                                    nextAction = (
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
                                    );
                                  }

                                  return (
                                    <TableRow key={slot.id}>
                                      <TableCell className="font-medium">
                                        <div className="flex flex-col">
                                          <span>{slot.deliveryman?.name || "N/A"}</span>
                                          <span className="text-xs text-muted-foreground">
                                            {slot.period
                                              .map((p) => PERIOD_LABELS[p] ?? p)
                                              .join(", ")}{" "}
                                            -{" "}
                                            {formatMoney(
                                              slot.deliverymanAmountDay ||
                                              slot.deliverymanAmountNight,
                                            )}
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
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                className="size-7"
                                                onClick={() =>
                                                  alert("Reenviar convite não implementado")
                                                }
                                              >
                                                <Send className="size-4" />
                                              </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>Reenviar Convite</TooltipContent>
                                          </Tooltip>
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                className="size-7"
                                                onClick={() => {
                                                  setSelectedSlotForAction(slot);
                                                  setFinishServiceDialogOpen(true);
                                                }}
                                              >
                                                <SquareCheck className="size-4" />
                                              </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>Finalizar Servico</TooltipContent>
                                          </Tooltip>
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
                                              <DropdownMenuSeparator />
                                              <DropdownMenuItem
                                                disabled={isAbsent || isMarkingAbsent}
                                                onClick={() => markAbsent(slot.id)}
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
                                    <TableCell colSpan={4}>
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
          open={finishServiceDialogOpen}
          onOpenChange={(open) => {
            setFinishServiceDialogOpen(open);
            if (!open) setSelectedSlotForAction(null);
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Finalizar Servico</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja finalizar o servico do entregador{" "}
                <strong>{selectedSlotForAction?.deliveryman?.name || "N/A"}</strong>?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  toast.info("Funcionalidade de finalizar servico ainda não implementada.");
                  setFinishServiceDialogOpen(false);
                }}
              >
                Confirmar
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
                    <Text variant="muted">Tipo de Contrato</Text>
                    <Text className="capitalize">
                      {selectedSlotForAction.contractType.toLowerCase()}
                    </Text>
                  </div>
                  {(selectedSlotForAction.deliverymanAmountDay ||
                    selectedSlotForAction.deliverymanAmountNight) && (
                    <div className="flex justify-between">
                      <Text variant="muted">Valor</Text>
                      <Text>
                        {formatMoney(
                          selectedSlotForAction.deliverymanAmountDay ||
                            selectedSlotForAction.deliverymanAmountNight,
                        )}
                      </Text>
                    </div>
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
                    selectedDate={new Date(selectedSlotForAction.shiftDate)}
                    editMode={true}
                    workShiftSlot={selectedSlotForAction}
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
      </div>
    </TooltipProvider>
  );
}
