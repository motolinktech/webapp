import { createFileRoute, redirect } from "@tanstack/react-router";
import { toast } from "sonner";
import { ContentHeader } from "@/components/composite/content-header";
import { DeliverymenForm } from "@/components/forms/deliverymen-form";
import { hasPermissions } from "@/lib/utils/has-permissions";
import { getStoredUser } from "@/modules/auth/auth.service";

export const Route = createFileRoute("/_auth/gestao/entregadores/novo")({
  beforeLoad: () => {
    const user = getStoredUser();
    if (!user || !hasPermissions(user, "manager.create")) {
      toast.error("Você não tem permissão para criar entregadores.");
      throw redirect({ to: "/dashboard" });
    }
  },
  component: NovoEntregador,
});

export function NovoEntregador() {
  return (
    <main>
      <ContentHeader
        breadcrumbItems={[
          { title: "Entregadores", href: "/gestao/entregadores" },
          { title: "Novo Entregador" },
        ]}
      />
      <DeliverymenForm deliveryman={undefined} />
    </main>
  );
}
