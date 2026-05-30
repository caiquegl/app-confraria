import { z } from "zod";

export const verifyResetCodeSchema = z.object({
  code: z
    .string()
    .length(6, "Código deve ter 6 dígitos")
    .regex(/^\d+$/, "Código deve conter apenas números"),
});

export type VerifyResetCodeFormData = z.infer<typeof verifyResetCodeSchema>;

export type VerifyResetCodeViewProps = {
  email: string;
  onBack: () => void;
};
