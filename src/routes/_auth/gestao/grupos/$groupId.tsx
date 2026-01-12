import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Text } from "@/components/ui/text";
import { getGroupById } from "@/modules/groups/groups.service";

export const Route = createFileRoute("/_auth/gestao/grupos/$groupId")({
  component: GroupDetails,
});

function GroupDetails() {
  const navigate = useNavigate();
  const { groupId } = Route.useParams();

  const { data: group, isLoading, isError } = useQuery({
    queryKey: ["groups", groupId],
    queryFn: () => getGroupById(groupId),
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

  if (isError || !group) {
    return (
      <Alert variant="destructive" className="m-6">
        Erro ao carregar detalhes do grupo
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
            onClick={() => navigate({ to: "/gestao/grupos" })}
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Detalhes do Grupo</h1>
            <p className="text-muted-foreground mt-1">
              Informações completas do grupo
            </p>
          </div>
        </div>
      </div>

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
            <Text variant="large">
              {group.description || "Sem descrição"}
            </Text>
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
  );
}
