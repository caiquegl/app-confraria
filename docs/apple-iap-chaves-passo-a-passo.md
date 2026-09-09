# Apple IAP — como obter as chaves (CON-80)

Guia para preencher a tabela **`AppleIapConfig`** no Neon (ou variáveis do seed).  
**Não** coloque o `.p8` no app cliente — só no backend / banco.

Product IDs oficiais (não mudar depois do lançamento):

- Mensal: `confraria.vip.monthly`
- Anual: `confraria.vip.annual`

Bundle ID: `com.caiquegl22.appconfraria`  
Apple ID do app (Connect): `6798417262`

---

## 1. Pré-requisitos no App Store Connect

1. Acesse [App Store Connect](https://appstoreconnect.apple.com).
2. Confirme que o contrato **Paid Applications** está aceito (Agreements, Tax, and Banking).
3. Abra o app **Confraria** → **App Information** e anote o **Apple ID** numérico (`6798417262`).
4. Em **Certificates, Identifiers & Profiles** (developer.apple.com) → Identifiers → App ID do bundle: habilite **In-App Purchase**.

---

## 2. Criar o Subscription Group e os produtos

1. App Store Connect → app Confraria → **Monetization** → **Subscriptions**.
2. Crie um **Subscription Group** (ex.: `confraria_vip`).
3. Dentro do group, crie duas assinaturas:

| Campo | Mensal | Anual |
|-------|--------|-------|
| Reference Name | VIP Mensal | VIP Anual |
| Product ID | `confraria.vip.monthly` | `confraria.vip.annual` |
| Duration | 1 month | 1 year |
| Price | (definir BR) | (definir BR) |

4. Preencha localização (pelo menos **Portuguese (Brazil)**): nome exibido + descrição.
5. Salve. Status pode ficar “Ready to Submit” até a próxima versão do app com IAP.

---

## 3. Gerar a In-App Purchase Key (`.p8`)

Esta chave assina JWTs do **App Store Server API** e valida notificações/transações no backend.

1. App Store Connect → **Users and Access** → aba **Integrations**.
2. Em **In-App Purchase**, clique em **Generate** / **+** (se ainda não existir chave IAP).
3. Dê um nome (ex.: `Confraria IAP Backend`).
4. Baixe o arquivo **`.p8`** imediatamente (só é possível uma vez).
5. Anote na mesma tela:
   - **Key ID** (ex.: `AB12CD34EF`)
   - **Issuer ID** (UUID no topo da página Integrations; o mesmo da conta)

### Conteúdo `private_key_pem`

Abra o `.p8` em um editor. O texto deve ficar assim (guarde as quebras de linha):

```text
-----BEGIN PRIVATE KEY-----
MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQg...
...
-----END PRIVATE KEY-----
```

No Neon, grave a string completa. Se colar em uma linha só no SQL, use `\n` no lugar das quebras (o backend normaliza `\n` → newline).

---

## 4. Mapa campo → valor (AppleIapConfig)

| Coluna no Neon | De onde vem |
|----------------|-------------|
| `key_id` | Key ID da In-App Purchase Key |
| `issuer_id` | Issuer ID (Users and Access → Integrations) |
| `private_key_pem` | Conteúdo do arquivo `.p8` |
| `bundle_id` | `com.caiquegl22.appconfraria` |
| `app_apple_id` | `6798417262` (App Information → Apple ID) |
| `environment` | `Sandbox` (QA) ou `Production` (loja) |
| `monthly_product_id` | `confraria.vip.monthly` |
| `annual_product_id` | `confraria.vip.annual` |
| `monthly_amount` / `annual_amount` | Valores de exibição no app (espelhar preço) |
| `currency` | `brl` |
| `is_active` | `true` (só uma row ativa) |

### SQL de exemplo (Neon)

```sql
UPDATE "AppleIapConfig"
SET
  key_id = 'SEU_KEY_ID',
  issuer_id = 'SEU_ISSUER_UUID',
  private_key_pem = '-----BEGIN PRIVATE KEY-----
...cole o PEM...
-----END PRIVATE KEY-----
',
  bundle_id = 'com.caiquegl22.appconfraria',
  app_apple_id = '6798417262',
  environment = 'Sandbox',
  monthly_product_id = 'confraria.vip.monthly',
  annual_product_id = 'confraria.vip.annual',
  monthly_amount = 19.90,
  annual_amount = 159.00,
  currency = 'brl',
  is_active = true,
  updated_at = NOW()
WHERE is_active = true;
```

Se ainda não existir row (após migrate + seed com placeholder), faça `INSERT` com os mesmos campos.

---

## 5. App Store Server Notifications V2

1. App Store Connect → app → **App Information** (ou **General** → App Store Server Notifications, conforme UI atual).
2. Configure a URL de produção:

```text
https://confraria-backend.fly.dev/webhooks/apple
```

3. Versão: **Version 2**.
4. Opcional: URL de Sandbox apontando para o mesmo endpoint (o backend usa `environment` da config).

---

## 6. Conta Sandbox Tester (QA)

1. Users and Access → **Sandbox** → **Testers**.
2. Crie um tester (e-mail Apple ID de teste, não precisa ser real da loja).
3. No iPhone de teste: Ajustes → App Store → Conta Sandbox → entre com esse tester.
4. Compre VIP no app (build nativa com IAP). Não use a Apple ID pessoal de produção.

---

## 7. Checklist rápido

- [ ] Paid Apps agreement ativo  
- [ ] IAP capability no App ID  
- [ ] Subscription Group + 2 Product IDs  
- [ ] Key `.p8` + Key ID + Issuer ID  
- [ ] Row `AppleIapConfig` no Neon (sem placeholder)  
- [ ] Webhook ASSN V2 apontando para `/webhooks/apple`  
- [ ] Sandbox Tester criado  
- [ ] Build nativa iOS com `expo-iap` instalada (OTA sozinha **não** entrega StoreKit nativo)

---

## 8. Logs para debug (Grafana)

Backend (Loki): `apple.iap.verify.*`, `apple.iap.webhook.*`, `apple.iap.config.*`  
App (Faro): `apple.iap.purchase.*`, `apple.iap.restore.*`

Nunca logar o conteúdo do PEM.
