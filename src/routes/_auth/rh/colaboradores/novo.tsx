import { createFileRoute } from "@tanstack/react-router";
import { ContentHeader } from "@/components/composite/content-header";

export const Route = createFileRoute("/_auth/rh/colaboradores/novo")({
  component: NovoColaborador,
});

export function NovoColaborador() {
  return (
    <main>
      <ContentHeader breadcrumbItems={[{ title: `Colaboradores`, href: '/rh/colaboradores' }]} />

    </main>
  );
}
