import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle } from "lucide-react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { z } from "zod";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
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
import { cpfMask } from "@/lib/masks/cpfMask";
import { phoneMask } from "@/lib/masks/phoneMask";
import {
  createDeliveryman,
  updateDeliveryman,
} from "@/modules/deliverymen/deliverymen.service";
import type { Deliveryman } from "@/modules/deliverymen/deliverymen.types";
import { listRegions } from "@/modules/regions/regions.service";

const deliverymanFormSchema = z.object({
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  document: z
    .string()
    .length(14, "CPF inválido, deve ter 11 dígitos (XXX.XXX.XXX-XX)"),
  phone: z.string().min(14, "Telefone inválido (ex: (DD) XXXXX-XXXX)"),
  contractType: z.enum(["FREELANCER", "INDEPENDENT_COLLABORATOR"], {
    message: "Selecione um tipo de contrato",
  }),
  mainPixKey: z.string().min(1, "Chave PIX principal é obrigatória"),
  secondPixKey: z.string().optional(),
  thridPixKey: z.string().optional(),
  agency: z.string().optional(),
  account: z.string().optional(),
  vehicleModel: z.string().optional(),
  vehiclePlate: z.string().optional(),
  vehicleColor: z.string().optional(),
  regionId: z.string().optional(),
});

type DeliverymanFormData = z.infer<typeof deliverymanFormSchema>;

interface DeliverymenFormProps {
  setToogleSheet: React.Dispatch<React.SetStateAction<boolean>>;
  deliveryman?: Deliveryman | null;
}

