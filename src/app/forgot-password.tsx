import { router } from "expo-router";

import { ForgotPasswordView } from "@/pages/forgot-password";

export default function ForgotPasswordScreen() {
  return <ForgotPasswordView onBack={() => router.back()} />;
}
