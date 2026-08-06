# Build e publicação iOS (TestFlight / App Store)

App: **Confraria**  
Bundle ID: `com.caiquegl22.appconfraria`  
App Store Connect Apple ID (`ascAppId`): `6798417262`  
Expo account: `caiquegl-2-2`  
Projeto EAS: `@caiquegl-2-2/app-confraria`

## Pré-requisitos

- Logado na Expo: `eas whoami`
- Arquivo da API Key na raiz: `AuthKey_88P3739F34.p8` (já no `.gitignore`)
- Submit configurado em `eas.json` (`ascAppId` + API Key)

Se o terminal pedir login Apple / 2FA por SMS e falhar: **pule o login** (credenciais iOS já estão no EAS) ou use `--non-interactive`.

## 1. Gerar build de produção (iOS)

```bash
cd ~/Documentos/app-confraria
eas build --platform ios --profile production
```

Se pedir login na Apple → responda **No** (usar credenciais remotas já criadas).

Alternativa sem prompts:

```bash
eas build --platform ios --profile production --non-interactive
```

Acompanhar o build:

- URL no final do comando, ou
- https://expo.dev/accounts/caiquegl-2-2/projects/app-confraria/builds

## 2. Enviar para a App Store Connect / TestFlight

Quando o build terminar:

```bash
cd ~/Documentos/app-confraria
eas submit --platform ios --profile production --latest
```

Não deve pedir Apple ID (usa a API Key do `eas.json`).

## 3. Depois de publicar (TestFlight)

1. Abra [App Store Connect → CONFRARIA → TestFlight](https://appstoreconnect.apple.com/apps/6798417262/testflight/ios)
2. Aguarde o processamento da build (status “Pronto para envio” / “Testamento”)
3. Se aparecer pergunta de criptografia: o app já declara `ITSAppUsesNonExemptEncryption: false`
4. Em **Testes internos** → crie/use um grupo → adicione testers (Apple ID)
5. Associe a build ao grupo
6. Testers instalam pelo app **TestFlight** no iPhone

### Aviso ITMS-90863 (símbolos ExpoModulesCore / Mac)

Causa comum no SDK 56: versões desalinhadas de `expo-modules-core` vs módulos pré-compilados (`expo-file-system`, `expo-font`, etc.).

Correção no projeto:
1. Manter deps alinhadas com `npx expo install --fix` (sem forçar downgrade do Sentry)
2. `LSRequiresIPhoneOS: true` no `app.json`
3. No App Store Connect, **desmarcar** disponibilidade em Macs com Apple Silicon
4. Gerar **nova** build + submit

A build antiga (ex.: construção 3) não é corrigida retroativamente.


## Comandos úteis

```bash
# Status / lista de builds
eas build:list --platform ios --limit 5

# Credenciais iOS (certificado, profile, push)
eas credentials -p ios

# Build + submit em um passo (pode pedir login Apple no submit se a API Key falhar)
eas build --platform ios --profile production --auto-submit
```

## Notas

- **Ícone:** usar `icon` em `app.json` (`./assets/images/Icones_IMG.png`). Não apontar `ios.icon` para `./assets/expo.icon`.
- **Push:** desativado o prompt automático (`promptToConfigurePushNotifications: false`). Configurar depois com `eas credentials -p ios` quando o 2FA por **device** (iPhone) funcionar.
- **Profile:** para TestFlight/App Store use sempre `--profile production` (não `preview`, que está como `distribution: internal`).
- **Sentry:** manter `@sentry/react-native` na major **8.x** (ex.: `8.16.0`). Não deixar o `npx expo install --fix` fazer downgrade para `7.x` — isso quebra o import e o app crasha na abertura (TestFlight).
- Após corrigir ícone, deps ou Info.plist, é obrigatório **nova build** + novo submit — builds antigas no TestFlight não mudam.
