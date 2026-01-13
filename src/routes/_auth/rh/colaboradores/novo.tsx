import { createFileRoute } from "@tanstack/react-router";
import { ContentHeader } from "@/components/composite/content-header";
import { UserForm } from "@/components/forms/user-form";

export const Route = createFileRoute("/_auth/rh/colaboradores/novo")({
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
