# Rotas: o que implementar no app

Documento único de trabalho. Cruza a comparação [protótipo × app](./rotas-prototipo-vs-app.md) com a lista de [ajustes](./rotas-ajustes-mobile.md).

- O primeiro MD diz **o que cada um tem** e onde o layout divergiu.
- O segundo MD diz **o que falta**, com prioridade.
- Este MD diz **o que o app deve ganhar, manter e ignorar** — backlog para implementar.

---

## Como ler os dois MDs juntos

| Documento | Pergunta que responde | Não serve para |
|---|---|---|
| `rotas-prototipo-vs-app.md` | Onde o app ficou diferente do layout/produto do protótipo? | Ordem de código, tickets, backend |
| `rotas-ajustes-mobile.md` | O que portar, em que ordem, o que não copiar do mock? | Inventário completo tela a tela |
| **Este arquivo** | O que entra no app, o que já está pronto, o que não se faz | Detalhe visual de cada tela |

Regra: o protótipo manda no **fluxo e no layout**. O app manda no **motor** (GPS, API, socket, permissões). Não desfazer o que o app já faz de verdade para “ficar igual ao SVG”.

---

## Já está no app — não reimplementar

Vem da seção 4 da comparação. Só encaixar no layout novo.

| Peça | Onde vive hoje |
|---|---|
| Wizard 4 passos (dias, moto, pedágio, combustível, agendar/sair agora) | `/routes/create`, `/routes/edit` |
| CRUD + status `scheduled → in_progress → finished` | backend `RoutesService` |
| Directions, Places, estimate-fuel | `/places/*` |
| Navegação GPS, reroute, keep-awake, background tracking | `/routes/[id]/navigate` |
| WebSocket (posição, reporte, foto) | namespace `/route-navigation` |
| Convite pelo chat, aceitar/recusar | detalhe + `RouteInvitation` |
| Publicar / despublicar | `PATCH /routes/:id/publish` |
| Avaliação + gate se saiu sem notar | `RouteCompletedView`, `PendingRouteReviewGate` |
| FAB rota ativa | layout autenticado |
| Filtros ricos de minhas rotas | `RoutesFiltersSheet` — **manter** ao virar lista vertical |
| Card de rota pessoal (mini-traçado) | `SavedRouteCard` — reusar |
| Nearby de estabelecimentos | hoje em Serviços; **reusar** na home mapa |

---

## Implementar — backlog

Cada item: o que a comparação mostrou → o que o ajuste pede → o que fazer no app (e no backend, se precisar).

### Bloco A — Home e trajeto rápido (P0)

Sem isso a aba Rotas continua um CRUD, não o produto do protótipo.

| # | Comparação mostrou | Ajuste pediu | Implementar no app | Backend |
|---|---|---|---|---|
| A1 | Home é lista com tabs; protótipo é mapa tela cheia | Recriar `RoutesHome` em `/routes` | Mapa full screen, GPS, TopBar “Para onde vamos?” (Places), sheet com detents, atalhos Explorar / Minhas rotas, CTA Planejar roteiro, recentrar. Tabs atuais saem da home. | Não |
| A2 | Não existe trajeto rápido; tudo cai no wizard | GPS → destino → resumo no sheet | Sheet: km, tempo, ETA, combustível da moto, Iniciar / Salvar / paradas / trocar moto / Planejar roteiro. Wizard só com 2+ paradas ou vários dias. | `POST /routes` já serve (sair agora ou agendar) |
| A3 | Sem chips sinuosa / equilibrada / direta | Usar `routes[]` do directions, não senóide mock | Pedir 2–3 rotas, rotular, desenhar polylines, usuário escolhe **antes** de salvar/iniciar | Ampliar `POST /places/directions` para devolver alternativas + métricas |
| A4 | Minhas rotas em carrossel; PRD do protótipo é lista | Lista vertical agrupada | Tela `/routes/mine` (ou equivalente): Em andamento / Planejadas / Recentes / Concluídas, 1 card por linha. Manter filtros, banner Retomar, FAB. | Não |

**Rotas Expo sugeridas depois de A1/A4:**

