---
name: confraria-theme
description: >-
  Enforces Confraria design tokens from src/theme when creating or editing React
  Native components and screens. Use when building UI, styling StyleSheet,
  adding colors, spacing, typography, border radius, or editing any .tsx view or
  component in app-confraria.
---

# Confraria Theme Tokens

## Regra obrigatória

Ao criar ou editar componentes e páginas em `app-confraria`:

1. **Nunca** inserir valores visuais literais diretamente no componente ou na página.
2. **Sempre** consumir tokens de `src/theme/` via `@/theme`.
3. Se o token não existir, **adicione primeiro** em `src/theme/` e só depois use no componente.
4. **Nunca** crie dois tokens com o mesmo valor numérico ou cor — reutilize o token existente (ex.: `spacing.xl` em vez de novo `listGap: 14`).

Isso vale para: cores (hex/rgba), espaçamento, tipografia, raios de borda e estados de feedback.

## Import padrão

```tsx
import { colors, radii, spacing, typography } from "@/theme";
```

`import { colors } from "@/theme/colors"` continua válido, mas prefira `@/theme`.

## O que usar de cada arquivo

| Necessidade | Token | Exemplo |
|-------------|-------|---------|
| Cor de texto | `colors.text.*` | `colors.text.secondary` |
| Fundo / card | `colors.surface.*` | `colors.surface.primary` |
| Borda | `colors.border.*` | `colors.border.subtle` |
| Erro / destrutivo | `colors.feedback.*` | `colors.feedback.danger` |
| Marca / CTA | `colors.accent.brand` ou `colors.brandGreen` | `colors.accent.brand` |
| Padding / gap / margin | `spacing.*` | `spacing["2xl"]` |
| fontSize / peso / lineHeight | `typography.*` | `typography.bodyStrong` |
| borderRadius | `radii.*` | `radii.md`, `radii.pill` |

## Proibido

```tsx
// ❌ hex, rgba ou números mágicos no StyleSheet
backgroundColor: "#FFFFFF"
color: "#6B7280"
paddingHorizontal: 16
fontSize: 14
borderRadius: 16
borderColor: "#E5E7EB"

// ❌ inline style com valor visual
<View style={{ padding: 24, backgroundColor: "#fff" }} />
```

## Permitido

```tsx
// ✅ tokens semânticos
const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface.primary,
    borderColor: colors.border.subtle,
    borderRadius: radii.md,
    padding: spacing["2xl"],
    gap: spacing.md,
  },
  title: {
    ...typography.titleSection,
    color: colors.text.primary,
  },
});
```

## Quando o valor não existe no tema

Siga esta ordem **antes** de usar no componente:

1. Verifique se já existe token com o **mesmo papel visual** (não o mesmo número).
2. Se não existir e o valor se repetir ou for reutilizável:
   - **Cor** → `src/theme/colors.ts` (nome por função: `text.secondary`, `border.subtle`)
   - **Espaço** → `src/theme/spacing.ts`
   - **Tipografia** → `src/theme/typography.ts`
   - **Raio** → `src/theme/radii.ts`
3. Reexporte em `src/theme/index.ts` se criar arquivo novo.
4. Use o token no componente.

**Não** crie token para valor único com função especial (ícone de mapa, cor de categoria). Nesses casos, documente no PR por que ficou local.

## Checklist antes de finalizar

- [ ] Nenhum `#`, `rgba(`, `fontSize:` numérico literal ou `borderRadius:` numérico literal nos arquivos alterados
- [ ] Imports de `@/theme` presentes onde há estilo
- [ ] Tokens novos nomeados por **função**, não por tom ou número
- [ ] Aliases de marca (`brandGreen`, `brandDark`, etc.) preservados se já usados
- [ ] Visual inalterado — tokens mapeiam aos valores que existiam

## Exceções raras (justificar no diff)

- `transparent`, `0`, `1` (opacidade), `100%`, `flex: 1`
- Overlays de modal: `rgba(0,0,0,0.5)` até existir `colors.overlay.scrim` no tema
- Assets, mapas e cores vindas de API dinâmica

## Referência rápida

Arquivos do tema: `app-confraria/src/theme/`

- `colors.ts` — marca + semânticos (`text`, `surface`, `border`, `feedback`, `accent`)
- `spacing.ts` — `xs` … `5xl`
- `typography.ts` — `caption`, `body`, `bodyStrong`, `input`, `buttonSm/Md/Lg`, `titleSection`, `titlePage`, `titlePageLarge`, `label`
- `radii.ts` — `sm`, `md`, `lg`, `xl`, `sheet`, `pill`
- `index.ts` — export único + instruções de como adicionar token
