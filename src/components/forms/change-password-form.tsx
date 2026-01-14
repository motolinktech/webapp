import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { changePassword } from "@/modules/users/users.service";

const changePasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Senha deve ter pelo menos 8 caracteres")
      .max(128, "Senha deve ter no máximo 128 caracteres")
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).+$/, "Senha deve conter pelo menos uma letra maiúscula"),
    passwordConfirmation: z.string(),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    message: "As senhas não coincidem",
    path: ["passwordConfirmation"],
  });

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

interface ChangePasswordFormProps {
  userId: string;
  token: string;
}

export function ChangePasswordForm({ userId, token }: ChangePasswordFormProps) {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
  });

  const { mutateAsync, isError, isPending, isSuccess } = useMutation({
    mutationFn: async (data: ChangePasswordFormData) => {
      return changePassword({
        id: userId,
        password: data.password,
        passwordConfirmation: data.passwordConfirmation,
        token,
      });
    },
    onSuccess: () => {
      setTimeout(() => {
        navigate({ to: "/login" });
      }, 2000);
    },
  });

  if (isSuccess) {
    return (
      <Alert variant="default">
        <CheckCircle2 className="size-4 text-green-600" />
        <AlertDescription className="text-green-700">
          Senha alterada com sucesso! Redirecionando para o login...
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <form onSubmit={handleSubmit((data) => mutateAsync(data))}>
      <FieldGroup>
        {isError && (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertDescription>
              Erro ao alterar senha. Verifique se o link é válido.
            </AlertDescription>
          </Alert>
        )}

        <Field>
          <FieldLabel htmlFor="password">Nova Senha</FieldLabel>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            aria-invalid={!!errors.password}
            {...register("password")}
          />
          <FieldError errors={[errors.password]} />
        </Field>

        <Field>
          <FieldLabel htmlFor="passwordConfirmation">Confirmar Senha</FieldLabel>
          <Input
            id="passwordConfirmation"
            type="password"
            placeholder="••••••••"
            aria-invalid={!!errors.passwordConfirmation}
            {...register("passwordConfirmation")}
          />
          <FieldError errors={[errors.passwordConfirmation]} />
        </Field>

        <Button type="submit" isLoading={isPending}>
          Alterar Senha
        </Button>
      </FieldGroup>
    </form>
  );
}
