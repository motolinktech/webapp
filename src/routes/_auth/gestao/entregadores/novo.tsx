import { createFileRoute } from "@tanstack/react-router";
import { ContentHeader } from "@/components/composite/content-header";
import { DeliverymenForm } from "@/components/forms/deliverymen-form";

export const Route = createFileRoute("/_auth/gestao/entregadores/novo")({
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
