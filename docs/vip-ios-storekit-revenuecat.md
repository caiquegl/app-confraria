# VIP no iOS: StoreKit + RevenueCat — o que configurar

Guia de **cadastros e pré-requisitos** antes de implementar o código.  
Objetivo: no **iPhone**, a assinatura VIP usa **In-App Purchase (StoreKit)** via **RevenueCat**, para cumprir as regras da Apple. No **Android** (e fluxos atuais) o Stripe pode continuar.

---

## Por que isso é necessário?

| Plataforma | Como vender VIP | Motivo |
|---|---|---|
| **iOS** | StoreKit (via RevenueCat) | Apple exige IAP para benefícios digitais dentro do app (selo VIP, etc.). Stripe Checkout no app iOS pode barrar na review. |
| **Android** | Stripe (fluxo atual) | Google tem regras próprias; o Stripe atual pode permanecer até decisão diferente. |

O **backend Confraria** continua sendo a fonte da verdade do VIP (`User.is_vip` / `vip_until`). O RevenueCat avisa o backend por **webhook** quando a compra, renovação ou cancelamento acontece.

---

## Visão geral do fluxo (depois de configurado)

```text
App iOS → RevenueCat / StoreKit → Apple cobra o usuário
                ↓
         Webhook RevenueCat
                ↓
         API Confraria marca is_vip = true
```

Troca de plano e cancelamento no iOS também passam pela Apple/RevenueCat (não pelo Checkout Stripe).

---

## Checklist rápido

1. [ ] Conta Apple Developer ativa + contrato pago aceito  
2. [ ] App criado no App Store Connect (bundle id correto)  
3. [ ] Grupo de assinaturas + produtos mensal e anual  
4. [ ] Testers Sandbox criados  
5. [ ] Conta RevenueCat + app iOS  
6. [ ] Credenciais Apple no RevenueCat  
7. [ ] Entitlement, Products, Offering no RevenueCat  
8. [ ] API Key pública iOS anotada  
9. [ ] (Depois) webhook RevenueCat → backend + código no app  

---

## 1. Apple Developer / App Store Connect

### Onde

