import { createFileRoute } from "@tanstack/react-router";
import logoImage from "@/assets/motolink.png";
import backgroundImage from "@/assets/rio-de-janeiro.jpg";
import { AuthForm } from "@/components/forms/auth-form";
import { Text } from "@/components/ui/text";

export const Route = createFileRoute("/login")({
	component: Login,
});

function Login() {
	return (
		<div className="flex min-h-screen">
			<div className="hidden lg:flex lg:w-2/3 bg-muted items-center justify-center relative">
				<Text variant="muted" className="absolute">
					Carregando paisagem carioca... 🏖️
				</Text>
				<img
					src={backgroundImage}
					alt="Rio de Janeiro"
					className="w-full h-full object-cover"
				/>
			</div>

			<div className="w-full lg:w-1/3 bg-background flex flex-col justify-center px-8 py-12">
				<div className="mx-auto w-full max-w-sm space-y-6">
					<div className="space-y-2 text-center">
						<img src={logoImage} alt="Motolink Logo" className="w-64 mx-auto" />

						<Text variant="muted">
							Bem-vindo ao Sistema Motolink. Faça login para acessar o painel de
							controle e gerenciar suas operações de forma simples e eficiente.
						</Text>
					</div>

					<AuthForm />
				</div>
			</div>
		</div>
	);
}
