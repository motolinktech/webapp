import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Eye, Lock, Pencil, Plus, Search, Trash2, Unlock } from "lucide-react";
import { useEffect, useState } from "react";
import { Alert } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cpfMask } from "@/lib/masks/cpf-mask";
import { phoneMask } from "@/lib/masks/phone-mask";
import {
  deleteDeliveryman,
  listDeliverymen,
  toggleBlockDeliveryman,
} from "@/modules/deliverymen/deliverymen.service";
import type { Deliveryman } from "@/modules/deliverymen/deliverymen.types";

export const Route = createFileRoute("/_auth/gestao/entregadores/")({
  component: Deliverymen,
});

function Deliverymen() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [toogleDeleteAlert, setToogleDeleteAlert] = useState(false);
  const [toogleBlockAlert, setToogleBlockAlert] = useState(false);
  const [selectedDeliveryman, setSelectedDeliveryman] = useState<Deliveryman | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["deliverymen", debouncedSearch, page],
    queryFn: () => listDeliverymen({ name: debouncedSearch, page, limit: 10 }),
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      setDebouncedSearch(search);
      setPage(1);
    }
  };

  const openDeleteAlert = (deliveryman: Deliveryman) => {
    setSelectedDeliveryman(deliveryman);
    setToogleDeleteAlert(true);
  };

  const openBlockAlert = (deliveryman: Deliveryman) => {
    setSelectedDeliveryman(deliveryman);
    setToogleBlockAlert(true);
  };

  const handleDeleteDeliveryman = async () => {
    if (!selectedDeliveryman?.id) return;
    await deleteDeliveryman(selectedDeliveryman.id);
    setToogleDeleteAlert(false);
    queryClient.invalidateQueries({ queryKey: ["deliverymen"] });
  };

  const handleToggleBlockDeliveryman = async () => {
    if (!selectedDeliveryman?.id) return;
    await toggleBlockDeliveryman(selectedDeliveryman.id);
    setToogleBlockAlert(false);
    queryClient.invalidateQueries({ queryKey: ["deliverymen"] });
  };

  const getStatusVariant = (isDeleted: boolean, isBlocked: boolean) => {
    if (isDeleted) return "destructive";
    if (isBlocked) return "secondary";
    return "default";
  };

  const getStatusText = (isDeleted: boolean, isBlocked: boolean) => {
    if (isDeleted) return "Deletado";
    if (isBlocked) return "Bloqueado";
    return "Ativo";
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <Skeleton className="mb-4 h-8 w-1/3" />
        <div className="space-y-2">
          {[...Array(5)].map((_, index) => (
            <Skeleton key={`skeleton-${index}`} className="h-10 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <Alert variant="destructive" className="m-6">
        Erro ao carregar entregadores
      </Alert>
    );
  }

  const totalDeliverymen = data?.count;
  const deliverymen = data?.data || [];
  const totalPages = Math.ceil((totalDeliverymen || 0) / 10);

  const renderPaginationItems = () => {
    const items = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink isActive={page === i} onClick={() => setPage(i)}>
              {i}
            </PaginationLink>
          </PaginationItem>,
        );
      }
    } else {
      items.push(
        <PaginationItem key={1}>
          <PaginationLink isActive={page === 1} onClick={() => setPage(1)}>
            1
          </PaginationLink>
        </PaginationItem>,
      );

      if (page > 3) {
        items.push(
          <PaginationItem key="ellipsis-1">
            <PaginationEllipsis />
          </PaginationItem>,
        );
      }

      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);

      for (let i = start; i <= end; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink isActive={page === i} onClick={() => setPage(i)}>
              {i}
            </PaginationLink>
          </PaginationItem>,
        );
      }

      if (page < totalPages - 2) {
        items.push(
          <PaginationItem key="ellipsis-2">
            <PaginationEllipsis />
          </PaginationItem>,
        );
      }

      items.push(
        <PaginationItem key={totalPages}>
          <PaginationLink isActive={page === totalPages} onClick={() => setPage(totalPages)}>
            {totalPages}
          </PaginationLink>
        </PaginationItem>,
      );
    }

    return items;
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Entregadores ({totalDeliverymen})</h1>
        <p className="text-muted-foreground mt-2">Gerencie os entregadores.</p>
      </div>

      <div className="mb-4 flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pl-9"
          />
        </div>
        <Button asChild>
          <Link to="/gestao/entregadores/novo">
            <Plus className="size-4" />
            Novo entregador
          </Link>
        </Button>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Documento</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Região</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {deliverymen.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Nenhum entregador encontrado
                </TableCell>
              </TableRow>
            ) : (
              deliverymen.map((deliveryman) => (
                <TableRow key={deliveryman.id}>
                  <TableCell className="font-medium">{deliveryman.name}</TableCell>
                  <TableCell>{cpfMask(deliveryman.document)}</TableCell>
                  <TableCell>{phoneMask(deliveryman.phone)}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        getStatusVariant(deliveryman.isDeleted, deliveryman.isBlocked) as
                          | "default"
                          | "secondary"
                          | "destructive"
                      }
                    >
                      {getStatusText(deliveryman.isDeleted, deliveryman.isBlocked)}
                    </Badge>
                  </TableCell>
                  <TableCell>{deliveryman.region?.name || "-"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button asChild variant="ghost" size="icon-sm">
                        <Link
                          to="/gestao/entregadores/$deliverymanId/detalhe"
                          params={{ deliverymanId: deliveryman.id }}
                        >
                          <Eye className="size-4" />
                        </Link>
                      </Button>
                      <Button asChild variant="ghost" size="icon-sm">
                        <Link
                          to="/gestao/entregadores/$deliverymanId/editar"
                          params={{ deliverymanId: deliveryman.id }}
                        >
                          <Pencil className="size-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => openBlockAlert(deliveryman)}
                      >
                        {deliveryman.isBlocked ? (
                          <Unlock className="size-4" />
                        ) : (
                          <Lock className="size-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => openDeleteAlert(deliveryman)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setPage(Math.max(1, page - 1))}
                  className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
              {renderPaginationItems()}
              <PaginationItem>
                <PaginationNext
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  className={
                    page === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      <AlertDialog open={toogleDeleteAlert} onOpenChange={setToogleDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deseja excluir o entregador?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação excluirá o entregador permanentemente. Tem certeza que deseja prosseguir?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button variant="destructive" onClick={handleDeleteDeliveryman}>
                Apagar
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={toogleBlockAlert} onOpenChange={setToogleBlockAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Deseja {selectedDeliveryman?.isBlocked ? "desbloquear" : "bloquear"} o entregador?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedDeliveryman?.isBlocked
                ? "Esta ação permitirá que o entregador volte a receber entregas."
                : "Esta ação impedirá que o entregador receba novas entregas."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button onClick={handleToggleBlockDeliveryman}>
                {selectedDeliveryman?.isBlocked ? "Desbloquear" : "Bloquear"}
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
