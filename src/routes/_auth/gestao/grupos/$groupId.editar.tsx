import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { ContentHeader } from "@/components/composite/content-header";
import { GroupsForm } from "@/components/forms/groups-form";
import { Alert } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { getGroupById } from "@/modules/groups/groups.service";

export const Route = createFileRoute("/_auth/gestao/grupos/$groupId/editar")({
  component: EditarGrupo,
});

export function EditarGrupo() {
  const { groupId } = Route.useParams();

  const {
    data: group,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["groups", groupId],
    queryFn: () => getGroupById(groupId),
  });

  if (isLoading) {
    return (
      <main>
        <ContentHeader
          breadcrumbItems={[
            { title: "Grupos", href: "/gestao/grupos" },
            { title: "Editar Grupo" },
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
            { title: "Grupos", href: "/gestao/grupos" },
            { title: "Erro" },
          ]}
        />
        <Alert variant="destructive" className="m-6">
          Erro ao carregar grupo para edição.
        </Alert>
      </main>
    );
  }

  return (
    <main>
      <ContentHeader
        breadcrumbItems={[
          { title: "Grupos", href: "/gestao/grupos" },
          {
            title: group?.name || "Detalhes do grupo",
            href: `/gestao/grupos/${groupId}/detalhe`,
          },
          { title: "Editar" },
        ]}
      />
      <GroupsForm group={group} />
    </main>
  );
}
