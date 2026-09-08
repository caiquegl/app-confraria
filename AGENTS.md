# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v56.0.0/ before writing any code.

## Observabilidade (Grafana + Sentry)

Ao analisar bugs ou fluxos em produção/preview, use **Sentry e Grafana em paralelo**.

| Ferramenta | Papel |
|---|---|
| **Sentry** | Exceptions, crashes, stack traces |
| **Grafana Faro → Loki** | Trilha operacional (`appLog`) |

- Código: `src/lib/app-log.ts`, `src/lib/faro.ts`, `src/lib/faro-config.ts`
- Faro só envia fora de `__DEV__` (build/OTA preview ou production)
- Loki: `{service_name="app-confraria"}`
- Ex.: `{service_name="app-confraria"} |= "profile.update"`
- Correlacionar com backend via `requestId` (`x-request-id`)
- Nunca logar tokens, senha, CPF completo ou body sensível

Se o MCP Grafana Cloud estiver autenticado, use `query_loki_logs` no datasource `grafanacloud-logs` para evidências durante a análise.
