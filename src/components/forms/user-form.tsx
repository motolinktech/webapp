import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, ChevronDown } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { createUser, updateUser } from "@/modules/users/users.service";
import { dateMask } from "@/lib/masks/date-mask";
import { userPermissions } from "@/modules/users/users.constants";
import dayjs from "dayjs";
import type { User } from "@/modules/users/users.types";

const userFormSchema = z.object({
  name: z
    .string()
    .min(3, "Nome deve ter pelo menos 3 caracteres")
    .max(100, "Nome deve ter no máximo 100 caracteres"),
  email: z.email("Email inválido"),
  birthDate: z
    .string()
    .regex(/^\d{2}\/\d{2}\/\d{4}$/, "Data deve estar no formato DD/MM/YYYY")
    .refine((date) => {
      const birthDate = new Date(date);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      return age >= 18 && age <= 120;
    }, "Usuário deve ter entre 18 e 120 anos"),
  role: z.enum(["ADMIN", "USER"], {
    message: "Selecione um tipo de usuário"
  }),
  permissions: z.array(z.string()).optional(),
});

type UserFormData = z.infer<typeof userFormSchema>;

interface UserFormProps {
  setToogleSheet: React.Dispatch<React.SetStateAction<boolean>>;
  user?: User | null;
}

export function UserForm({ setToogleSheet, user }: UserFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    watch,
    setValue
  } = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      birthDate: dayjs(user?.birthDate).format("DD/MM/YYYY") || "",
      role: user?.role || "USER",
      permissions: user?.permissions || [],
    }
  });
  const queryClient = useQueryClient()

  const selectedPermissions = watch("permissions") || [];

  const togglePermission = (permission: string) => {
    const current = selectedPermissions;
    if (current.includes(permission)) {
      setValue("permissions", current.filter(p => p !== permission));
    } else {
      setValue("permissions", [...current, permission]);
    }
  };

  const { mutateAsync, isError, isPending } = useMutation({
    mutationFn: async (data: UserFormData) => {
      if (user?.id) {
        return updateUser({ ...data, id: user.id });
      }

      return createUser(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setToogleSheet(false);
    },
  });

  return (
    <form onSubmit={handleSubmit(data => mutateAsync(data))} className="p-4 overflow-y-auto">
      <FieldGroup>
        {isError && (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertDescription>Erro ao criar usuário</AlertDescription>
          </Alert>
        )}

        <Field>
          <FieldLabel htmlFor="name">Nome</FieldLabel>
          <Input
            id="name"
            type="text"
            placeholder="João Silva"
            aria-invalid={!!errors.name}
            {...register("name")}
          />
          <FieldError errors={[errors.name]} />
        </Field>

        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            type="email"
            placeholder="email@example.com"
            aria-invalid={!!errors.email}
            {...register("email")}
          />
          <FieldError errors={[errors.email]} />
        </Field>

        <Field>
          <FieldLabel htmlFor="birthDate">Data de Nascimento</FieldLabel>
          <Input
            id="birthDate"
            type="text"
            aria-invalid={!!errors.birthDate}
            {...register("birthDate", {
              onChange: (e) => {
                let value = e.target.value;

                e.target.value = dateMask(value);
              },
            })}
          />
          <FieldError errors={[errors.birthDate]} />
        </Field>

        <Controller
          control={control}
          name="role"
          render={({ field: { onChange, value } }) => (
            <Field>
              <Field>
                <FieldLabel>Permissões</FieldLabel>
                <div className="space-y-2">
                  {userPermissions.map((group) => (
                    <Collapsible key={group.type}>
                      <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors">
                        <div className="flex flex-col items-start">
                          <span className="font-medium text-sm">{group.type}</span>
                          <span className="text-xs text-muted-foreground">
                            {group.description}
                          </span>
                        </div>
                        <ChevronDown className="size-4 transition-transform duration-200 [.data-[state=open]>&]:rotate-180" />
                      </CollapsibleTrigger>
                      <CollapsibleContent className="pt-2 px-3 space-y-1.5">
                        {group.rules.map((rule) => (
                          <Badge
                            key={rule.permission}
                            variant={selectedPermissions.includes(rule.permission) ? "default" : "outline"}
                            className="cursor-pointer hover:opacity-80 transition-opacity py-1.5 px-3"
                            onClick={() => togglePermission(rule.permission)}
                            asChild={false}
                          >
                            <span className="text-xs">{rule.description}</span>
                          </Badge>
                        ))}
                      </CollapsibleContent>
                    </Collapsible>
                  ))}
                </div>
              </Field>
              <FieldLabel htmlFor="role">Tipo</FieldLabel>
              <Select onValueChange={onChange} value={value} defaultValue={value}>
                <SelectTrigger id="role" aria-invalid={!!errors.role}>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Administrador</SelectItem>
                  <SelectItem value="USER">Usuário</SelectItem>
                </SelectContent>
              </Select>
              <FieldError errors={[errors.role]} />
            </Field>
          )} />


        <Button type="submit" isLoading={isPending}>
          {user?.id ? "Atualizar Usuário" : "Criar Usuário"}
        </Button>
      </FieldGroup>
    </form>
  );
}
