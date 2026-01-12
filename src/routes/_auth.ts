import { createFileRoute, redirect } from "@tanstack/react-router";

// Mock authentication state - set to true/false to simulate logged in/out user
const isAuthenticated = false;

export const Route = createFileRoute("/_auth")({
	beforeLoad: () => {
		if (!isAuthenticated) {
			throw redirect({ to: "/login" });
		}
	},
});