export function DeliverymenForm({
  setToogleSheet,
  deliveryman,
}: DeliverymenFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
  } = useForm<DeliverymanFormData>({
    resolver: zodResolver(deliverymanFormSchema),
    defaultValues: {
      name: deliveryman?.name || "",
      document: deliveryman?.document ? cpfMask(deliveryman.document) : "",
      phone: deliveryman?.phone ? phoneMask(deliveryman.phone) : "",
      contractType:
        (deliveryman?.contractType as "FREELANCER" | "INDEPENDENT_COLLABORATOR") ||
        undefined,
      mainPixKey: deliveryman?.mainPixKey || "",
      secondPixKey: deliveryman?.secondPixKey || "",
      thridPixKey: deliveryman?.thridPixKey || "",
      agency: deliveryman?.agency || "",
      account: deliveryman?.account || "",
      vehicleModel: deliveryman?.vehicleModel || "",
      vehiclePlate: deliveryman?.vehiclePlate || "",
      vehicleColor: deliveryman?.vehicleColor || "",
      regionId: deliveryman?.regionId || undefined,
    },
  });
  const queryClient = useQueryClient();

  const mainPixKey = useWatch({ control, name: "mainPixKey" });
  const secondPixKey = useWatch({ control, name: "secondPixKey" });

  const { data: regionsData } = useQuery({
    queryKey: ["regions"],
    queryFn: () => listRegions({ limit: 1000 }),
  });

  const clearMasks = (data: DeliverymanFormData) => {
    return {
      ...data,
      document: data.document.replace(/\D/g, ""),
      phone: data.phone.replace(/\D/g, ""),
    };
  };

  const { mutateAsync, isError, isPending } = useMutation({
    mutationFn: async (data: DeliverymanFormData) => {
      const unmaskedData = clearMasks(data);

      if (deliveryman?.id) {
        return updateDeliveryman({ id: deliveryman.id, ...unmaskedData });
      }

      return createDeliveryman(unmaskedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deliverymen"] });
      setToogleSheet(false);
    },
  });

  return (
    <form
      onSubmit={handleSubmit((data) => mutateAsync(data))}
      className="p-4 overflow-y-auto h-full"
    >
      <FieldGroup className="flex flex-col gap-4">
        {isError && (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertDescription>Erro ao salvar entregador</AlertDescription>
          </Alert>
        )}

        <FieldSet>
          <FieldLegend>Informação Pessoal</FieldLegend>
          <Field>
            <FieldLabel htmlFor="name">Nome</FieldLabel>
            <Input id="name" {...register("name")} />
            <FieldError errors={[errors.name]} />
          </Field>
          <Field>
            <FieldLabel htmlFor="document">CPF</FieldLabel>
            <Input
              id="document"
              {...register("document", {
                onChange: (e) => {
                  e.target.value = cpfMask(e.target.value);
                },
              })}
            />
            <FieldError errors={[errors.document]} />
          </Field>
          <Field>
            <FieldLabel htmlFor="phone">Telefone</FieldLabel>
            <Input
              id="phone"
              {...register("phone", {
                onChange: (e) => {
                  e.target.value = phoneMask(e.target.value);
                },
              })}
            />
            <FieldError errors={[errors.phone]} />
          </Field>
          <Controller
            control={control}
            name="contractType"
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor="contractType">Tipo de Contrato</FieldLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  defaultValue={field.value}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo de contrato" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FREELANCER">FREELANCER</SelectItem>
                    <SelectItem value="INDEPENDENT_COLLABORATOR">
                      COLABORADOR INDEPENDENTE
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FieldError errors={[errors.contractType]} />
              </Field>
            )}
          />
        </FieldSet>

        <FieldSet>
          <FieldLegend>Dados Bancários</FieldLegend>
          <Field>
            <FieldLabel htmlFor="mainPixKey">Chave PIX Principal</FieldLabel>
            <Input id="mainPixKey" {...register("mainPixKey")} />
            <FieldError errors={[errors.mainPixKey]} />
          </Field>
          <Field>
            <FieldLabel htmlFor="secondPixKey">Chave PIX Secundária</FieldLabel>
            <Input
              id="secondPixKey"
              {...register("secondPixKey")}
              disabled={!mainPixKey}
            />
            <FieldError errors={[errors.secondPixKey]} />
          </Field>
          <Field>
            <FieldLabel htmlFor="thridPixKey">Chave PIX Terciária</FieldLabel>
            <Input
              id="thridPixKey"
              {...register("thridPixKey")}
              disabled={!secondPixKey}
            />
            <FieldError errors={[errors.thridPixKey]} />
          </Field>
          <Field>
            <FieldLabel htmlFor="account">Conta</FieldLabel>
            <Input id="account" {...register("account")} />
            <FieldError errors={[errors.account]} />
          </Field>
          <Field>
            <FieldLabel htmlFor="agency">Agência</FieldLabel>
            <Input id="agency" {...register("agency")} />
            <FieldError errors={[errors.agency]} />
          </Field>
        </FieldSet>

        <FieldSet>
          <FieldLegend>Informações do Veículo</FieldLegend>
          <Field>
            <FieldLabel htmlFor="vehicleModel">Modelo</FieldLabel>
            <Input id="vehicleModel" {...register("vehicleModel")} />
            <FieldError errors={[errors.vehicleModel]} />
          </Field>
          <Field>
            <FieldLabel htmlFor="vehicleColor">Cor</FieldLabel>
            <Input id="vehicleColor" {...register("vehicleColor")} />
            <FieldError errors={[errors.vehicleColor]} />
          </Field>
          <Field>
            <FieldLabel htmlFor="vehiclePlate">Placa</FieldLabel>
            <Input id="vehiclePlate" {...register("vehiclePlate")} />
            <FieldError errors={[errors.vehiclePlate]} />
          </Field>
        </FieldSet>

        <FieldSet>
          <FieldLegend>Associações</FieldLegend>
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
        </FieldSet>

        <Button type="submit" isLoading={isPending} className="mt-4">
          {deliveryman?.id ? "Atualizar Entregador" : "Criar Entregador"}
        </Button>
      </FieldGroup>
    </form>
  );
}
