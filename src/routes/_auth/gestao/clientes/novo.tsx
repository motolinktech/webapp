import { createFileRoute } from "@tanstack/react-router";
import { ContentHeader } from "@/components/composite/content-header";
import { ClientsForm } from "@/components/forms/clients-form";

export const Route = createFileRoute("/_auth/gestao/clientes/novo")({
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
