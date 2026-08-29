# Rotas: plano de implementação (app + backend)

Checklist para executar o [MD de ajustes](./rotas-ajustes-mobile.md) e a [CON-69](https://linear.app/motoconfraria/issue/CON-69/ajustes-da-tela-de-rotas).

Este arquivo responde duas coisas:

1. **Temos informação suficiente?** — o que já dá para codar e o que precisa de decisão.
2. **O que fazer, em que ordem, em qual repo.**

Não entra neste ciclo: capa, like/comentários, voz/noite/pause, senóide, offline fake, share WhatsApp genérico (RN-15).

---

## 1. Temos todas as informações?

**Para começar o P0 de interface (mapa, busca, sheet, permissão, calcular sem salvar): sim.**

O app já tem mapa, Places, directions (inclusive `computeAlternativeRoutes` quando não há paradas intermediárias), combustível por estado (`fuelPriceByState`), motos, wizard, navegação, socket, nearby, share no chat, assinatura (`GET /subscriptions/me`).

**Para fechar o produto inteiro: não.** Faltam contratos. Abaixo: o que bloqueia o quê, e a hipótese de trabalho se produto não responder agora.

### 1.1 Dá para implementar agora (informação suficiente)

| Área | Por quê |
|---|---|
| Home mapa, “Para onde vamos?”, recentrar, CTA Planejar roteiro | Layout + CON-69 RN-01. Reusa mapa/Places/geo. |
| GPS: Explorar/Minhas sem permissão | RN-02. Só mudar `LocationGate` / split de telas. |
| Origem lat/lng sem rua (AH-04) | Critérios de aceite claros. Reverse geocode já existe. |
| Autocomplete acima do teclado (AH-05) | Bug de UI no `PlaceAutocompleteField` + sheet. |
| Sheet arrastável (AH-06) | Bug de gesto no `RoutePlannerSheet` / novo sheet da home. |
| Calcular rota no client sem POST | Directions já existem. Draft local = `QuickRouteDraft`. |
| Lista vertical Minhas rotas (grupos visuais) | RN-05. Pode agrupar o `GET /routes/me` atual **até** Recentes existir no backend. |
| Um dia sem “Dia 1” (RN-12) | Só UI do wizard. |
| Renomear CTA para Planejar roteiro | Copy. |
| Esconder FAB na home mapa | Layout. |
| Recálculo visível na navegação | Hook já reroteia; falta estado na UI (CON-72). |
| Velocidade atual no card | GPS já tem speed. |
| Resumo final: ordem km/tempo/mapa/nota + share chat | `RouteCompletedView` + `RouteShareSheet`. Custo só depois da flag. |
| Instrumentação local (logs / Sentry tags) | Eventos da CON-69; ainda não há Amplitude/PostHog no app. |

### 1.2 Hipótese de trabalho (dá para seguir se produto confirmar)

Se na discussão vocês **não** mudarem isso, o plano assume:

| Tema | Hipótese | Se mudar, impacta |
|---|---|---|
| Rota rápida vs planejada | Um único model `Route` com `kind: quick \| planned`. Calcular = zero persistência. **Iniciar** cria `kind=quick`, `status=in_progress`. **Salvar** cria `kind=planned`, `status=scheduled` (ou `in_progress` se sair agora). | Recentes, limite de 5, listagens |
| Recentes 30 dias | `kind=quick` com `started_at` nos últimos 30 dias. Job ou filtro `WHERE started_at >= now()-30d`. Não apaga `planned`. | Backend Recentes |
| Limite de 5 | Conta `kind=planned` + `is_deleted=false` + `is_published=false` + dono. Recentes/quick **não** entram. Publicado **não** entra. | CON-51 |
| Alternativas | Google já devolve 2–3 rotas sem intermediários. **Não** rotular “sinuosa/equilibrada/direta” até haver métrica. UI: “Opção A/B/C” + km + tempo. Chips de perfil motociclístico ficam desligados (RN-08). | RN-08 |
| Combustível premium | Sem CON-25: gate por `GET /subscriptions/me` (`status` ativo ou `isVip`). Flag local `premium_fuel_cost_estimate` default on em homolog, off-remote depois. Backend **omite** `fuelCost` na resposta se não elegível. | RN-09 |
| Preço regional | Já existe `fuelPriceByState` + `stateCode` no estimate-fuel. Manter. | — |
| Comunidade “Iniciar agora” | Persistência imediata: copia days/places → `kind=planned`, `in_progress`, abre navigate. Autoria da original preservada num `cloned_from_id`. | RN-11 |
| “Personalizar” | **Não** POST. Abre `/routes/create` com draft em memória/`route-create-cache`. Descarta ao sair sem salvar (RN-16). | RN-11 |
| Share | Só `RouteShareSheet` (chat). Sem WhatsApp neste ciclo. | RN-15 |
| Autosave | **Não.** | RN-16 |
| Evitar terra (CON-49) | Google Routes não tem avoid-unpaved confiável. **Não** mostrar toggle até o provider aceitar. | CON-49 |
| Selo parceiro | Nearby hoje não marca patrocinado. Mostrar POIs **sem** selo até o backend mandar `isConfrariaPartner` / `sponsored`. Não inventar selo. | RN-10, CON-58 |
| Instrumentação produto | Sem SDK de analytics. Emitir eventos num helper (`trackRoutesEvent`) no-op ou Sentry breadcrumb até existir ferramenta. | Handoff CON-69 |

### 1.3 Bloqueia entrega completa (precisa de resposta)

Não impede o sprint 1–2. Impede chamar a CON-69 de “pronta”.

| # | Pergunta | Por que importa | Quem |
|---|---|---|---|
| Q1 | Confirma `kind` no `Route` (hipótese) ou tabela `QuickRoute` separada? | Contrato Iniciar/Salvar/Recentes | Produto + backend |
| Q2 | Como classificar sinuosa / equilibrada / direta? (curvas na polyline? terceiro provider?) | Sem isso os chips da CON-69 não existem; só opções A/B/C | Produto + backend |
| Q3 | CON-25 (feature flags remotas) entra **antes** do combustível premium ou assinatura basta no beta? | RN-09 pede flag global sem release | Produto |
| Q4 | O que entra nos 5 roteiros? (hipótese: planned privado) Inclui rascunho local? Inclui publicado? | Paywall errado é bug de monetização | Produto |
| Q5 | “Iniciar agora” na comunidade: persistir na hora (hipótese) ou também é draft até o primeiro ponto GPS? | CON-69 pede iniciar **e** cópia temporária só no Personalizar — são dois comportamentos | Produto |
| Q6 | Nearby: de onde vem Parceiro Confraria / Patrocinado? Cadastro admin? Import Places? | Sem campo, RN-10 fica incompleto | Produto + admin |
| Q7 | Recálculo na navegação com **paradas**: Google não calcula alternativas com intermediates. Recalcular só a rota ativa? | RN-13 / CON-72 | Backend |
| Q8 | Encerramento de rota **rápida**: vira Concluída, some dos Recentes, ou os dois? | RN-05 grupos | Produto |
| Q9 | Texto do paywall do 6º roteiro e do combustível free (copy + tela de assinatura) | CON-51 / RN-09 | Design |
| Q10 | Protótipo navegável / handoff Figma da home mapa (Luis) | CON-69 pede validar fluxos; o Vercel ajuda, mas o app nativo tem teclado/sheet diferentes | Design |

**Conclusão:** dá para planejar e **começar o P0**. Não dá para prometer alternativas “sinuosas”, selo patrocinado, flag remota e CON-49 sem Q2/Q3/Q6.

---

## 2. Repos e o que reaproveitar

| Repo | Papel |
|---|---|
| `app-confraria` | Telas, drafts, permissão, navegação, paywall UI |
| `confraria-backend` | `kind`, Recentes TTL, limite 5, clone, fuel gated, nearby partner, directions labels |

Não recriar: `src/lib/places`, `src/lib/location`, `route-background-tracking`, `route-navigation-socket`, `useRouteNavigation`, `useRouteDirections`, `useRouteCostEstimate`, `useRouteBikes`, `ActiveRouteFAB`, `RouteShareSheet`, `PendingRouteReviewGate`, `PlacesService` (directions/nearby/fuel).

Rotas Expo alvo:

```
/routes                 home mapa
/routes/mine            minhas rotas (lista)
/routes/explore         comunidade
/routes/create          planejador (já existe)
/routes/edit            planejador
/routes/[id]            detalhe
/routes/[id]/navigate   navegação
```

---

## 3. Todo list por sprint

Marcar no PR / Linear filha. Ordem = dependência. App e backend no mesmo sprint quando o contrato for necessário.

### Sprint 0 — Contratos e hipóteses (backend leve + produto)

- [ ] **P** Fechar Q1–Q5 (ou aceitar as hipóteses da §1.2 por escrito).
- [ ] **BE** Decidir migration: `Route.kind` (`quick` | `planned`) + `cloned_from_id` opcional. Default `planned` nas rotas atuais.
- [ ] **BE** Documentar no OpenAPI: calcular directions **não** cria `Route`.
- [ ] **APP** Helper `trackRoutesEvent(name, props)` (no-op/Sentry) com os nomes da CON-69.

### Sprint 1 — Arquitetura da entrada (P0.1–2) — só app + geo

RN-01, RN-02, AH-01, AH-02, AH-03, AH-04, AH-08.

**App**

- [ ] Quebrar `/routes`: mapa na home; mover lista atual para `/routes/mine`.
- [ ] Mapa tela cheia + recentrar + busca “Para onde vamos?” (`PlaceAutocompleteField`).
- [ ] CTA **Planejar roteiro** → `/routes/create` (rascunho limpo; origem = GPS).
- [ ] Atalhos no sheet: Explorar / Minhas rotas.
- [ ] `LocationGate` **não** bloquear Explorar/Minhas; empty só no mapa/busca.
- [ ] Origem por lat/lng; reverse geocode só rótulo; fallback AH-04; restaurar Minha localização.
- [ ] Esconder `ActiveRouteFAB` em `/routes` (home mapa).
- [ ] Evento `routes_map_opened`.

**Backend:** nenhum.

**Pronto quando:** abrir Rotas vê mapa; sem GPS ainda abre Minhas/Explorar; origem sem rua calcula depois (sprint 2).

### Sprint 2 — Rota rápida: calcular, paradas, sheet (P0.3–4) — app + directions atuais

RN-03, RN-04 (draft local), AH-05, AH-06.

**App**

- [ ] Draft em memória: origem, destino, paradas, alternativa escolhida, moto. **Zero POST** ao calcular.
- [ ] Sheet de resumo: destino, duração, km, ETA, moto (trocar / CTA Garagem).
- [ ] Adicionar / remover / reordenar paradas sem sair do mapa; recálculo a cada mudança.
- [ ] **Planejar este roteiro** só como ação explícita → `/routes/create` com o draft (não automático).
- [ ] Autocomplete visível acima do teclado; destino inválido sem coordenadas.
- [ ] Sheet: gesto no header **e** área vazia; lista interna rola (AH-06). Android + iOS.
- [ ] Estados: buscando, sem resultado ≠ erro de rede, calculando, retry (CON-37/38/42).
- [ ] Eventos: `quick_route_destination_searched`, `quick_route_calculated`, `quick_route_stop_added`.

**Backend**

- [ ] Confirmar (já existe): `POST /places/directions` com 2 pontos devolve várias `routes[]`. Com intermediários, uma rota só — documentar no app (não mostrar chips de alternativa com paradas).

**Ainda não:** persistir Iniciar/Salvar (sprint 4). Nesta sprint “Iniciar” pode: (a) ficar disabled com toast “em breve”, ou (b) criar `POST /routes` planned como **atalho temporário** — **preferir (a)** para não misturar entidades. Discussão: se o beta precisar navegar já, usar (b) marcado como débito.

**Pronto quando:** GPS → destino → traço no mapa → paradas → planejador recebe o mesmo trajeto.

### Sprint 3 — Alternativas visíveis (P0.5)

RN-08.

**Backend**

- [ ] Expor nas alternativas o que o Google já manda (`isDefault`, km, duração, polyline). Sem campo `profile: winding` até Q2.
- [ ] (Opcional Q2) Métrica de curvas na polyline **ou** deixar chips de perfil desligados.

**App**

- [ ] Sem intermediários: desenhar N polylines; seletor “Opção A/B/C” (ou default/alternativas).
- [ ] **Não** mostrar “Mais sinuosa” sem `profile` no payload.
- [ ] Trocar opção atualiza km/tempo/custo (custo só se sprint 5).
- [ ] Evento `route_profile_selected` (id da opção, não nome fake).

**Pronto quando:** usuário escolhe traçado real antes de iniciar; zero label mentiroso.

### Sprint 4 — Persistência rápida: Iniciar, Salvar, Recentes

RN-04, RN-07. Depende de Q1 (hipótese `kind`).

**Backend**

- [ ] Migration `kind`, índice `(created_by_id, kind, started_at)`.
- [ ] `POST /routes` aceita `kind: quick | planned` (default `planned`).
- [ ] Quick: `Iniciar` → `status=in_progress` + `started_at`. `Salvar` planned não usa TTL.
- [ ] `GET /routes/me` passa a devolver `kind` (e opcional `group`).
- [ ] `GET /routes/me/recents?days=30` ou filtro no `me`: quick com `started_at` recente.
- [ ] Não deletar planned quando o quick expirar da listagem.

**App**

- [ ] Iniciar: POST quick + `ensureRouteBackgroundTracking` + `/navigate`.
- [ ] Salvar: POST planned `scheduled` (ou in_progress se “salvar e sair agora” — **não** está na CON-69; só Salvar vs Iniciar).
- [ ] Eventos `quick_route_started`, `quick_route_saved`.
- [ ] Converter para planejador: `quick_route_converted_to_planner`.

**Pronto quando:** calcular não cria linha; Iniciar aparece em Recentes; Salvar em Planejadas.

### Sprint 5 — Combustível premium (P1.7)

RN-09. Hipótese: gate por assinatura até CON-25.

**Backend**

- [ ] `POST /places/estimate-fuel` (e totais de rota): se usuário não for premium/vip, **não** retornar `fuelCost` / `pricePerLiter` (campos nulos + `locked: true`).
- [ ] Manter `fuelPriceByState` como fonte.
- [ ] Quando CON-25 existir: respeitar flag `premium_fuel_cost_estimate` (off = não retorna valor nem `locked` comercial).

**App**

- [ ] Sheet rápido + resumo final: premium vê R$; free vê bloco bloqueado + CTA assinatura (`/profile/subscription`).
- [ ] Sem moto: CTA Garagem (não substitui assinatura).
- [ ] Trocar moto no sheet; recálculo.
- [ ] **Zero** custo na `RouteNavigationView`.
- [ ] Flag off: some preço e paywall.
- [ ] Eventos `fuel_estimate_viewed`, `garage_cta_clicked`.

**Pronto quando:** free não vê número; premium vê; navegação sem R$.

### Sprint 6 — Minhas rotas lista (P0.6)

RN-05.

**App**

- [ ] `/routes/mine` lista vertical (sem carrossel).
- [ ] Grupos: Em andamento / Planejadas / Recentes / Concluídas (mapear `kind` + `status` + TTL).
- [ ] Manter `RoutesFiltersSheet` como filtro, não como seções.
- [ ] Banner Retomar; FAB Planejar roteiro.
- [ ] Empty/erro separados (CON-42).
- [ ] Preview no sheet da home + **Ver todas**.

**Backend**

- [ ] Se a lista `me` ficar pesada: paginar por grupo (CON-69 pediu). Pode ser fase 2 se o volume for baixo no beta.

**Pronto quando:** nenhuma seção em carrossel; Recentes ≠ Planejadas.

### Sprint 7 — Limite free 5 roteiros (P1.8)

RN-06, CON-51. Depende de Q4.

**Backend**

- [ ] Antes de `POST` planned privado: contar; se >= 5 e não premium → `402` ou `403` com código `FREE_ROUTE_LIMIT`.
- [ ] Quick/Recentes não contam.

**App**

- [ ] Paywall contextual no 6º Salvar / 6º Planejador. Nunca falhar em silêncio.
- [ ] Premium: sem contador.
- [ ] Evento `free_route_limit_reached`.

**Pronto quando:** 5º salva, 6º paywall, Recentes ilimitados.

### Sprint 8 — Explorar e comunidade (P1.9)

RN-11, RN-16.

**Backend**

- [ ] `POST /routes/:id/clone` (persistir) com `cloned_from_id`.
- [ ] Clone não precisa de endpoint para Personalizar (é draft no app).
- [ ] `assertCanNavigateRoute` no clone do próprio usuário.

**App**

- [ ] `/routes/explore`: publicadas, perto, amigos (hooks atuais). Lista, não mapa inicial.
- [ ] Detalhe visitante: **Iniciar agora** / **Salvar em Minhas rotas** / **Personalizar roteiro**.
- [ ] Personalizar: `RouteCreateView` com snapshot; back com alterações → Continuar / Sair sem salvar.
- [ ] Eventos `community_route_personalized`.
- [ ] Sem like/comentários/capa neste ciclo.

**Pronto quando:** visitante inicia ou salva cópia; personalizar não cria linha até Salvar.

### Sprint 9 — Parceiros no mapa (P1.10)

RN-10.

**App**

- [ ] Sheet idle: nearby por categoria (postos, mecânicas, restaurantes, hotéis). Sem comunidade, sem “destinos populares”.
- [ ] Tap: destino se vazio; parada se já houver trajeto.
- [ ] Recentes no sheet (depois do sprint 4).

**Backend**

- [ ] Campo `isConfrariaPartner` / `sponsored` no nearby **quando** Q6 existir. Até lá, lista orgânica sem selo.

**Pronto quando:** POIs no mapa idle; selo só com dado real.

### Sprint 10 — Planejador (P1.11)

RN-12, AH-03–06, CON-49 (se Q provider).

**App**

- [ ] Um dia: sem container “Dia 1”; botão Adicionar outro dia.
- [ ] Entrada convertida da rota rápida (origem/destino/paradas/alternativa).
- [ ] Origem GPS + restore (se não veio no sprint 1).
- [ ] AH-05/AH-06 no wizard (mesmo sheet).
- [ ] Sem toggle terra até CON-49/provider.

**Backend**

- [ ] CON-49: `avoidDirt` **somente** se Google/outro aceitar. Senão issue segue aberta, fora deste plano.

**Pronto quando:** wizard vazio ou pré-preenchido; 1 dia limpo; 2+ dias com seções.

### Sprint 11 — Navegação e encerramento (P1.12–13)

RN-13, RN-14, RN-15. Relacionada CON-72.

**App**

- [ ] Card: instrução, distância da manobra, tempo/km restantes, ETA, **velocidade**.
- [ ] Banner **Recalculando rota** (`isRerouting`).
- [ ] Sem combustível na tela de navigate.
- [ ] Buscar posto/oficina/restaurante **durante** navigate → add stop (recalcular). Sem limite nesta versão.
- [ ] FAB + tracking: já existem; QA minimizar → Mensagens → retomar.
- [ ] `RouteCompletedView`: ordem CON-69; share interno; salvar se ainda for quick não persistido como planned.
- [ ] Eventos `navigation_minimized`, `navigation_resumed`, `navigation_recalculated`, `route_completed`.

**Backend**

- [ ] Add stop em `in_progress` (hoje add stop só `scheduled` — **gap real**). Liberar `POST /routes/days/:dayId/stops` para dono em navegação, ou endpoint de desvio.

**Pronto quando:** recálculo visível; POI na via; resumo na ordem da RN-15.

### Sprint 12 — QA, instrumentação, issues irmãs

- [ ] Matriz AH-09: GPS com/sem número, teclado, sheet, Android/iOS.
- [ ] Free 4º/5º/6º roteiro; Recentes expiram sem apagar planned.
- [ ] Background kill + recovery (`active-navigation-store` + tracking session).
- [ ] CON-37/38/39/42 aplicados nas telas novas (empty, erro+retry, confirm destructive).
- [ ] Atualizar/encerrar CON-50 (combustível = premium).
- [ ] CON-52: não aplicar paywall em Recentes.

---

## 4. Mapa de arquivos (ponto de partida)

**App**

| Área | Arquivos |
|---|---|
| Home | `src/app/(app)/routes.tsx`, `pages/routes/view/RoutesView.tsx` |
| Layout/FAB | `src/app/(app)/_layout.tsx`, `ActiveRouteFAB.tsx` |
| Create | `RouteCreateView.tsx`, `RoutePlannerSheet.tsx`, `RouteCreateStep1.tsx`, `RouteDayCard.tsx` |
| Places UI | `PlaceAutocompleteField.tsx`, `lib/places/*` |
| Geo | `LocationGate.tsx`, `lib/location/*` |
| Nav | `RouteNavigationView.tsx`, `useRouteNavigation.ts`, `RouteCompletedView.tsx` |
| API | `lib/api-routes.ts`, `pages/routes/services/routes.service.ts` |

**Backend**

| Área | Arquivos |
|---|---|
| Rotas | `src/routes/routes.controller.ts`, `routes.service.ts`, `dto/*`, `prisma/schema.prisma` |
| Places | `places.service.ts`, `place-directions.dto.ts`, `nearby-places.dto.ts`, `estimate-fuel-cost.dto.ts` |
| Assinatura | `subscriptions.service.ts` (`getMe`) |

---

## 5. O que eu **não** tenho (para a discussão)

Dá para **iniciar Sprint 1–2 amanhã**. Antes do Sprint 4 (persistir Iniciar/Salvar) precisamos do **sim** nas hipóteses Q1 ou do modelo oficial.

Lista curta para a conversa:

1. Aceitam `Route.kind` quick/planned?
2. Alternativas: Opção A/B/C no beta, chips sinuosos depois — ok?
3. Combustível: gate por Stripe/`isVip` no beta, flag remota depois (CON-25) — ok?
4. Os 5 do free = planned privado não publicado?
5. Iniciar agora na comunidade persiste na hora?
6. Nearby patrocinado: tem dado no admin ou fica orgânico no beta?
7. Add stop com rota `in_progress` — backend libera nessa entrega?
8. “Iniciar” no sprint 2 fica desabilitado até o sprint 4, ou o beta precisa navegar já?

Se 1, 2, 3, 4 e 5 forem “ok na hipótese”, a informação **é suficiente** para implementar o núcleo da CON-69. 6, 7 e 8 só afinam escopo do beta, não o desenho.
