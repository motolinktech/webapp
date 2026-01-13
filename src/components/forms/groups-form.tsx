import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { AlertCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createGroup, updateGroup } from "@/modules/groups/groups.service";
import type { Group } from "@/modules/groups/groups.types";

const groupFormSchema = z.object({
  name: z
    .string()
    .min(3, "Nome deve ter pelo menos 3 caracteres")
    .max(100, "Nome deve ter no máximo 100 caracteres"),
  description: z
    .string()
    .max(255, "Descrição deve ter no máximo 255 caracteres")
    .optional(),
});

type GroupFormData = z.infer<typeof groupFormSchema>;

interface GroupsFormProps {
  group?: Group | null;
}

export function GroupsForm({ group }: GroupsFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<GroupFormData>({
    resolver: zodResolver(groupFormSchema),
    defaultValues: {
      name: group?.name || "",
      description: group?.description || "",
    },
  });
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { mutateAsync, isError, isPending } = useMutation({
    mutationFn: async (data: GroupFormData) => {
      if (group?.id) {
        return updateGroup({ ...data, id: group.id });
      }
      return createGroup(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      navigate({ to: "/gestao/grupos" });
    },
  });

  return (
    <form
      onSubmit={handleSubmit((data) => mutateAsync(data))}
      className="p-4 overflow-y-auto"
    >
      <FieldGroup>
        {isError && (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertDescription>
              Erro ao {group?.id ? "atualizar" : "criar"} grupo
            </AlertDescription>
          </Alert>
        )}

        <Field>
          <FieldLabel htmlFor="name">Nome</FieldLabel>
          <Input
            id="name"
            type="text"
            placeholder="Nome do grupo"
            aria-invalid={!!errors.name}
            {...register("name")}
          />
          <FieldError errors={[errors.name]} />
        </Field>

        <Field>
          <FieldLabel htmlFor="description">Descrição</FieldLabel>
          <Textarea
            id="description"
            placeholder="Descrição do grupo"
            aria-invalid={!!errors.description}
            {...register("description")}
          />
          <FieldError errors={[errors.description]} />
        </Field>

        <Button type="submit" isLoading={isPending}>
          {group?.id ? "Atualizar grupo" : "Criar grupo"}
        </Button>
      </FieldGroup>
    </form>
  );
}
