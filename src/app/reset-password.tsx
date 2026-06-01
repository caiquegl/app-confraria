import { Redirect, router, useLocalSearchParams } from "expo-router";

import { ResetPasswordView } from "@/pages/reset-password";

export default function ResetPasswordScreen() {
  const { code, email } = useLocalSearchParams<{ code: string; email: string }>();

  if (!email || !code) {
    return <Redirect href="/forgot-password" />;
  }

  return <ResetPasswordView code={code} email={email} onBack={() => router.back()} />;
}
