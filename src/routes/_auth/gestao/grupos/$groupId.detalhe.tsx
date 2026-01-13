import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { ContentHeader } from "@/components/composite/content-header";
import { Alert } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Text } from "@/components/ui/text";
import { getGroupById } from "@/modules/groups/groups.service";

export const Route = createFileRoute("/_auth/gestao/grupos/$groupId/detalhe")({
  component: GroupDetails,
});

function GroupDetails() {
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
          breadcrumbItems={[{ title: "Grupos", href: "/gestao/grupos" }, { title: "Detalhes" }]}
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

  if (isError || !group) {
    return (
      <main>
        <ContentHeader
          breadcrumbItems={[{ title: "Grupos", href: "/gestao/grupos" }, { title: "Erro" }]}
        />
        <Alert variant="destructive" className="m-6">
          Erro ao carregar detalhes do grupo.
        </Alert>
      </main>
    );
  }

  return (
    <main>
      <ContentHeader
        breadcrumbItems={[{ title: "Grupos", href: "/gestao/grupos" }, { title: group.name }]}
      />
      <div className="p-6">
        <div className="rounded-md border bg-card p-6">
          <div className="space-y-6">
            <div className="space-y-2">
              <Text variant="muted">Nome</Text>
              <Text variant="large" className="font-medium">
                {group.name}
              </Text>
            </div>

            <div className="space-y-2">
              <Text variant="muted">Descrição</Text>
              <Text variant="large">{group.description || "Sem descrição"}</Text>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Text variant="muted">Data de Criação</Text>
                <Text variant="small">
                  {new Date(group.createdAt).toLocaleDateString("pt-BR", {
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
                  {new Date(group.updatedAt).toLocaleDateString("pt-BR", {
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
