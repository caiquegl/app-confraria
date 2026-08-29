# Rotas: o que ajustar no mobile

O que falta no `app-confraria` para a experiência de Rotas. Fontes, nesta ordem de autoridade:

1. **[CON-69](https://linear.app/motoconfraria/issue/CON-69/ajustes-da-tela-de-rotas)** — regras de produto (RN-01 a RN-16) e pedidos do Hallefy (AH-01 a AH-09). Vale sobre o protótipo quando houver conflito.
2. [rotas-prototipo-vs-app.md](./rotas-prototipo-vs-app.md) — layout e fluxos do protótipo.
3. Código atual do app — o que reaproveitar, não reescrever.

Backlog de implementação: [rotas-implementar-no-app.md](./rotas-implementar-no-app.md).  
Plano com todo list (app + backend): [rotas-plano-implementacao.md](./rotas-plano-implementacao.md).

Prioridade:

- **P0** — muda a leitura da aba Rotas (mapa, rota rápida, lista).
- **P1** — comunidade, combustível premium, limites free, planejador, parceiros.
- **P2** — polish de navegação, encerramento, instrumentação.
- **Não fazer** — mock do protótipo, ou o app já resolve melhor.

---

## O que mudou neste MD depois da CON-69

Comparação item a item: o que o MD original pedia × o que a issue fechou.

| Item do MD original | CON-69 | Fica neste MD |
|---|---|---|
| Home = mapa + sheet + “Para onde vamos?” | RN-01, AH-01, AH-02 | **Mantém.** Mapa é a entrada. Explorar e Minhas rotas são telas secundárias, não tabs iguais ao mapa. |
| Sem GPS, `LocationGate` bloqueia a aba inteira | RN-02 | **Corrige.** Sem permissão: empty no mapa/busca/navegação. **Explorar e Minhas rotas continuam.** |
| Trajeto rápido; wizard a partir de 2 paradas | RN-03 | **Corrige.** Parada **não** converte sozinha. Só **Planejar este roteiro**. Sem limite de paradas nesta versão. |
| `POST /routes` ao iniciar/salvar | RN-04 | **Corrige.** Calcular **não salva**. **Iniciar** → Recentes (30 dias). **Salvar** → Minhas rotas (não expira). Entidades distintas (rápida vs. planejada). |
| Alternativas: sempre mostrar 3 chips | RN-08 | **Corrige.** Só se o backend classificar sinuosidade de verdade. Sem dado, **não inventar** chip. |
| Combustível visível para todo mundo | RN-09, CON-50 | **Corrige.** Valor em R$ é **premium + feature flag**. Free vê benefício bloqueado + CTA. Não some o bloco. **Não mostrar na pilotagem.** |
| Grupos da lista: período (Hoje, Semana…) | RN-05 | **Corrige.** Só: Em andamento / Planejadas / Recentes (30 dias) / Concluídas. Lista vertical. |
| Clone imediato da rota da comunidade | RN-11 | **Corrige.** Três CTAs: Iniciar agora / Salvar / Personalizar. Personalizar = **cópia temporária** no Planejador; persiste só no Salvar. Sair com alteração → confirmar. |
| Share WhatsApp / copiar link | RN-15 | **Corrige.** Share principal é **interno** (Confraria). Link externo só se abrir/instalar o app. |
| CTA “Nova viagem” | item 12 | **Corrige.** Renomear para **Planejar roteiro**. |
| Sem regra de 5 rotas | RN-06, CON-51 | **Inclui.** Free: 5 roteiros privados salvos. 6º = paywall. Recentes **não** entram no limite. |
| Sem origem sem rua/número | AH-03, AH-04 | **Inclui.** Origem = lat/lng. Reverse geocode não bloqueia. |
| Sem bug de autocomplete/sheet | AH-05, AH-06 | **Inclui.** Lista acima do teclado; sheet arrasta pelo conteúdo, não só pelo puxador. |
| 1 dia já mostra “Dia 1” | RN-12 | **Inclui.** Um dia: sem container Dia 1. Segundo dia cria a estrutura. |
| Like/comentários no detalhe público | — | **Fora desta issue.** CON-69 não pede like/comentários; pede Iniciar / Salvar / Personalizar. Favoritos de rotas fica em aberto. |
| Capa da rota | — | **Fora desta issue.** Protótipo tem; CON-69 não pede. Pode voltar depois. |
| Voz / modo noite / pause | RN-13 | **Não é P0.** Prioridade da issue: instrução, ETA, velocidade, recálculo, minimizar, foto, reporte. Voz/noite/pause continuam P2 opcional. |
| Destinos populares no sheet | RN-10 | **Não incluir.** Só parceiros/postos/oficinas/restaurantes/hotéis + recentes + atalhos. Selo **Parceiro Confraria / Patrocinado**. |

---

## P0 — Hierarquia da home e rota rápida

### 1. Home mapa — RN-01, AH-01, AH-02

Recriar `/routes` como o `RoutesHome` do protótipo e da CON-69:

- Mapa tela cheia, centrado no GPS.
- Busca **Para onde vamos?** (Places, não filtro de nome de rota).
- Recentrar.
- CTA **Planejar roteiro** (não “Novo passeio” / “Nova viagem”).
- Sheet com detents: atalhos **Explorar rotas** e **Minhas rotas**.
- Rotas da comunidade **não** aparecem como traçado no mapa inicial.
- Distinguir **Mapa** da **biblioteca de Rotas** (AH-02). Eventos e Serviços ficam fora do cálculo (AH-08); parceiros no mapa podem pontuar para Serviços.

Minhas rotas e explorar viram telas (`/routes/mine`, `/routes/explore`), não tabs da home.

Esconder o FAB de rota ativa nesta tela (não cobrir o sheet), como o protótipo.

### 2. Localização — RN-02, AH-03, AH-04

Hoje o `LocationGate` bloqueia a aba inteira. A issue manda o contrário.

- Sem permissão: empty state **só** no mapa, busca e navegação.
- Explorar e Minhas rotas **sempre acessíveis**.
- Tratar: carregando, pedível, negada, bloqueada no SO, falha de coordenadas.
- Origem do planejamento = coordenadas atuais. Rótulo humano se o reverse geocode vier; se não vier, a rota **segue**.
- Fallback do rótulo: estabelecimento → bairro/cidade → “Localização atual” → coords.
- Nunca exigir rua/número. Falha de geocode não apaga lat/lng.
- Origem editável; ação **Minha localização** restaura. Rota nova não reutiliza origem de um draft antigo.

### 3. Rota rápida — RN-03, RN-04, itens 4–6 da issue

Escolher destino **não** abre o wizard. Sheet de resumo:

- Destino, duração, distância, ETA, alternativa, moto.
- Combustível: ver item 8 (premium).
- CTAs: **Iniciar**, **Adicionar parada**, **Salvar**, **Planejar este roteiro** (quando houver paradas; nunca forçar).
- Add / remove / reorder de paradas **sem sair** do fluxo rápido. Sem limite nesta versão.
- Calcular **não cria registro**.
- **Iniciar** → Recentes (TTL 30 dias, contrato backend).
- **Salvar** → persistente em Minhas rotas (não expira com Recentes).
- Converter para o Planejador preserva origem, destino, alternativa e paradas.

Estados de UI: busca vazia, buscando, sem resultado ≠ erro de rede, calculando, erro com retry (CON-37, CON-38, CON-42).

### 4. Autocomplete e sheet — AH-05, AH-06

Bugs relatados no Planejador; valem também na rota rápida.

- Lista de sugestões visível **acima do teclado**, rolável, não recortada pelo sheet.
- Destino só vale com place ID + coordenadas. Texto livre sem resolver **não** calcula.
- Sheet expande/recolhe pelo puxador **e** por área não interativa. Lista interna rola. Android e iOS.

### 5. Alternativas — RN-08

Mais sinuosa / Equilibrada / Mais direta, com duração, distância e impacto de consumo.

- Usar `routes[]` reais do directions. **Não** senóide do protótipo.
- Se o backend não classificar sinuosidade, **não mostrar classificação fictícia**.
- Escolha do usuário **antes** de iniciar/salvar. Trocar alternativa recalcula combustível.

### 6. Minhas rotas — RN-05

Lista vertical. Grupos **somente**:

| Grupo | O que entra |
|---|---|
| Em andamento | Rota rápida ou roteiro **ativo** agora |
| Planejadas | Roteiros persistidos ainda não iniciados |
| Recentes | Rápidas **iniciadas** nos últimos 30 dias |
| Concluídas | Roteiros planejados **finalizados** |

- Sem carrossel. Sem fatia por “Hoje / Semana / Mês” como agrupamento principal (filtros atuais do app podem **permanecer** como filtro, não como seções).
- Banner Retomar + FAB **Planejar roteiro**.
- Sheet do mapa é prévia; **Ver todas** abre esta tela.
- Cada estado só mostra ações compatíveis.

---

## P1 — Combustível, free, comunidade, planejador, parceiros

### 7. Estimativa de combustível — RN-09 (fecha CON-50)

`custo = distância ÷ consumo médio da moto × preço regional`

- Feature flag sugerida: `premium_fuel_cost_estimate` (CON-25).
- Flag off: não mostra valor nem paywall.
- Flag on + premium: valor, moto, consumo, trocar moto.
- Flag on + free: bloco **visível e bloqueado** + CTA de assinatura. Não some.
- Flag on + erro/assinatura desconhecida: não libera valor, sem número inventado.
- Sem moto: CTA Garagem. Cadastrar moto **não** substitui a assinatura.
- Recalcular ao trocar moto ou alternativa.
- Mostrar **antes** da navegação e no **resumo final** (se elegível).
- **Não** mostrar durante a pilotagem.
- Backend não deve devolver o valor monetário para quem não é elegível.

### 8. Limite free — RN-06 (CON-51) e Recentes — RN-07 (CON-52)

- Rota rápida: grátis, sem limite de paradas nesta versão.
- Planejador: **5 roteiros privados salvos** no free. 6º = paywall com contexto, nunca bloqueio silencioso. Premium não vê contador.
- Recentes **não** consomem o limite de 5.
- TTL de Recentes (30 dias, operacional) **≠** histórico comercial da CON-52. Não aplicar paywall em Recentes nem apagar roteiro salvo.

### 9. Explorar — item 10 da issue

Tela própria, fora do mapa. Preservar: publicadas, perto, amigos.

A CON-69 **não** exige chips de macrorregião / dificuldade / nota / km (isso vinha do protótipo). Manter descoberta em lista. Filtros extras do protótipo ficam **P2 / decisão de produto**, não bloqueiam o P1.

Ao selecionar uma rota publicada (RN-11):

1. **Iniciar agora**
2. **Salvar em Minhas rotas**
3. **Personalizar roteiro** — abre Planejador com dados preenchidos, **cópia temporária**. Sem salvar, não persiste. Sem alteração: sair. Com alteração: Continuar editando / Sair sem salvar (RN-16).

Like, comentários e capa do detalhe “post” do protótipo **não estão na CON-69**. Não implementar neste ciclo.

### 10. Parceiros no mapa — RN-10

Sheet idle: parceiros, postos, oficinas, restaurantes/cafés, hotéis/pousadas, trajetos recentes, atalhos.

- Reusar `GET /places/nearby` (hoje em Serviços).
- **Não** destinos populares. **Não** rotas da comunidade.
- Pago: selo **Parceiro Confraria** ou **Patrocinado** (CON-58). Não parecer orgânico.
- Tap: destino se o campo estiver vazio; parada se já houver trajeto.

### 11. Planejador — item 12, RN-12, CON-49

- Entrada vazia **ou** convertida da rota rápida (preserva origem/destino/paradas/alternativa).
- Um dia: inputs em largura total, **sem** título “Dia 1”. **Adicionar outro dia** cria Dia 1, Dia 2…
- Manter dias, pernoites, autonomia, pedágio, combustível.
- **Evitar estrada de terra / tipo de estrada:** CON-49. Só mostrar se o provider aceitar. Sem suporte, sem toggle fake.
- Draft descartável; sem autosave até produto decidir (pendência da issue).
- Origem GPS + autocomplete + sheet: mesmos AH-03 a AH-06.

### 12. Navegação ativa — RN-13, RN-14

Já existem GPS, reroute, FAB, foto, reporte, socket. Ajustar layout e estados:

Priorizar: próxima instrução, distância da conversão, tempo restante, distância restante, ETA, **velocidade atual**, paradas, recentrar, foto, reporte.

- Estado **Recalculando rota** visível (CON-72 relacionada).
- Custo **fora** da tela de pilotagem.
- Minimizar e ir a Mensagens sem encerrar; tracking segue; FAB retoma.
- Durante a navegação: buscar e adicionar posto/oficina/restaurante **sem** encerrar. Sem limite nesta versão. Se ficar complexo, oferecer ir ao Planejador.

Voz, modo noite e pause **não** estão nas RNs. Continuam P2.

### 13. Encerramento — RN-15

Ordem no resumo:

1. Custo estimado (só se RN-09 liberar)
2. Distância percorrida
3. Duração
4. Rota no mapa
5. Avaliação por estrelas (opcional, no próprio resumo)
6. Salvar
7. Compartilhar **dentro do Confraria**

Link externo só para abrir/instalar o app. O `PendingRouteReviewGate` permanece.

---

## P2 — Depois do núcleo CON-69

Não bloqueiam o redesign. O protótipo pedia; a issue não.

| Item | Nota |
|---|---|
| Filtros explorar (dificuldade, região, nota, km) | Layout do protótipo; CON-69 só pede lista + 3 CTAs |
| Capa da rota | Protótipo; não está na issue |
| Favoritar / like / comentários | Protótipo; issue não pede |
| Atalhos Serra / Praia / Cênica | Só com catálogo real |
| Histórico de destinos no wizard | Útil; não é RN |
| TTS / modo noite / pause | Fora do recorte da navegação na issue |
| Instrumentação (`routes_map_opened`, etc.) | Pedido no handoff da CON-69; fazer junto com cada entrega |
| QA Android/iOS da lista AH-09 | Obrigatório na entrega, não é feature |

---

## Regras de negócio (canônicas)

Cópia operacional das RNs da CON-69, para não depender de abrir o Linear a cada item.

| ID | Regra |
|---|---|
| RN-01 | Entrada = mapa. Explorar e Minhas rotas são secundárias. |
| RN-02 | Rota rápida depende de GPS. Sem permissão, só mapa/busca/nav param. Explorar e Minhas seguem. |
| RN-03 | Rápida ≠ planejada. Parada não converte. Conversão só em **Planejar este roteiro**, preservando o trajeto. |
| RN-04 | Calcular não salva. Iniciar → Recentes 30 dias. Salvar → persistente. Em andamento no topo. |
| RN-05 | Lista: Em andamento / Planejadas / Recentes / Concluídas. Sem carrossel. |
| RN-06 | Free: 5 roteiros privados. 6º = paywall. Recentes fora da conta. Rápida sem limite de paradas nesta versão. |
| RN-07 | TTL Recentes ≠ histórico premium CON-52. Não misturar. |
| RN-08 | Três perfis só com motor real. Sem classificação inventada. |
| RN-09 | R$ do combustível = premium + flag. Free vê bloqueio + CTA. Sem preço na pilotagem. |
| RN-10 | Sheet local: parceiros e POIs. Sem comunidade no mapa. Selo comercial explícito. |
| RN-11 | Comunidade: Iniciar / Salvar / Personalizar (cópia temporária). |
| RN-12 | Um dia sem “Dia 1”. Multidia a partir do segundo. |
| RN-13 | Navegação: instrução, ETA, velocidade, recálculo, minimizar, tracking. |
| RN-14 | Add POI durante a navegação sem encerrar. |
| RN-15 | Resumo: custo → km → tempo → mapa → nota → salvar → share interno. |
| RN-16 | Sair com alteração não salva pede confirmação. Sem persistir rascunho sozinho. |

AH-01 a AH-09 (Hallefy): mapa primeiro; separar mapa/biblioteca; origem GPS; funcionar sem rua; autocomplete visível; sheet arrastável; benchmarks motos; não enterrar Eventos/Serviços; QA regressivo desses bugs.

---

## Backend e contratos (CON-69)

Além do que o MD original listava:

1. Rota rápida **sem** criar roteiro planejado (`QuickRouteDraft` / `QuickRouteRecent`).
2. Sinuosidade real ou **não** expor chips.
3. Persistência + expiração de Recentes (30 dias).
4. Contagem dos 5 roteiros privados free (CON-51).
5. Distinção recente / salvo / planejado / concluído.
6. Cópia temporária de rota publicada (não persistir antes de Salvar).
7. Combustível: flag + elegibilidade; **não** devolver R$ para free.
8. Preço regional e fonte.
9. Recálculo após desvio (já há caminho; formalizar estado).
10. Nearby + sinal de patrocinado.
11. Share interno.
12. Paginação dos grupos de Minhas rotas.

Já existem e **não reabrir**: WebSocket, status, convites, review, tracking, Places directions/fuel atuais.

Entidades a não misturar: `QuickRouteDraft`, `QuickRouteRecent`, `SavedRoute` / `PlannedItinerary`, `ActiveNavigation`, `CommunityRouteCopyDraft`.

---

## Não fazer

| Item | Por quê |
|---|---|
| Mapa CSS/SVG, senóide, IA neblina, offline fake | Mock; app já tem motor real |
| Marcar concluída sem viajar | Quebra `started_at` / `finished_at` e a nota |
| Share WhatsApp genérico neste ciclo | RN-15: interno primeiro |
| Like/comentários/capa neste ciclo | Fora da CON-69 |
| Converter automático com 2 paradas | RN-03 |
| Bloquear Explorar/Minhas sem GPS | RN-02 |
| Mostrar 3 chips sem sinuosidade no backend | RN-08 |
| Mostrar R$ de combustível para free ou na pilotagem | RN-09 |
| Recriar tracking/socket/wizard do zero | Handoff da issue: reaproveitar |

---

## Ordem (alinhada à CON-69)

1. Arquitetura do mapa + permissão (P0.1–2, RN-01/02, AH-04–06).
2. Rota rápida + paradas + Iniciar/Salvar/Recentes (P0.3–4, RN-03/04).
3. Alternativas reais, se o contrato existir (P0.5, RN-08).
4. Combustível premium + flag (P1.7, RN-09) — pode ir em paralelo se a flag CON-25 estiver pronta.
5. Minhas rotas lista + grupos (P0.6, RN-05).
6. Explorar + 3 CTAs + cópia temporária (P1.9, RN-11).
7. Parceiros nearby + selo (P1.10, RN-10).
8. Planejador: CTA, dias progressivos, conversão, tipo de estrada (P1.11, RN-12, CON-49).
9. Navegação: recálculo visível, POI na via, resumo RN-15 (P1.12–13).
10. Limite 5 + paywall (P1.8, CON-51) e instrumentação.

Pendências da issue **antes** de alguns itens (para a discussão seguinte):

- Métrica de sinuosidade.
- Contrato da rota rápida vs. `POST /routes` atual.
- Fonte do preço regional.
- Autosave do Planejador (sim/não).
- O que exatamente conta no limite de 5.
- Atualizar/encerrar CON-50 (decisão já tomada: combustível = premium).
