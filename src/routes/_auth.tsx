import {
	createFileRoute,
	Link,
	Outlet,
	redirect,
	useNavigate,
} from "@tanstack/react-router";
import {
	Building2,
	ChevronDown,
	ChevronsUpDown,
	Home,
	LogOut,
	Settings,
	Users,
	Wrench,
} from "lucide-react";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarHeader,
	SidebarInset,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSub,
	SidebarMenuSubButton,
	SidebarMenuSubItem,
	SidebarProvider,
} from "@/components/ui/sidebar";
import { useGlobal } from "@/contexts/global.context";
import { isAuthenticated } from "@/lib/modules/auth/auth.service";

const branches = [
	{ id: "rj", name: "Rio de Janeiro" },
	{ id: "sp", name: "São Paulo" },
	{ id: "camp", name: "Campinas" },
];

export const Route = createFileRoute("/_auth")({
	beforeLoad: () => {
		if (!isAuthenticated()) {
			throw redirect({ to: "/login" });
		}
	},
	component: AuthLayout,
});

function AuthLayout() {
	const { user, logout } = useGlobal();
	const navigate = useNavigate();
	const [selectedBranch, setSelectedBranch] = useState(branches[0]);

	const handleLogout = () => {
		logout();
		navigate({ to: "/login" });
	};

	const userInitials = user?.name
		? user.name
				.split(" ")
				.map((n) => n[0])
				.join("")
				.toUpperCase()
				.slice(0, 2)
		: "U";

	return (
		<SidebarProvider>
			<Sidebar>
				<SidebarHeader>
					<SidebarMenu>
						<SidebarMenuItem>
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<SidebarMenuButton
										size="lg"
										className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
									>
										<div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
											<Building2 className="size-4" />
										</div>
										<div className="grid flex-1 text-left text-sm leading-tight">
											<span className="truncate font-medium">
												{selectedBranch.name}
											</span>
											<span className="truncate text-xs text-muted-foreground">
												Filial
											</span>
										</div>
										<ChevronsUpDown className="ml-auto" />
									</SidebarMenuButton>
								</DropdownMenuTrigger>
								<DropdownMenuContent
									className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
									align="start"
									side="bottom"
									sideOffset={4}
								>
									{branches.map((branch) => (
										<DropdownMenuItem
											key={branch.id}
											onClick={() => setSelectedBranch(branch)}
										>
											{branch.name}
										</DropdownMenuItem>
									))}
								</DropdownMenuContent>
							</DropdownMenu>
						</SidebarMenuItem>
					</SidebarMenu>
				</SidebarHeader>

				<SidebarContent>
					<SidebarGroup>
						<SidebarGroupContent>
							<SidebarMenu>
								<SidebarMenuItem>
									<SidebarMenuButton asChild>
										<Link to="/dashboard">
											<Home />
											<span>Dashboard</span>
										</Link>
									</SidebarMenuButton>
								</SidebarMenuItem>

								<Collapsible defaultOpen className="group/collapsible">
									<SidebarMenuItem>
										<CollapsibleTrigger asChild>
											<SidebarMenuButton>
												<Users />
												<span>Clientes</span>
												<ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
											</SidebarMenuButton>
										</CollapsibleTrigger>
										<CollapsibleContent>
											<SidebarMenuSub>
												<SidebarMenuSubItem>
													<SidebarMenuSubButton asChild>
														<Link to="/dashboard">
															<span>Listar clientes</span>
														</Link>
													</SidebarMenuSubButton>
												</SidebarMenuSubItem>
												<SidebarMenuSubItem>
													<SidebarMenuSubButton asChild>
														<Link to="/dashboard">
															<span>Novo cliente</span>
														</Link>
													</SidebarMenuSubButton>
												</SidebarMenuSubItem>
											</SidebarMenuSub>
										</CollapsibleContent>
									</SidebarMenuItem>
								</Collapsible>

								<Collapsible className="group/collapsible">
									<SidebarMenuItem>
										<CollapsibleTrigger asChild>
											<SidebarMenuButton>
												<Wrench />
												<span>Serviços</span>
												<ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
											</SidebarMenuButton>
										</CollapsibleTrigger>
										<CollapsibleContent>
											<SidebarMenuSub>
												<SidebarMenuSubItem>
													<SidebarMenuSubButton asChild>
														<Link to="/dashboard">
															<span>Ordens de serviço</span>
														</Link>
													</SidebarMenuSubButton>
												</SidebarMenuSubItem>
												<SidebarMenuSubItem>
													<SidebarMenuSubButton asChild>
														<Link to="/dashboard">
															<span>Nova ordem</span>
														</Link>
													</SidebarMenuSubButton>
												</SidebarMenuSubItem>
											</SidebarMenuSub>
										</CollapsibleContent>
									</SidebarMenuItem>
								</Collapsible>

								<SidebarMenuItem>
									<SidebarMenuButton asChild>
										<Link to="/dashboard">
											<Settings />
											<span>Configurações</span>
										</Link>
									</SidebarMenuButton>
								</SidebarMenuItem>
							</SidebarMenu>
						</SidebarGroupContent>
					</SidebarGroup>
				</SidebarContent>

				<SidebarFooter>
					<SidebarMenu>
						<SidebarMenuItem>
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<SidebarMenuButton
										size="lg"
										className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
									>
										<Avatar className="size-8 rounded-lg">
											<AvatarImage src="" alt={user?.name || "Usuário"} />
											<AvatarFallback className="rounded-lg">
												{userInitials}
											</AvatarFallback>
										</Avatar>
										<div className="grid flex-1 text-left text-sm leading-tight">
											<span className="truncate font-medium">
												{user?.name || "Usuário"}
											</span>
											<span className="truncate text-xs text-muted-foreground">
												{user?.email || ""}
											</span>
										</div>
										<ChevronsUpDown className="ml-auto size-4" />
									</SidebarMenuButton>
								</DropdownMenuTrigger>
								<DropdownMenuContent
									className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
									side="bottom"
									align="end"
									sideOffset={4}
								>
									<DropdownMenuItem onClick={handleLogout}>
										<LogOut />
										Sair da conta
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</SidebarMenuItem>
					</SidebarMenu>
				</SidebarFooter>
			</Sidebar>

			<SidebarInset>
				<Outlet />
			</SidebarInset>
		</SidebarProvider>
	);
}
