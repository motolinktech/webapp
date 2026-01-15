import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { ContentHeader } from "@/components/composite/content-header";
import { COMMERCIAL_CONDITION_LABELS } from "@/components/forms/clients.constants";
import { Alert } from "@/components/ui/alert";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Text } from "@/components/ui/text";
import { cepMask } from "@/lib/masks/cep-mask";
import { cnpjMask } from "@/lib/masks/cnpj-mask";
import { moneyMask } from "@/lib/masks/money-mask";
import { phoneMask } from "@/lib/masks/phone-mask";
import { getClientById } from "@/modules/clients/clients.service";

export const Route = createFileRoute("/_auth/gestao/clientes/$clientId/detalhe")({
  component: ClientDetails,
});

function formatMoney(value?: number | string) {
  if (value === null || value === undefined) return "N/A";

  if (typeof value === "number") {
    return moneyMask(String(Math.round(value * 100)));
  }

  // string
  const normalized = value.replace(",", ".");
  const parsed = parseFloat(normalized);
  if (!Number.isNaN(parsed)) {
    return moneyMask(String(Math.round(parsed * 100)));
  }

  const digits = value.replace(/\D/g, "");
  if (!digits) return "N/A";
  return moneyMask(digits);
}

function ClientDetails() {
  const { clientId } = Route.useParams();

  const {
    data: client,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["clients", clientId],
    queryFn: () => getClientById(clientId),
  });

  const cc = client?.commercialCondition;
  const paymentForm = cc?.paymentForm || [];
  const dailyPeriods: string[] = cc?.dailyPeriods || [];
  const guaranteedPeriods: string[] = cc?.guaranteedPeriods || [];
  const hasDeliveryArea = Boolean(cc?.deliveryAreaKm && cc.deliveryAreaKm > 0);

  if (isLoading) {
    return (
      <main>
        <ContentHeader
          breadcrumbItems={[{ title: "Clientes", href: "/gestao/clientes" }, { title: "Detalhes" }]}
        />
        <div className="p-6">
          <Skeleton className="mb-4 h-8 w-1/3" />
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </div>
      </main>
    );
  }

  if (isError || !client) {
    return (
      <main>
        <ContentHeader
          breadcrumbItems={[{ title: "Clientes", href: "/gestao/clientes" }, { title: "Erro" }]}
        />
        <Alert variant="destructive" className="m-6">
          Erro ao carregar detalhes do cliente.
        </Alert>
      </main>
    );
  }

  return (
    <main>
      <ContentHeader
        breadcrumbItems={[{ title: "Clientes", href: "/gestao/clientes" }, { title: client.name }]}
      />
      <div className="p-6">
        <div className="rounded-md border bg-card p-6">
          <div className="space-y-6">
            <div>
              <Heading variant="h1" className="mb-8">
                {client.name}
              </Heading>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Text variant="muted">CNPJ</Text>
                  <Text variant="large">{cnpjMask(client.cnpj)}</Text>
                </div>

                <div className="space-y-2">
                  <Text variant="muted">Nome do Contato</Text>
                  <Text variant="large">{client.contactName}</Text>
                </div>

                <div className="space-y-2">
                  <Text variant="muted">Telefone do Contato</Text>
                  <Text variant="large">{client.contactPhone ? phoneMask(client.contactPhone) : "N/A"}</Text>
                </div>

                <div className="space-y-2">
                  <Text variant="muted">Região</Text>
                  <Text variant="large">{client.region?.name || "N/A"}</Text>
                </div>

                <div className="space-y-2">
                  <Text variant="muted">Grupo</Text>
                  <Text variant="large">{client.group?.name || "N/A"}</Text>
                </div>

                <div className="space-y-2 col-span-1 md:col-span-2 lg:col-span-3">
                  <Text variant="muted">Observações</Text>
                  <Text variant="large">{client.observations || "N/A"}</Text>
                </div>
              </div>
            </div>

            <Separator />

            {/* Endereço */}
            <div>
              <Heading variant="h3" className="mb-4">
                Endereço
              </Heading>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Text variant="muted">CEP</Text>
                  <Text variant="large">{cepMask(client.cep)}</Text>
                </div>

                <div className="space-y-2">
                  <Text variant="muted">Endereço</Text>
                  <Text variant="large">
                    {`${client.street}, ${client.number} ${client.complement ? `- ${client.complement}` : ""}`}
                  </Text>
                </div>

                <div className="space-y-2">
                  <Text variant="muted">Bairro</Text>
                  <Text variant="large">{client.neighborhood}</Text>
                </div>

                <div className="space-y-2">
                  <Text variant="muted">Cidade/UF</Text>
                  <Text variant="large">
                    {client.city} / {client.uf}
                  </Text>
                </div>
              </div>
            </div>

            {/* Condições Comerciais */}
            {client.commercialCondition && (
              <>
                <Separator />
                <div>
                  <Heading variant="h3" className="mb-4">
                    Condições Comerciais
                  </Heading>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Text variant="muted">Forma de Pagamento</Text>
                      <Text variant="large">
                        {(cc?.paymentForm || [])
                          .map((p: string) => COMMERCIAL_CONDITION_LABELS[p] || p)
                          .join(", ")}
                      </Text>
                    </div>

                    {cc?.deliveryAreaKm !== undefined && (
                      <div className="space-y-2">
                        <Text variant="muted">Área de Entrega (km)</Text>
                        <Text variant="large">{cc.deliveryAreaKm}</Text>
                      </div>
                    )}

                    {cc?.bagsAllocated !== undefined && (
                      <div className="space-y-2">
                        <Text variant="muted">Bags Alocados</Text>
                        <Text variant="large">{cc.bagsAllocated}</Text>
                      </div>
                    )}

                    {paymentForm.includes("GUARANTEED") && (
                      <>
                        <div className="space-y-2">
                          <Text variant="muted">Cobertura Motolink</Text>
                          <Text variant="large">{cc?.isMotolinkCovered ? "Sim" : "Não"}</Text>
                        </div>

                        {guaranteedPeriods.includes("WEEK_DAY") && (
                          <div className="space-y-2">
                            <Text variant="muted">Diária Garantida (Dia)</Text>
                            <Text variant="large">{cc?.guaranteedDay}</Text>
                          </div>
                        )}

                        {guaranteedPeriods.includes("WEEKEND_DAY") && (
                          <div className="space-y-2">
                            <Text variant="muted">Diária Garantida (Dia/Fim de Semana)</Text>
                            <Text variant="large">{cc?.guaranteedDayWeekend}</Text>
                          </div>
                        )}

                        {guaranteedPeriods.includes("WEEK_NIGHT") && (
                          <div className="space-y-2">
                            <Text variant="muted">Diária Garantida (Noite)</Text>
                            <Text variant="large">{cc?.guaranteedNight}</Text>
                          </div>
                        )}

                        {guaranteedPeriods.includes("WEEKEND_NIGHT") && (
                          <div className="space-y-2">
                            <Text variant="muted">Diária Garantida (Noite/Fim de Semana)</Text>
                            <Text variant="large">{cc?.guaranteedNightWeekend}</Text>
                          </div>
                        )}
                      </>
                    )}

                    {paymentForm.includes("DAILY") && (
                      <>
                        {dailyPeriods.includes("WEEK_DAY") && (
                          <>
                            <div className="space-y-2">
                              <Text variant="muted">Diária Cliente (Dia)</Text>
                              <Text variant="large">{formatMoney(cc?.clientDailyDay)}</Text>
                            </div>
                            <div className="space-y-2">
                              <Text variant="muted">Diária Entregador (Dia)</Text>
                              <Text variant="large">{formatMoney(cc?.deliverymanDailyDay)}</Text>
                            </div>
                          </>
                        )}

                        {dailyPeriods.includes("WEEKEND_DAY") && (
                          <>
                            <div className="space-y-2">
                              <Text variant="muted">Diária Cliente (Dia/Fim de Semana)</Text>
                              <Text variant="large">{formatMoney(cc?.clientDailyDayWknd)}</Text>
                            </div>
                            <div className="space-y-2">
                              <Text variant="muted">Diária Entregador (Dia/Fim de Semana)</Text>
                              <Text variant="large">{formatMoney(cc?.deliverymanDailyDayWknd)}</Text>
                            </div>
                          </>
                        )}

                        {dailyPeriods.includes("WEEK_NIGHT") && (
                          <>
                            <div className="space-y-2">
                              <Text variant="muted">Diária Cliente (Noite)</Text>
                              <Text variant="large">{formatMoney(cc?.clientDailyNight)}</Text>
                            </div>
                            <div className="space-y-2">
                              <Text variant="muted">Diária Entregador (Noite)</Text>
                              <Text variant="large">{formatMoney(cc?.deliverymanDailyNight)}</Text>
                            </div>
                          </>
                        )}

                        {dailyPeriods.includes("WEEKEND_NIGHT") && (
                          <>
                            <div className="space-y-2">
                              <Text variant="muted">Diária Cliente (Noite/Fim de Semana)</Text>
                              <Text variant="large">{formatMoney(cc?.clientDailyNightWknd)}</Text>
                            </div>
                            <div className="space-y-2">
                              <Text variant="muted">Diária Entregador (Noite/Fim de Semana)</Text>
                              <Text variant="large">{formatMoney(cc?.deliverymanDailyNightWknd)}</Text>
                            </div>
                          </>
                        )}
                      </>
                    )}

                    {hasDeliveryArea && (
                      <>
                        <div className="space-y-2">
                          <Text variant="muted">Por Entrega (Cliente)</Text>
                          <Text variant="large">{formatMoney(cc?.clientPerDelivery)}</Text>
                        </div>

                        <div className="space-y-2">
                          <Text variant="muted">Km Adicional (Cliente)</Text>
                          <Text variant="large">{formatMoney(cc?.clientAdditionalKm)}</Text>
                        </div>

                        <div className="space-y-2">
                          <Text variant="muted">Por Entrega (Entregador)</Text>
                          <Text variant="large">{formatMoney(cc?.deliverymanPerDelivery)}</Text>
                        </div>

                        <div className="space-y-2">
                          <Text variant="muted">Km Adicional (Entregador)</Text>
                          <Text variant="large">{formatMoney(cc?.deliverymanAdditionalKm)}</Text>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </>
            )}

            <Separator />

            {/* Datas */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Text variant="muted">Data de Criação</Text>
                <Text variant="small">
                  {new Date(client.createdAt).toLocaleDateString("pt-BR", {
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
                  {new Date(client.updatedAt).toLocaleDateString("pt-BR", {
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
    </main>
  );
}
