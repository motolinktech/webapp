import { ChevronsUpDown, MapPin } from "lucide-react";
import { useState } from "react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";

const BRANCH_KEY = "motolink_selected_branch";

const branches = [
	{ id: "rj", name: "Rio de Janeiro" },
	{ id: "sp", name: "São Paulo" },
	{ id: "camp", name: "Campinas" },
];

function getStoredBranch() {
	const storedId = localStorage.getItem(BRANCH_KEY);
	return branches.find((b) => b.id === storedId) || branches[0];
}

export function AppSidebarHeader() {
	const [selectedBranch, setSelectedBranch] = useState(getStoredBranch);

	const handleBranchChange = (branch: (typeof branches)[0]) => {
		setSelectedBranch(branch);
		localStorage.setItem(BRANCH_KEY, branch.id);
	};

	return (
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
									<MapPin className="size-4" />
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
									onClick={() => handleBranchChange(branch)}
								>
									{branch.name}
								</DropdownMenuItem>
							))}
						</DropdownMenuContent>
					</DropdownMenu>
				</SidebarMenuItem>
			</SidebarMenu>
		</SidebarHeader>
	);
}