| Rota | Papel |
|---|---|
| `/routes` | Home mapa (hoje é a lista) |
| `/routes/mine` | Minhas rotas (lista) |
| `/routes/explore` | Comunidade |
| `/routes/create` | Wizard (já existe) |
| `/routes/[id]` | Detalhe (já existe) |
| `/routes/[id]/navigate` | Navegação (já existe) |

Esconder o FAB na home mapa (o protótipo esconde em `ROUTES_HOME` para não cobrir o sheet).

---

### Bloco B — Comunidade (P1)

A comparação: explorar é parcial; visitante não inicia a rota. O ajuste: tela própria + clone.

| # | Comparação mostrou | Ajuste pediu | Implementar no app | Backend |
|---|---|---|---|---|
| B1 | 3 carrosséis, só busca | Tela Explorar como o `CommunityRoutesTab` | Seções: suas publicadas, perto, amigos, **por região**. Chips Sul…Norte. Filtros dificuldade, nota, km, região. Card de comunidade (capa, dificuldade, rating, tags, autor) | `difficulty`, `tags`, `description`, macrorregião no `Route`; query nos discovers |
| B2 | Mesmo detalhe da rota própria; CTA iniciar só dono/participante | Detalhe público + clonar | Layout visitante: hero, autor, tags, descrição, itinerário, lista de reviews (`GET /reviews` já existe). CTA **Usar esta rota** clona e opcionalmente navega | `POST /routes/:id/clone` (sem isso o `assertCanNavigateRoute` bloqueia) |
| B3 | Favoritos de rotas vazio; sem like/comentários | Favoritar + decidir comentários | Coração no detalhe público; preencher tab Rotas em `/profile/favorites`. Comentários: reusar review ou thread — decisão de produto antes de código | `POST /routes/:id/favorite` |
| B4 | Share só no chat | Deep link + share nativo | WhatsApp / copiar `/routes/:id`. Convite no chat **permanece** | URL pública ou app link |

---

### Bloco C — Mapa local e wizard (P1)

| # | Comparação mostrou | Ajuste pediu | Implementar no app | Backend |
|---|---|---|---|---|
| C1 | Parceiros no mapa só no mock | Pins + sheet na home | Reusar `GET /places/nearby`. Categorias: posto, oficina, restaurante, hotel. Tap = destino ou parada | Reusar Places; se faltar categoria, estender nearby |
| C2 | Wizard sem “evitar terra” | Flag só se o provider aceitar | Toggle no passo 3 + chip no detalhe | `avoidDirt` no create/update + parâmetro no directions. Sem suporte: **não mostrar** |
| C3 | Sem capa ao salvar | Upload ou snapshot do mapa | Picker no passo 4 / modal salvar, igual eventos. Hero no detalhe público e no card de explorar | Campo de capa no `Route` (storage) |
| C4 | Sem atalhos/histórico no passo 1 | Histórico de buscas; atalhos só com fonte real | Últimos destinos Places. Chips Serra/Praia só se houver catálogo. Conferir foto nas sugestões já existentes | Opcional: persistir últimas buscas |

---

### Bloco D — Polish da navegação e conclusão (P2)

Motor já é melhor que o protótipo. Aqui é paridade de UI, não reescrita.

| # | Comparação mostrou | Ajuste pediu | Implementar no app | Backend |
|---|---|---|---|---|
| D1 | Sem voz / noite / pause | Avaliar, não copiar botão morto | TTS das manobras; estilo escuro do mapa; pause só com regra clara para `in_progress` | Pause: definir se congela só o client ou também o tracking |
| D2 | Card de instrução diferente do mock | Alinhar visual | Tipografia/posição tipo “800 m + manobra” no topo; manter carrossel real de steps | Não |
| D3 | Sem “Compartilhar experiência” na chegada | Post no feed com stats | Botão no `RouteCompletedView` (câmera/feed da navegação já existem) | Reusar create post |
| D4 | FAB e gate já ok | Só posição | Esconder FAB na home mapa (A1) | Não |

---

## Não implementar

Consenso dos dois MDs. Mock, ou o app já resolveu melhor.

