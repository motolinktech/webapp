import { useQueryClient } from "@tanstack/react-query";
import { ChevronsUpDown, Loader2, MapPin } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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
import { useGlobal } from "@/contexts/global.context";
import type { Branch } from "@/modules/branches/branches.types";
import { useBranches } from "@/modules/branches/useBranches";

const BRANCH_KEY = "motolink_selected_branch";

export function AppSidebarHeader() {
  const queryClient = useQueryClient();
  const { user } = useGlobal();
  const { data, isLoading } = useBranches();
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);

  const availableBranches = useMemo(() => {
    if (!data?.data || !user) return [];

    if (user.role === "ADMIN") {
      return data.data;
    }

    return data.data.filter((branch) => user.branches.includes(branch.id));
  }, [data?.data, user]);

  useEffect(() => {
    if (availableBranches.length === 0) return;

    const storedId = localStorage.getItem(BRANCH_KEY);
    const currentValidBranch = availableBranches.find((b) => b.id === storedId);

    const newBranch = currentValidBranch || availableBranches[0];

    setSelectedBranch(newBranch);

    if (storedId !== newBranch.id) {
      localStorage.setItem(BRANCH_KEY, newBranch.id);
      queryClient.invalidateQueries();
    }
  }, [availableBranches, queryClient]);

  const handleBranchChange = (branch: Branch) => {
    setSelectedBranch(branch);
    localStorage.setItem(BRANCH_KEY, branch.id);
    queryClient.invalidateQueries();
  };

  if (isLoading) {
    return (
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" disabled>
              <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                <Loader2 className="size-4 animate-spin" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">Carregando...</span>
                <span className="truncate text-xs text-muted-foreground">
                  Filial
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
    );
  }

  if (!selectedBranch) {
    return null;
  }

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
                    {selectedBranch.code}
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
              {availableBranches.map((branch) => (
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
