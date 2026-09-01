/**
 * Ponto único de exportação dos tokens de design do Confraria.
 *
 * ## Como adicionar um token
 * 1. Confirme que o valor se repete em 3+ lugares com o mesmo papel visual.
 * 2. Nomeie por função (`text.secondary`, `border.subtle`), não por tom ou número isolado.
 * 3. Adicione no arquivo do domínio (`colors.ts`, `spacing.ts`, etc.).
 * 4. Reexporte aqui e use nos componentes compartilhados antes de espalhar em telas.
 * 5. Não substitua literais automaticamente se a função visual for diferente.
 *
 * ## Imports
 * - Preferido: `import { colors, spacing, typography, radii } from "@/theme"`
 * - Legado: `import { colors } from "@/theme/colors"` continua válido
 */
export { colors } from "./colors";
export { radii } from "./radii";
export { spacing } from "./spacing";
export { typography } from "./typography";
