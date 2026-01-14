import { Link } from "@tanstack/react-router";
import { BookUser, ChevronDown, CirclePlus, Home, Target } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { hasPermissions } from "@/lib/utils/has-permissions";
import { getStoredUser } from "@/modules/auth/auth.service";

const items = [
  {
    title: "Operacional",
    icon: Target,
    requiredPermission: "manager.view",
    items: [
      {
        title: "Planejamento",
        url: "/operacional/planejamento",
      },
      {
        title: "Monitoramento",
        url: "/operacional/monitoramento/diario",
      },
    ],
  },
  {
    title: "Gestão",
    icon: CirclePlus,
    requiredPermission: "manager.view",
    items: [
      {
        title: "Clientes",
        url: "/gestao/clientes",
        requiredPermission: "client.view",
      },
      {
        title: "Entregadores",
        url: "/gestao/entregadores",
      },
      {
        title: "Grupos",
        url: "/gestao/grupos",
      },
      {
        title: "Regiões",
        url: "/gestao/regiao",
      },
    ],
  },
  // {
  //   title: "Financeiro",
  //   icon: Landmark,
  //   requiredPermission: "financial.view",
  //   items: [
  //     {
  //       title: "Resumo",
  //       url: "/financeiro",
  //     },
  //     {
  //       title: "Solicitação de Pagamento",
  //       url: "/financeiro/solicitacao-pagamento",
  //     },
  //   ],
  // },
  {
    title: "Recursos Humanos",
    icon: BookUser,
    requiredPermission: "employee.view",
    items: [
      {
        title: "Colaboradores",
        url: "/rh/colaboradores",
      },
    ],
  },
];

export function AppSidebarContent() {
  const user = getStoredUser();

  const filteredItems = items.filter((item) => {
    if (!user) return false;
    return hasPermissions(user, item.requiredPermission);
  });

  return (
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

            {filteredItems.map((item) => (
              <Collapsible key={item.title} className="group/collapsible">
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton>
                      <item.icon />
                      <span>{item.title}</span>
                      <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.items
                        .filter((subItem) => {
                          if (!subItem.requiredPermission) return true;
                          if (!user) return false;
                          return hasPermissions(user, subItem.requiredPermission);
                        })
                        .map((subItem) => (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton asChild>
                              <Link to={subItem.url}>
                                <span>{subItem.title}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>
  );
}
