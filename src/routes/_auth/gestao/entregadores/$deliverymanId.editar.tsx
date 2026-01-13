import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { ContentHeader } from "@/components/composite/content-header";
import { DeliverymenForm } from "@/components/forms/deliverymen-form";
import { Alert } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { getDeliverymanById } from "@/modules/deliverymen/deliverymen.service";

export const Route = createFileRoute("/_auth/gestao/entregadores/$deliverymanId/editar")({
  component: EditarEntregador,
});

export function EditarEntregador() {
  const { deliverymanId } = Route.useParams();

  const {
    data: deliveryman,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["deliverymen", deliverymanId],
    queryFn: () => getDeliverymanById(deliverymanId),
  });

  if (isLoading) {
    return (
      <main>
        <ContentHeader
          breadcrumbItems={[
            { title: "Entregadores", href: "/gestao/entregadores" },
            { title: "Editar Entregador" },
          ]}
        />
        <div className="p-6">
          <Skeleton className="h-96 w-full" />
        </div>
      </main>
    );
  }

  if (isError) {
    return (
      <main>
        <ContentHeader
          breadcrumbItems={[
            { title: "Entregadores", href: "/gestao/entregadores" },
            { title: "Erro" },
          ]}
        />
        <Alert variant="destructive" className="m-6">
          Erro ao carregar entregador para edição.
        </Alert>
      </main>
    );
  }

  return (
    <main>
      <ContentHeader
        breadcrumbItems={[
          { title: "Entregadores", href: "/gestao/entregadores" },
          {
            title: deliveryman?.name || "Detalhes do entregador",
            href: `/gestao/entregadores/${deliverymanId}/detalhe`,
          },
          { title: "Editar" },
        ]}
      />
      <DeliverymenForm deliveryman={deliveryman} />
    </main>
  );
}
