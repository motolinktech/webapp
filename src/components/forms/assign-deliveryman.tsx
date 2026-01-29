import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ChevronsUpDown } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { BadgeSelect } from "@/components/composite/badge-select";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import { hourMask } from "@/lib/masks/hour-mask";
import { clearMoneyMask, moneyMask } from "@/lib/masks/money-mask";
import { getApiErrorMessage } from "@/lib/services/api";
import { classHelper } from "@/lib/utils/class-helper";
import { BAGS_STATUS, BAGS_STATUS_OPTIONS } from "@/modules/clients/clients.constants";
import type { Client } from "@/modules/clients/clients.types";
import { getDeliverymanById, listDeliverymen } from "@/modules/deliverymen/deliverymen.service";
import type { Deliveryman } from "@/modules/deliverymen/deliverymen.types";
import { createWorkShiftSlot, updateWorkShiftSlot } from "@/modules/work-shift-slots/work-shift-slots.service";
import type { WorkShiftSlot } from "@/modules/work-shift-slots/work-shift-slots.types";

import { Separator } from "../ui/separator";

// TODO: move this to a shared file
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

// TODO: move this to a shared file
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

// TODO: move this to a shared file
function formatDeliverymanConditions(client: Client): string | null {
  const condition = client.commercialCondition;
  if (!condition) return null;

  const parts: string[] = [];
  const paymentForm = condition.paymentForm || [];
  const dailyPeriods = condition.dailyPeriods || [];
  const guaranteedPeriods = condition.guaranteedPeriods || [];

  // Handle DAILY payment type
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
    if (dailyValues.length > 0) {
      parts.push(`Diaria: ${dailyValues.join(", ")}`);
    }
  }

  // Handle GUARANTEED payment type
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
    if (guaranteedValues.length > 0) {
      parts.push(`Qt. Garantida: ${guaranteedValues.join(", ")}`);
    }
  }

  return parts.length > 0 ? parts.join(" | ") : null;
}

const CONTRACT_TYPE_OPTIONS = [
  { value: "FREELANCER", label: "Freelancer" },
  { value: "INDEPENDENT_COLLABORATOR", label: "Colaborador Independente" },
] as const;

const PERIOD_OPTIONS = [
  { value: "daytime", label: "Diurno" },
  { value: "nighttime", label: "Noturno" },
] as const;

function extractTimeFromIso(isoString: string): string {
  const date = new Date(isoString);
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

const periodEnum = z.enum(["daytime", "nighttime"]);

type WorkShiftPeriod = (typeof PERIOD_OPTIONS)[number]["value"];

const PAYMENT_TYPE_OPTIONS = [
  { value: "DAILY", label: "Diária" },
  { value: "GUARANTEED", label: "Qt. Garantida" },
] as const;

const assignDeliverymanSchema = z
  .object({
    deliverymanId: z.string().min(1, "Selecione um entregador"),
    contractType: z.enum(["FREELANCER", "INDEPENDENT_COLLABORATOR"]),
    paymentType: z.enum(["DAILY", "GUARANTEED"]),
    startAt: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Hora inválida"),
    endAt: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Hora inválida"),
    periods: z.array(periodEnum).min(1, "Selecione pelo menos um período"),
    serviceValueDiurno: z.string().optional(),
    serviceValueNoturno: z.string().optional(),
    deliverymanPaymentMethod: z.enum(["mainPixKey", "secondPixKey", "thridPixKey", "bankAccount"]).optional(),
    deliverymanAmountDay: z.number().optional(),
    deliverymanAmountNight: z.number().optional(),
    // GUARANTEED payment fields
    guaranteedQuantityDiurno: z.coerce.number().optional(),
    guaranteedQuantityNoturno: z.coerce.number().optional(),
    perDeliveryDiurno: z.string().optional(),
    perDeliveryNoturno: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.deliverymanId && !data.deliverymanPaymentMethod) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Selecione um método de pagamento",
        path: ["deliverymanPaymentMethod"],
      });
    }
  });

type AssignDeliverymanFormInput = z.input<typeof assignDeliverymanSchema>;
type AssignDeliverymanFormData = z.output<typeof assignDeliverymanSchema>;

export type { AssignDeliverymanFormData };

