import { useEffect, useState } from "react";
import { router } from "expo-router";

import { isAuthenticated } from "@/lib/auth";
import { HomeView } from "@/pages/home";

export default function HomeScreen() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    isAuthenticated().then((authenticated) => {
      if (!authenticated) {
        router.replace("/landing");
        return;
      }
      setReady(true);
    });
  }, []);

  if (!ready) return null;

  return <HomeView />;
}
