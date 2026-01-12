import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Text } from "@/components/ui/text";
import { getRegionById } from "@/modules/regions/regions.service";

export const Route = createFileRoute("/_auth/gestao/regiao/$regionId")({
  component: RegionDetails,
});

function RegionDetails() {
  const navigate = useNavigate();
  const { regionId } = Route.useParams();

  const { data: region, isLoading, isError } = useQuery({
    queryKey: ["regions", regionId],
    queryFn: () => getRegionById(regionId),
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

  if (isError || !region) {
    return (
      <Alert variant="destructive" className="m-6">
        Erro ao carregar detalhes da região
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
            onClick={() => navigate({ to: "/gestao/regiao" })}
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Detalhes da Região</h1>
            <p className="text-muted-foreground mt-1">
              Informações completas da região
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-md border bg-card p-6">
        <div className="space-y-6">
          <div className="space-y-2">
            <Text variant="muted">Nome</Text>
            <Text variant="large" className="font-medium">
              {region.name}
            </Text>
          </div>

          <div className="space-y-2">
            <Text variant="muted">Descrição</Text>
            <Text variant="large">
              {region.description || "Sem descrição"}
            </Text>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Text variant="muted">Data de Criação</Text>
              <Text variant="small">
                {new Date(region.createdAt).toLocaleDateString("pt-BR", {
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
                {new Date(region.updatedAt).toLocaleDateString("pt-BR", {
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
