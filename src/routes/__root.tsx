import { TanStackDevtools } from "@tanstack/react-devtools";
import type { QueryClient } from "@tanstack/react-query";
import {
	createRootRouteWithContext,
	Outlet,
	redirect,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { isAuthenticated } from "@/lib/modules/auth/auth.service";
import TanStackQueryDevtools from "../contexts/tanstack-query/devtools";

interface MyRouterContext {
	queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
	beforeLoad: ({ location }) => {
		const authenticated = isAuthenticated();
		const publicPaths = ["/", "/login"];

		if (authenticated && publicPaths.includes(location.pathname)) {
			throw redirect({
				to: "/dashboard",
			});
		}
	},
	component: () => (
		<>
			<Outlet />
			<TanStackDevtools
				config={{
					position: "bottom-right",
				}}
				plugins={[
					{
						name: "Tanstack Router",
						render: <TanStackRouterDevtoolsPanel />,
					},
					TanStackQueryDevtools,
				]}
			/>
		</>
	),
});
