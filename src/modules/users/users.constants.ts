export const userRoles = {
  ADMIN: "ADMIN",
  USER: "USER",
};

export const userRolesArr = Object.keys(userRoles) as Array<
  keyof typeof userRoles
>;

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
    type: "Colaborador",
    description: "Permissões para gerir Colaboradores",
    rules: [
      {
        permission: "employee.view",
        description: "Visualizar informações do colaborador",
      },
      {
        permission: "employee.create",
        description: "Criar novo colaborador",
      },
      {
        permission: "employee.edit",
        description: "Editar informações do colaborador",
      },
      {
        permission: "employee.delete",
        description: "Excluir colaborador",
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
    type: "Gestor",
    description: "Permissões para gerir Motoboy, Região e Grupo",
    rules: [
      {
        permission: "manager.view",
        description: "Visualizar informações de gestão",
      },
      {
        permission: "manager.create",
        description: "Criar novos registros de gestão",
      },
      {
        permission: "manager.edit",
        description: "Editar informações de gestão",
      },
      {
        permission: "manager.delete",
        description: "Excluir registros de gestão",
      },
    ],
  },
  {
    type: "Financeiro",
    description: "Permissões para gerir Financeiro",
    rules: [
      {
        permission: "financial.view",
        description: "Visualizar informações financeiras",
      },
      {
        permission: "financial.create",
        description: "Criar novos registros financeiros",
      },
      {
        permission: "financial.edit",
        description: "Editar informações financeiras",
      },
      {
        permission: "financial.delete",
        description: "Excluir registros financeiros",
      },
    ],
  },
  {
    type: "Comercial",
    description: "Permissões para gerir modulo Comercial",
    rules: [
      {
        permission: "commercial.view",
        description: "Visualizar informações comerciais",
      },
      {
        permission: "commercial.create",
        description: "Criar novos registros comerciais",
      },
      {
        permission: "commercial.edit",
        description: "Editar informações comerciais",
      },
      {
        permission: "commercial.delete",
        description: "Excluir registros comerciais",
      },
    ],
  },
];
