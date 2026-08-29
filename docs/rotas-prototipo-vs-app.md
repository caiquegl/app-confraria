# Rotas: protótipo × app mobile

Comparação entre `prototipo-app-confraria` (layout web, dados mock, sem backend) e `app-confraria` (Expo + Nest). O protótipo é a referência visual e de produto; o app é a implementação real.

---

## 1. Arquitetura de telas

### Protótipo

A aba Rotas **abre no mapa**. Lista, explorar e planejador são destinos secundários.

| View | Tela |
|---|---|
| `ROUTES_HOME` | Mapa tela cheia + bottom sheet |
| `MY_ROUTES` | Lista vertical das rotas salvas |
| `EXPLORE_ROUTES` | Feed da comunidade |
| `ROUTE_PLANNER` | Wizard 4 passos, detalhe, navegação mock, conclusão |

Fluxo rápido no mapa: buscar destino → chips de alternativa (sinuosa / equilibrada / direta) → resumo no sheet (iniciar, salvar, adicionar parada, planejar roteiro).

### App

A aba Rotas **abre numa lista com tabs**. Não existe mapa como home.

| Rota | Tela |
|---|---|
| `/routes` | Tabs “Todas as Rotas” / “Minhas Rotas” |
| `/routes/create` | Wizard 4 passos (mapa + sheet) |
| `/routes/edit` | Mesmo wizard |
| `/routes/[routeId]` | Detalhe |
| `/routes/[routeId]/navigate` | Navegação GPS real |

Não há trajeto rápido (origem = GPS → destino agora, sem wizard). Para ir a algum lugar, o usuário entra no planejador completo.

---

## 2. Layout por tela

### 2.1 Home

| | Protótipo (`RoutesHome`) | App (`RoutesView`) |
|---|---|---|
| Hierarquia | Mapa em tela cheia | Lista com header + tabs |
| Busca | “Para onde vamos?” (destino Nominatim) | “Buscar rota por nome” (filtra cards) |
| Sheet inicial | Atalhos Explorar / Minhas rotas, parceiros no mapa, viagens recentes | Não existe |
| CTA principal | “Planejar roteiro” flutuando no mapa | FAB “Nova viagem” só em Minhas Rotas |
| Recentrar GPS | Botão no mapa | Só no `LocationGate` e na navegação |
| Alternativas de trajeto | Chips sinuosa / equilibrada / direta no header | Não existe |

### 2.2 Minhas rotas

O PRD do protótipo **tirou o carrossel** desta tela: lista vertical para comparar de relance.

| | Protótipo (`MyRoutesScreen`) | App (aba Minhas Rotas) |
|---|---|---|
| Layout | Lista vertical agrupada | Carrossel horizontal por grupo (exceto “Em andamento”) |
| Grupos | Em andamento / Planejadas / Recentes / Concluídas | Em andamento + buckets de período (Hoje, Semana, Mês, Próximos, Sem data) + Concluídas |
| Filtros | Só busca do TopBar | Sheet completo: período, conclusão, moto, datas, status + chips rápidos |
| Card | Mini-traçado SVG, tags “Já viajei” / “Dia X de Y” | Mesmo visual de card (portado) |
| Banner retomar | Não nesta tela (FAB global) | Banner “Em navegação → Retomar” |
| Empty state | Ícone + “Criar nova rota” | Equivalente |

O app **enriqueciu filtros** em relação à tela atual do protótipo, mas **voltou ao carrossel** que o protótipo tinha abandonado.

### 2.3 Explorar / comunidade

| | Protótipo (`ExploreRoutesScreen` + `CommunityRoutesTab`) | App (aba Todas as Rotas) |
|---|---|---|
| Layout | Feed com seções e chips de região | 3 carrosséis horizontais |
| Publicadas por você | Sim, no topo | Sim |
| Perto de você | Sim | Sim (cidade/região do GPS) |
| Rotas de amigos | Sim | Sim (quem está em `friends_list`) |
| Por região (Sul, Sudeste…) | Chips + lista | Não |
| Filtros | Dificuldade, região, nota mínima, faixa de km | Só busca textual |
| Card da comunidade | Foto/mapa, dificuldade, rating, tags, autor | `SavedRouteCard` genérico (mesmo da lista pessoal) |
| Detalhe | Tela própria estilo “post”: hero, autor, tags, descrição, itinerário, reviews, like, comentários, share, **Iniciar passeio** | Mesmo `RouteDetailView` de rota própria; visitante **não inicia** a rota |

