import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { ContentHeader } from "@/components/composite/content-header";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Text } from "@/components/ui/text";
import { userPermissions } from "@/modules/users/users.constants";
import { getUserById } from "@/modules/users/users.service";

export const Route = createFileRoute("/_auth/rh/colaboradores/$userId/detalhe")({
  component: UserDetails,
});

function UserDetails() {
  const { userId } = Route.useParams();

  const {
    data: user,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["users", userId],
    queryFn: () => getUserById(userId),
  });

  if (isLoading) {
    return (
      <main>
        <ContentHeader
          breadcrumbItems={[
            { title: "Colaboradores", href: "/rh/colaboradores" },
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

  if (isError || !user) {
    return (
      <main>
        <ContentHeader
          breadcrumbItems={[
            { title: "Colaboradores", href: "/rh/colaboradores" },
            { title: "Erro" },
          ]}
        />
        <Alert variant="destructive" className="m-6">
          Erro ao carregar detalhes do colaborador.
        </Alert>
      </main>
    );
  }

  return (
    <main>
      <ContentHeader
        breadcrumbItems={[
          { title: "Colaboradores", href: "/rh/colaboradores" },
          { title: user.name },
        ]}
      />
      <div className="p-6">
        <div className="rounded-md border bg-card p-6">
          <div className="space-y-6">
            <div className="space-y-2">
              <Text variant="muted">Nome</Text>
              <Text variant="large" className="font-medium">
                {user.name}
              </Text>
            </div>

            <div className="space-y-2">
              <Text variant="muted">Email</Text>
              <Text variant="large">{user.email}</Text>
            </div>

            {user.birthDate && (
              <div className="space-y-2">
                <Text variant="muted">Data de Nascimento</Text>
                <Text variant="large">
                  {new Date(user.birthDate).toLocaleDateString("pt-BR")}
                </Text>
              </div>
            )}

            <div className="space-y-2">
              <Text variant="muted">Função</Text>
              <Text variant="large">{user.role}</Text>
            </div>

            <div className="space-y-2">
              <Text variant="muted">Permissões</Text>
              {user.permissions && user.permissions.length > 0 ? (
                <div className="space-y-3">
                  {userPermissions.map((group) => {
                    const groupPermissions = group.rules.filter((rule) =>
                      user.permissions?.includes(rule.permission),
                    );

                    if (groupPermissions.length === 0) return null;

                    return (
                      <div key={group.type} className="space-y-1.5">
                        <Text variant="small" className="font-medium">
                          {group.type}
                        </Text>
                        <div className="flex flex-wrap gap-1.5">
                          {groupPermissions.map((rule) => (
                            <Badge
                              key={rule.permission}
                              variant="secondary"
                              className="text-xs"
                            >
                              {rule.description}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <Text variant="small" className="text-muted-foreground">
                  Nenhuma permissão atribuída
                </Text>
              )}
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Text variant="muted">Data de Criação</Text>
                <Text variant="small">
                  {new Date(user.createdAt).toLocaleDateString("pt-BR", {
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
                  {new Date(user.updatedAt).toLocaleDateString("pt-BR", {
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