| Item do protótipo | Motivo |
|---|---|
| Mapa CSS/SVG na navegação | GPS + polyline reais |
| Senóide `routeAlternatives.ts` | Directions reais (A3) |
| Parceiros colados em Curitiba | Places nearby (C1) |
| Alerta “neblina” / IA | Reportes de piloto |
| Salvar mapa offline / badge Offline Ativo | Sem tile offline |
| Marcar concluída sem viajar | Quebra `started_at` / `finished_at` e a nota |
| Modal WhatsApp/copiar sem ação | Share nativo de uma vez (B4) |
| Desfazer wizard, socket, convites, tracking | O app está na frente; o layout novo **usa** isso |

---

## Decisões de produto (travar antes do código)

Sem isso o bloco B/C/D vira retrabalho.

1. **Clone vs. participar:** “Iniciar passeio” numa rota publicada cria uma rota nova do usuário, ou só convite ao dono? Os dois MDs assumem **clone**.
2. **Comentários** vs. **reviews:** o protótipo tem os dois. O backend hoje só tem review (1 por usuário, pós-finished). Favorito é separado.
3. **`avoidDirt`:** só entra no UI se o Google (ou o provider) realmente desviar de terra.
4. **Pause na navegação:** pausa visual ou também para o background tracking?
5. **Atalhos Serra/Praia/Cênica:** catálogo editorial ou só histórico pessoal?

---

## Ordem de implementação (app)

Une a ordem do segundo MD com o que a comparação mostrou como gap estrutural.

| Sprint | Entrega | Depende de | Só app? |
|---|---|---|---|
| **1** | A1 Home mapa + sheet + atalhos + recentrar | — | Sim (reusar mapa/Places/geo) |
| **2** | A2 Trajeto rápido (resumo, paradas, iniciar/salvar) | A1, `POST /routes` | Quase; directions atuais bastam para 1 rota |
| **3** | A3 Chips de alternativas no mapa | A2 | **Não** — directions com N rotas |
| **4** | A4 Minhas rotas lista vertical (mover a lista atual) | A1 | Sim |
| **5** | B2 Clone + detalhe público | Decisão clone | **Não** — endpoint clone |
| **6** | B1 Explorar (região, filtros, card) | Campos no `Route` | **Não** |
| **7** | C1 Parceiros no mapa da home | A1 | Reusar nearby |
| **8** | B3–B4 + C2–C3 Favoritos, share, terra, capa | Endpoints | Misto |
| **9** | D1–D3 Voz, noite, pause, share na chegada, visual do card | Decisões D1 | Quase só app |

Depois do sprint 4 a hierarquia do protótipo está no ar. Depois do 6 a comunidade deixa de ser “minhas publicadas em carrossel”. 7–9 são produto, não correção de IA.

---

## Checklist por tela (quando “pronto”)

Para não entregar home-mapa e deixar o resto no modelo antigo.

| Tela | Pronto quando |
|---|---|
| `/routes` | Mapa + busca destino + sheet idle (atalhos + parceiros) + trajeto rápido com alternativas |
| `/routes/mine` | Lista vertical agrupada + filtros atuais + retomar |
| `/routes/explore` | Seções + região + filtros + card de comunidade |
| `/routes/[id]` visitante | Hero/autor/tags/reviews + Usar esta rota (clone) + favoritar + share |
| `/routes/[id]` dono | Como hoje (mapa, convites, publicar, iniciar) + capa/chip terra se existirem |
| `/routes/create` | Como hoje + terra se houver provider + capa + histórico de destinos |
| `/navigate` | Como hoje (GPS, socket, mídia, reporte) + visual do card; voz/noite/pause se aprovados |
| Conclusão | Como hoje + compartilhar experiência |
| Favoritos | Tab Rotas com dados |

---

## Mapa rápido

```
Protótipo manda          App já tem              Falta implementar
──────────────           ──────────              ─────────────────
Home = mapa              Wizard 4 passos         A1 home mapa
Trajeto rápido           GPS / reroute           A2 resumo no sheet
3 alternativas           Socket / reportes       A3 directions N rotas
Lista vertical           Convites / publish      A4 tirar carrossel
Explorar + filtros       Avaliação + gate        B1 explorar de verdade
Iniciar rota alheia      FAB + tracking          B2 clone + detalhe público
Parceiros no mapa        Nearby (em Serviços)    C1 nearby na home
Capa / terra / share     Chat share              B3 B4 C2 C3
```
