import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { CalendarIcon, ChevronsUpDown, Info, X, FileText, Send, UserPlus } from "lucide-react";
import { useMemo, useState } from "react";
import { ContentHeader } from "@/components/composite/content-header";
import { COMMERCIAL_CONDITION_LABELS } from "@/components/forms/clients.constants";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Text } from "@/components/ui/text";
import { classHelper } from "@/lib/utils/class-helper";
import { getClientById, listClients } from "@/modules/clients/clients.service";
import type { Client } from "@/modules/clients/clients.types";
import { listGroups } from "@/modules/groups/groups.service";
import { listPlannings } from "@/modules/planning/planning.service";
import { listWorkShiftSlots } from "@/modules/work-shift-slots/work-shift-slots.service";
import type { WorkShiftSlot } from "@/modules/work-shift-slots/work-shift-slots.types";

export const Route = createFileRoute("/_auth/operacional/monitoramento/diario")({
  component: MonitoramentoDiario,
});

function formatDateLabel(date: Date): string {
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
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

function formatCompactCommercialConditions(client: Client): string {
  const condition = client.commercialCondition;
  if (!condition) return "Condições comerciais não cadastradas.";

  const parts: string[] = [];
  if (condition.paymentForm?.length) {
    const paymentLabel = condition.paymentForm
      .map((form) => COMMERCIAL_CONDITION_LABELS[form] ?? form)
      .join(", ");
    if (paymentLabel) {
      parts.push(`Pagamento: ${paymentLabel}`);
    }
  }

  if (condition.deliveryAreaKm !== undefined) {
    parts.push(`Área: ${condition.deliveryAreaKm} km`);
  }

  if (condition.isMotolinkCovered !== undefined) {
    parts.push(`Cobertura: ${condition.isMotolinkCovered ? "Sim" : "Não"}`);
  }

  return parts.length > 0 ? parts.join(" | ") : "Condições comerciais não cadastradas.";
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

function MonitoramentoDiario() {
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [clientSearchOpen, setClientSearchOpen] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [deliverymanDialogOpen, setDeliverymanDialogOpen] = useState(false);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });

  const startDate = useMemo(() => startOfDay(selectedDate).toISOString(), [selectedDate]);
  const endDate = useMemo(() => endOfDay(selectedDate).toISOString(), [selectedDate]);
  const dateLabel = useMemo(() => formatDateLabel(selectedDate), [selectedDate]);

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

  const { isLoading: isLoadingPlannings } = useQuery({
    queryKey: ["plannings", selectedGroupId, selectedClientId, startDate, endDate],
    queryFn: () =>
      listPlannings({
        startDate,
        endDate,
        clientId: selectedClientId || undefined,
        limit: 1000,
      }),
    enabled: hasActiveFilter && clientIds.length > 0,
  });

  const { data: workShiftSlotsData, isLoading: isLoadingWorkShiftSlots } = useQuery({
    queryKey: ["work-shift-slots", clientIds, startDate],
    queryFn: async () => {
      if (clientIds.length === 0) return { data: [], count: 0 };

      const results = await Promise.all(
        clientIds.map((clientId) =>
          listWorkShiftSlots({
            clientId,
            limit: 100,
          })
        )
      );

      const allSlots = results.flatMap((result) => result.data);

      const dateStr = selectedDate.toISOString().split("T")[0];
      const filteredSlots = allSlots.filter((slot) => slot.shiftDate.startsWith(dateStr));

      return { data: filteredSlots, count: filteredSlots.length };
    },
    enabled: hasActiveFilter && clientIds.length > 0,
  });

  const workShiftSlotsByClient = useMemo(() => {
    const slots = workShiftSlotsData?.data || [];
    const byClient: Record<string, WorkShiftSlot[]> = {};

    for (const slot of slots) {
      if (!byClient[slot.clientId]) {
        byClient[slot.clientId] = [];
      }
      byClient[slot.clientId].push(slot);
    }

    return byClient;
  }, [workShiftSlotsData?.data]);

  const groups = groupsData?.data || [];
  const clients = useMemo(() => {
    if (selectedClientId && selectedClientData) {
      return [selectedClientData];
    }
    return clientsData?.data || [];
  }, [selectedClientId, selectedClientData, clientsData?.data]);

  return (
    <div className="flex flex-1 flex-col">
      <ContentHeader
        breadcrumbItems={[
          { title: "Operacional", href: "/operacional" },
          { title: "Monitoramento", href: "/operacional/monitoramento" },
          { title: "Diário" },
        ]}
      />

      <div className="flex flex-1 flex-col gap-6 p-6">
        <div>
          <h1 className="text-2xl font-bold">Monitoramento Diário</h1>
          <p className="text-muted-foreground mt-2">
            Acompanhe o planejamento diário dos clientes.
          </p>
        </div>

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

          <div className="flex items-center gap-2">
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
                  {selectedDate ? dateLabel : <span>Selecione a data</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    if (!date) return;
                    setSelectedDate(date);
                    setDatePickerOpen(false);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {!hasActiveFilter && (
          <Alert className="w-full">
            <Info className="size-4" />
            <AlertTitle>Nenhum filtro selecionado</AlertTitle>
            <AlertDescription>
              Selecione um grupo ou busque um cliente para visualizar o monitoramento diário.
            </AlertDescription>
          </Alert>
        )}

        {hasActiveFilter &&
          !isLoadingClients &&
          !isLoadingSelectedClient &&
          clients.length === 0 && (
            <Alert className="w-full">
              <Info className="size-4" />
              <AlertTitle>Nenhum cliente encontrado</AlertTitle>
              <AlertDescription>
                {selectedGroupId
                  ? "Não há clientes cadastrados neste grupo. Adicione clientes para começar o monitoramento."
                  : "Cliente não encontrado. Verifique se o cliente existe."}
              </AlertDescription>
            </Alert>
          )}

        {hasActiveFilter && (isLoadingClients || isLoadingSelectedClient || clients.length > 0) && (
          <div className="flex flex-col gap-4" aria-busy={isLoadingPlannings}>
            {isLoadingClients || isLoadingSelectedClient
              ? [...Array(6)].map((_, index) => (
                <Card
                  key={`client-skeleton-${
                    // biome-ignore lint/suspicious/noArrayIndexKey: skeleton cards
                    index
                    }`}
                >
                  <CardHeader className="gap-2">
                    <Skeleton className="h-5 w-4/5" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/5" />
                  </CardHeader>
                </Card>
              ))
              : clients.map((client) => {
                const clientSlots = workShiftSlotsByClient[client.id] || [];

                return (
                  <Card key={client.id}>
                    <CardHeader>
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <Heading variant="h4" className="text-lg">
                            {client.name}
                          </Heading>
                          <Text variant="muted">{formatCompactAddress(client)}</Text>
                          <Text variant="muted">{formatCompactCommercialConditions(client)}</Text>
                        </div>

                        {isLoadingWorkShiftSlots ? (
                          <div className="space-y-2">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-16 w-full" />
                          </div>
                        ) : clientSlots.length > 0 ? (
                          <div className="rounded-md border">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Entregador</TableHead>
                                  <TableHead>Tipo de Contrato</TableHead>
                                  <TableHead>Status</TableHead>
                                  <TableHead>Horário</TableHead>
                                  <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {clientSlots.map((slot) => (
                                  <TableRow key={slot.id}>
                                    <TableCell className="font-medium">
                                      {slot.deliveryman ? (
                                        slot.deliveryman.name
                                      ) : (
                                        <div className="flex items-center gap-2">
                                          <Text variant="muted" className="text-sm">
                                            Slot de trabalho sem entregador selecionado
                                          </Text>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                              setSelectedSlotId(slot.id);
                                              setDeliverymanDialogOpen(true);
                                            }}
                                          >
                                            <UserPlus className="mr-2 size-4" />
                                            Selecionar Entregador
                                          </Button>
                                        </div>
                                      )}
                                    </TableCell>
                                    <TableCell>{slot.contractType}</TableCell>
                                    <TableCell>
                                      <Badge variant="outline">{slot.status}</Badge>
                                    </TableCell>
                                    <TableCell>
                                      {slot.startTime} - {slot.endTime}
                                    </TableCell>
                                    <TableCell className="text-right">
                                      {slot.deliveryman && (
                                        <div className="flex justify-end gap-2">
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="size-8"
                                            title="Ver detalhes"
                                          >
                                            <FileText className="size-4" />
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="size-8"
                                            title="Enviar convite"
                                          >
                                            <Send className="size-4" />
                                          </Button>
                                        </div>
                                      )}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        ) : (
                          <Alert>
                            <Info className="size-4" />
                            <AlertTitle>Nenhum turno agendado</AlertTitle>
                            <AlertDescription>
                              <div className="flex flex-col gap-3">
                                <p>
                                  Não há turnos de trabalho cadastrados para este cliente na data
                                  selecionada.
                                </p>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="w-fit"
                                  onClick={() => {
                                    setSelectedSlotId(null);
                                    setDeliverymanDialogOpen(true);
                                  }}
                                >
                                  <UserPlus className="mr-2 size-4" />
                                  Criar Novo Turno
                                </Button>
                              </div>
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    </CardHeader>
                  </Card>
                );
              })}
          </div>
        )}
      </div>

      <Dialog open={deliverymanDialogOpen} onOpenChange={setDeliverymanDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedSlotId ? "Selecionar Entregador" : "Criar Novo Turno"}
            </DialogTitle>
            <DialogDescription>
              {selectedSlotId
                ? "Selecione um entregador para este turno de trabalho."
                : "Configure um novo turno de trabalho para este cliente."}
            </DialogDescription>
          </DialogHeader>
          {/* Dialog content will be implemented here */}
        </DialogContent>
      </Dialog>
    </div>
  );
}
