import { api } from "@/lib/api";
import { apiRoutes } from "@/lib/api-routes";

export type PasswordResetMessage = { message: string };

export type VerifyResetCodeResponse = {
  valid: boolean;
  message: string;
};

export async function requestPasswordReset(
  email: string,
): Promise<PasswordResetMessage> {
  const { data } = await api.post<PasswordResetMessage>(apiRoutes.users.forgotPassword, {
    email,
  });
  return data;
}

export async function verifyResetCode(
  email: string,
  code: string,
): Promise<VerifyResetCodeResponse> {
  const { data } = await api.post<VerifyResetCodeResponse>(apiRoutes.users.verifyResetCode, {
    code,
    email,
  });
  return data;
}

export async function resetPassword(payload: {
  email: string;
  code: string;
  password: string;
}): Promise<PasswordResetMessage> {
  const { data } = await api.post<PasswordResetMessage>(apiRoutes.users.resetPassword, payload);
  return data;
}

export function getApiErrorMessage(err: unknown, fallback: string): string {
  const message = (err as { response?: { data?: { message?: string | string[] } } })
    ?.response?.data?.message;

  if (Array.isArray(message)) {
    return message[0] ?? fallback;
  }

  return message ?? fallback;
}
