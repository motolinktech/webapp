# Roadmap — Status de Implementação (análise do `src/`)

Data da análise: 2026-01-14

## Escopo e premissas

- Esta análise cobre **apenas o front-end** dentro de `src/`.
- Há chamadas para uma API autenticada (`authApi`) e upload no Firebase (documentos), mas **o back-end não foi avaliado**.
- Legenda:
  - ✅ Implementado (há rota/tela e/ou serviço claramente utilizado)
  - ⚠️ Parcial (existe parte do fluxo/estrutura, mas faltam campos/telas/regras do roadmap)
  - ❌ Não encontrado no `src/`

---

## 1) Visão do sistema (objetivo geral)

**Objetivo do roadmap:** cadastrar lojas e entregadores, montar/gerir escala (fixos + freelancers), disparar mensagens (confirmação/vaga aberta), integrar agenda (feriados/jogos/clima) e fechar fluxo de pagamento (confirmação + checkout).

**Status no `src/`:** ⚠️ Parcial

- ✅ Cadastro/gestão de **Clientes (Lojistas)** e **Entregadores** com CRUD.
- ✅ UI de **Planejamento semanal** (quantidade planejada por cliente/dia).
- ⚠️ Existe modelagem/serviço para **slots de turno** (`work-shift-slots`) com status/logs, mas **sem tela** consumindo isso.
- ❌ Não encontrado: fluxo completo de **escala com status (Aberta/Reservada/Confirmada/...)**, **vagas abertas**, **WhatsApp**, **agenda inteligente**, **pagamentos/checkout**, **relatórios do roadmap**.

**Evidências principais**
- Autenticação e proteção de rotas: `src/routes/__root.tsx`, `src/routes/_auth.tsx`, `src/routes/login.tsx`
- Navegação/menus e permissões: `src/components/composite/app-layout/app-sidebar-content.tsx`, `src/lib/utils/has-permissions.ts`
- Planejamento semanal (UI): `src/routes/_auth/operacional/planejamento/index.tsx`

---

## 2) Perfis de usuário (permissões)

**Roadmap:** Admin / Operacional / Financeiro / Lojista / Entregador / Freelancer.

**Status no `src/`:** ⚠️ Parcial

- ✅ Existe **controle por permissões** (strings) e um papel `ADMIN` com bypass.
- ⚠️ O modelo de usuário no front diferencia apenas `role: "ADMIN" | "USER"` + `permissions: string[]`.
- ❌ Não há evidência de apps/telas separadas para **Lojista**, **Entregador** e **Freelancer** (ex: confirmação/checkout).

**Evidências**
- Usuário/permissões: `src/modules/users/users.types.ts`, `src/lib/utils/has-permissions.ts`
- Itens de menu com `requiredPermission`: `src/components/composite/app-layout/app-sidebar-content.tsx`
- RH/Colaboradores (gestão interna de usuários): `src/routes/_auth/rh/colaboradores/*`

---

## M1 — Cadastro de Lojistas (Clientes)

### Dados
**Status:** ⚠️ Parcial

Implementado:
- ✅ Razão/Nome: `Client.name`
- ✅ CNPJ: `Client.cnpj`
- ✅ Endereço (CEP, rua, número, complemento, bairro, cidade, UF)
- ✅ Contato (nome + telefone)
- ✅ Regras/observações (campo livre)
- ✅ Condições comerciais (formas de pagamento; diárias/garantidos/valores por entrega; KM/área)

Não encontrado / faltando vs roadmap:
- ❌ Geolocalização (lat/lng)
- ❌ Quantidade mínima de entregadores por turno/dia (há **planejamento** separado, mas não como dado do cliente)
- ❌ Bags (total/em uso/disponíveis)
- ⚠️ “Regras internas” específicas (horário de pico, raio, etc.) aparece só como **observações** e `deliveryAreaKm`.