### 2.4 Planejador (wizard)

Os 4 passos são os mesmos na intenção. Diferenças de layout e conteúdo:

| Passo | Protótipo | App |
|---|---|---|
| 1 Itinerário | Cards de dia, sugestões com foto/nota, atalhos (Serra, Praia, Cênica) e histórico | Cards de dia, autocomplete Places, sugestões reais da API, sem atalhos/histórico |
| 2 Moto | Lista com consumo/tanque; autonomia muda o mapa | Equivalente |
| 3 Ajustes | Evitar pedágio, **evitar terra**, otimizar combustível | Pedágio + combustível. **Sem evitar terra** |
| 4 Resumo | Card escuro, custos, agenda agora/depois, capa da rota ao salvar | Equivalente (agora/agendar), **sem escolher capa** |
| Mapa | Mock/MapLibre no fundo | Google/Places directions reais no fundo |
| Salvar | Modal com nome + capa (imagem ou mapa) | POST direto, título gerado pelos dias |

### 2.5 Detalhe

| | Protótipo | App |
|---|---|---|
| Header | Voltar, título, share, menu ⋮ | Equivalente |
| Abas | Geral / Dias | Geral / Dias |
| Hero | Capa ou mini-mapa | Mapa real com polyline |
| Preferências | Chips pedágio / terra / eco | Só o que veio do backend (sem terra) |
| Convidados | Lista mock (Rafa, Thiago, Bruna) | Convidados e participantes reais + convite pelo chat |
| Offline | Salvar / apagar mapa offline | Não existe |
| Marcar concluída | Toggle manual no menu | Só via finalizar navegação |
| Publicar | Globe + publicar/despublicar | Equivalente |
| Excluir / editar | Só rota salva | Só `scheduled`, dono |

### 2.6 Navegação

| | Protótipo (CSS + SVG, sem GPS) | App (GPS + directions reais) |
|---|---|---|
| Mapa | Grid + linha fake | Mapa nativo, polyline, snap, reroute |
| Instrução | Card escuro no topo (“800 m, vire…”) | Card real com manobras e carrossel |
| Alerta contextual | Mock (posto, oficina) | Reportes de piloto (trânsito, radar, acidente…) |
| Assistente IA | Balão “neblina adiante” | Não existe (e não precisa portar o mock) |
| Controles | Mute voz, recentrar, modo noite | Reporte, câmera/mídia, recentrar |
| Pause | Botão pause | Não existe |
| Minimizar | “Minimizar mapa” | FAB global “Rota ativa” (mesmo conceito, outro visual) |
| Offline badge | “Offline Ativo” | Não existe |
| Parceiros no mapa | Não (navegação é solo mock) | Avatares ao vivo via WebSocket |
| Mídia | Não | Story, feed, foto pinada no mapa |
| Chegada | Tela “Chegamos!” | Tela equivalente + persistência da nota |

### 2.7 Conclusão / nota

Visual bem próximo: fundo escuro, estrela, comentário, distância/tempo, “Avaliar & Salvar”.

| Protótipo | App |
|---|---|
| “Compartilhar Experiência” (botão morto) | Não tem |
| Voltar para Início | Equivalente |
| Gate se saiu sem avaliar | App tem `PendingRouteReviewGate` global (melhor que o protótipo) |

---

## 3. Matriz de funcionalidades

Legenda: **Sim** = existe de verdade · **Parcial** = existe mas incompleto ou outro layout · **Não** = ausente · **Mock** = só no protótipo, sem motor real.

### Descoberta e home

