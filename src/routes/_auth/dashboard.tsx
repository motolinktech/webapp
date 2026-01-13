import { createFileRoute } from "@tanstack/react-router";
import { CalendarIcon, ClockIcon } from "lucide-react";
import { useGlobal } from "@/contexts/global-context";

export const Route = createFileRoute("/_auth/dashboard")({
  component: Dashboard,
});

// Mock data for schedule
const scheduleData = {
  today: [
    {
      time: "09:00",
      title: "Coleta em Supermercado X",
      description: "Retirar 10 caixas de produtos.",
    },
    {
      time: "10:00",
      title: "Reunião de Equipe",
      description: "Alinhamento de projetos.",
    },
    {
      time: "14:00",
      title: "Reunião com a equipe",
      description: "Alinhamento sobre novas rotas.",
    },
  ],
  tomorrow: [
    {
      time: "09:00",
      title: "Aniversário do Usuário",
      description: "Parabéns!",
    },
    {
      time: "10:00",
      title: "Manutenção na Moto 01",
      description: "Troca de óleo e verificação de freios.",
    },
    {
      time: "13:00",
      title: "Coleta em Fornecedor Z",
      description: "Retirar material de escritório.",
    },
    {
      time: "16:00",
      title: "Entrega expressa",
      description: "Documentos importantes para empresa A.",
    },
    {
      time: "17:00",
      title: "Planejamento da Próxima Semana",
      description: "Revisão de tarefas e definição de metas.",
    },
  ],
};

function Dashboard() {
  const { user } = useGlobal();

  return (
    <div className="grid h-full grid-cols-1 gap-6 p-6 lg:grid-cols-2">
      {/* Left Column */}
      <div className="lg:col-span-1">
        <h1 className="text-2xl font-bold">Olá, {user?.name || "Usuário"}</h1>
        <p className="mt-2 text-muted-foreground">
          Bem-vindo ao painel de controle.
        </p>
      </div>

      {/* Right Column: Schedule */}
      <div className="lg:col-span-1">
        <div className="h-full rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="flex h-full flex-col">
            <div className="flex items-center gap-3 border-b p-4">
              <CalendarIcon className="h-6 w-6" />
              <h3 className="text-lg font-semibold">Agenda</h3>
            </div>
            <div className="flex-1 space-y-6 overflow-y-auto p-4">
              {/* Today's schedule - full detail */}
              <div>
                <h4 className="mb-3 text-lg font-bold">Hoje</h4>
                <div className="space-y-4">
                  {scheduleData.today.map((event, index) => (
                    <div key={index} className="flex items-start gap-4">
                      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <ClockIcon className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="font-semibold">{event.time}</p>
                        <p className="text-sm text-muted-foreground">{event.title}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tomorrow's schedule - less detail */}
              <div>
                <h4 className="mb-3 text-lg font-semibold">Amanhã</h4>
                <div className="space-y-2">
                  {scheduleData.tomorrow.map((event, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-muted-foreground" />
                      <p className="text-sm text-muted-foreground">{event.title}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
