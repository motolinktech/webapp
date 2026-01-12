import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Text } from "@/components/ui/text";
import { getClientById } from "@/modules/clients/clients.service";

export const Route = createFileRoute("/_auth/gestao/clientes/$clientId")({
  component: ClientDetails,
});

function ClientDetails() {
  const navigate = useNavigate();
  const { clientId } = Route.useParams();

  const {
    data: client,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["clients", clientId],
    queryFn: () => getClientById(clientId),
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <Skeleton className="mb-4 h-8 w-1/3" />
        <div className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    );
  }

  if (isError || !client) {
    return (
      <Alert variant="destructive" className="m-6">
        Erro ao carregar detalhes do cliente
      </Alert>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate({ to: "/gestao/clientes" })}
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Detalhes do Cliente</h1>
            <p className="text-muted-foreground mt-1">
              Informações completas do cliente
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-md border bg-card p-6">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Text variant="muted">Nome</Text>
              <Text variant="large" className="font-medium">
                {client.name}
              </Text>
            </div>

            <div className="space-y-2">
              <Text variant="muted">CNPJ</Text>
              <Text variant="large">{client.cnpj}</Text>
            </div>

            <div className="space-y-2">
              <Text variant="muted">Nome do Contato</Text>
              <Text variant="large">{client.contactName}</Text>
            </div>

            <div className="space-y-2">
              <Text variant="muted">Telefone do Contato</Text>
              <Text variant="large">{client.contactPhone || "N/A"}</Text>
            </div>

            <div className="space-y-2">
              <Text variant="muted">CEP</Text>
              <Text variant="large">{client.cep}</Text>
            </div>

            <div className="space-y-2">
              <Text variant="muted">Endereço</Text>
              <Text variant="large">
                {`${client.street}, ${client.number} ${client.complement ? `- ${client.complement}` : ""}`}
              </Text>
            </div>

            <div className="space-y-2">
              <Text variant="muted">Bairro</Text>
              <Text variant="large">{client.neighborhood}</Text>
            </div>

            <div className="space-y-2">
              <Text variant="muted">Cidade/UF</Text>
              <Text variant="large">
                {client.city} / {client.uf}
              </Text>
            </div>

            <div className="space-y-2">
              <Text variant="muted">Região</Text>
              <Text variant="large">{client.region?.name || "N/A"}</Text>
            </div>

            <div className="space-y-2">
              <Text variant="muted">Grupo</Text>
              <Text variant="large">{client.group?.name || "N/A"}</Text>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 pt-6 border-t">
            <div className="space-y-2">
              <Text variant="muted">Data de Criação</Text>
              <Text variant="small">
                {new Date(client.createdAt).toLocaleDateString("pt-BR", {
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
                {new Date(client.updatedAt).toLocaleDateString("pt-BR", {
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
  );
}