**Evidências**
- Tipos/serviço: `src/modules/clients/clients.types.ts`, `src/modules/clients/clients.service.ts`
- Formulário (inclui condições comerciais): `src/components/forms/clients-form.tsx`
- Telas: lista/novo/editar/detalhe em `src/routes/_auth/gestao/clientes/*`

### Telas
**Status:** ✅ Implementado

- ✅ Lista (paginação, busca, ações): `src/routes/_auth/gestao/clientes/index.tsx`
- ✅ Cadastro: `src/routes/_auth/gestao/clientes/novo.tsx` + `src/components/forms/clients-form.tsx`
- ✅ Edição: `src/routes/_auth/gestao/clientes/$clientId.editar.tsx`
- ✅ Detalhe: `src/routes/_auth/gestao/clientes/$clientId.detalhe.tsx`

Observação:
- ⚠️ “Detalhe da loja (escala + histórico + financeiro)” aparece como **detalhe informativo** e condições comerciais; não há histórico/financeiro/escala completa.

---

## M2 — Cadastro de Entregadores (Fixos)

### Dados
**Status:** ⚠️ Parcial

Implementado:
- ✅ Nome, CPF (com validação e máscara)
- ✅ Telefone
- ✅ Documentos via upload (armazenamento Firebase; lista de URLs)
- ✅ PIX (principal + secundária + terciária), agência e conta
- ✅ Dados do veículo (modelo, placa, cor)
- ✅ Status operacional básico: `isBlocked` / `isDeleted` + ação de bloquear/desbloquear

Não encontrado / faltando vs roadmap:
- ❌ Data de nascimento (no entregador)
- ❌ Endereço e cidade/área de atuação
- ⚠️ Status “ativo/suspenso/bloqueado”: existe bloqueado/deletado, mas não “suspenso” como estado próprio
- ❌ Blacklist estruturada (motivo, data, quem bloqueou, anexo/print)
- ⚠️ Documentos tipados (CNH, doc moto, selfie, etc.) — no front aparece como array de URLs, sem tipo

**Evidências**
- Tipos/serviço: `src/modules/deliverymen/deliverymen.types.ts`, `src/modules/deliverymen/deliverymen.service.ts`
- Formulário: `src/components/forms/deliverymen-form.tsx`
- Telas: lista/novo/editar/detalhe em `src/routes/_auth/gestao/entregadores/*`

### Telas
**Status:** ✅ Implementado

- ✅ Lista (busca/paginação, bloquear, deletar): `src/routes/_auth/gestao/entregadores/index.tsx`
- ✅ Cadastro/Edição: `src/routes/_auth/gestao/entregadores/novo.tsx`, `src/routes/_auth/gestao/entregadores/$deliverymanId.editar.tsx`
- ✅ Detalhe (docs/PIX/veículo): `src/routes/_auth/gestao/entregadores/$deliverymanId.detalhe.tsx`

Observação:
- ❌ “Perfil do entregador (histórico de escalas, pagamentos, ocorrências)” não encontrado no `src/`.

---

## M3 — Escala por Loja (semanal/mensal)

### Planejamento semanal (quantidade necessária)
**Status:** ⚠️ Parcial

- ✅ Existe tela de **Planejamento semanal** por cliente/dia (campo numérico “plannedCount”).
- ✅ Filtro por grupo e busca por cliente.
- ✅ Persistência via API (`/planning`).

**Evidências**
- UI: `src/routes/_auth/operacional/planejamento/index.tsx`
- Serviço/tipos: `src/modules/planning/planning.service.ts`, `src/modules/planning/planning.types.ts`

### Escala (turnos, alocação de entregadores, status da vaga)
**Status:** ⚠️ Parcial / estrutura sem UI

- ⚠️ Existe módulo de **Work Shift Slots** com:
  - `shiftDate`, `startTime`, `endTime`
  - `status`, `contractType`, `auditStatus`
  - `logs[]` (auditoria)
  - vínculo com `client` e `deliveryman`
- ❌ Não foi encontrada tela/rota usando `work-shift-slots` no `src/`.

**Evidências**
- Tipos/serviço: `src/modules/work-shift-slots/work-shift-slots.types.ts`, `src/modules/work-shift-slots/work-shift-slots.service.ts`

