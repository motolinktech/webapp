import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AppLayout } from "@/components/composite/app-layout";
import { isAuthenticated } from "@/modules/auth/auth.service";

export const Route = createFileRoute("/_auth")({
	beforeLoad: () => {
		if (!isAuthenticated()) {
			throw redirect({ to: "/login" });
		}
	},
	component: AuthLayout,
});

function AuthLayout() {
	return (
		<AppLayout>
			<Outlet />
		</AppLayout>
	);
}
