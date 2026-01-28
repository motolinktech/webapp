import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import logoImage from "@/assets/motolink.png";
import backgroundImage from "@/assets/rio-de-janeiro.jpg";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Heading } from "@/components/ui/heading";
import { Label } from "@/components/ui/label";
import { Text } from "@/components/ui/text";
import { getApiErrorMessage, publicApi } from "@/lib/services/api";

const searchParamsSchema = z.object({
  inviteId: z.string(),
  token: z.string(),
});

export const Route = createFileRoute("/confirmar-escala")({
  validateSearch: (search) => searchParamsSchema.parse(search),
  component: ConfirmarEscala,
});

type AcceptInvitePayload = {
  isAccepted: boolean;
};

type InviteResponse = {
  id: string;
  token: string;
  status: string;
  workShiftSlotId: string;
  deliverymanId: string | null;
  clientId: string;
  clientName: string;
  clientAddress: string;
  shiftDate: string;
  startTime: string;
  endTime: string;
  sentAt: string;
  expiresAt: string;
  respondedAt?: string | null;
};

async function fetchInvite({ inviteId, token }: { inviteId: string; token: string }) {
  const response = await publicApi.get<InviteResponse>(`/work-shift-slots/invites/${inviteId}`, {
    params: { token },
  });
  return response.data;
}

async function respondInvite({
  inviteId,
  token,
  payload,
}: {
  inviteId: string;
  token: string;
  payload: AcceptInvitePayload;
}) {
  return publicApi.post(`/work-shift-slots/invites/${inviteId}/respond`, payload, {
    params: { token },
  });
}

function formatDate(dateStr: string): string {
  const parsed = new Date(dateStr);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toLocaleDateString("pt-BR");
  }
  const [year, month, day] = dateStr.split("-");
  if (!year || !month || !day) return dateStr;
  return `${day}/${month}/${year}`;
}

function formatTime(dateStr?: string | null): string | null {
  if (!dateStr) return null;
  const parsed = new Date(dateStr);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  }
  return dateStr;
}

type WorkShiftDetailsProps = {
  invite: InviteResponse;
};

function WorkShiftDetails({ invite }: WorkShiftDetailsProps) {
  const startTime = formatTime(invite.startTime);
  const endTime = formatTime(invite.endTime);

  return (
    <div className="space-y-3 text-left bg-muted/50 rounded-lg p-4">
      <div>
        <Text variant="muted" className="text-xs">
          Cliente
        </Text>
        <Text className="font-medium">{invite.clientName}</Text>
      </div>
      {invite.clientAddress && (
        <div>
          <Text variant="muted" className="text-xs">
            Endereço
          </Text>
          <Text className="font-medium">{invite.clientAddress}</Text>
        </div>
      )}
      {invite.shiftDate && (
        <div>
          <Text variant="muted" className="text-xs">
            Data
          </Text>
          <Text className="font-medium">{formatDate(invite.shiftDate)}</Text>
        </div>
      )}
      {(startTime || endTime) && (
        <div>
          <Text variant="muted" className="text-xs">
            Horário
          </Text>
          <Text className="font-medium">
            {startTime && endTime ? `${startTime} - ${endTime}` : startTime || endTime}
          </Text>
        </div>
      )}
    </div>
  );
}