### Itens do roadmap não encontrados (no `src/`)
**Status:** ❌

- ❌ Turnos “manhã/tarde/noite” como conceito de UI
- ❌ “Montar escala” (drag & drop ou seletor)
- ❌ Visualização mês/semana (calendário)
- ❌ Status de vaga: Aberta/Reservada/Confirmada/Cancelada/No-show
- ❌ Central de vagas abertas + disparo
- ❌ Regras: bloquear blacklist/bloqueado; evitar duplicidade no mesmo horário; log de alterações (há log no tipo, mas sem UI)

Observação adicional
- ⚠️ O menu contém “Monitoramento” (`/operacional/monitoramento`), mas **não existe rota** correspondente no `src/routes/`.

---

## M4 — Agenda Inteligente (contexto operacional)

**Status:** ❌ Não encontrado (apenas mock no dashboard)

- ⚠️ O `Dashboard` exibe um card “Agenda” com **dados mockados** (sem integração/configuração).
- ❌ Não há telas de calendário/configuração de alertas.
- ❌ Não há integração com feriados/jogos/clima no `src/`.

**Evidências**
- Dashboard (mock “Agenda”): `src/routes/_auth/dashboard.tsx`

---

## M5 — Cadastro de Freelancers

**Status:** ⚠️ Parcial (somente como enum/contrato)

- ⚠️ Há `contractType` com opção `FREELANCER` no cadastro de entregadores.
- ❌ Não há módulo/telas dedicadas a freelancers (aprovação, termo/aceite, habilitar para vagas abertas, etc.).

**Evidência**
- `contractType` em entregadores: `src/components/forms/deliverymen-form.tsx`, `src/modules/deliverymen/deliverymen.types.ts`

---

## M6 — Fluxo de Pagamento (freelancer e/ou fixo)

**Status:** ❌ Não encontrado (UI/fluxo)

Implementado parcialmente (base de dados):
- ✅ Clientes possuem “condições comerciais”/formas de pagamento (para precificação).
- ✅ Entregadores possuem informações de PIX/conta.

Não encontrado no `src/`:
- ❌ Estados do fluxo (Escalado/Confirmado/Check-in/Produção/Check-out/Conferência/Aprovado/Pago)
- ❌ Painel de pagamentos pendentes
- ❌ Aprovação em lote / exportação / integração bancária
- ❌ Histórico por entregador/loja

Observação:
- ⚠️ Há um bloco de menu **Financeiro** comentado no sidebar (sugere intenção, mas não implementado).

**Evidências**
- Menu Financeiro comentado: `src/components/composite/app-layout/app-sidebar-content.tsx`

---

## 3) Relatórios (mínimo viável)

**Status:** ❌ Não encontrado

Não foram encontradas telas/rotas específicas para:
- Cobertura de escala (necessário x atendido)
- Confirmados x faltas
- Top freelancers
- Custo por loja
- Pagamentos por período

---

## 4) MVP em fases — aderência atual

### Fase 1 (MVP)
**Lojistas + Entregadores + Escala semanal + Vagas abertas + Confirmação WhatsApp**

- ✅ Lojistas/Clientes: CRUD implementado
- ✅ Entregadores: CRUD implementado (com docs e dados bancários), porém faltam alguns campos do roadmap
- ⚠️ “Escala semanal”: existe **Planejamento** (quantidade/dia), mas não “escala” com alocação/status
- ❌ Vagas abertas: não encontrado
- ❌ Confirmação WhatsApp: não encontrado

### Fase 2
**Freelancer completo + Fluxo pagamento + checkout**

- ⚠️ Freelancer: apenas como `contractType`
- ❌ Pagamento/checkout: não encontrado

### Fase 3
**Agenda + dashboards + relatórios avançados**

- ⚠️ Dashboard existe, mas agenda é mock
- ❌ Agenda inteligente/integrações/relatórios: não encontrado

### Fase 4
**Integração bancária/API + automações + auditoria robusta**

