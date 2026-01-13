import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import logoImage from "@/assets/motolink.png";
import backgroundImage from "@/assets/rio-de-janeiro.jpg";
import { ChangePasswordForm } from "@/components/forms/change-password-form";
import { Text } from "@/components/ui/text";

const searchParamsSchema = z.object({
  token: z.string(),
  userId: z.string(),
});

export const Route = createFileRoute("/trocar-senha")({
  validateSearch: (search) => searchParamsSchema.parse(search),
  component: TrocarSenha,
});

function TrocarSenha() {
  const { token, userId } = Route.useSearch();

  return (
    <div className="flex min-h-screen">
      <div className="hidden lg:flex lg:w-2/3 bg-muted items-center justify-center relative">
        <Text variant="muted" className="absolute">
          Carregando paisagem carioca...
        </Text>
        <img
          src={backgroundImage}
          alt="Rio de Janeiro"
          className="w-full h-full object-cover"
        />
      </div>

      <div className="w-full lg:w-1/3 bg-background flex flex-col justify-center px-8 py-12">
        <div className="mx-auto w-full max-w-sm space-y-6">
          <div className="space-y-2 text-center">
            <img src={logoImage} alt="Motolink Logo" className="w-64 mx-auto" />

            <Text variant="muted">
              Digite sua nova senha para acessar o sistema.
            </Text>
          </div>

          <ChangePasswordForm userId={userId} token={token} />
        </div>
      </div>
    </div>
  );
}
