import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { ExternalLink, FileText } from "lucide-react";
import { ContentHeader } from "@/components/composite/content-header";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
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

  const getFileNameFromUrl = (url: string) => {
    try {
      const decodedUrl = decodeURIComponent(url);
      const matches = decodedUrl.match(/[^/]+(?=\?|$)/);
      if (matches) {
        const fullName = matches[0];
        const nameParts = fullName.split("-");
        return nameParts.length > 1 ? nameParts.slice(1).join("-") : fullName;
      }
      return "Documento";
    } catch {
      return "Documento";
    }
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
            <div>
              <Heading variant="h1" className="mb-2">
                {deliveryman.name}
              </Heading>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Basic Info */}
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
              </div>
            </div>

            <Separator />

            {/* Documents */}
            {deliveryman.files && deliveryman.files.length > 0 && (
              <>
                <div>
                  <Heading variant="h3" className="mb-4">
                    Documentos
                  </Heading>
                  <div className="space-y-3">
                    <ul className="space-y-2">
                      {deliveryman.files.map((fileUrl) => (
                        <li
                          key={fileUrl}
                          className="flex items-center justify-between gap-3 rounded-lg border bg-card p-3"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <FileText className="size-5 shrink-0 text-muted-foreground" />
                            <span className="truncate text-sm font-medium">
                              {getFileNameFromUrl(fileUrl)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <a
                              href={fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                            >
                              <ExternalLink className="size-4" />
                              <span className="sr-only">Abrir arquivo</span>
                            </a>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Bank / PIX */}
            <div>
              <Heading variant="h3" className="mb-4">
                Pagamento / Conta
              </Heading>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Text variant="muted">Chave PIX Principal</Text>
                  <Text variant="large">{deliveryman.mainPixKey || "N/A"}</Text>
                </div>

                <div className="space-y-2">
                  <Text variant="muted">Chave PIX Secundária</Text>
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
              </div>
            </div>

            <Separator />

            {/* Vehicle */}
            <div>
              <Heading variant="h3" className="mb-4">
                Veículo
              </Heading>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
            </div>

            <Separator />

            {/* Dates */}
            <div className="grid grid-cols-2 gap-6">
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