- [Apple Developer](https://developer.apple.com/account)  
- [App Store Connect](https://appstoreconnect.apple.com)

### Bundle ID do app

Já definido no projeto:

```text
com.caiquegl22.appconfraria
```

Confirme que o app no App Store Connect usa **exatamente** esse identifier.

### O que cadastrar e para quê

| Cadastro | Onde | Para quê |
|---|---|---|
| **Paid Applications Agreement** + dados bancários/fiscais | App Store Connect → Agreements, Tax, and Banking | Sem isso, assinaturas **não funcionam** (nem em sandbox em alguns casos). |
| **App** | Apps → seu app | Base para criar IAP. |
| **Subscription Group** | App → Monetization → Subscriptions | Agrupa planos que o usuário pode trocar entre si (mensal ↔ anual). Ex.: `Confraria VIP`. |
| **Subscription — Mensal** | Dentro do grupo | Produto cobrado todo mês. Ex. Product ID: `vip_monthly`. |
| **Subscription — Anual** | Dentro do grupo | Produto cobrado todo ano. Ex. Product ID: `vip_annual`. |
| **Localização (pt-BR)** | Em cada produto | Nome e descrição que a Apple mostra na compra. |
| **Preço** | Em cada produto | Espelhar a ideia do Stripe (ex.: ~R$ 19,90 / mês e ~R$ 159 / ano). A Apple controla o preço final por faixa. |
| **Sandbox Testers** | Users and Access → Sandbox → Testers | Contas de teste para comprar **sem cobrar de verdade**. |

### Sugestão de Product IDs

Use IDs estáveis (não mudam depois de criados):

| Plano | Product ID sugerido |
|---|---|
| Mensal | `vip_monthly` |
| Anual | `vip_annual` |

Anote esses IDs — eles serão os mesmos no RevenueCat.

### Orientação Sandbox

1. Crie um tester (e-mail que **não** seja o Apple ID principal da conta).  
2. No iPhone: Ajustes → App Store → Conta Sandbox (ou faça logout da App Store e use o tester na hora da compra).  
3. Compras de teste **não** geram cobrança real.  
4. Renovações sandbox são aceleradas (minutos/horas, não meses).

---

## 2. RevenueCat

### Onde

- [RevenueCat Dashboard](https://app.revenuecat.com)

### O que cadastrar e para quê

| Cadastro | Onde no RevenueCat | Para quê |
|---|---|---|
| **Project** | Projects | Projeto do Confraria. |
| **App iOS** | Project → Apps → New → iOS | Liga o RC ao `com.caiquegl22.appconfraria`. |
| **App Store Connect credentials** | App iOS → App Store Connect API / shared secret | Permite o RC **validar recibos** com a Apple. |
| **Entitlement** | Product catalog → Entitlements | Direito lógico do app. Ex.: `vip` (= “usuário é VIP”). |
| **Products** | Product catalog → Products | Espelha `vip_monthly` e `vip_annual` da Apple e associa ao entitlement `vip`. |
| **Offering** | Product catalog → Offerings | Pacote que o app mostra na tela. Ex.: offering `default` com packages Monthly + Annual. |
| **Public API Key (iOS)** | App iOS → API Keys | Chave `appl_...` usada **só no app iOS** (pode ir no cliente). |
| **Webhook** (fase código) | Project → Integrations → Webhooks | URL do backend, ex.: `https://SEU_DOMINIO/webhooks/revenuecat`. |

### Mapeamento recomendado

```text
Entitlement:  vip
Products:     vip_monthly  → entitlement vip
              vip_annual   → entitlement vip
Offering:     default
  - package $rc_monthly → vip_monthly
  - package $rc_annual  → vip_annual
```

### Credenciais Apple no RevenueCat

No painel do app iOS no RevenueCat, configure a integração com App Store Connect (API Key com permissão de In-App Purchase / Apps, conforme o fluxo atual do RC).

Sem essa ligação, o RevenueCat não consegue confirmar se a compra é válida.

---

## 3. O que **não** fazer ainda no Stripe

- Não remova o Stripe do Android.  
- No iOS, a tela de assinatura **não** deve abrir Checkout Stripe (para evitar rejeição).  
- Usuários que já assinaram via Stripe em testes continuam no fluxo Stripe; o código futuro deve decidir por plataforma (`Platform.OS === 'ios'` → RevenueCat).

---

## 4. Backend Confraria (fase seguinte — só referência)

Quando os cadastros acima estiverem prontos, a implementação de código fará algo nesta linha:

| Item | Função |
|---|---|
| `POST /webhooks/revenuecat` | Recebe eventos: compra, renovação, cancelamento, expiração, troca de produto. |
| Atualizar `User.is_vip` / `vip_until` | Mesma regra de negócio do VIP atual. |
| Identificar usuário | `app_user_id` do RevenueCat = `user.id` do Confraria (ao logar no app). |

**Não implemente o webhook ainda** se os produtos Apple/RC não existirem — primeiro feche o checklist da seção “Checklist rápido”.

---

## 5. App (fase seguinte — só referência)

| Item | Função |
|---|---|
| Pacote `react-native-purchases` | SDK oficial RevenueCat. |
| Build nativo iOS (EAS / Xcode) | IAP **não** funciona de forma confiável só no Expo Go. |
| `Purchases.configure` + `logIn(userId)` | Liga compras ao usuário logado. |
| Tela Minha assinatura (iOS) | Lista Offering do RC e chama `purchasePackage`. |
| Restaurar compras | Botão “Restaurar” (exigência comum da Apple). |

---

## 6. Ordem prática recomendada

1. Aceitar contratos e preencher banking/tax na Apple.  
2. Criar Subscription Group + `vip_monthly` + `vip_annual` no App Store Connect.  
3. Criar Sandbox Tester e validar que os produtos aparecem (mesmo que só no painel).  
4. Criar projeto/app no RevenueCat e colar credenciais Apple.  
5. Criar entitlement `vip`, products e offering `default`.  
6. Anotar:  
   - Product IDs  
   - Entitlement ID  
   - Offering ID  
   - Public API Key iOS (`appl_...`)  
7. Avisar o time / seguir para o plano de código (app + webhook).

---

## 7. Dados para colar aqui quando estiver pronto

Preencha e guarde (ou envie no chat na hora de implementar):

```text
Bundle ID:              com.caiquegl22.appconfraria
Product ID mensal:      vip_monthly   (ou o que você criou)
Product ID anual:       vip_annual    (ou o que você criou)
Subscription Group:     ________________
Entitlement RC:         vip
Offering RC:            default
Public API Key iOS:     appl________________
Webhook secret RC:      (gerar na hora de ligar o backend)
```

---

## Links úteis

- [App Store Connect — Subscriptions](https://appstoreconnect.apple.com/apps)  
- [RevenueCat — Docs iOS / React Native](https://www.revenuecat.com/docs/getting-started/installation/reactnative)  
- [RevenueCat — Webhooks](https://www.revenuecat.com/docs/integrations/webhooks)  
- [Apple — In-App Purchase](https://developer.apple.com/in-app-purchase/)  

---

## Resumo em uma frase

**Cadastre os produtos na Apple, espelhe-os no RevenueCat (entitlement `vip` + offering), anote a API key iOS — só então implementamos o código no app e o webhook no backend.**
