import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { AlertCircle, X } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { cepMask } from "@/lib/masks/cep-mask";
import { clearMask } from "@/lib/masks/clear-mask";
import { cnpjMask } from "@/lib/masks/cnpj-mask";
import { clearMoneyMask, moneyMask } from "@/lib/masks/money-mask";
import { phoneMask } from "@/lib/masks/phone-mask";
import { searchCnpj } from "@/lib/services/brazil-api";
import { BRAZIL_STATES } from "@/lib/utils/states";
import { createClient, updateClient } from "@/modules/clients/clients.service";
import type { Client } from "@/modules/clients/clients.types";
import { listGroups } from "@/modules/groups/groups.service";
import { listRegions } from "@/modules/regions/regions.service";
import { Label } from "../ui/label";

const clientFormSchema = z.object({
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  cnpj: z.string().length(18, "CNPJ inválido, deve ter 14 dígitos (XX.XXX.XXX/XXXX-XX)"),
  contactName: z.string().min(3, "Nome do contato deve ter pelo menos 3 caracteres"),
  contactPhone: z.string().min(14, "Telefone inválido (ex: (DD) XXXXX-XXXX)"),
  cep: z.string().length(9, "CEP inválido, deve ter 8 dígitos (XXXXX-XXX)"),
  street: z.string(),
  number: z.string(),
  complement: z.string().optional(),
  neighborhood: z.string(),
  city: z.string(),
  uf: z.string(),
  observations: z.string().optional(),
  regionId: z.string().optional(),
  groupId: z.string().optional(),
  paymentForm: z.array(z.string()).optional(),
  dailyPeriods: z.array(z.string()).optional(),
  guaranteedPeriods: z.array(z.string()).optional(),
  deliveryAreaKm: z.number().min(0).optional(),
  isMotolinkCovered: z.boolean().optional(),
  clientDailyDay: z.string().optional(),
  clientDailyNight: z.string().optional(),
  clientDailyDayWknd: z.string().optional(),
  clientDailyNightWknd: z.string().optional(),
  deliverymanDailyDay: z.string().optional(),
  deliverymanDailyNight: z.string().optional(),
  deliverymanDailyDayWknd: z.string().optional(),
  deliverymanDailyNightWknd: z.string().optional(),
  guaranteedDay: z.number().min(1, "Valor mínimo é 1").optional(),
  guaranteedNight: z.number().min(1, "Valor mínimo é 1").optional(),
  guaranteedDayWeekend: z.number().min(1, "Valor mínimo é 1").optional(),
  guaranteedNightWeekend: z.number().min(1, "Valor mínimo é 1").optional(),
  clientPerDelivery: z.string().optional(),
  clientAdditionalKm: z.string().optional(),
  deliverymanPerDelivery: z.string().optional(),
  deliverymanAdditionalKm: z.string().optional(),
});

import { Textarea } from "../ui/textarea";
import { PAYMENT_TYPES, PERIOD_TYPES } from "./clients.constants";

interface CnpjData {
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  municipio?: string;
  uf?: string;
}

type ClientFormData = z.infer<typeof clientFormSchema>;

interface ClientsFormProps {
  client?: Client | null;
}

