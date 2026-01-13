import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { ContentHeader } from "@/components/composite/content-header";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Text } from "@/components/ui/text";
import { cpfMask } from "@/lib/masks/cpf-mask";
import { phoneMask } from "@/lib/masks/phone-mask";
import { getDeliverymanById } from "@/modules/deliverymen/deliverymen.service";

export const Route = createFileRoute("/_auth/gestao/entregadores/$deliverymanId/detalhe")({
  component: DeliverymanDetails,
});

function DeliverymanDetails() {
  const { deliverymanId } = Route.useParams();

  const {
    data: deliveryman,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["deliverymen", deliverymanId],
    queryFn: () => getDeliverymanById(deliverymanId),
  });

  const getStatusVariant = (isDeleted: boolean, isBlocked: boolean) => {
    if (isDeleted) return "destructive";
    if (isBlocked) return "secondary";
    return "default";
  };

  const getStatusText = (isDeleted: boolean, isBlocked: boolean) => {
    if (isDeleted) return "Deletado";
    if (isBlocked) return "Bloqueado";
    return "Ativo";
  };

  if (isLoading) {
    return (
      <main>
        <ContentHeader
          breadcrumbItems={[
            { title: "Entregadores", href: "/gestao/entregadores" },
            { title: "Detalhes" },
          ]}
        />
        <div className="p-6">
          <Skeleton className="mb-4 h-8 w-1/3" />
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </div>
      </main>
    );
  }

  if (isError || !deliveryman) {
    return (
      <main>
        <ContentHeader
          breadcrumbItems={[
            { title: "Entregadores", href: "/gestao/entregadores" },
            { title: "Erro" },
          ]}
        />
        <Alert variant="destructive" className="m-6">
          Erro ao carregar detalhes do entregador
        </Alert>
      </main>
    );
  }

  return (
    <main>
      <ContentHeader
        breadcrumbItems={[
          { title: "Entregadores", href: "/gestao/entregadores" },
          { title: deliveryman.name },
        ]}
      />
      <div className="p-6">
        <div className="rounded-md border bg-card p-6">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Text variant="muted">Nome</Text>
                <Text variant="large" className="font-medium">
                  {deliveryman.name}
                </Text>
              </div>
              <div className="space-y-2">
                <Text variant="muted">CPF</Text>
                <Text variant="large">{cpfMask(deliveryman.document)}</Text>
              </div>
              <div className="space-y-2">
                <Text variant="muted">Telefone</Text>
                <Text variant="large">{phoneMask(deliveryman.phone)}</Text>
              </div>
              <div className="space-y-2">
                <Text variant="muted">Status</Text>
                <div>
                  <Badge
                    variant={
                      getStatusVariant(deliveryman.isDeleted, deliveryman.isBlocked) as
                        | "default"
                        | "secondary"
                        | "destructive"
                    }
                  >
                    {getStatusText(deliveryman.isDeleted, deliveryman.isBlocked)}
                  </Badge>
                </div>
              </div>
              <div className="space-y-2">
                <Text variant="muted">Tipo de contrato</Text>
                <Text variant="large">{deliveryman.contractType}</Text>
              </div>
              <div className="space-y-2">
                <Text variant="muted">Região</Text>
                <Text variant="large">{deliveryman.region?.name || "N/A"}</Text>
              </div>
              <div className="space-y-2">
                <Text variant="muted">Chave PIX Principal</Text>
                <Text variant="large">{deliveryman.mainPixKey}</Text>
              </div>
              <div className="space-y-2">
                <Text variant="muted">Chave PIX Secundaria</Text>
                <Text variant="large">{deliveryman.secondPixKey || "N/A"}</Text>
              </div>
              <div className="space-y-2">
                <Text variant="muted">Chave PIX Terciária</Text>
                <Text variant="large">{deliveryman.thridPixKey || "N/A"}</Text>
              </div>
              <div className="space-y-2">
                <Text variant="muted">Conta</Text>
                <Text variant="large">{deliveryman.account || "N/A"}</Text>
              </div>
              <div className="space-y-2">
                <Text variant="muted">Agência</Text>
                <Text variant="large">{deliveryman.agency || "N/A"}</Text>
              </div>
              <div className="space-y-2">
                <Text variant="muted">Modelo do Veículo</Text>
                <Text variant="large">{deliveryman.vehicleModel || "N/A"}</Text>
              </div>
              <div className="space-y-2">
                <Text variant="muted">Cor do Veículo</Text>
                <Text variant="large">{deliveryman.vehicleColor || "N/A"}</Text>
              </div>
              <div className="space-y-2">
                <Text variant="muted">Placa do Veículo</Text>
                <Text variant="large">{deliveryman.vehiclePlate || "N/A"}</Text>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 pt-6 border-t">
              <div className="space-y-2">
                <Text variant="muted">Data de Criação</Text>
                <Text variant="small">
                  {new Date(deliveryman.createdAt).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </div>

              <div className="space-y-2">
                <Text variant="muted">Última Atualização</Text>
                <Text variant="small">
                  {new Date(deliveryman.updatedAt).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
