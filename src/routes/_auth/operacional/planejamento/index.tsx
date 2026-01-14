import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Eye, Info, Pencil } from "lucide-react";
import { useMemo, useState } from "react";
import { ContentHeader } from "@/components/composite/content-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { classHelper } from "@/lib/utils/class-helper";
import { listClients } from "@/modules/clients/clients.service";
import { listGroups } from "@/modules/groups/groups.service";

export const Route = createFileRoute("/_auth/operacional/planejamento/")({
  component: Planejamento,
});

const WEEKDAY_LABELS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sab", "Dom"];

function getWeekDates(): Date[] {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);
  monday.setHours(0, 0, 0, 0);

  const weekDates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    weekDates.push(date);
  }

  return weekDates;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

function Planejamento() {
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");

  const weekDates = useMemo(() => getWeekDates(), []);

  const { data: groupsData, isLoading: isLoadingGroups } = useQuery({
    queryKey: ["groups"],
    queryFn: () => listGroups({ limit: 100 }),
  });

  const { data: clientsData, isLoading: isLoadingClients } = useQuery({
    queryKey: ["clients", selectedGroupId],
    queryFn: () => listClients({ groupId: selectedGroupId, limit: 100 }),
    enabled: !!selectedGroupId,
  });

  const groups = groupsData?.data || [];
  const clients = clientsData?.data || [];

  return (
    <div className="flex flex-1 flex-col">
      <ContentHeader
        breadcrumbItems={[
          { title: "Operacional", href: "/operacional" },
          { title: "Planejamento" },
        ]}
      />

      <div className="flex flex-1 flex-col gap-6 p-6">
        <div>
          <h1 className="text-2xl font-bold">Planejamento</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie o planejamento semanal dos clientes.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-72">
            <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione um grupo" />
              </SelectTrigger>
              <SelectContent>
                {isLoadingGroups ? (
                  <div className="p-2">
                    <Skeleton className="h-6 w-full" />
                  </div>
                ) : (
                  groups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        {!selectedGroupId && (
          <Alert className="w-full">
            <Info className="size-4" />
            <AlertTitle>Nenhum grupo selecionado</AlertTitle>
            <AlertDescription>
              Selecione um grupo para visualizar os clientes e gerenciar o planejamento semanal.
            </AlertDescription>
          </Alert>
        )}

        {selectedGroupId && !isLoadingClients && clients.length === 0 && (
          <Alert className="w-full">
            <Info className="size-4" />
            <AlertTitle>Nenhum cliente encontrado</AlertTitle>
            <AlertDescription>
              Não há clientes cadastrados neste grupo. Adicione clientes para começar o planejamento.
            </AlertDescription>
          </Alert>
        )}

        {selectedGroupId && (isLoadingClients || clients.length > 0) && (
          <div className="rounded-md border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">Cliente</TableHead>
                  {weekDates.map((date, index) => (
                    <TableHead
                      key={date.toISOString()}
                      className={classHelper("w-24 text-center", isToday(date) && "bg-primary/10")}
                    >
                      <div className="flex flex-col items-center">
                        <span className="text-xs font-medium">{WEEKDAY_LABELS[index]}</span>
                        <span
                          className={classHelper(
                            "text-xs",
                            isToday(date) ? "font-bold text-primary" : "text-muted-foreground",
                          )}
                        >
                          {formatDate(date)}
                        </span>
                      </div>
                    </TableHead>
                  ))}
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingClients ? (
                  [...Array(5)].map((_, index) => (
                    <TableRow
                      key={`skeleton-${
                        // biome-ignore lint/suspicious/noArrayIndexKey: skeleton rows
                        index
                        }`}
                    >
                      <TableCell>
                        <Skeleton className="h-8 w-full" />
                      </TableCell>
                      {weekDates.map((date) => (
                        <TableCell key={date.toISOString()}>
                          <Skeleton className="h-8 w-full" />
                        </TableCell>
                      ))}
                      <TableCell>
                        <Skeleton className="h-8 w-16" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  clients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">{client.name}</TableCell>
                      {weekDates.map((date) => (
                        <TableCell
                          key={date.toISOString()}
                          className={classHelper("text-center", isToday(date) && "bg-primary/5")}
                        >
                          <Input
                            type="number"
                            min={0}
                            className="h-8 w-16 text-center mx-auto"
                            placeholder="0"
                          />
                        </TableCell>
                      ))}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon-sm">
                            <Eye className="size-4" />
                          </Button>
                          <Button variant="ghost" size="icon-sm">
                            <Pencil className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