export function ClientsForm({ client }: ClientsFormProps) {
  const [isCnpjLoading, setIsCnpjLoading] = useState(false);
  const [cnpjError, setCnpjError] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [cnpjData, setCnpjData] = useState<CnpjData | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    watch,
    setValue,
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientFormSchema),
    shouldUnregister: true,
    defaultValues: {
      name: client?.name || "",
      cnpj: client?.cnpj ? cnpjMask(client.cnpj) : "",
      contactName: client?.contactName || "",
      contactPhone: client?.contactPhone ? phoneMask(client.contactPhone) : "",
      cep: client?.cep ? cepMask(client.cep) : "",
      street: client?.street || "",
      number: client?.number || "",
      complement: client?.complement || "",
      neighborhood: client?.neighborhood || "",
      city: client?.city || "",
      uf: client?.uf || "",
      observations: client?.observations || "",
      regionId: client?.regionId || undefined,
      groupId: client?.groupId || undefined,
      paymentForm: client?.commercialCondition?.paymentForm || [],
      dailyPeriods: [],
      guaranteedPeriods: [],
      deliveryAreaKm: client?.commercialCondition?.deliveryAreaKm || undefined,
      isMotolinkCovered: client?.commercialCondition?.isMotolinkCovered || false,
      // Daily fields
      clientDailyDay: client?.commercialCondition?.clientDailyDay ? moneyMask(String(client.commercialCondition.clientDailyDay * 100)) : "",
      clientDailyNight: client?.commercialCondition?.clientDailyNight ? moneyMask(String(client.commercialCondition.clientDailyNight * 100)) : "",
      clientDailyDayWknd: client?.commercialCondition?.clientDailyDayWknd ? moneyMask(String(client.commercialCondition.clientDailyDayWknd * 100)) : "",
      clientDailyNightWknd: client?.commercialCondition?.clientDailyNightWknd ? moneyMask(String(client.commercialCondition.clientDailyNightWknd * 100)) : "",
      deliverymanDailyDay: client?.commercialCondition?.deliverymanDailyDay ? moneyMask(String(client.commercialCondition.deliverymanDailyDay * 100)) : "",
      deliverymanDailyNight: client?.commercialCondition?.deliverymanDailyNight ? moneyMask(String(client.commercialCondition.deliverymanDailyNight * 100)) : "",
      deliverymanDailyDayWknd: client?.commercialCondition?.deliverymanDailyDayWknd ? moneyMask(String(client.commercialCondition.deliverymanDailyDayWknd * 100)) : "",
      deliverymanDailyNightWknd: client?.commercialCondition?.deliverymanDailyNightWknd ? moneyMask(String(client.commercialCondition.deliverymanDailyNightWknd * 100)) : "",
      // Guaranteed fields
      guaranteedDay: client?.commercialCondition?.guaranteedDay || undefined,
      guaranteedNight: client?.commercialCondition?.guaranteedNight || undefined,
      guaranteedDayWeekend: client?.commercialCondition?.guaranteedDayWeekend || undefined,
      guaranteedNightWeekend: client?.commercialCondition?.guaranteedNightWeekend || undefined,
      // Delivery area fields
      clientPerDelivery: client?.commercialCondition?.clientPerDelivery ? moneyMask(String(Number(client.commercialCondition.clientPerDelivery) * 100)) : "",
      clientAdditionalKm: client?.commercialCondition?.clientAdditionalKm ? moneyMask(String(client.commercialCondition.clientAdditionalKm * 100)) : "",
      deliverymanPerDelivery: client?.commercialCondition?.deliverymanPerDelivery ? moneyMask(String(Number(client.commercialCondition.deliverymanPerDelivery) * 100)) : "",
      deliverymanAdditionalKm: client?.commercialCondition?.deliverymanAdditionalKm ? moneyMask(String(client.commercialCondition.deliverymanAdditionalKm * 100)) : "",
    },
  });

  console.log(errors)

  const selectedPaymentForm = watch("paymentForm") || [];
  const selectedDailyPeriods = watch("dailyPeriods") || [];
  const selectedGuaranteedPeriods = watch("guaranteedPeriods") || [];
  const deliveryAreaKmValue = watch("deliveryAreaKm");

  const togglePaymentType = (paymentType: string) => {
    const current = selectedPaymentForm;
    if (current.includes(paymentType)) {
      setValue(
        "paymentForm",
        current.filter((p) => p !== paymentType),
      );
      if (paymentType === "GUARANTEED") {
        setValue("isMotolinkCovered", false);
        setValue("guaranteedPeriods", []);
      }
      if (paymentType === "DAILY") {
        setValue("dailyPeriods", []);
      }
    } else {
      setValue("paymentForm", [...current, paymentType]);
    }
  };

  const togglePeriod = (periodType: string, paymentType: "DAILY" | "GUARANTEED") => {
    const fieldName = paymentType === "DAILY" ? "dailyPeriods" : "guaranteedPeriods";
    const current = paymentType === "DAILY" ? selectedDailyPeriods : selectedGuaranteedPeriods;

    if (current.includes(periodType)) {
      setValue(fieldName, current.filter((p) => p !== periodType));
    } else {
      setValue(fieldName, [...current, periodType]);
    }
  };

  const handleCnpjLookup = async () => {
    const cnpjValue = watch("cnpj");
    if (!cnpjValue || cnpjValue.length < 18) return;

    const unmaskedCnpj = clearMask(cnpjValue);
    if (unmaskedCnpj.length !== 14) return;

    setIsCnpjLoading(true);
    setCnpjError(null);

    try {
      const data = await searchCnpj(unmaskedCnpj);

      // Check if there's existing address data
      const hasAddressData = watch("street") || watch("neighborhood") || watch("city");

      if (hasAddressData) {
        // Store data and show confirmation dialog
        setCnpjData(data);
        setShowConfirmDialog(true);
      } else {
        // Directly update fields
        updateAddressFields(data);
      }
    } catch (error) {
      setCnpjError(
        error instanceof Error
          ? "Erro ao buscar CNPJ. Verifique se o número está correto."
          : "Erro ao buscar CNPJ. Tente novamente."
      );
    } finally {
      setIsCnpjLoading(false);
    }
  };

  const updateAddressFields = (data: CnpjData) => {
    if (data.cep) setValue("cep", cepMask(data.cep));
    if (data.logradouro) setValue("street", data.logradouro);
    if (data.numero) setValue("number", data.numero);
    if (data.complemento) setValue("complement", data.complemento);
    if (data.bairro) setValue("neighborhood", data.bairro);
    if (data.municipio) setValue("city", data.municipio);
    if (data.uf) setValue("uf", data.uf);
  };

  const handleConfirmOverwrite = () => {
    if (cnpjData) {
      updateAddressFields(cnpjData);
    }
    setShowConfirmDialog(false);
    setCnpjData(null);
  };

  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: regionsData } = useQuery({
    queryKey: ["regions"],
    queryFn: () => listRegions({ limit: 1000 }),
  });

  const { data: groupsData } = useQuery({
    queryKey: ["groups"],
    queryFn: () => listGroups({ limit: 1000 }),
  });

  const clearMasks = (data: ClientFormData) => {
    return {
      ...data,
      cnpj: data.cnpj.replace(/\D/g, ""),
      contactPhone: data.contactPhone.replace(/\D/g, ""),
      cep: data.cep.replace(/\D/g, ""),
    };
  };

  const { mutateAsync, isError, isPending } = useMutation({
    mutationFn: async (data: ClientFormData) => {
      const unmaskedData = clearMasks(data);
      const {
        paymentForm,
        dailyPeriods,
        guaranteedPeriods,
        deliveryAreaKm,
        isMotolinkCovered,
        // Daily fields (need to convert from money mask to number)
        clientDailyDay,
        clientDailyNight,
        clientDailyDayWknd,
        clientDailyNightWknd,
        deliverymanDailyDay,
        deliverymanDailyNight,
        deliverymanDailyDayWknd,
        deliverymanDailyNightWknd,
        // Guaranteed fields (already numbers)
        guaranteedDay,
        guaranteedNight,
        guaranteedDayWeekend,
        guaranteedNightWeekend,
        // Delivery area fields
        clientPerDelivery,
        clientAdditionalKm,
        deliverymanPerDelivery,
        deliverymanAdditionalKm,
        ...clientData
      } = unmaskedData;

      const payload = {
        client: {
          ...clientData,
          complement: clientData.complement || "",
        },
        commercialCondition: {
          paymentForm,
          dailyPeriods,
          guaranteedPeriods,
          deliveryAreaKm,
          isMotolinkCovered,
          // Delivery area fields - convert money mask to number
          clientPerDelivery: clientPerDelivery ? clearMoneyMask(clientPerDelivery) : undefined,
          clientAdditionalKm: clientAdditionalKm ? clearMoneyMask(clientAdditionalKm) : undefined,
          deliverymanPerDelivery: deliverymanPerDelivery ? clearMoneyMask(deliverymanPerDelivery) : undefined,
          deliverymanAdditionalKm: deliverymanAdditionalKm ? clearMoneyMask(deliverymanAdditionalKm) : undefined,
          // Daily fields - convert money mask to number
          clientDailyDay: clientDailyDay ? clearMoneyMask(clientDailyDay) : undefined,
          clientDailyNight: clientDailyNight ? clearMoneyMask(clientDailyNight) : undefined,
          clientDailyDayWknd: clientDailyDayWknd ? clearMoneyMask(clientDailyDayWknd) : undefined,
          clientDailyNightWknd: clientDailyNightWknd ? clearMoneyMask(clientDailyNightWknd) : undefined,
          deliverymanDailyDay: deliverymanDailyDay ? clearMoneyMask(deliverymanDailyDay) : undefined,
          deliverymanDailyNight: deliverymanDailyNight ? clearMoneyMask(deliverymanDailyNight) : undefined,
          deliverymanDailyDayWknd: deliverymanDailyDayWknd ? clearMoneyMask(deliverymanDailyDayWknd) : undefined,
          deliverymanDailyNightWknd: deliverymanDailyNightWknd ? clearMoneyMask(deliverymanDailyNightWknd) : undefined,
          // Guaranteed fields
          guaranteedDay,
          guaranteedNight,
          guaranteedDayWeekend,
          guaranteedNightWeekend,
        },
      };

      if (client?.id) {
        return updateClient({ clientId: client.id, ...payload });
      }

      return createClient(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      navigate({ to: "/gestao/clientes" });
    },
  });

  return (
    <form
      onSubmit={handleSubmit((data) => mutateAsync(data))}
      className="p-4 md:p-6 overflow-y-auto"
    >
      <FieldGroup className="flex flex-col gap-6">
        {isError && (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertDescription>
              Erro ao {client?.id ? "atualizar" : "criar"} cliente
            </AlertDescription>
          </Alert>
        )}

        {cnpjError && (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertDescription className="flex items-center justify-between gap-2">
              <span>{cnpjError}</span>
              <button
                type="button"
                onClick={() => setCnpjError(null)}
                className="shrink-0 rounded-sm opacity-70 transition-opacity hover:opacity-100"
              >
                <X className="size-4" />
                <span className="sr-only">Fechar</span>
              </button>
            </AlertDescription>
          </Alert>
        )}

        <FieldSet>
          <FieldLegend>Informações Gerais</FieldLegend>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field>
              <FieldLabel htmlFor="name">Nome</FieldLabel>
              <Input id="name" {...register("name")} />
              <FieldError errors={[errors.name]} />
            </Field>

            <Field>
              <FieldLabel htmlFor="cnpj">CNPJ</FieldLabel>
              <div className="relative">
                <Input
                  id="cnpj"
                  disabled={isCnpjLoading}
                  {...register("cnpj", {
                    onChange: (e) => {
                      e.target.value = cnpjMask(e.target.value);
                    },
                    onBlur: handleCnpjLookup,
                  })}
                />
                {isCnpjLoading && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Spinner className="size-4" />
                  </div>
                )}
              </div>
              <FieldError errors={[errors.cnpj]} />
            </Field>

            <Field>
              <FieldLabel htmlFor="contactName">Nome do Contato</FieldLabel>
              <Input id="contactName" {...register("contactName")} />
              <FieldError errors={[errors.contactName]} />
            </Field>

            <Field>
              <FieldLabel htmlFor="contactPhone">Telefone de Contato</FieldLabel>
              <Input
                id="contactPhone"
                {...register("contactPhone", {
                  onChange: (e) => {
                    e.target.value = phoneMask(e.target.value);
                  },
                })}
              />
              <FieldError errors={[errors.contactPhone]} />
            </Field>
          </div>
        </FieldSet>

        <Separator />

        <FieldSet>
          <FieldLegend>Endereço</FieldLegend>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <Field className="md:col-span-2">
              <FieldLabel htmlFor="cep">CEP</FieldLabel>
              <Input
                id="cep"
                {...register("cep", {
                  onChange: (e) => {
                    e.target.value = cepMask(e.target.value);
                  },
                })}
              />
              <FieldError errors={[errors.cep]} />
            </Field>

            <Field className="md:col-span-4">
              <FieldLabel htmlFor="street">Rua</FieldLabel>
              <Input id="street" {...register("street")} />
              <FieldError errors={[errors.street]} />
            </Field>

            <Field className="md:col-span-2">
              <FieldLabel htmlFor="number">Número</FieldLabel>
              <Input id="number" {...register("number")} />
              <FieldError errors={[errors.number]} />
            </Field>

            <Field className="md:col-span-4">
              <FieldLabel htmlFor="complement">Complemento</FieldLabel>
              <Input id="complement" {...register("complement")} />
              <FieldError errors={[errors.complement]} />
            </Field>

            <Field className="md:col-span-2">
              <FieldLabel htmlFor="neighborhood">Bairro</FieldLabel>
              <Input id="neighborhood" {...register("neighborhood")} />
              <FieldError errors={[errors.neighborhood]} />
            </Field>

            <Field className="md:col-span-3">
              <FieldLabel htmlFor="city">Cidade</FieldLabel>
              <Input id="city" {...register("city")} />
              <FieldError errors={[errors.city]} />
            </Field>

            <Controller
              control={control}
              name="uf"
              render={({ field }) => (
                <Field className="md:col-span-1">
                  <FieldLabel htmlFor="uf">UF</FieldLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    defaultValue={field.value}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o estado" />
                    </SelectTrigger>
                    <SelectContent>
                      {BRAZIL_STATES.map((s) => (
                        <SelectItem key={s.uf} value={s.uf}>
                          {s.uf} - {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldError errors={[errors.uf]} />
                </Field>
              )}
            />
          </div>
        </FieldSet>

        <Separator />

        <FieldSet>
          <FieldLegend>Associações</FieldLegend>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Controller
              control={control}
              name="regionId"
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor="regionId">Região</FieldLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    defaultValue={field.value}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma região" />
                    </SelectTrigger>
                    <SelectContent>
                      {regionsData?.data.map((region) => (
                        <SelectItem key={region.id} value={region.id}>
                          {region.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldError errors={[errors.regionId]} />
                </Field>
              )}
            />

            <Controller
              control={control}
              name="groupId"
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor="groupId">Grupo</FieldLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    defaultValue={field.value}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um grupo" />
                    </SelectTrigger>
                    <SelectContent>
                      {groupsData?.data.map((group) => (
                        <SelectItem key={group.id} value={group.id}>
                          {group.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldError errors={[errors.groupId]} />
                </Field>
              )}
            />
          </div>
        </FieldSet>

        <Separator />

        <FieldSet>
          <FieldLegend>Condições Comerciais</FieldLegend>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field className="col-span-1">
              <FieldLabel>Forma de Pagamento</FieldLabel>
              <div className="flex flex-wrap gap-2">
                {PAYMENT_TYPES.map((type) => (
                  <Badge
                    key={type.value}
                    variant={selectedPaymentForm.includes(type.value) ? "default" : "outline"}
                    className="cursor-pointer hover:opacity-80 transition-opacity py-1.5 px-3"
                    onClick={() => togglePaymentType(type.value)}
                  >
                    <span className="text-xs">{type.label}</span>
                  </Badge>
                ))}
              </div>
            </Field>

            <Field className="md:w-1/3 col-span-1 justify-end">
              <FieldLabel htmlFor="deliveryAreaKm">Área de Entrega (KM)</FieldLabel>
              <Input
                id="deliveryAreaKm"
                type="number"
                min={0}
                step={1}
                defaultValue={0}
                {...register("deliveryAreaKm", { valueAsNumber: true })}
              />
              <FieldError errors={[errors.deliveryAreaKm]} />
            </Field>

            {selectedPaymentForm.includes("GUARANTEED") && (
              <Label className="col-span-2 hover:bg-accent/50 flex items-start gap-3 rounded-lg border p-3 has-[[aria-checked=true]]:border-blue-600 has-[[aria-checked=true]]:bg-blue-50 dark:has-[[aria-checked=true]]:border-blue-900 dark:has-[[aria-checked=true]]:bg-blue-950">
                <Checkbox
                  id="toggle-2"
                  defaultChecked
                  className="data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-600 data-[state=checked]:text-white dark:data-[state=checked]:border-blue-700 dark:data-[state=checked]:bg-blue-700"
                  {...register("isMotolinkCovered")}
                />
                <div className="grid gap-1.5 font-normal">
                  <p className="text-sm leading-none font-medium">
                    Importante
                  </p>
                  <p className="text-muted-foreground text-sm">
                    Caso o entregador não atinja o valor de entregas garantidas a diferença será paga pela MOTOLINK
                  </p>
                </div>
              </Label>
            )}

            {selectedPaymentForm.includes("DAILY") && (
              <Field className="col-span-1">
                <FieldLabel>Períodos - Diária</FieldLabel>
                <div className="flex flex-wrap gap-2">
                  {PERIOD_TYPES.map((period) => (
                    <Badge
                      key={period.value}
                      variant={selectedDailyPeriods.includes(period.value) ? "default" : "outline"}
                      className="cursor-pointer hover:opacity-80 transition-opacity py-1.5 px-3"
                      onClick={() => togglePeriod(period.value, "DAILY")}
                    >
                      <span className="text-xs">{period.label}</span>
                    </Badge>
                  ))}
                </div>
              </Field>
            )}

            {selectedPaymentForm.includes("GUARANTEED") && (
              <Field className="col-span-1">
                <FieldLabel>Períodos - Qt. Garantida</FieldLabel>
                <div className="flex flex-wrap gap-2">
                  {PERIOD_TYPES.map((period) => (
                    <Badge
                      key={period.value}
                      variant={selectedGuaranteedPeriods.includes(period.value) ? "default" : "outline"}
                      className="cursor-pointer hover:opacity-80 transition-opacity py-1.5 px-3"
                      onClick={() => togglePeriod(period.value, "GUARANTEED")}
                    >
                      <span className="text-xs">{period.label}</span>
                    </Badge>
                  ))}
                </div>
              </Field>
            )}

            {/* Dynamic inputs for DELIVERY AREA - shown first */}
            {deliveryAreaKmValue && deliveryAreaKmValue > 0 && (
              <div className="col-span-2 grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg bg-muted/30">
                <FieldLegend className="col-span-1 md:col-span-4 mb-0">Valores - Área de Entrega</FieldLegend>

                <Field>
                  <FieldLabel htmlFor="clientPerDelivery">Cliente - Por Entrega</FieldLabel>
                  <Input
                    id="clientPerDelivery"
                    {...register("clientPerDelivery", {
                      onChange: (e) => {
                        e.target.value = moneyMask(e.target.value);
                      },
                    })}
                  />
                  <FieldError errors={[errors.clientPerDelivery]} />
                </Field>

                <Field>
                  <FieldLabel htmlFor="deliverymanPerDelivery">Entregador - Por Entrega</FieldLabel>
                  <Input
                    id="deliverymanPerDelivery"
                    {...register("deliverymanPerDelivery", {
                      onChange: (e) => {
                        e.target.value = moneyMask(e.target.value);
                      },
                    })}
                  />
                  <FieldError errors={[errors.deliverymanPerDelivery]} />
                </Field>

                <Field>
                  <FieldLabel htmlFor="clientAdditionalKm">Cliente - KM Adicional</FieldLabel>
                  <Input
                    id="clientAdditionalKm"
                    {...register("clientAdditionalKm", {
                      onChange: (e) => {
                        e.target.value = moneyMask(e.target.value);
                      },
                    })}
                  />
                  <FieldError errors={[errors.clientAdditionalKm]} />
                </Field>

                <Field>
                  <FieldLabel htmlFor="deliverymanAdditionalKm">Entregador - KM Adicional</FieldLabel>
                  <Input
                    id="deliverymanAdditionalKm"
                    {...register("deliverymanAdditionalKm", {
                      onChange: (e) => {
                        e.target.value = moneyMask(e.target.value);
                      },
                    })}
                  />
                  <FieldError errors={[errors.deliverymanAdditionalKm]} />
                </Field>
              </div>
            )}

            {selectedPaymentForm.includes("GUARANTEED") && selectedGuaranteedPeriods.length > 0 && (
              <div className="col-span-2 grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg bg-muted/30">
                <FieldLegend className="col-span-1 md:col-span-4 mb-0">Valores - Qt. Garantida</FieldLegend>

                {selectedGuaranteedPeriods.includes("WEEK_DAY") && (
                  <Field>
                    <FieldLabel htmlFor="guaranteedDay">Qt. Garantida - Semanal (Dia)</FieldLabel>
                    <Input
                      id="guaranteedDay"
                      type="number"
                      min={1}
                      step={1}
                      defaultValue={0}
                      {...register("guaranteedDay")}
                    />
                    <FieldError errors={[errors.guaranteedDay]} />
                  </Field>
                )}

                {selectedGuaranteedPeriods.includes("WEEK_NIGHT") && (
                  <Field>
                    <FieldLabel htmlFor="guaranteedNight">Qt. Garantida - Semanal (Noite)</FieldLabel>
                    <Input
                      id="guaranteedNight"
                      type="number"
                      min={1}
                      step={1}
                      defaultValue={0}
                      {...register("guaranteedNight")}
                    />
                    <FieldError errors={[errors.guaranteedNight]} />
                  </Field>
                )}

                {selectedGuaranteedPeriods.includes("WEEKEND_DAY") && (
                  <Field>
                    <FieldLabel htmlFor="guaranteedDayWeekend">Qt. Garantida - Fim de Semana (Dia)</FieldLabel>
                    <Input
                      id="guaranteedDayWeekend"
                      type="number"
                      min={1}
                      step={1}
                      defaultValue={0}
                      {...register("guaranteedDayWeekend")}
                    />
                    <FieldError errors={[errors.guaranteedDayWeekend]} />
                  </Field>
                )}

                {selectedGuaranteedPeriods.includes("WEEKEND_NIGHT") && (
                  <Field>
                    <FieldLabel htmlFor="guaranteedNightWeekend">Qt. Garantida - Fim de Semana (Noite)</FieldLabel>
                    <Input
                      id="guaranteedNightWeekend"
                      type="number"
                      min={1}
                      step={1}
                      defaultValue={0}
                      {...register("guaranteedNightWeekend")}
                    />
                    <FieldError errors={[errors.guaranteedNightWeekend]} />
                  </Field>
                )}
              </div>
            )}

            {/* Dynamic inputs for DAILY payment type - shown last */}
            {selectedPaymentForm.includes("DAILY") && selectedDailyPeriods.length > 0 && (
              <div className="col-span-2 grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg bg-muted/30">
                <FieldLegend className="col-span-1 md:col-span-4 mb-0">Valores - Diária</FieldLegend>

                {selectedDailyPeriods.includes("WEEK_DAY") && (
                  <>
                    <Field>
                      <FieldLabel htmlFor="clientDailyDay">Cliente - Semanal (Dia)</FieldLabel>
                      <Input
                        id="clientDailyDay"
                        {...register("clientDailyDay", {
                          onChange: (e) => {
                            e.target.value = moneyMask(e.target.value);
                          },
                        })}
                      />
                      <FieldError errors={[errors.clientDailyDay]} />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="deliverymanDailyDay">Entregador - Semanal (Dia)</FieldLabel>
                      <Input
                        id="deliverymanDailyDay"
                        {...register("deliverymanDailyDay", {
                          onChange: (e) => {
                            e.target.value = moneyMask(e.target.value);
                          },
                        })}
                      />
                      <FieldError errors={[errors.deliverymanDailyDay]} />
                    </Field>
                  </>
                )}

                {selectedDailyPeriods.includes("WEEK_NIGHT") && (
                  <>
                    <Field>
                      <FieldLabel htmlFor="clientDailyNight">Cliente - Semanal (Noite)</FieldLabel>
                      <Input
                        id="clientDailyNight"
                        {...register("clientDailyNight", {
                          onChange: (e) => {
                            e.target.value = moneyMask(e.target.value);
                          },
                        })}
                      />
                      <FieldError errors={[errors.clientDailyNight]} />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="deliverymanDailyNight">Entregador - Semanal (Noite)</FieldLabel>
                      <Input
                        id="deliverymanDailyNight"
                        {...register("deliverymanDailyNight", {
                          onChange: (e) => {
                            e.target.value = moneyMask(e.target.value);
                          },
                        })}
                      />
                      <FieldError errors={[errors.deliverymanDailyNight]} />
                    </Field>
                  </>
                )}

                {selectedDailyPeriods.includes("WEEKEND_DAY") && (
                  <>
                    <Field>
                      <FieldLabel htmlFor="clientDailyDayWknd">Cliente - Fim de Semana (Dia)</FieldLabel>
                      <Input
                        id="clientDailyDayWknd"
                        {...register("clientDailyDayWknd", {
                          onChange: (e) => {
                            e.target.value = moneyMask(e.target.value);
                          },
                        })}
                      />
                      <FieldError errors={[errors.clientDailyDayWknd]} />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="deliverymanDailyDayWknd">Entregador - Fim de Semana (Dia)</FieldLabel>
                      <Input
                        id="deliverymanDailyDayWknd"
                        {...register("deliverymanDailyDayWknd", {
                          onChange: (e) => {
                            e.target.value = moneyMask(e.target.value);
                          },
                        })}
                      />
                      <FieldError errors={[errors.deliverymanDailyDayWknd]} />
                    </Field>
                  </>
                )}

                {selectedDailyPeriods.includes("WEEKEND_NIGHT") && (
                  <>
                    <Field>
                      <FieldLabel htmlFor="clientDailyNightWknd">Cliente - Fim de Semana (Noite)</FieldLabel>
                      <Input
                        id="clientDailyNightWknd"
                        {...register("clientDailyNightWknd", {
                          onChange: (e) => {
                            e.target.value = moneyMask(e.target.value);
                          },
                        })}
                      />
                      <FieldError errors={[errors.clientDailyNightWknd]} />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="deliverymanDailyNightWknd">Entregador - Fim de Semana (Noite)</FieldLabel>
                      <Input
                        id="deliverymanDailyNightWknd"
                        {...register("deliverymanDailyNightWknd", {
                          onChange: (e) => {
                            e.target.value = moneyMask(e.target.value);
                          },
                        })}
                      />
                      <FieldError errors={[errors.deliverymanDailyNightWknd]} />
                    </Field>
                  </>
                )}
              </div>
            )}
          </div>
        </FieldSet>

        <Separator />

        <Field>
          <FieldLabel htmlFor="observations">Observações</FieldLabel>
          <Textarea
            id="observations"
            {...register("observations")}
            placeholder="Adicione observações sobre o cliente..."
          />
          <FieldError errors={[errors.observations]} />
        </Field>

        <Button type="submit" isLoading={isPending} className="md:w-fit mt-8">
          {client?.id ? "Atualizar Cliente" : "Criar Cliente"}
        </Button>
      </FieldGroup>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Substituir dados de endereço?</AlertDialogTitle>
            <AlertDialogDescription>
              Já existem dados de endereço preenchidos. Deseja substituí-los pelos dados retornados do CNPJ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowConfirmDialog(false);
              setCnpjData(null);
            }}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmOverwrite}>
              Substituir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </form>
  );
}
