import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Eye, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { hasPermissions } from "@/lib/utils/has-permissions";
import { getStoredUser } from "@/modules/auth/auth.service";
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
import { deleteGroup, listGroups } from "@/modules/groups/groups.service";
import type { Group } from "@/modules/groups/groups.types";

export const Route = createFileRoute("/_auth/gestao/grupos/")({
  component: Grupos,
});

function Grupos() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [toogleAlert, setToogleAlert] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);

  const currentUser = getStoredUser();
  const canCreate = currentUser ? hasPermissions(currentUser, "manager.create") : false;
  const canEdit = currentUser ? hasPermissions(currentUser, "manager.edit") : false;
  const canDelete = currentUser ? hasPermissions(currentUser, "manager.delete") : false;

  const { data, isLoading, isError } = useQuery({
    queryKey: ["groups", debouncedSearch, page],
    queryFn: () => listGroups({ name: debouncedSearch, page, limit: 10 }),
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

  const openDeleteAlert = (group: Group) => {
    setSelectedGroup(group);
    setToogleAlert(true);
  };

  const handleDeleteGroup = async () => {
    if (!selectedGroup?.id) return;
    await deleteGroup(selectedGroup.id);
    setToogleAlert(false);
    queryClient.invalidateQueries({ queryKey: ["groups"] });
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <Skeleton className="mb-4 h-8 w-1/3" />
        <div className="space-y-2">
          {[...Array(5)].map((_, index) => (
            <Skeleton
              key={`skeleton-${
                // biome-ignore lint/suspicious/noArrayIndexKey: id is unique
                index
              }`}
              className="h-10 w-full"
            />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <Alert variant="destructive" className="m-6">
        Erro ao carregar grupos
      </Alert>
    );
  }

  const totalGroups = data?.count;
  const groups = data?.data || [];
  const totalPages = Math.ceil((totalGroups || 0) / 10);

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
      <AlertDialog open={toogleAlert} onOpenChange={setToogleAlert}>
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Grupos ({totalGroups})</h1>
          <p className="text-muted-foreground mt-2">Gerencie os grupos de clientes.</p>
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
          {canCreate && (
            <Button asChild>
              <Link to="/gestao/grupos/novo">
                <Plus className="size-4" />
                Novo grupo
              </Link>
            </Button>
          )}
        </div>

        <div className="rounded-md border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {groups.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">
                    Nenhum grupo encontrado
                  </TableCell>
                </TableRow>
              ) : (
                groups.map((group) => (
                  <TableRow key={group.id}>
                    <TableCell className="font-medium">{group.name}</TableCell>
                    <TableCell>{group.description || "-"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon-sm" asChild>
                          <Link to="/gestao/grupos/$groupId/detalhe" params={{ groupId: group.id }}>
                            <Eye className="size-4" />
                          </Link>
                        </Button>
                        {canEdit && (
                          <Button variant="ghost" size="icon-sm" asChild>
                            <Link to="/gestao/grupos/$groupId/editar" params={{ groupId: group.id }}>
                              <Pencil className="size-4" />
                            </Link>
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => openDeleteAlert(group)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        )}
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

        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deseja excluir o grupo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação excluirá o grupo permanentemente. Tem certeza que deseja prosseguir?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button variant="destructive" onClick={handleDeleteGroup}>
                Apagar
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
