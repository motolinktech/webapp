import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import dayjs from "dayjs";
import { Link as CopyLink, Eye, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { ContentHeader } from "@/components/composite/content-header";
import { Alert } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { userStatusTranslations } from "@/modules/users/users.constants";
import { deleteUser, listUsers } from "@/modules/users/users.service";
import type { User } from "@/modules/users/users.types";

export const Route = createFileRoute("/_auth/rh/colaboradores/")({
  component: Colaboradores,
});

const statusColors = {
  ACTIVE: "bg-green-500",
  BLOCKED: "bg-red-500",
  PENDING: "bg-yellow-500",
};

function Colaboradores() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [toogleAlert, setToogleAlert] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["users", debouncedSearch, page],
    queryFn: () => listUsers({ search: debouncedSearch, page, limit: 10 }),
  })

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 5000);

    return () => clearTimeout(timer);
  }, [search]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      setDebouncedSearch(search);
      setPage(1);
    }
  };

  const openDeleteAlert = (user: User) => {
    setSelectedUser(user);
    setToogleAlert(true);
  }

  const handleDeleteUser = async () => {
    if (selectedUser?.id) {
      await deleteUser(selectedUser.id);
      setToogleAlert(false);
      queryClient.invalidateQueries({ queryKey: ["users"] });
    }
  }

  if (isLoading) {
    return (
      <div>
        <Skeleton className="mb-4 h-8 w-1/3" />
        <div className="space-y-2">
          {[...Array(5)].map((_, index) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: pode ignorar por ser array estático
            <Skeleton key={`skeleton-${index}`} className="h-10 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <Alert variant="destructive" className="m-6">
        Erro ao carregar colaboradores
      </Alert>
    );
  }

  const totalUsers = data?.count
  const users = data?.data || []
  const totalPages = Math.ceil((totalUsers || 0) / 10);

  const renderPaginationItems = () => {
    const items = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              isActive={page === i}
              onClick={() => setPage(i)}
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }
    } else {
      items.push(
        <PaginationItem key={1}>
          <PaginationLink
            isActive={page === 1}
            onClick={() => setPage(1)}
          >
            1
          </PaginationLink>
        </PaginationItem>
      );

      if (page > 3) {
        items.push(
          <PaginationItem key="ellipsis-1">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }

      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);

      for (let i = start; i <= end; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              isActive={page === i}
              onClick={() => setPage(i)}
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }

      if (page < totalPages - 2) {
        items.push(
          <PaginationItem key="ellipsis-2">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }

      items.push(
        <PaginationItem key={totalPages}>
          <PaginationLink
            isActive={page === totalPages}
            onClick={() => setPage(totalPages)}
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }

    return items;
  };

  return (
    <div>
      <AlertDialog open={toogleAlert} onOpenChange={setToogleAlert}>
        <ContentHeader breadcrumbItems={[{ title: `Colaboradores` }]} />

        <div className="mb-4 flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              className="pl-9"
            />
          </div>
          <Button asChild>
            <Link to={"/rh/colaboradores/novo"}>
              <Plus className="size-4" />
              Novo usuário
            </Link>
          </Button>
        </div>

        <div className="rounded-md border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Data de Nascimento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center text-muted-foreground"
                  >
                    Nenhum colaborador encontrado
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{dayjs(user.birthDate).format("DD/MM/YYYY")}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${statusColors[user.status as keyof typeof statusColors]}`}
                      >
                        {userStatusTranslations[user.status]}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {user.verificationTokens && user.verificationTokens.length > 0 && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => {
                              const url = `${import.meta.env.VITE_BASE_URL}/trocar-senha?token=${user.verificationTokens?.[0].token}&userId=${user.id}`;
                              navigator.clipboard.writeText(url);

                            }}
                          >
                            <CopyLink className="size-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          asChild
                        >
                          <Link to={`/rh/colaboradores/$userId/detalhe`} params={{ userId: user.id }}>
                            <Eye className="size-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          asChild
                        >
                          <Link to={`/rh/colaboradores/$userId/editar`} params={{ userId: user.id }}>
                            <Pencil className="size-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => openDeleteAlert(user)}
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
                    className={page === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}

        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desejar excluir o usuário?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação desabilitará o usuário permanentemente, mas para fins de
              auditoria, seus dados serão mantidos no sistema. Tem certeza que
              deseja prosseguir?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button variant="destructive" onClick={handleDeleteUser}>
                Apagar
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
