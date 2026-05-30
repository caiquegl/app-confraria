import { router } from "expo-router";

import { LandingView } from "@/pages/landing";

export default function Landing() {
  return (
    <LandingView
      onRegister={() => router.push("/register")}
      onLogin={() => router.push("/login")}
    />
  );
}
