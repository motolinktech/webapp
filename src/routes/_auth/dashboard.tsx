import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useGlobal } from "@/contexts/global.context";
import { clearAuth } from "@/lib/modules/auth/auth.service";

export const Route = createFileRoute("/_auth/dashboard")({
	component: Dashboard,
});

function Dashboard() {
	const { user } = useGlobal();
	const navigate = useNavigate();

	const handleLogout = () => {
		clearAuth();
		navigate({ to: "/login" });
	};

	return (
		<div>
			<h1>Hello {user?.name || "Dashboard"}</h1>
			<Button onClick={handleLogout}>Logout</Button>
		</div>
	);
}
