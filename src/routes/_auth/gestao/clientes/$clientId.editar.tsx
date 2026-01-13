import { useQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { toast } from "sonner";

import { ContentHeader } from "@/components/composite/content-header";
import { ClientsForm } from "@/components/forms/clients-form";
import { Alert } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { hasPermissions } from "@/lib/utils/has-permissions";
import { getStoredUser } from "@/modules/auth/auth.service";
import { getClientById } from "@/modules/clients/clients.service";

export const Route = createFileRoute("/_auth/gestao/clientes/$clientId/editar")({
  beforeLoad: () => {
    const user = getStoredUser();
    if (!user || !hasPermissions(user, "client.edit")) {
      toast.error("Você não tem permissão para editar clientes.");
      throw redirect({ to: "/dashboard" });
    }
  },
  component: EditarCliente,
});

export function EditarCliente() {
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
      <main>
        <ContentHeader
          breadcrumbItems={[
            { title: "Clientes", href: "/gestao/clientes" },
            { title: "Editar Cliente" },
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
          breadcrumbItems={[{ title: "Clientes", href: "/gestao/clientes" }, { title: "Erro" }]}
        />
        <Alert variant="destructive" className="m-6">
          Erro ao carregar cliente para edição.
        </Alert>
      </main>
    );
  }

  return (
    <main>
      <ContentHeader
        breadcrumbItems={[
          { title: "Clientes", href: "/gestao/clientes" },
          {
            title: client?.name || "Detalhes do cliente",
            href: `/gestao/clientes/${clientId}/detalhe`,
          },
          { title: "Editar" },
        ]}
      />
      <ClientsForm client={client} />
    </main>
  );
}
