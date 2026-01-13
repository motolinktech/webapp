import { createFileRoute } from "@tanstack/react-router";
import { ContentHeader } from "@/components/composite/content-header";
import { RegionForm } from "@/components/forms/region-form";

export const Route = createFileRoute("/_auth/gestao/regiao/novo")({
  component: NovaRegiao,
});

export function NovaRegiao() {
  return (
    <main>
      <ContentHeader
        breadcrumbItems={[
          { title: "Regiões", href: "/gestao/regiao" },
          { title: "Nova Região" },
        ]}
      />
      <RegionForm region={undefined} />
    </main>
  );
}
