import { createFileRoute, redirect } from "@tanstack/react-router";
import { toast } from "sonner";
import { ContentHeader } from "@/components/composite/content-header";
import { RegionForm } from "@/components/forms/region-form";
import { hasPermissions } from "@/lib/utils/has-permissions";
import { getStoredUser } from "@/modules/auth/auth.service";

export const Route = createFileRoute("/_auth/gestao/regiao/novo")({
  beforeLoad: () => {
    const user = getStoredUser();
    if (!user || !hasPermissions(user, "region.create")) {
      toast.error("Você não tem permissão para criar regiões.");
      throw redirect({ to: "/dashboard" });
    }
  },
  component: NovaRegiao,
});

export function NovaRegiao() {
  return (
    <main>
      <ContentHeader
        breadcrumbItems={[{ title: "Regiões", href: "/gestao/regiao" }, { title: "Nova Região" }]}
      />
      <RegionForm region={undefined} />
    </main>
  );
}
