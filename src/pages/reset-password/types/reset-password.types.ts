import { z } from "zod";

const resetPasswordBaseSchema = z.object({
  password: z.string().min(6, "Senha deve ter ao menos 6 caracteres"),
  passwordConfirm: z.string().min(1, "Confirme sua senha"),
});

export const resetPasswordSchema = resetPasswordBaseSchema.refine(
  (data) => data.password === data.passwordConfirm,
  { message: "As senhas não coincidem", path: ["passwordConfirm"] },
);

export type ResetPasswordFormData = z.infer<typeof resetPasswordBaseSchema>;

export type ResetPasswordViewProps = {
  email: string;
  code: string;
  onBack: () => void;
};
