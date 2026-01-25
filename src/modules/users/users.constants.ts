export const userRoles = {
  ADMIN: "ADMIN",
  USER: "USER",
};

export const userRolesArr = Object.keys(userRoles) as Array<keyof typeof userRoles>;

export const userStatus = {
  ACTIVE: "ACTIVE",
  BLOCKED: "BLOCKED",
  PENDING: "PENDING",
};

export const userStatusTranslations: Record<string, string> = {
  ACTIVE: "Ativo",
  BLOCKED: "Bloqueado",
  PENDING: "Pendente",
};

export const userPermissions = [
  {
    type: "Entregador",
    description: "Permissões para gerir Entregadores",
    rules: [
      {
        permission: "deliveryman.view",
        description: "Visualizar informações do entregador",
      },
      {
        permission: "deliveryman.create",
        description: "Criar novo entregador",
      },
      {
        permission: "deliveryman.edit",
        description: "Editar informações do entregador",
      },
      {
        permission: "deliveryman.delete",
        description: "Excluir entregador",
      },
    ],
  },
  {
    type: "Região",
    description: "Permissões para gerir Regiões",
    rules: [
      {
        permission: "region.view",
        description: "Visualizar informações da região",
      },
      {
        permission: "region.create",
        description: "Criar nova região",
      },
      {
        permission: "region.edit",
        description: "Editar informações da região",
      },
      {
        permission: "region.delete",
        description: "Excluir região",
      },
    ],
  },
  {
    type: "Grupo",
    description: "Permissões para gerir Grupos",
    rules: [
      {
        permission: "group.view",
        description: "Visualizar informações do grupo",
      },
      {
        permission: "group.create",
        description: "Criar novo grupo",
      },
      {
        permission: "group.edit",
        description: "Editar informações do grupo",
      },
      {
        permission: "group.delete",
        description: "Excluir grupo",
      },
    ],
  },
  {
    type: "Cliente",
    description: "Permissões para gerir Clientes",
    rules: [
      {
        permission: "client.view",
        description: "Visualizar informações do cliente",
      },
      {
        permission: "client.create",
        description: "Criar novo cliente",
      },
      {
        permission: "client.edit",
        description: "Editar informações do cliente",
      },
      {
        permission: "client.delete",
        description: "Excluir cliente",
      },
    ],
  },
  {
    type: "Usuário",
    description: "Permissões para gerir Usuários",
    rules: [
      {
        permission: "user.view",
        description: "Visualizar informações do usuário",
      },
      {
        permission: "user.create",
        description: "Criar novo usuário",
      },
      {
        permission: "user.edit",
        description: "Editar informações do usuário",
      },
      {
        permission: "user.delete",
        description: "Excluir usuário",
      },
    ],
  },
  {
    type: "Operacional",
    description: "Permissões para gerir Turnos e Planejamento",
    rules: [
      {
        permission: "operational.view",
        description: "Visualizar informações operacionais",
      },
      {
        permission: "operational.create",
        description: "Criar novos registros operacionais",
      },
      {
        permission: "operational.edit",
        description: "Editar informações operacionais",
      },
      {
        permission: "operational.delete",
        description: "Excluir registros operacionais",
      },
    ],
  },
];