| Funcionalidade | Protótipo | App |
|---|---|---|
| Home = mapa em tela cheia | Sim | Não |
| Trajeto rápido (destino na busca) | Sim (mock de alternativas) | Não |
| 3 perfis de rota (sinuosa / equilibrada / direta) | Mock | Não |
| Parceiros no mapa (posto, oficina, restaurante, hotel) | Mock | Não |
| Viagens recentes no sheet | Mock | Não |
| Recentrar no GPS | Sim | Só na navegação |
| Explorar rotas da comunidade | Sim | Parcial (tab, sem filtros de produto) |
| Filtro dificuldade / nota / km / região | Sim | Não |
| Rotas por macrorregião | Sim | Não |
| Favoritar rota da comunidade | Mock | Tab Favoritos existe, lista de rotas vazia |
| Like + comentários na rota publicada | Mock | Não |
| Copiar rota da comunidade e sair | Sim (escolhe moto e “inicia”) | Não (visitante só vê o detalhe) |

### Planejamento

| Funcionalidade | Protótipo | App |
|---|---|---|
| Wizard 4 passos | Sim | Sim |
| Vários dias + pernoite | Sim | Sim |
| Reordenar paradas | Sim | Sim |
| Sugestões de parada | Mock com foto | API Places real |
| Atalhos (Serra, Praia, Cênica) | Mock | Não |
| Histórico de destinos | Mock | Não |
| Evitar pedágio | Mock no custo | Sim (entra no directions) |
| Evitar estrada de terra | Mock (só chip) | Não |
| Otimizar combustível | Mock | Flag salva; impacto no traçado limitado |
| Estimativa combustível / pedágio | Fórmula mock | API `estimate-fuel` |
| Agendar ou sair agora | Sim | Sim |
| Escolher capa (foto ou mapa) | Sim | Não |
| Salvar offline | Mock | Não |

### Social e detalhe

| Funcionalidade | Protótipo | App |
|---|---|---|
| Publicar no Confraria | Mock local | Sim (`is_published`) |
| Share WhatsApp / copiar link | UI sem backend | Share pelo chat interno |
| Convidar amigos | Avatares mock | Convite real via chat + `RouteInvitation` |
| Aceitar / recusar convite | Não | Sim |
| Lista de reviews da comunidade | Mock | API existe; UI do detalhe mostra sobretudo a nota do usuário |
| Editar / excluir pendente | Sim | Sim (regras de status) |

### Navegação

| Funcionalidade | Protótipo | App |
|---|---|---|
| GPS, manobras, ETA | Mock | Sim |
| Recálculo fora da rota | Não | Sim |
| Localização dos parceiros ao vivo | Não | Sim (Socket.IO) |
| Reportes na via | Não | Sim |
| Foto no mapa / story / feed | Não | Sim |
| Tracking em background | Não | Sim |
| Voz / mute | UI | Não |
| Modo noite do mapa | UI | Não |
| Pausar navegação | UI | Não |
| FAB rota ativa | Sim | Sim |
| Avaliação ao terminar | Sim | Sim + gate global |

---

## 4. O que o app ganhou (não estava no protótipo)

Coisas novas, certas de manter:

- Backend completo (CRUD, status `scheduled → in_progress → finished`, publish, soft delete).
- Directions, Places, combustível reais.
- Navegação GPS com reroute, keep-awake, tracking em background.
- Sala WebSocket: posições, reportes, fotos.
- Convites e participantes de verdade (chat).
- Avaliação persistida e gate se o usuário saiu sem notar.
- Permissões de dono vs. participante.
- Paginação das listas de descoberta.

Essas peças não devem ser desfeitas para “ficar igual ao mock”.

---

## 5. Resumo da mudança de layout

O app **inverteu a hierarquia do protótipo**.

Protótipo (depois do redesign):

1. Mapa + “para onde vamos?”
2. Trajeto rápido no sheet
3. Planejador só se o passeio ficar complexo
4. Lista e explorar como atalhos do sheet

App hoje:

1. Lista (Minhas / Todas)
2. Planejador de 4 passos para qualquer viagem
3. Navegação só depois de criar/iniciar uma rota persistida
4. Mapa só no create/detalhe/navigate

O card de “minha rota” foi bem portado. O feed de comunidade e a home-mapa não.

Próximo: [rotas-ajustes-mobile.md](./rotas-ajustes-mobile.md) (prioridades). Backlog único: [rotas-implementar-no-app.md](./rotas-implementar-no-app.md).
