# App Confraria

Aplicativo mobile do Confraria — Expo SDK 56 + expo-router.

## Desenvolvimento local

```bash
npm install
npx expo start
```

> Updates OTA **não rodam** em `__DEV__` (Expo Go / dev client). Para testar OTA, use build de produção/preview.

---

## EAS Update (OTA) — guia completo

### Por que alguns aparelhos travavam na splash?

Causas comuns de crash/travamento com OTA:

1. **`reloadAsync()` durante a splash** — reinicia o JS no meio do boot
2. **`runtimeVersion` incompatível** — update publicado para binário diferente
3. **`checkAutomatically: ON_LOAD` + rede lenta** — splash fica esperando indefinidamente
4. **Mudança nativa via OTA** — novo módulo nativo, SDK, permissões (precisa nova build)

### O que foi configurado neste projeto

| Config | Valor | Motivo |
|---|---|---|
| `runtimeVersion.policy` | `appVersion` | OTA só compatível com a mesma versão do app (`1.0.0`) |
| `checkAutomatically` | `NEVER` | Verificação manual, controlada pelo app |
| `fallbackToCacheTimeout` | `0` | Não trava na splash esperando rede |
| Download OTA | Na loading, paralelo | Timeout de 8s, nunca bloqueia o boot |
| Aplicação do update | **Próximo cold start** | Sem `reloadAsync()` na splash |

---

## Passo a passo — primeira publicação

### 1. Instalar EAS CLI (uma vez)

```bash
npm install -g eas-cli
eas login
```

### 2. Gerar build nativa (obrigatório antes do OTA)

```bash
# Android (produção)
npm run build:android
# ou
eas build --platform android --profile production

# iOS (produção)
npm run build:ios
# ou
eas build --platform ios --profile production
```

Instale o APK/AAB ou IPA nos dispositivos / publique nas lojas.

> **Importante:** OTA só funciona em builds geradas pelo EAS (ou dev build configurado), não no Expo Go.

### 3. Conferir canal e versão

- Canal de produção: `production`
- Versão atual no `app.json`: `"version": "1.0.0"`
- `runtimeVersion` será `1.0.0` (policy `appVersion`)

---

## Passo a passo — publicar atualização OTA (JS/assets)

Use OTA para correções de **telas, lógica, estilos e assets**. Não use para mudanças nativas.

### 1. Faça as alterações no código

Edite os arquivos normalmente e teste localmente com `npx expo start`.

### 2. Publique o update

```bash
# Produção
eas update --channel production --message "fix: corrige login"

# Preview / testes internos
eas update --channel preview --message "test: nova tela"
```

Ou via scripts:

```bash
npm run update:production -- "fix: corrige login"
npm run update:preview -- "test: nova tela"
```

### 3. Como o usuário recebe

1. Abre o app → tela de loading verifica update (máx. 8s)
2. Se houver update, **baixa em background**
3. App abre normalmente com a versão atual
4. Na **próxima vez que fechar e abrir** o app, a nova versão JS é aplicada

> Não usamos `reloadAsync()` na splash para evitar travamentos.

---

## Quando fazer NOVA BUILD (não OTA)

Gere nova build e publique na loja quando:

- Atualizar Expo SDK ou React Native
- Instalar lib com código nativo (`npx expo install alguma-lib-nativa`)
- Alterar `app.json` que exige rebuild (permissões, ícone, splash nativo, etc.)
- Mudar `version` no `app.json` (ex: `1.0.0` → `1.1.0`)

Fluxo:

```bash
# 1. Bump version em app.json
# "version": "1.1.0"

# 2. Nova build
eas build --platform android --profile production

# 3. Publicar na loja

# 4. OTA futuros devem ser publicados com a NOVA versão
eas update --channel production --message "fix pós release 1.1.0"
```

---

## Canais

| Canal | Perfil EAS | Uso |
|---|---|---|
| `production` | `production` | Usuários finais |
| `preview` | `preview` | Testes internos |
| `development` | `development` | Dev client |

Cada build é vinculada ao canal do perfil. OTA publicado em `production` só chega em builds `production`.

---

## Checklist antes de publicar OTA

- [ ] Build instalada no dispositivo foi gerada com o **mesmo canal** do update
- [ ] `version` no `app.json` é igual à build instalada
- [ ] Nenhuma dependência nativa nova foi adicionada
- [ ] Testou localmente com `npx expo start`
- [ ] Mensagem descritiva no `--message`

---

## Rollback (reverter update)

Se um OTA causar problemas:

```bash
# Listar updates recentes
eas update:list --channel production

# Republicar update anterior estável
eas update:republish --group <GROUP_ID>
```

Se o problema for grave, publique nova build na loja.

---

## Comandos úteis

```bash
# Ver updates publicados
eas update:list --channel production

# Ver builds
eas build:list

# Info do projeto
eas project:info
```

---

## Estrutura do app

```
src/
  app/          # Rotas (expo-router)
  pages/        # Views, hooks, services por tela
  components/   # Componentes compartilhados
  lib/          # API, auth, updates OTA
```

---

## Projeto EAS

- **Owner:** `@caiquegl-2-2`
- **Slug:** `app-confraria`
- **Project ID:** `05d39947-b293-4a74-a806-4d3828cd0c63`
