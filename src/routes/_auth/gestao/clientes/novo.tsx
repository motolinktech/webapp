import { createFileRoute, redirect } from "@tanstack/react-router";
import { toast } from "sonner";
import { ContentHeader } from "@/components/composite/content-header";
import { ClientsForm } from "@/components/forms/clients-form";
import { hasPermissions } from "@/lib/utils/has-permissions";
import { getStoredUser } from "@/modules/auth/auth.service";

export const Route = createFileRoute("/_auth/gestao/clientes/novo")({
  beforeLoad: () => {
    const user = getStoredUser();
    if (!user || !hasPermissions(user, "client.create")) {
      toast.error("Você não tem permissão para criar clientes.");
      throw redirect({ to: "/dashboard" });
    }
  },
  component: NovoCliente,
});

export function NovoCliente() {
  return (
    <main>
      <ContentHeader
        breadcrumbItems={[
          { title: "Clientes", href: "/gestao/clientes" },
          { title: "Novo Cliente" },
        ]}
      />
      <ClientsForm client={undefined} />
    </main>
  );
}
