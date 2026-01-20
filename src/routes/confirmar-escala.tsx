import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import logoImage from "@/assets/motolink.png";
import backgroundImage from "@/assets/rio-de-janeiro.jpg";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { useMutation } from "@tanstack/react-query";
import { publicApi } from "@/lib/services/api";
import { toast } from "sonner";
import { Heading } from "@/components/ui/heading";
import { useState } from "react";

const searchParamsSchema = z.object({
  token: z.string(),
});

export const Route = createFileRoute("/confirmar-escala")({
  validateSearch: (search) => searchParamsSchema.parse(search),
  component: ConfirmarEscala,
});

type AcceptInvitePayload = {
  isAccepted: boolean;
};

async function acceptInvite({
  token,
  payload,
}: {
  token: string;
  payload: AcceptInvitePayload;
}) {
  return publicApi.post(`/work-shift-slots/accept-invite/${token}`, payload);
}

function ConfirmarEscala() {
  const { token } = Route.useSearch();
  const [submitted, setSubmitted] = useState(false);
  const [accepted, setAccepted] = useState(false);

  const mutation = useMutation({
    mutationFn: (payload: AcceptInvitePayload) => acceptInvite({ token, payload }),
    onSuccess: (_, variables) => {
      setSubmitted(true);
      setAccepted(variables.isAccepted);
      if (variables.isAccepted) {
        toast.success("Escala confirmada com sucesso!");
      } else {
        toast.info("Escala recusada.");
      }
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Ocorreu um erro ao processar sua resposta.",
      );
    },
  });

  if (submitted) {
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
          <div className="mx-auto w-full max-w-sm space-y-6 text-center">
            <img src={logoImage} alt="Motolink Logo" className="w-64 mx-auto" />
            {accepted ? (
              <Heading>Obrigado por confirmar!</Heading>
            ) : (
              <Heading>Resposta registrada.</Heading>
            )}
            <Text variant="muted">
              Sua resposta foi registrada com sucesso. Você já pode fechar esta página.
            </Text>
          </div>
        </div>
      </div>
    );
  }

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

            <Heading>Confirmar Escala</Heading>
            <Text variant="muted">Você deseja aceitar esta escala de trabalho?</Text>
          </div>

          <div className="flex gap-4 justify-center">
            <Button
              isLoading={mutation.isPending && mutation.variables?.isAccepted === false}
              disabled={mutation.isPending}
              variant="outline"
              onClick={() => mutation.mutate({ isAccepted: false })}
            >
              Recusar
            </Button>
            <Button
              isLoading={mutation.isPending && mutation.variables?.isAccepted === true}
              disabled={mutation.isPending}
              onClick={() => mutation.mutate({ isAccepted: true })}
            >
              Aceitar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
