import { createFileRoute } from "@tanstack/react-router";
import { useGlobal } from "@/contexts/global.context";

export const Route = createFileRoute("/_auth/dashboard")({
	component: Dashboard,
});

function Dashboard() {
	const { user } = useGlobal();

	return (
		<div className="p-6">
			<h1 className="text-2xl font-bold">
				Olá, {user?.name || "Usuário"}
			</h1>
			<p className="text-muted-foreground mt-2">
				Bem-vindo ao painel de controle.
			</p>
		</div>
	);
}