interface AssignDeliverymanFormProps {
  client: Client;
  period: WorkShiftPeriod | null;
  selectedDate: string;
  onSubmit: (data: AssignDeliverymanFormData) => void;
  editMode?: boolean;
  workShiftSlot?: WorkShiftSlot;
}

export function AssignDeliverymanForm({
  client,
  period,
  selectedDate,
  onSubmit,
  editMode = false,
  workShiftSlot,
}: AssignDeliverymanFormProps) {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [deliverymanSearch, setDeliverymanSearch] = useState("");
  const [debouncedDeliverymanSearch, setDebouncedDeliverymanSearch] = useState("");
  const [deliverymenResults, setDeliverymenResults] = useState<Deliveryman[]>([]);
  const [selectedDeliveryman, setSelectedDeliveryman] = useState<Deliveryman | null>(null);
  const queryClient = useQueryClient();
  const selectedDateValue = useMemo(() => {
    const [year, month, day] = selectedDate.split("-").map((value) => Number(value));
    return new Date(year, month - 1, day);
  }, [selectedDate]);

  const availablePaymentForms = useMemo(() => {
    return (
      client.commercialCondition?.paymentForm.map((p) =>
        PAYMENT_TYPE_OPTIONS.find((o) => o.value === p),
      ) || PAYMENT_TYPE_OPTIONS
    ).filter(Boolean) as { value: string; label: string }[];
  }, [client.commercialCondition?.paymentForm]);

  const isPaymentTypeDisabled = availablePaymentForms.length === 1;

  const defaultValues = useMemo(() => {
    if (editMode && workShiftSlot) {
      const isDaily = workShiftSlot.paymentForm === "DAILY";
      const isGuaranteed = workShiftSlot.paymentForm === "GUARANTEED";

      return {
        deliverymanId: workShiftSlot.deliverymanId || "",
        contractType: workShiftSlot.contractType as "FREELANCER" | "INDEPENDENT_COLLABORATOR",
        periods: workShiftSlot.period,
        startAt: extractTimeFromIso(workShiftSlot.startTime),
        endAt: extractTimeFromIso(workShiftSlot.endTime),
        paymentType: workShiftSlot.paymentForm as "DAILY" | "GUARANTEED" | undefined,
        deliverymanPaymentMethod: workShiftSlot.deliverymanPaymentType,

        serviceValueDiurno:
          isDaily && workShiftSlot.deliverymanAmountDay
            ? formatMoney(workShiftSlot.deliverymanAmountDay)
            : undefined,
        serviceValueNoturno:
          isDaily && workShiftSlot.deliverymanAmountNight
            ? formatMoney(workShiftSlot.deliverymanAmountNight)
            : undefined,

        guaranteedQuantityDiurno: isGuaranteed ? workShiftSlot.guaranteedQuantityDay : undefined,
        guaranteedQuantityNoturno: isGuaranteed ? workShiftSlot.guaranteedQuantityNight : undefined,
        perDeliveryDiurno:
          isGuaranteed && workShiftSlot.deliverymanPerDeliveryDay
            ? formatMoney(workShiftSlot.deliverymanPerDeliveryDay)
            : undefined,
        perDeliveryNoturno:
          isGuaranteed && workShiftSlot.deliverymanPerDeliveryNight
            ? formatMoney(workShiftSlot.deliverymanPerDeliveryNight)
            : undefined,
      };
    }
    return {
      periods: period ? [period] : [],
      paymentType: isPaymentTypeDisabled
        ? (availablePaymentForms[0].value as "DAILY" | "GUARANTEED")
        : undefined,
    };
  }, [editMode, workShiftSlot, period, isPaymentTypeDisabled, availablePaymentForms]);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    register,
    formState: { errors },
  } = useForm<AssignDeliverymanFormInput, unknown, AssignDeliverymanFormData>({
    resolver: zodResolver(assignDeliverymanSchema),
    defaultValues,
  });

  const selectedDeliverymanId = watch("deliverymanId");
  const selectedPaymentType = watch("paymentType");
  const selectedPeriods = watch("periods");
  const deliverymanPaymentMethod = watch("deliverymanPaymentMethod");

  const normalizedDeliverymanSearch = useMemo(() => {
    return deliverymanSearch.trim().replace(/\s+/g, " ");
  }, [deliverymanSearch]);

  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedDeliverymanSearch(normalizedDeliverymanSearch);
    }, 500);
    return () => clearTimeout(handle);
  }, [normalizedDeliverymanSearch]);

  const deliverymenSearchEnabled = debouncedDeliverymanSearch.length >= 3;

  // TODO: Implementar filtro de entregadores bloqueados
  const { data: deliverymenData, isFetching: isFetchingDeliverymen } = useQuery({
    queryKey: ["deliverymen", "search", debouncedDeliverymanSearch],
    queryFn: () =>
      listDeliverymen({
        limit: 20,
        name: debouncedDeliverymanSearch,
      }),
    enabled: deliverymenSearchEnabled,
  });

  const { data: selectedDeliverymanData, isFetching: isFetchingSelectedDeliveryman } = useQuery({
    queryKey: ["deliverymen", selectedDeliverymanId],
    queryFn: () => getDeliverymanById(selectedDeliverymanId),
    enabled: !!selectedDeliverymanId && selectedDeliveryman?.id !== selectedDeliverymanId,
  });

  useEffect(() => {
    if (!selectedDeliverymanId) {
      setSelectedDeliveryman(null);
      return;
    }

    const match = deliverymenResults.find((deliveryman) => deliveryman.id === selectedDeliverymanId);
    if (match) {
      setSelectedDeliveryman(match);
    }
  }, [selectedDeliverymanId, deliverymenResults]);

  useEffect(() => {
    if (selectedDeliverymanData) {
      setSelectedDeliveryman(selectedDeliverymanData);
    }
  }, [selectedDeliverymanData]);

  useEffect(() => {
    if (deliverymenData) {
      setDeliverymenResults(deliverymenData.data);
    }
  }, [deliverymenData]);

  const sortedDeliverymen = useMemo(() => {
    if (!deliverymenResults.length) return [];

    return [...deliverymenResults].sort((a, b) => {
      const aInRegion = a.regionId === client.regionId;
      const bInRegion = b.regionId === client.regionId;

      if (aInRegion && !bInRegion) return -1;
      if (!aInRegion && bInRegion) return 1;

      return a.name.localeCompare(b.name);
    });
  }, [deliverymenResults, client.regionId]);

  const deliverymanPaymentOptions = useMemo(() => {
    if (!selectedDeliveryman) return [];
    const options = [];
    if (selectedDeliveryman.mainPixKey) {
      options.push({ value: "mainPixKey", label: "Pix Principal" });
    }
    if (selectedDeliveryman.secondPixKey) {
      options.push({ value: "secondPixKey", label: "Pix Secundário" });
    }
    if (selectedDeliveryman.thridPixKey) {
      options.push({ value: "thridPixKey", label: "Pix Terciário" });
    }
    if (selectedDeliveryman.agency && selectedDeliveryman.account) {
      options.push({ value: "bankAccount", label: "Conta Bancária" });
    }
    return options;
  }, [selectedDeliveryman]);

  const selectedPaymentMethodValue = useMemo(() => {
    if (!selectedDeliveryman || !deliverymanPaymentMethod) return null;

    if (deliverymanPaymentMethod === "bankAccount") {
      return `Agência: ${selectedDeliveryman.agency}, Conta: ${selectedDeliveryman.account}`;
    }
    if (
      deliverymanPaymentMethod === "mainPixKey" ||
      deliverymanPaymentMethod === "secondPixKey" ||
      deliverymanPaymentMethod === "thridPixKey"
    ) {
      return selectedDeliveryman[deliverymanPaymentMethod];
    }

    return null;
  }, [deliverymanPaymentMethod, selectedDeliveryman]);

  useEffect(() => {
    if (selectedDeliverymanId && !editMode) {
      setValue("deliverymanPaymentMethod", undefined);
    }
  }, [selectedDeliverymanId, setValue, editMode]);

  const isSearchingDeliverymen =
    deliverymenSearchEnabled && (isFetchingDeliverymen || isFetchingSelectedDeliveryman);

  const isWeekend = useMemo(() => {
    const day = selectedDateValue.getDay();
    return day === 0 || day === 6;
  }, [selectedDateValue]);

  const diurnoServiceValue = useMemo(() => {
    const cc = client.commercialCondition;
    if (!cc || !selectedPaymentType) return { value: undefined, label: "", isMoney: false };

    let value: string | number | undefined | null;
    let label = "";
    let isMoney = true;

    if (selectedPaymentType === "DAILY") {
      label = "Valor da Diária (Diurno)";
      value = isWeekend ? cc.deliverymanDailyDayWknd : cc.deliverymanDailyDay;
    } else if (selectedPaymentType === "GUARANTEED") {
      label = "Qt. Garantida (Diurno)";
      isMoney = false;
      value = isWeekend ? cc.guaranteedDayWeekend : cc.guaranteedDay;
    }

    let displayValue: string | undefined;
    if (label) {
      displayValue = isMoney ? formatMoney(value || "0") : String(value || 0);
    }

    return { value: displayValue, label, isMoney };
  }, [client.commercialCondition, selectedPaymentType, isWeekend]);

  const noturnoServiceValue = useMemo(() => {
    const cc = client.commercialCondition;
    if (!cc || !selectedPaymentType) return { value: undefined, label: "", isMoney: false };

    let value: string | number | undefined | null;
    let label = "";
    let isMoney = true;

    if (selectedPaymentType === "DAILY") {
      label = "Valor da Diária (Noturno)";
      value = isWeekend ? cc.deliverymanDailyNightWknd : cc.deliverymanDailyNight;
    } else if (selectedPaymentType === "GUARANTEED") {
      label = "Qt. Garantida (Noturno)";
      isMoney = false;
      value = isWeekend ? cc.guaranteedNightWeekend : cc.guaranteedNight;
    }

    let displayValue: string | undefined;
    if (label) {
      displayValue = isMoney ? formatMoney(value || "0") : String(value || 0);
    }

    return { value: displayValue, label, isMoney };
  }, [client.commercialCondition, selectedPaymentType, isWeekend]);

  const perDeliveryValue = useMemo(() => {
    const cc = client.commercialCondition;
    if (!cc || selectedPaymentType !== "GUARANTEED") return { value: undefined };

    const value = cc.deliverymanPerDelivery;
    const displayValue = formatMoney(value || "0");

    return { value: displayValue };
  }, [client.commercialCondition, selectedPaymentType]);

  useEffect(() => {
    if (selectedPeriods?.includes("daytime") && diurnoServiceValue.value !== undefined) {
      setValue("serviceValueDiurno", diurnoServiceValue.value);
    }
  }, [diurnoServiceValue.value, selectedPeriods, setValue]);

  useEffect(() => {
    if (selectedPeriods?.includes("nighttime") && noturnoServiceValue.value !== undefined) {
      setValue("serviceValueNoturno", noturnoServiceValue.value);
    }
  }, [noturnoServiceValue.value, selectedPeriods, setValue]);

  // Set guaranteed quantity and per-delivery values when GUARANTEED is selected
  useEffect(() => {
    if (selectedPaymentType === "GUARANTEED") {
      if (selectedPeriods?.includes("daytime") && diurnoServiceValue.value !== undefined) {
        setValue("guaranteedQuantityDiurno", Number(diurnoServiceValue.value) || 0);
      }
      if (selectedPeriods?.includes("nighttime") && noturnoServiceValue.value !== undefined) {
        setValue("guaranteedQuantityNoturno", Number(noturnoServiceValue.value) || 0);
      }
      if (perDeliveryValue.value !== undefined) {
        if (selectedPeriods?.includes("daytime")) {
          setValue("perDeliveryDiurno", perDeliveryValue.value);
        }
        if (selectedPeriods?.includes("nighttime")) {
          setValue("perDeliveryNoturno", perDeliveryValue.value);
        }
      }
    }
  }, [
    selectedPaymentType,
    selectedPeriods,
    diurnoServiceValue.value,
    noturnoServiceValue.value,
    perDeliveryValue.value,
    setValue,
  ]);

  const bagsInfo = formatBagsInfo(client);
  const deliverymanConditions = formatDeliverymanConditions(client);

  const { mutateAsync, isPending } = useMutation({
    mutationFn: async (formData: AssignDeliverymanFormData) => {
      // Convert monetary values from masked strings to numbers (only for selected periods)
      const deliverymanAmountDay =
        formData.paymentType === "DAILY" && formData.periods.includes("daytime") && formData.serviceValueDiurno
          ? Number(clearMoneyMask(formData.serviceValueDiurno))
          : undefined;
      const deliverymanAmountNight =
        formData.paymentType === "DAILY" &&
        formData.periods.includes("nighttime") &&
        formData.serviceValueNoturno
          ? Number(clearMoneyMask(formData.serviceValueNoturno))
          : undefined;

      const guaranteedQuantityDay =
        formData.paymentType === "GUARANTEED" && formData.periods.includes("daytime")
          ? formData.guaranteedQuantityDiurno
          : undefined;
      const guaranteedQuantityNight =
        formData.paymentType === "GUARANTEED" && formData.periods.includes("nighttime")
          ? formData.guaranteedQuantityNoturno
          : undefined;

      const deliverymanPerDeliveryDay =
        formData.paymentType === "GUARANTEED" &&
        formData.periods.includes("daytime") &&
        formData.perDeliveryDiurno
          ? Number(clearMoneyMask(formData.perDeliveryDiurno))
          : undefined;
      const deliverymanPerDeliveryNight =
        formData.paymentType === "GUARANTEED" &&
        formData.periods.includes("nighttime") &&
        formData.perDeliveryNoturno
          ? Number(clearMoneyMask(formData.perDeliveryNoturno))
          : undefined;

      // Compute payment type and value for deliveryman
      const deliverymanPaymentType = formData.deliverymanPaymentMethod;
      let deliverymenPaymentValue: string | undefined;

      if (selectedDeliveryman && formData.deliverymanPaymentMethod) {
        if (formData.deliverymanPaymentMethod === "bankAccount") {
          deliverymenPaymentValue = `Agência: ${selectedDeliveryman.agency}, Conta: ${selectedDeliveryman.account}`;
        } else if (
          formData.deliverymanPaymentMethod === "mainPixKey" ||
          formData.deliverymanPaymentMethod === "secondPixKey" ||
          formData.deliverymanPaymentMethod === "thridPixKey"
        ) {
          deliverymenPaymentValue = selectedDeliveryman[formData.deliverymanPaymentMethod] ?? undefined;
        }
      }

      const [startHour, startMinute] = formData.startAt.split(":").map(Number);
      const startTime = new Date(selectedDateValue);
      startTime.setHours(startHour, startMinute);

      const [endHour, endMinute] = formData.endAt.split(":").map(Number);
      const endTime = new Date(selectedDateValue);
      endTime.setHours(endHour, endMinute);

      if (editMode && workShiftSlot) {
        return updateWorkShiftSlot(workShiftSlot.id, {
          contractType: formData.contractType,
          shiftDate: workShiftSlot.shiftDate,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          period: formData.periods,
          isFreelancer: formData.contractType === "FREELANCER",
          auditStatus: workShiftSlot.auditStatus,
          status: workShiftSlot.status,
          deliverymanAmountDay,
          deliverymanAmountNight,
          deliverymanPaymentType,
          deliverymenPaymentValue,
          paymentForm: formData.paymentType,
          guaranteedQuantityDay,
          guaranteedQuantityNight,
          deliverymanPerDeliveryDay,
          deliverymanPerDeliveryNight,
        });
      }

      return createWorkShiftSlot({
        clientId: client.id,
        deliverymanId: formData.deliverymanId,
        contractType: formData.contractType,
        shiftDate: selectedDateValue.toISOString(),
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        period: formData.periods,
        isFreelancer: formData.contractType === "FREELANCER",
        auditStatus: "INVITED",
        status: "INVITED",
        deliverymanAmountDay,
        deliverymanAmountNight,
        deliverymanPaymentType,
        deliverymenPaymentValue,
        paymentForm: formData.paymentType,
        guaranteedQuantityDay,
        guaranteedQuantityNight,
        deliverymanPerDeliveryDay,
        deliverymanPerDeliveryNight,
      });
    },
    onSuccess: (_, formData) => {
      queryClient.invalidateQueries({ queryKey: ["workShiftSlots"] });
      onSubmit(formData);
    },
    onError: (err) => {
      const errorMessage = getApiErrorMessage(err);
      toast.error(editMode ? "Erro ao atualizar turno" : "Erro ao atribuir entregador", {
        description: errorMessage,
      });
    },
  });

  return (
    <form onSubmit={handleSubmit((data) => mutateAsync(data))}>
      <FieldGroup>
        <div className="space-y-1">
          {client.observations && (
            <Text variant="muted">
              <strong>Observação: </strong>
              {client.observations}
            </Text>
          )}
          {bagsInfo && <Text variant="muted">{bagsInfo}</Text>}
          {deliverymanConditions && <Text variant="muted">{deliverymanConditions}</Text>}
        </div>

        <Field>
          <FieldLabel>Entregador</FieldLabel>
          <Popover open={popoverOpen} onOpenChange={editMode ? undefined : setPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={popoverOpen}
                className="w-full justify-between"
                disabled={editMode}
              >
                {selectedDeliverymanId
                  ? selectedDeliveryman?.name || workShiftSlot?.deliveryman?.name
                  : "Selecione um entregador..."}
                {!editMode && <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />}
              </Button>
            </PopoverTrigger>
            {!editMode && (
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command>
                  <CommandInput
                    placeholder="Buscar entregador..."
                    value={deliverymanSearch}
                    onValueChange={setDeliverymanSearch}
                  />
                  <CommandList>
                    {!deliverymenSearchEnabled && (
                      <div className="px-2 py-2 text-sm text-muted-foreground">
                        Digite ao menos 3 letras para buscar.
                      </div>
                    )}
                    {deliverymenSearchEnabled && !isSearchingDeliverymen && deliverymenResults.length === 0 && (
                      <CommandEmpty>Nenhum entregador encontrado.</CommandEmpty>
                    )}
                    {isSearchingDeliverymen && (
                      <div className="flex items-center gap-2 px-2 py-2 text-sm text-muted-foreground">
                        <Spinner className="size-3" />
                        Buscando entregadores...
                      </div>
                    )}
                    <CommandGroup>
                      {sortedDeliverymen.map((deliveryman) => (
                        <CommandItem
                          key={deliveryman.id}
                          value={deliveryman.name}
                          onSelect={() => {
                            setValue("deliverymanId", deliveryman.id, { shouldValidate: true });
                            setSelectedDeliveryman(deliveryman);
                            setPopoverOpen(false);
                          }}
                        >
                          <Check
                            className={classHelper(
                              "mr-2 size-4",
                              selectedDeliverymanId === deliveryman.id ? "opacity-100" : "opacity-0",
                            )}
                          />
                          {deliveryman.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            )}
          </Popover>
          <FieldError errors={[errors.deliverymanId]} />
        </Field>

        {selectedDeliveryman && (
          <Controller
            control={control}
            name="deliverymanPaymentMethod"
            render={({ field }) => (
              <Field>
                <FieldLabel>Método de Pagamento do Entregador</FieldLabel>
                <BadgeSelect
                  options={deliverymanPaymentOptions}
                  value={field.value ? [field.value] : []}
                  onChange={(values) => field.onChange(values.pop())}
                />
                {selectedPaymentMethodValue && (
                  <Text variant="muted" className="mt-2">
                    {selectedPaymentMethodValue}
                  </Text>
                )}
                <FieldError errors={[errors.deliverymanPaymentMethod]} />
              </Field>
            )}
          />
        )}

        <Controller
          control={control}
          name="periods"
          render={({ field }) => (
            <Field>
              <FieldLabel>Período</FieldLabel>
              <BadgeSelect options={PERIOD_OPTIONS} value={field.value} onChange={field.onChange} />
              <FieldError errors={[errors.periods]} />
            </Field>
          )}
        />

        <Controller
          control={control}
          name="contractType"
          render={({ field }) => (
            <Field>
              <FieldLabel>Tipo de Serviço</FieldLabel>
              <BadgeSelect
                options={CONTRACT_TYPE_OPTIONS}
                value={field.value ? [field.value] : []}
                onChange={(values) => {
                  field.onChange(values.pop());
                }}
              />
              <FieldError errors={[errors.contractType]} />
            </Field>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <Field>
            <FieldLabel htmlFor="startAt">Início</FieldLabel>
            <Input
              id="startAt"
              placeholder="00:00"
              {...register("startAt", {
                onChange: (e) => {
                  e.target.value = hourMask(e.target.value);
                },
              })}
            />
            <FieldError errors={[errors.startAt]} />
          </Field>
          <Field>
            <FieldLabel htmlFor="endAt">Fim</FieldLabel>
            <Input
              id="endAt"
              placeholder="00:00"
              {...register("endAt", {
                onChange: (e) => {
                  e.target.value = hourMask(e.target.value);
                },
              })}
            />
            <FieldError errors={[errors.endAt]} />
          </Field>
        </div>

        <Separator className="my-4" />

        <Controller
          control={control}
          name="paymentType"
          render={({ field }) => (
            <Field>
              <FieldLabel>Tipo de Pagamento</FieldLabel>
              <div
                className={classHelper({
                  "opacity-50 pointer-events-none": isPaymentTypeDisabled,
                })}
              >
                <BadgeSelect
                  options={availablePaymentForms}
                  value={field.value ? [field.value] : []}
                  onChange={(values) => {
                    if (!isPaymentTypeDisabled) {
                      field.onChange(values.pop());
                    }
                  }}
                />
              </div>
              <FieldError errors={[errors.paymentType]} />
            </Field>
          )}
        />

        {selectedPeriods?.includes("daytime") && selectedPaymentType === "DAILY" && (
          <Field>
            <FieldLabel htmlFor="serviceValueDiurno">{diurnoServiceValue.label}</FieldLabel>
            <Input
              id="serviceValueDiurno"
              {...register("serviceValueDiurno", {
                onChange: (e) => {
                  if (diurnoServiceValue.isMoney) {
                    e.target.value = moneyMask(e.target.value);
                  }
                },
              })}
            />
            <FieldError errors={[errors.serviceValueDiurno]} />
          </Field>
        )}

        {selectedPeriods?.includes("daytime") && selectedPaymentType === "GUARANTEED" && (
          <>
            <Field>
              <FieldLabel htmlFor="guaranteedQuantityDiurno">Qt. Garantida (Diurno)</FieldLabel>
              <Input
                id="guaranteedQuantityDiurno"
                type="number"
                {...register("guaranteedQuantityDiurno")}
              />
              <FieldError errors={[errors.guaranteedQuantityDiurno]} />
            </Field>
            <Field>
              <FieldLabel htmlFor="perDeliveryDiurno">Valor por Entrega (Diurno)</FieldLabel>
              <Input
                id="perDeliveryDiurno"
                {...register("perDeliveryDiurno", {
                  onChange: (e) => {
                    e.target.value = moneyMask(e.target.value);
                  },
                })}
              />
              <FieldError errors={[errors.perDeliveryDiurno]} />
            </Field>
          </>
        )}

        {selectedPeriods?.includes("nighttime") && selectedPaymentType === "DAILY" && (
          <Field>
            <FieldLabel htmlFor="serviceValueNoturno">{noturnoServiceValue.label}</FieldLabel>
            <Input
              id="serviceValueNoturno"
              {...register("serviceValueNoturno", {
                onChange: (e) => {
                  if (noturnoServiceValue.isMoney) {
                    e.target.value = moneyMask(e.target.value);
                  }
                },
              })}
            />
            <FieldError errors={[errors.serviceValueNoturno]} />
          </Field>
        )}

        {selectedPeriods?.includes("nighttime") && selectedPaymentType === "GUARANTEED" && (
          <>
            <Field>
              <FieldLabel htmlFor="guaranteedQuantityNoturno">Qt. Garantida (Noturno)</FieldLabel>
              <Input
                id="guaranteedQuantityNoturno"
                type="number"
                {...register("guaranteedQuantityNoturno")}
              />
              <FieldError errors={[errors.guaranteedQuantityNoturno]} />
            </Field>
            <Field>
              <FieldLabel htmlFor="perDeliveryNoturno">Valor por Entrega (Noturno)</FieldLabel>
              <Input
                id="perDeliveryNoturno"
                {...register("perDeliveryNoturno", {
                  onChange: (e) => {
                    e.target.value = moneyMask(e.target.value);
                  },
                })}
              />
              <FieldError errors={[errors.perDeliveryNoturno]} />
            </Field>
          </>
        )}

        <Button type="submit" isLoading={isPending} className="w-full">
          {editMode ? "Salvar Alterações" : "Atribuir Entregador"}
        </Button>
      </FieldGroup>
    </form>
  );
}
