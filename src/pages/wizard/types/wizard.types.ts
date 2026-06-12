import { z } from "zod";

// ─── Schemas por step ────────────────────────────────────────────────────────

export const step1Schema = z.object({
  email: z.string().email("E-mail inválido"),
  firstName: z.string().min(2, "Nome deve ter ao menos 2 caracteres"),
});

const step2BaseSchema = z.object({
  password: z.string().min(6, "Senha deve ter ao menos 6 caracteres"),
  passwordConfirm: z.string().min(1, "Confirme sua senha"),
});

export const step2Schema = step2BaseSchema.refine(
  (data) => data.password === data.passwordConfirm,
  { message: "As senhas não coincidem", path: ["passwordConfirm"] },
);

export const step3Schema = z.object({
  hasLicense: z.boolean({ message: "Selecione uma opção" }),
  isAdult: z.boolean({ message: "Selecione uma opção" }),
});

export const step4Schema = z.object({
  bikeCategoryIds: z.array(z.string()).min(1, "Selecione ao menos uma categoria"),
  tripStyleId: z.string().min(1, "Selecione o tipo de rota"),
});

export const step5Schema = z.object({
  ridingCompanionIds: z.array(z.string()).min(1, "Selecione ao menos uma opção"),
});

// ─── Schema final (payload enviado ao backend, sem passwordConfirm) ──────────

export const registerSchema = step1Schema
  .merge(step2BaseSchema.omit({ passwordConfirm: true }))
  .merge(step3Schema)
  .merge(step4Schema)
  .merge(step5Schema);

// ─── Types derivados dos schemas ─────────────────────────────────────────────

// ─── Tipos das entidades do backend ──────────────────────────────────────────

export type BikeCategory = { id: string; name: string };
export type CurvePreference = { id: string; name: string; icon: string };
export type TripStyle = { id: string; name: string };
export type RidingCompanion = { id: string; name: string };
export type Term = {
  id: string;
  title: string;
  content: string;
  type: string;
  version: number;
  created_at: string;
};

export type LgpdTermsModalProps = {
  visible: boolean;
  onClose: () => void;
};

export type RegisterResponse = { message: string; token: string };

// ─── Types derivados dos schemas ─────────────────────────────────────────────

export type Step1Data = z.infer<typeof step1Schema>;
export type Step2Data = z.infer<typeof step2Schema>;
export type Step3Data = z.infer<typeof step3Schema>;
export type Step4Data = z.infer<typeof step4Schema>;
export type Step5Data = z.infer<typeof step5Schema>;
export type RegisterPayload = z.infer<typeof registerSchema>;

// ─── Dados acumulados do wizard (union de todos os steps parciais) ────────────

export type WizardFormData = Partial<RegisterPayload> & {
  passwordConfirm?: string;
};

// ─── Props compartilhadas entre os steps ─────────────────────────────────────

export type StepProps = {
  defaultValues: WizardFormData;
  onNext: (data: WizardFormData) => void;
  onBack: () => void;
  isPreparingProfile?: boolean;
};

// ─── Retorno do hook principal ───────────────────────────────────────────────

export type UseWizardResult = {
  currentStep: number;
  formData: WizardFormData;
  isLastStep: boolean;
  goNext: (data: WizardFormData) => void;
  goBack: () => void;
  submitForm: () => Promise<void>;
  isPreparingProfile: boolean;
  onPreparingComplete: () => void;
  userName: string;
};
