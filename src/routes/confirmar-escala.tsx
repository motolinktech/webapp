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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useState } from "react";

const searchParamsSchema = z.object({
  token: z.string(),
  clientName: z.string().optional(),
  clientAddress: z.string().optional(),
  shiftDate: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
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

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
}

type WorkShiftDetailsProps = {
  clientName?: string;
  clientAddress?: string;
  shiftDate?: string;
  startTime?: string;
  endTime?: string;
};

function WorkShiftDetails({
  clientName,
  clientAddress,
  shiftDate,
  startTime,
  endTime,
}: WorkShiftDetailsProps) {
  const hasDetails = clientName || clientAddress || shiftDate || startTime || endTime;

  if (!hasDetails) return null;

  return (
    <div className="space-y-3 text-left bg-muted/50 rounded-lg p-4">
      {clientName && (
        <div>
          <Text variant="muted" className="text-xs">Cliente</Text>
          <Text className="font-medium">{clientName}</Text>
        </div>
      )}
      {clientAddress && (
        <div>
          <Text variant="muted" className="text-xs">Endereço</Text>
          <Text className="font-medium">{clientAddress}</Text>
        </div>
      )}
      {shiftDate && (
        <div>
          <Text variant="muted" className="text-xs">Data</Text>
          <Text className="font-medium">{formatDate(shiftDate)}</Text>
        </div>
      )}
      {(startTime || endTime) && (
        <div>
          <Text variant="muted" className="text-xs">Horário</Text>
          <Text className="font-medium">
            {startTime && endTime
              ? `${startTime} - ${endTime}`
              : startTime || endTime}
          </Text>
        </div>
      )}
    </div>
  );
}

function ConfirmarEscala() {
  const { token, clientName, clientAddress, shiftDate, startTime, endTime } = Route.useSearch();
  const [submitted, setSubmitted] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

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
            <WorkShiftDetails
              clientName={clientName}
              clientAddress={clientAddress}
              shiftDate={shiftDate}
              startTime={startTime}
              endTime={endTime}
            />
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

          <WorkShiftDetails
            clientName={clientName}
            clientAddress={clientAddress}
            shiftDate={shiftDate}
            startTime={startTime}
            endTime={endTime}
          />

          <Label className="flex items-start gap-3 rounded-lg border p-3 cursor-pointer">
            <Checkbox
              id="terms-checkbox"
              checked={termsAccepted}
              onCheckedChange={(val) => setTermsAccepted(val === true)}
              className="mt-0.5"
            />
            <span className="text-sm text-muted-foreground leading-relaxed">
              Ao aceitar a escala, declaro ciência e concordância em comparecer e executar as atividades nos horários informados. Caso haja impossibilidade, comprometo-me a avisar com, no mínimo, 24 (vinte e quatro) horas de antecedência ou indicar substituto autorizado pela empresa, sob pena de exclusão da base e dos grupos de vagas. E o intervalo deverá ocorrer entre entregas, com tempo suficiente para necessidades pessoais.
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
