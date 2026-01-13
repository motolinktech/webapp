import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { AlertCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useGlobal } from "@/contexts/global-context";
import { authenticate, saveAuth } from "@/modules/auth/auth.service";
import type { AuthCredentials } from "@/modules/auth/auth.types";

export function AuthForm() {
	const navigate = useNavigate();
	const { setUser } = useGlobal();
	const { register, handleSubmit } = useForm<AuthCredentials>();

	const mutation = useMutation({
		mutationFn: authenticate,
		onSuccess: (response) => {
			saveAuth(response.token, response.user);
			setUser(response.user);
			navigate({ to: "/dashboard" });
		},
	});

	const onSubmit = (data: AuthCredentials) => {
		mutation.mutate(data);
	};

	return (
		<form onSubmit={handleSubmit(onSubmit)}>
			<FieldGroup>
				{mutation.isError && (
					<Alert variant="destructive">
						<AlertCircle className="size-4" />
						<AlertDescription>Credenciais inválidas</AlertDescription>
					</Alert>
				)}

				<Field>
					<FieldLabel htmlFor="email">Email</FieldLabel>
					<Input
						type="email"
						placeholder="email@example.com"
						{...register("email", { required: true })}
					/>
				</Field>

				<Field>
					<FieldLabel htmlFor="password">Password</FieldLabel>
					<Input
						type="password"
						placeholder="••••••••"
						{...register("password", { required: true })}
					/>
				</Field>

				<Button type="submit" isLoading={mutation.isPending}>
					Sign in
				</Button>
			</FieldGroup>
		</form>
	);
}
