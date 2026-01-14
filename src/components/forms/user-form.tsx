import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import dayjs from "dayjs";
import { AlertCircle, ChevronDown } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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
import { useGlobal } from "@/contexts/global-context";
import { clearMask } from "@/lib/masks/clear-mask";
import { cpfMask } from "@/lib/masks/cpf-mask";
import { dateMask } from "@/lib/masks/date-mask";
import { dateToISO } from "@/lib/services/date";
import { cpfValidator } from "@/lib/utils/cpf-validator";
import { useBranches } from "@/modules/branches/useBranches";
import { userPermissions } from "@/modules/users/users.constants";
import { createUser, updateUser } from "@/modules/users/users.service";
import type { User } from "@/modules/users/users.types";

const userFormSchema = z.object({
  name: z
    .string()
    .min(3, "Nome deve ter pelo menos 3 caracteres")
    .max(100, "Nome deve ter no máximo 100 caracteres"),
  email: z.email("Email inválido"),
  birthDate: z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/, "Data deve estar no formato DD/MM/YYYY"),
  role: z.enum(["ADMIN", "USER"], {
    message: "Selecione um tipo de usuário",
  }),
  document: z
    .string()
    .min(11, "Documento deve ter pelo menos 11 caracteres")
    .max(14, "Documento deve ter no máximo 14 caracteres")
    .superRefine((val, ctx) => {
      try {
        cpfValidator(val);
      } catch (err) {
        ctx.addIssue({ code: 'custom', message: (err as Error).message });
      }
    }),
  branches: z.array(z.string()).optional(),
  permissions: z.array(z.string()).optional(),
});

type UserFormData = z.infer<typeof userFormSchema>;

interface UserFormProps {
  user?: User | null;
}

export function UserForm({ user }: UserFormProps) {
  const { selectedBranch } = useGlobal();
  const { data: branchesData, isLoading: isLoadingBranches } = useBranches();
  const branches = branchesData?.data || [];

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    watch,
    setValue,
  } = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      birthDate: dayjs(user?.birthDate).format("DD/MM/YYYY") || "",
      role: user?.role || "USER",
      branches: user?.branches || (selectedBranch ? [selectedBranch.id] : []),
      permissions: user?.permissions || [],
    },
  });
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const selectedPermissions = watch("permissions") || [];
  const selectedBranches = watch("branches") || [];
  const selectedRole = watch("role");

  const togglePermission = (permission: string) => {
    const current = selectedPermissions;
    if (current.includes(permission)) {
      setValue(
        "permissions",
        current.filter((p) => p !== permission),
      );
    } else {
      setValue("permissions", [...current, permission]);
    }
  };

  const toggleBranch = (branchId: string) => {
    const current = selectedBranches;
    if (current.includes(branchId)) {
      setValue(
        "branches",
        current.filter((b) => b !== branchId),
      );
    } else {
      setValue("branches", [...current, branchId]);
    }
  };

  const { mutateAsync, isError, isPending } = useMutation({
    mutationFn: async (data: UserFormData) => {
      const formattedData = {
        ...data,
        document: clearMask(data.document),
        birthDate: await dateToISO(data.birthDate),
      };

      if (user?.id) {
        return updateUser({ ...formattedData, id: user.id });
      }

      return createUser(formattedData);
    },
    onSuccess: () => {
      toast.success("Usuário salvo com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      navigate({
        to: "/rh/colaboradores",
      });
    },
  });

  return (
    <form onSubmit={handleSubmit((data) => mutateAsync(data))} className="p-4 overflow-y-auto">
      <FieldGroup>
        {isError && (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertDescription>Erro ao criar usuário</AlertDescription>
          </Alert>
        )}

        <FieldSet>
          <FieldLegend>Informações Pessoais</FieldLegend>
          <FieldGroup className="grid md:grid-cols-2 gap-4">
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
                    const value = e.target.value;

                    e.target.value = dateMask(value);
                  },
                })}
              />
              <FieldError errors={[errors.birthDate]} />
            </Field>

            <Field>
              <FieldLabel htmlFor="document">Documento</FieldLabel>
              <Input
                id="document"
                type="text"
                aria-invalid={!!errors.document}
                {...register("document", {
                  onChange: (e) => {
                    const value = e.target.value;

                    e.target.value = cpfMask(value);
                  },
                })}
              />
              <FieldError errors={[errors.document]} />
            </Field>
          </FieldGroup>
        </FieldSet>

        <FieldSet>
          <FieldLegend>Informações do Sistema</FieldLegend>
          <FieldGroup>
            <Controller
              control={control}
              name="role"
              render={({ field: { onChange, value } }) => (
                <Field>
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
              )}
            />

            <Field>
              <FieldLabel>Filiais</FieldLabel>
              {isLoadingBranches ? (
                <div className="text-sm text-muted-foreground">Carregando filiais...</div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {branches.map((branch) => (
                    <Badge
                      key={branch.id}
                      variant={selectedBranches.includes(branch.id) ? "default" : "outline"}
                      className="cursor-pointer hover:opacity-80 transition-opacity py-1.5 px-3"
                      onClick={() => toggleBranch(branch.id)}
                      asChild={false}
                    >
                      <span className="text-xs">{branch.name}</span>
                    </Badge>
                  ))}
                </div>
              )}
            </Field>

            {selectedRole === "USER" && (
              <Field>
                <FieldLabel>Permissões</FieldLabel>
                <div className="space-y-2">
                  {userPermissions.map((group) => (
                    <Collapsible key={group.type}>
                      <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors">
                        <div className="flex flex-col items-start">
                          <span className="font-medium text-sm">{group.type}</span>
                          <span className="text-xs text-muted-foreground">{group.description}</span>
                        </div>
                        <ChevronDown className="size-4 transition-transform duration-200 [.data-[state=open]>&]:rotate-180" />
                      </CollapsibleTrigger>
                      <CollapsibleContent className="pt-2 px-3 space-y-1.5">
                        {group.rules.map((rule) => (
                          <Badge
                            key={rule.permission}
                            variant={
                              selectedPermissions.includes(rule.permission) ? "default" : "outline"
                            }
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
            )}
          </FieldGroup>
        </FieldSet>

        <Button type="submit" isLoading={isPending}>
          {user?.id ? "Atualizar Usuário" : "Criar Usuário"}
        </Button>
      </FieldGroup>
    </form>
  );
}