function ConfirmarEscala() {
  const { inviteId, token } = Route.useSearch();
  const [submitted, setSubmitted] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const {
    data: invite,
    isLoading: isLoadingInvite,
    isError: isInviteError,
    error: inviteError,
  } = useQuery({
    queryKey: ["work-shift-invite", inviteId, token],
    queryFn: () => fetchInvite({ inviteId, token }),
  });

  const isInviteClosed = invite?.status && invite.status !== "PENDING";

  const mutation = useMutation({
    mutationFn: (payload: AcceptInvitePayload) => respondInvite({ inviteId, token, payload }),
    onSuccess: (_, variables) => {
      setSubmitted(true);
      setAccepted(variables.isAccepted);
      if (variables.isAccepted) {
        toast.success("Escala confirmada com sucesso!");
      } else {
        toast.info("Escala recusada.");
      }
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error) || "Ocorreu um erro ao processar sua resposta.");
    },
  });

  if (isLoadingInvite) {
    return (
      <div className="flex min-h-screen">
        <div className="hidden lg:flex lg:w-2/3 bg-muted items-center justify-center relative">
          <Text variant="muted" className="absolute">
            Carregando paisagem carioca...
          </Text>
          <img src={backgroundImage} alt="Rio de Janeiro" className="w-full h-full object-cover" />
        </div>

        <div className="w-full lg:w-1/3 bg-background flex flex-col justify-center px-8 py-12">
          <div className="mx-auto w-full max-w-sm space-y-6 text-center">
            <img src={logoImage} alt="Motolink Logo" className="w-64 mx-auto" />
            <Heading>Carregando convite...</Heading>
            <Text variant="muted">Aguarde enquanto buscamos as informações da escala.</Text>
          </div>
        </div>
      </div>
    );
  }

  if (!invite) {
    const message =
      getApiErrorMessage(inviteError) ||
      "Não foi possível carregar este convite. Verifique o link e tente novamente.";

    return (
      <div className="flex min-h-screen">
        <div className="hidden lg:flex lg:w-2/3 bg-muted items-center justify-center relative">
          <Text variant="muted" className="absolute">
            Carregando paisagem carioca...
          </Text>
          <img src={backgroundImage} alt="Rio de Janeiro" className="w-full h-full object-cover" />
        </div>

        <div className="w-full lg:w-1/3 bg-background flex flex-col justify-center px-8 py-12">
          <div className="mx-auto w-full max-w-sm space-y-6 text-center">
            <img src={logoImage} alt="Motolink Logo" className="w-64 mx-auto" />
            <Alert>
              <AlertTitle>Convite indisponível</AlertTitle>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          </div>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex min-h-screen">
        <div className="hidden lg:flex lg:w-2/3 bg-muted items-center justify-center relative">
          <Text variant="muted" className="absolute">
            Carregando paisagem carioca...
          </Text>
          <img src={backgroundImage} alt="Rio de Janeiro" className="w-full h-full object-cover" />
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
            <WorkShiftDetails invite={invite} />
          </div>
        </div>
      </div>
    );
  }

  if (isInviteError || isInviteClosed) {
    const message = isInviteClosed
      ? "Este convite já foi respondido ou expirou. Caso precise de ajuda, entre em contato com o suporte."
      : getApiErrorMessage(inviteError) ||
        "Não foi possível carregar este convite. Verifique o link e tente novamente.";

    return (
      <div className="flex min-h-screen">
        <div className="hidden lg:flex lg:w-2/3 bg-muted items-center justify-center relative">
          <Text variant="muted" className="absolute">
            Carregando paisagem carioca...
          </Text>
          <img src={backgroundImage} alt="Rio de Janeiro" className="w-full h-full object-cover" />
        </div>

        <div className="w-full lg:w-1/3 bg-background flex flex-col justify-center px-8 py-12">
          <div className="mx-auto w-full max-w-sm space-y-6 text-center">
            <img src={logoImage} alt="Motolink Logo" className="w-64 mx-auto" />
            <Alert>
              <AlertTitle>Convite indisponível</AlertTitle>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
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
        <img src={backgroundImage} alt="Rio de Janeiro" className="w-full h-full object-cover" />
      </div>

      <div className="w-full lg:w-1/3 bg-background flex flex-col justify-center px-8 py-12">
        <div className="mx-auto w-full max-w-sm space-y-6">
          <div className="space-y-2 text-center">
            <img src={logoImage} alt="Motolink Logo" className="w-64 mx-auto" />

            <Heading>Confirmar Escala</Heading>
            <Text variant="muted">Você deseja aceitar esta escala de trabalho?</Text>
          </div>

          <WorkShiftDetails invite={invite} />

          <Label className="flex items-start gap-3 rounded-lg border p-3 cursor-pointer">
            <Checkbox
              id="terms-checkbox"
              checked={termsAccepted}
              onCheckedChange={(val) => setTermsAccepted(val === true)}
              className="mt-0.5"
            />
            <span className="text-sm text-muted-foreground leading-relaxed">
              Ao aceitar a escala, declaro ciência e concordância em comparecer e executar as
              atividades nos horários informados. Caso haja impossibilidade, comprometo-me a avisar
              com, no mínimo, 24 (vinte e quatro) horas de antecedência ou indicar substituto
              autorizado pela empresa, sob pena de exclusão da base e dos grupos de vagas. E o
              intervalo deverá ocorrer entre entregas, com tempo suficiente para necessidades
              pessoais.
            </span>
          </Label>

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
              disabled={mutation.isPending || !termsAccepted}
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
