import { createFileRoute, redirect } from "@tanstack/react-router";
import { toast } from "sonner";
import { ContentHeader } from "@/components/composite/content-header";
import { GroupsForm } from "@/components/forms/groups-form";
import { hasPermissions } from "@/lib/utils/has-permissions";
import { getStoredUser } from "@/modules/auth/auth.service";

export const Route = createFileRoute("/_auth/gestao/grupos/novo")({
  beforeLoad: () => {
    const user = getStoredUser();
    if (!user || !hasPermissions(user, "manager.create")) {
      toast.error("Você não tem permissão para criar grupos.");
      throw redirect({ to: "/dashboard" });
    }
  },
  component: NovoGrupo,
});

export function NovoGrupo() {
  return (
    <main>
      <ContentHeader
        breadcrumbItems={[{ title: "Grupos", href: "/gestao/grupos" }, { title: "Novo Grupo" }]}
      />
      <GroupsForm group={undefined} />
    </main>
  );
}
