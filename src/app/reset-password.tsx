import { router, useLocalSearchParams } from "expo-router";

import { ResetPasswordView } from "@/pages/reset-password";

export default function ResetPasswordScreen() {
  const { code, email } = useLocalSearchParams<{ code: string; email: string }>();

  if (!email || !code) {
    router.replace("/forgot-password");
    return null;
  }

  return <ResetPasswordView code={code} email={email} onBack={() => router.back()} />;
}