- ⚠️ Há indícios de auditoria no tipo `WorkShiftSlot.logs`, mas sem UI no `src/`
- ❌ Integração bancária/automação: não encontrado

---

## Pontos fortes já prontos (no front)

- Autenticação com rotas protegidas e layout autenticado.
- Padrão de CRUD com React Query + TanStack Router para Clientes/Entregadores/Regiões/Grupos/RH.
- Formulários bem estruturados com Zod + React Hook Form.
- Upload de documentos do entregador via Firebase Storage.

## Lacunas prioritárias vs roadmap (o que falta no `src/`)

1. Escala por turno com alocação e status da vaga (usando `work-shift-slots`).
2. Central de vagas abertas e mecanismos de confirmação.
3. Integração WhatsApp (mensagens e eventos de confirmação/checkout) — ao menos telas/estado.
4. Módulo Financeiro (painel de pagamentos e fluxo de aprovação/checkout).
5. Agenda inteligente (calendário + integrações + alertas).
6. Relatórios MVP.

---

## Resumo quantitativo (contagem e %)

### Metodologia

- Unidade de contagem: **cada seção que declara `Status:`** neste documento.
- Total de itens avaliados: **13**.
- Cálculo de “% concluído” (estimativa): ✅ = 100%, ⚠️ = 50%, ❌ = 0%.

### Totais por status

- ✅ Implementado: **2** itens (**15,4%**)
- ⚠️ Parcial: **7** itens (**53,8%**)
- ❌ Não encontrado: **4** itens (**30,8%**)

### % de conclusão (estimado)

- Concluído (ponderado): **42,3%**

---

## Próximos passos sugeridos (ordem recomendada)

1. **Fechar o loop do M3 (Escala de verdade usando `work-shift-slots`)**
  - Criar telas/rotas para listar/criar/editar turnos por loja (semana/mês) usando o módulo `work-shift-slots`.
  - Definir e padronizar `status` (ex.: Aberta/Reservada/Confirmada/Cancelada/No-show) e `auditStatus`.
  - Expor/consumir `logs[]` na UI para auditoria básica (quem mudou e quando).

2. **Resolver “Monitoramento” do menu**
  - Hoje existe link no sidebar para `/operacional/monitoramento`, mas não existe rota correspondente.
  - Ou implemente a página (mesmo MVP), ou remova/oculte o item até existir.

3. **Vagas abertas + confirmação (parte central do MVP Fase 1)**
  - Implementar uma “Central de vagas abertas” no front (mesmo sem WhatsApp no início):
    - listar slots “Abertos”, permitir reservar/confirmar/cancelar.
  - Depois conectar isso ao disparo/retorno do WhatsApp.

4. **Integração WhatsApp (Fase 1/2)**
  - Definir o contrato de eventos (ex.: CONFIRMO/CHEGUEI/FINALIZEI) e como o backend atualizará `work-shift-slots`.
  - No front, mostrar status e histórico do slot/entregador.

5. **Financeiro (Fase 2) — mínimo funcional**
  - Criar módulo/telas “Pagamentos pendentes” e “Aprovação”, usando dados já existentes (condições comerciais + dados bancários/PIX).
  - Só depois evoluir para exportação/integração bancária.

6. **Freelancer como entidade (Fase 2)**
  - Decidir se “freelancer” é um tipo de entregador (como hoje) ou uma entidade própria com aprovação/termo/aceite.
  - Ajustar UI/fluxos para habilitar freelancer em vagas abertas.

7. **Agenda inteligente (Fase 3)**
  - Trocar o “mock” do dashboard por uma base real (eventos) e depois integrar feriados/jogos/clima.

8. **Relatórios (Fase 3)**
  - Começar com 1–2 relatórios MVP: cobertura (planejado x atendido) e faltas/no-show.

Se você me disser qual é o seu objetivo imediato (ex.: “entregar Fase 1 em X semanas”), eu posso transformar esses passos em um backlog com entregáveis semanais e critérios de aceite.

