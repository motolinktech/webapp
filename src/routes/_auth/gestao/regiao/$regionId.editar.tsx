import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { ContentHeader } from "@/components/composite/content-header";
import { RegionForm } from "@/components/forms/region-form";
import { Alert } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { getRegionById } from "@/modules/regions/regions.service";

export const Route = createFileRoute("/_auth/gestao/regiao/$regionId/editar")({
  component: EditarRegiao,
});

export function EditarRegiao() {
  const { regionId } = Route.useParams();

  const {
    data: region,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["regions", regionId],
    queryFn: () => getRegionById(regionId),
  });

  if (isLoading) {
    return (
      <main>
        <ContentHeader
          breadcrumbItems={[
            { title: "Regiões", href: "/gestao/regiao" },
            { title: "Editar Região" },
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
          breadcrumbItems={[{ title: "Regiões", href: "/gestao/regiao" }, { title: "Erro" }]}
        />
        <Alert variant="destructive" className="m-6">
          Erro ao carregar região para edição.
        </Alert>
      </main>
    );
  }

  return (
    <main>
      <ContentHeader
        breadcrumbItems={[
          { title: "Regiões", href: "/gestao/regiao" },
          {
            title: region?.name || "Detalhes da região",
            href: `/gestao/regiao/${regionId}/detalhe`,
          },
          { title: "Editar" },
        ]}
      />
      <RegionForm region={region} />
    </main>
  );
}
