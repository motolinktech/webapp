import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { ContentHeader } from "@/components/composite/content-header";
import { UserForm } from "@/components/forms/user-form";
import { Alert } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { getUserById } from "@/modules/users/users.service";

export const Route = createFileRoute("/_auth/rh/colaboradores/$userId/editar")({
  component: EditarColaborador,
});

export function EditarColaborador() {
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
            { title: "Editar Colaborador" },
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
            { title: "Colaboradores", href: "/rh/colaboradores" },
            { title: "Erro" },
          ]}
        />
        <Alert variant="destructive" className="m-6">
          Erro ao carregar colaborador para edição.
        </Alert>
      </main>
    );
  }

  return (
    <main>
      <ContentHeader
        breadcrumbItems={[
          { title: "Colaboradores", href: "/rh/colaboradores" },
          {
            title: user?.name || "Detalhes do usuário",
            href: `/rh/colaboradores/${userId}/detalhe`,
          },
          { title: "Editar" },
        ]}
      />
      <UserForm user={user} />
    </main>
  );
}
