import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { AlertCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createRegion, updateRegion } from "@/modules/regions/regions.service";
import type { Region } from "@/modules/regions/regions.types";

const regionFormSchema = z.object({
  name: z
    .string()
    .min(3, "Nome deve ter pelo menos 3 caracteres")
    .max(100, "Nome deve ter no máximo 100 caracteres"),
  description: z.string().max(255, "Descrição deve ter no máximo 255 caracteres").optional(),
});

type RegionFormData = z.infer<typeof regionFormSchema>;

interface RegionFormProps {
  region?: Region | null;
}

export function RegionForm({ region }: RegionFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegionFormData>({
    resolver: zodResolver(regionFormSchema),
    defaultValues: {
      name: region?.name || "",
      description: region?.description || "",
    },
  });
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { mutateAsync, isError, isPending } = useMutation({
    mutationFn: async (data: RegionFormData) => {
      if (region?.id) {
        return updateRegion({ ...data, id: region.id });
      }
      return createRegion(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["regions"] });
      if (region?.id) {
        navigate({
          to: "/gestao/regiao/$regionId/detalhe",
          params: { regionId: region.id },
        });
      } else {
        navigate({ to: "/gestao/regiao" });
      }
    },
  });

  return (
    <form onSubmit={handleSubmit((data) => mutateAsync(data))} className="p-4 overflow-y-auto">
      <FieldGroup>
        {isError && (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertDescription>
              {region?.id ? "Erro ao atualizar região" : "Erro ao criar região"}
            </AlertDescription>
          </Alert>
        )}

        <Field>
          <FieldLabel htmlFor="name">Nome</FieldLabel>
          <Input
            id="name"
            type="text"
            placeholder="Nome da região"
            aria-invalid={!!errors.name}
            {...register("name")}
          />
          <FieldError errors={[errors.name]} />
        </Field>

        <Field>
          <FieldLabel htmlFor="description">Descrição</FieldLabel>
          <Textarea
            id="description"
            placeholder="Descrição da região"
            aria-invalid={!!errors.description}
            {...register("description")}
          />
          <FieldError errors={[errors.description]} />
        </Field>

        <Button type="submit" isLoading={isPending}>
          {region?.id ? "Salvar alterações" : "Criar Região"}
        </Button>
      </FieldGroup>
    </form>
  );
}
