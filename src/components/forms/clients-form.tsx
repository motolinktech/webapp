import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { AlertCircle } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
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
import { Separator } from "@/components/ui/separator";
import { cepMask } from "@/lib/masks/cep-mask";
import { cnpjMask } from "@/lib/masks/cnpj-mask";
import { phoneMask } from "@/lib/masks/phone-mask";
import { createClient, updateClient } from "@/modules/clients/clients.service";
import type { Client } from "@/modules/clients/clients.types";
import { listGroups } from "@/modules/groups/groups.service";
import { listRegions } from "@/modules/regions/regions.service";

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
  regionId: z.string().optional(),
  groupId: z.string().optional(),
});

type ClientFormData = z.infer<typeof clientFormSchema>;

interface ClientsFormProps {
  client?: Client | null;
}

export function ClientsForm({ client }: ClientsFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      name: client?.name || "",
      cnpj: client?.cnpj || "",
      contactName: client?.contactName || "",
      contactPhone: client?.contactPhone || "",
      cep: client?.cep || "",
      street: client?.street || "",
      number: client?.number || "",
      complement: client?.complement || "",
      neighborhood: client?.neighborhood || "",
      city: client?.city || "",
      uf: client?.uf || "",
      regionId: client?.regionId || undefined,
      groupId: client?.groupId || undefined,
    },
  });
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
      const payload = {
        client: {
          ...unmaskedData,
          complement: unmaskedData.complement || "",
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
              <Input
                id="cnpj"
                {...register("cnpj", {
                  onChange: (e) => {
                    e.target.value = cnpjMask(e.target.value);
                  },
                })}
              />
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

            <Field className="md:col-span-1">
              <FieldLabel htmlFor="uf">UF</FieldLabel>
              <Input id="uf" {...register("uf")} />
              <FieldError errors={[errors.uf]} />
            </Field>
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

        <Button type="submit" isLoading={isPending} className="md:w-fit">
          {client?.id ? "Atualizar Cliente" : "Criar Cliente"}
        </Button>
      </FieldGroup>
    </form>
  );
}
