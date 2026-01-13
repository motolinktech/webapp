import { createFileRoute } from "@tanstack/react-router";
import { ContentHeader } from "@/components/composite/content-header";
import { GroupsForm } from "@/components/forms/groups-form";

export const Route = createFileRoute("/_auth/gestao/grupos/novo")({
  component: NovoGrupo,
});

export function NovoGrupo() {
  return (
    <main>
      <ContentHeader
        breadcrumbItems={[
          { title: "Grupos", href: "/gestao/grupos" },
          { title: "Novo Grupo" },
        ]}
      />
      <GroupsForm group={undefined} />
    </main>
  );
}
