import { createFileRoute, redirect } from "@tanstack/react-router";
import { toast } from "sonner";
import { ContentHeader } from "@/components/composite/content-header";
import { UserForm } from "@/components/forms/user-form";
import { hasPermissions } from "@/lib/utils/has-permissions";
import { getStoredUser } from "@/modules/auth/auth.service";

export const Route = createFileRoute("/_auth/rh/colaboradores/novo")({
  beforeLoad: () => {
    const user = getStoredUser();
    if (!user || !hasPermissions(user, "user.create")) {
      toast.error("Você não tem permissão para criar colaboradores.");
      throw redirect({ to: "/dashboard" });
    }
  },
  component: NovoColaborador,
});

export function NovoColaborador() {
  return (
    <main>
      <ContentHeader
        breadcrumbItems={[
          { title: `Colaboradores`, href: "/rh/colaboradores" },
          { title: `Novo Colaborador` },
        ]}
      />
      <UserForm user={undefined} />
    </main>
  );
}
