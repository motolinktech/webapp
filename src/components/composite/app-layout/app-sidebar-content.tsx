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

type SubItem = {
  title: string;
  url: string;
  requiredPermission?: string;
};

type MenuItem = {
  title: string;
  icon: React.ComponentType;
  requiredPermission?: string;
  items: SubItem[];
};

const items: MenuItem[] = [
  {
    title: "Operacional",
    icon: Target,
    requiredPermission: "operational.view",
    items: [
      {
        title: "Planejamento",
        url: "/operacional/planejamento",
      },
      {
        title: "Monitoramento Diario",
        url: "/operacional/monitoramento/diario",
      },
      {
        title: "Monitoramento Semanal",
        url: "/operacional/monitoramento/semanal",
      },
    ],
  },
  {
    title: "Gestão",
    icon: CirclePlus,
    items: [
      {
        title: "Clientes",
        url: "/gestao/clientes",
        requiredPermission: "client.view",
      },
      {
        title: "Entregadores",
        url: "/gestao/entregadores",
        requiredPermission: "deliveryman.view",
      },
      {
        title: "Grupos",
        url: "/gestao/grupos",
        requiredPermission: "group.view",
      },
      {
        title: "Regiões",
        url: "/gestao/regiao",
        requiredPermission: "region.view",
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
    requiredPermission: "user.view",
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

  const filteredItems = items
    .map((item) => {
      if (!user) return null;

      const canAccessGroup = item.requiredPermission ? hasPermissions(user, item.requiredPermission) : true;
      const visibleSubItems = item.items.filter((subItem) => {
        if (subItem.requiredPermission) {
          return hasPermissions(user, subItem.requiredPermission);
        }
        return canAccessGroup;
      });

      if (visibleSubItems.length === 0) return null;

      return {
        ...item,
        items: visibleSubItems,
      };
    })
    .filter((item): item is MenuItem => Boolean(item));

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
                      {item.items.map((subItem) => (
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
