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
import { Text } from "@/components/ui/text";
import { hourMask } from "@/lib/masks/hour-mask";
import { clearMoneyMask, moneyMask } from "@/lib/masks/money-mask";
import { getApiErrorMessage } from "@/lib/services/api";
import { classHelper } from "@/lib/utils/class-helper";
import { BAGS_STATUS, BAGS_STATUS_OPTIONS } from "@/modules/clients/clients.constants";
import type { Client } from "@/modules/clients/clients.types";
import { listDeliverymen } from "@/modules/deliverymen/deliverymen.service";
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
    deliverymanPaymentMethod: z.string().optional(),
    deliverymanAmountDay: z.number().optional(),
    deliverymanAmountNight: z.number().optional(),
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

type AssignDeliverymanFormData = z.infer<typeof assignDeliverymanSchema>;

export type { AssignDeliverymanFormData };

interface AssignDeliverymanFormProps {
  client: Client;
  period: WorkShiftPeriod | null;
  selectedDate: Date;
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
  const queryClient = useQueryClient();

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
      return {
        deliverymanId: workShiftSlot.deliverymanId || "",
        contractType: workShiftSlot.contractType as "FREELANCER" | "INDEPENDENT_COLLABORATOR",
        periods: workShiftSlot.period,
        startAt: extractTimeFromIso(workShiftSlot.startTime),
        endAt: extractTimeFromIso(workShiftSlot.endTime),
        paymentType: isPaymentTypeDisabled
          ? (availablePaymentForms[0].value as "DAILY" | "GUARANTEED")
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
  } = useForm<AssignDeliverymanFormData>({
    resolver: zodResolver(assignDeliverymanSchema),
    defaultValues,
  });

  const selectedDeliverymanId = watch("deliverymanId");
  const selectedPaymentType = watch("paymentType");
  const selectedPeriods = watch("periods");
  const deliverymanPaymentMethod = watch("deliverymanPaymentMethod");

  // TODO: Implementar filtro de entregadores bloqueados
  const { data: deliverymenData, isLoading: isLoadingDeliverymen } = useQuery({
    queryKey: ["deliverymen"],
    queryFn: () => listDeliverymen({ limit: 1000 }), // TODO: better pagination/search
  });

  const sortedDeliverymen = useMemo(() => {
    if (!deliverymenData?.data) return [];

    return [...deliverymenData.data].sort((a, b) => {
      const aInRegion = a.regionId === client.regionId;
      const bInRegion = b.regionId === client.regionId;

      if (aInRegion && !bInRegion) return -1;
      if (!aInRegion && bInRegion) return 1;

      return a.name.localeCompare(b.name);
    });
  }, [deliverymenData?.data, client.regionId]);

  const selectedDeliveryman = useMemo(() => {
    if (!selectedDeliverymanId) return null;
    return sortedDeliverymen.find((d) => d.id === selectedDeliverymanId);
  }, [selectedDeliverymanId, sortedDeliverymen]);

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
    if (selectedDeliverymanId) {
      setValue("deliverymanPaymentMethod", undefined);
    }
  }, [selectedDeliverymanId, setValue]);

  const isWeekend = useMemo(() => {
    const day = selectedDate.getDay();
    return day === 0 || day === 6;
  }, [selectedDate]);

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

  useEffect(() => {
    if (diurnoServiceValue.value !== undefined) {
      setValue("serviceValueDiurno", diurnoServiceValue.value);
    }
  }, [diurnoServiceValue.value, setValue]);

  useEffect(() => {
    if (noturnoServiceValue.value !== undefined) {
      setValue("serviceValueNoturno", noturnoServiceValue.value);
    }
  }, [noturnoServiceValue.value, setValue]);

  const bagsInfo = formatBagsInfo(client);
  const deliverymanConditions = formatDeliverymanConditions(client);

  const { mutateAsync, isPending } = useMutation({
    mutationFn: async (formData: AssignDeliverymanFormData) => {
      // Convert monetary values from masked strings to numbers
      const deliverymanAmountDay = formData.serviceValueDiurno
        ? diurnoServiceValue.isMoney
          ? Number(clearMoneyMask(formData.serviceValueDiurno))
          : Number(formData.serviceValueDiurno)
        : undefined;
      const deliverymanAmountNight = formData.serviceValueNoturno
        ? noturnoServiceValue.isMoney
          ? Number(clearMoneyMask(formData.serviceValueNoturno))
          : Number(formData.serviceValueNoturno)
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
      const startTime = new Date(selectedDate);
      startTime.setHours(startHour, startMinute);

      const [endHour, endMinute] = formData.endAt.split(":").map(Number);
      const endTime = new Date(selectedDate);
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
        });
      }

      return createWorkShiftSlot({
        clientId: client.id,
        deliverymanId: formData.deliverymanId,
        contractType: formData.contractType,
        shiftDate: selectedDate.toISOString(),
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
                disabled={isLoadingDeliverymen || editMode}
              >
                {selectedDeliverymanId
                  ? sortedDeliverymen.find((d) => d.id === selectedDeliverymanId)?.name ||
                  workShiftSlot?.deliveryman?.name
                  : "Selecione um entregador..."}
                {!editMode && <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />}
              </Button>
            </PopoverTrigger>
            {!editMode && (
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Buscar entregador..." />
                  <CommandList>
                    <CommandEmpty>Nenhum entregador encontrado.</CommandEmpty>
                    <CommandGroup>
                      {sortedDeliverymen.map((deliveryman) => (
                        <CommandItem
                          key={deliveryman.id}
                          value={deliveryman.name}
                          onSelect={() => {
                            setValue("deliverymanId", deliveryman.id, { shouldValidate: true });
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

        {selectedPeriods?.includes("daytime") && selectedPaymentType && (
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

        {selectedPeriods?.includes("nighttime") && selectedPaymentType && (
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

        <Button type="submit" isLoading={isPending} className="w-full">
          {editMode ? "Salvar Alterações" : "Atribuir Entregador"}
        </Button>
      </FieldGroup>
    </form>
  );
}
