import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Check, ChevronLeft, ChevronRight, ChevronsUpDown, Info, Loader2, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ContentHeader } from "@/components/composite/content-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Text } from "@/components/ui/text";
import { classHelper } from "@/lib/utils/class-helper";
import { getStoreBranch } from "@/modules/branches/branches.service";
import { getClientById, listClients } from "@/modules/clients/clients.service";
import type { Client } from "@/modules/clients/clients.types";
import { listGroups } from "@/modules/groups/groups.service";
import { createPlanning, listPlannings, updatePlanning } from "@/modules/planning/planning.service";
import type { Planning, PlanningPeriod } from "@/modules/planning/planning.types";

export const Route = createFileRoute("/_auth/operacional/planejamento/")({
  component: Planejamento,
});

const WEEKDAY_LABELS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sab", "Dom"];

function getWeekDates(weekOffset = 0): Date[] {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset + weekOffset * 7);
  monday.setHours(0, 0, 0, 0);

  const weekDates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    weekDates.push(date);
  }

  return weekDates;
}

function isPastDay(date: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

function toDateKey(date: Date): string {
  return date.toISOString().split("T")[0];
}

function getCellKey(clientId: string, date: Date, period: PlanningPeriod): string {
  return `${clientId}-${toDateKey(date)}-${period}`;
}

function formatCompactAddress(client: Client): string {
  const streetLine = [client.street, client.number].filter(Boolean).join(", ");
  const complement = client.complement ? `- ${client.complement}` : "";
  const addressLine = [streetLine, complement].filter(Boolean).join(" ");
  const cityUf = [client.city, client.uf].filter(Boolean).join("/");
  const parts = [addressLine, client.neighborhood, cityUf].filter(Boolean);

  return parts.join(" - ") || "Endereço não informado.";
}

function formatMealInfo(client: Client): string {
  return client.provideMeal ? "Fornece Refeição" : "Não fornece refeição";
}

const PERIODS: PlanningPeriod[] = ["daytime", "nighttime"];
const PERIOD_LABELS: Record<PlanningPeriod, string> = {
  daytime: "Diurno",
  nighttime: "Noturno",
};

function Planejamento() {
  const queryClient = useQueryClient();
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [clientSearchOpen, setClientSearchOpen] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);
  const [inputValues, setInputValues] = useState<Map<string, string>>(new Map());
  const [savingCells, setSavingCells] = useState<Set<string>>(new Set());
  const [savedCells, setSavedCells] = useState<Set<string>>(new Set());

  const weekDates = useMemo(() => getWeekDates(weekOffset), [weekOffset]);

  const goToPreviousWeek = () => {
    setWeekOffset((prev) => prev - 1);
    setInputValues(new Map());
  };

  const goToNextWeek = () => {
    setWeekOffset((prev) => prev + 1);
    setInputValues(new Map());
  };

  const weekRangeLabel = useMemo(() => {
    const start = formatDate(weekDates[0]);
    const end = formatDate(weekDates[6]);
    return `${start} - ${end}`;
  }, [weekDates]);
  const startDate = weekDates[0]?.toISOString();
  const endDate = weekDates[6]?.toISOString();

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
    return clientsData?.data?.map((c) => c.id) || [];
  }, [selectedClientId, clientsData?.data]);

  const hasActiveFilter = !!selectedGroupId || !!selectedClientId;

  const { data: planningsData } = useQuery({
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

  const groups = groupsData?.data || [];
  const clients = useMemo(() => {
    if (selectedClientId && selectedClientData) {
      return [selectedClientData];
    }
    return clientsData?.data || [];
  }, [selectedClientId, selectedClientData, clientsData?.data]);

  const planningMap = useMemo(() => {
    const map = new Map<string, Planning>();
    const plannings = planningsData?.data || [];
    for (const planning of plannings) {
      const dateKey = planning.plannedDate.split("T")[0];
      const key = `${planning.clientId}-${dateKey}-${planning.period}`;
      map.set(key, planning);
    }
    return map;
  }, [planningsData?.data]);

  useEffect(() => {
    if (planningMap.size === 0) return;
    setInputValues((prev) => {
      const newMap = new Map(prev);
      for (const [key, planning] of planningMap) {
        if (!newMap.has(key)) {
          newMap.set(key, String(planning.plannedCount));
        }
      }
      return newMap;
    });
  }, [planningMap]);

  const saveMutation = useMutation({
    mutationFn: async ({
      clientId,
      date,
      value,
      period,
    }: {
      clientId: string;
      date: Date;
      value: number;
      period: PlanningPeriod;
    }) => {
      const cellKey = getCellKey(clientId, date, period);
      const existing = planningMap.get(cellKey);
      const branchId = getStoreBranch()?.id;

      if (!branchId) throw new Error("Branch not selected");

      if (existing) {
        return updatePlanning({
          id: existing.id,
          plannedCount: value,
        });
      }
      return createPlanning({
        clientId,
        branchId,
        plannedDate: date.toISOString(),
        plannedCount: value,
        period,
      });
    },
    onSuccess: (_, variables) => {
      const cellKey = getCellKey(variables.clientId, variables.date, variables.period);
      setSavingCells((prev) => {
        const newSet = new Set(prev);
        newSet.delete(cellKey);
        return newSet;
      });
      setSavedCells((prev) => new Set(prev).add(cellKey));
      setTimeout(() => {
        setSavedCells((prev) => {
          const newSet = new Set(prev);
          newSet.delete(cellKey);
          return newSet;
        });
      }, 2000);
      queryClient.invalidateQueries({
        queryKey: ["plannings", selectedGroupId, selectedClientId, startDate, endDate],
      });
    },
    onError: (_, variables) => {
      const cellKey = getCellKey(variables.clientId, variables.date, variables.period);
      setSavingCells((prev) => {
        const newSet = new Set(prev);
        newSet.delete(cellKey);
        return newSet;
      });
    },
  });

  const handleInputChange = useCallback(
    (clientId: string, date: Date, period: PlanningPeriod, value: string) => {
      const cellKey = getCellKey(clientId, date, period);
      setInputValues((prev) => new Map(prev).set(cellKey, value));
    },
    [],
  );

  const handleBlur = useCallback(
    (clientId: string, date: Date, period: PlanningPeriod) => {
      const cellKey = getCellKey(clientId, date, period);
      const currentValue = inputValues.get(cellKey) ?? "";
      const existing = planningMap.get(cellKey);
      const originalValue = existing ? String(existing.plannedCount) : "";

      if (currentValue === "" && !existing) return;

      const numValue = Math.max(0, Number.parseInt(currentValue, 10) || 0);

      if (String(numValue) === originalValue) return;

      setSavingCells((prev) => new Set(prev).add(cellKey));
      saveMutation.mutate({ clientId, date, value: numValue, period });
    },
    [inputValues, planningMap, saveMutation],
  );

  const getInputValue = useCallback(
    (clientId: string, date: Date, period: PlanningPeriod): string => {
      const cellKey = getCellKey(clientId, date, period);
      if (inputValues.has(cellKey)) {
        return inputValues.get(cellKey) ?? "";
      }
      const planning = planningMap.get(cellKey);
      return planning ? String(planning.plannedCount) : "";
    },
    [inputValues, planningMap],
  );

  return (
    <div className="flex flex-1 flex-col">
      <ContentHeader
        breadcrumbItems={[
          { title: "Operacional", href: "/operacional" },
          { title: "Planejamento" },
        ]}
      />

      <div className="flex flex-1 flex-col gap-6 p-6">
        <div>
          <h1 className="text-2xl font-bold">Planejamento</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie o planejamento semanal dos clientes.
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
            <Button variant="outline" size="icon" onClick={goToPreviousWeek}>
              <ChevronLeft className="size-4" />
            </Button>
            <span className="min-w-[120px] text-center text-sm font-medium">{weekRangeLabel}</span>
            <Button variant="outline" size="icon" onClick={goToNextWeek}>
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>

        {!hasActiveFilter && (
          <Alert className="w-full">
            <Info className="size-4" />
            <AlertTitle>Nenhum filtro selecionado</AlertTitle>
            <AlertDescription>
              Selecione um grupo ou busque um cliente para visualizar e gerenciar o planejamento
              semanal.
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
                  ? "Não há clientes cadastrados neste grupo. Adicione clientes para começar o planejamento."
                  : "Cliente não encontrado. Verifique se o cliente existe."}
              </AlertDescription>
            </Alert>
          )}

        {hasActiveFilter && (isLoadingClients || isLoadingSelectedClient || clients.length > 0) && (
          <div className="flex flex-col gap-4">
            {isLoadingClients || isLoadingSelectedClient
              ? [...Array(3)].map((_, index) => (
                  <Card
                    key={`skeleton-${
                      // biome-ignore lint/suspicious/noArrayIndexKey: skeleton rows
                      index
                    }`}
                    className="p-4"
                  >
                    <div className="flex gap-6">
                      <div className="w-1/4 shrink-0 space-y-2">
                        <Skeleton className="h-5 w-4/5" />
                        <Skeleton className="h-4 w-full" />
                      </div>
                      <div className="w-3/4 space-y-2">
                        <div className="flex gap-2">
                          <div className="w-16 shrink-0" />
                          {weekDates.map((date) => (
                            <Skeleton key={date.toISOString()} className="h-6 flex-1" />
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <div className="w-16 shrink-0" />
                          {weekDates.map((date) => (
                            <Skeleton key={`d-${date.toISOString()}`} className="h-8 flex-1" />
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <div className="w-16 shrink-0" />
                          {weekDates.map((date) => (
                            <Skeleton key={`n-${date.toISOString()}`} className="h-8 flex-1" />
                          ))}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))
              : clients.map((client) => (
                  <Card key={client.id} className="p-4">
                    <div className="flex gap-6">
                      <div className="w-1/4 shrink-0">
                        <Heading variant="h4" className="text-base">
                          {client.name}
                        </Heading>
                        <Text variant="muted" className="text-xs mt-1">
                          {formatCompactAddress(client)}
                        </Text>
                        <Text variant="muted" className="text-xs mt-1">
                          {formatMealInfo(client)}
                        </Text>
                      </div>

                      <div className="w-3/4">
                        <div className="flex gap-2 mb-2">
                          <div className="w-16 shrink-0" />
                          {weekDates.map((date, index) => (
                            <div
                              key={date.toISOString()}
                              className={classHelper(
                                "flex-1 text-center",
                                isToday(date) && "bg-primary/10 rounded",
                                isPastDay(date) && "opacity-50",
                              )}
                            >
                              <span className="text-xs font-medium">{WEEKDAY_LABELS[index]}</span>
                              <br />
                              <span
                                className={classHelper(
                                  "text-xs",
                                  isToday(date) ? "font-bold text-primary" : "text-muted-foreground",
                                )}
                              >
                                {formatDate(date)}
                              </span>
                            </div>
                          ))}
                        </div>

                        {PERIODS.map((period) => (
                          <div key={period} className="flex gap-2 items-center mb-1">
                            <span className="w-16 shrink-0 text-xs text-muted-foreground">
                              {PERIOD_LABELS[period]}
                            </span>
                            {weekDates.map((date) => {
                              const cellKey = getCellKey(client.id, date, period);
                              const isSaving = savingCells.has(cellKey);
                              const isSaved = savedCells.has(cellKey);
                              const isPast = isPastDay(date);

                              return (
                                <div
                                  key={date.toISOString()}
                                  className={classHelper(
                                    "relative flex-1",
                                    isToday(date) && "bg-primary/5 rounded",
                                    isPast && "opacity-50",
                                  )}
                                >
                                  <Input
                                    type="number"
                                    min={0}
                                    className="h-8 w-full text-center text-sm"
                                    placeholder="0"
                                    value={getInputValue(client.id, date, period)}
                                    onChange={(e) =>
                                      handleInputChange(client.id, date, period, e.target.value)
                                    }
                                    onBlur={() => handleBlur(client.id, date, period)}
                                    disabled={isSaving || isPast}
                                  />
                                  {isSaving && (
                                    <Loader2 className="absolute right-1 top-1/2 -translate-y-1/2 size-3 animate-spin text-muted-foreground" />
                                  )}
                                  {isSaved && !isSaving && (
                                    <Check className="absolute right-1 top-1/2 -translate-y-1/2 size-3 text-green-500" />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    </div>
                  </Card>
                ))}
          </div>
        )}
      </div>
    </div>
  );
}
