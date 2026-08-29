import { Redirect, useLocalSearchParams } from "expo-router";

import { RoutesMapHomeView } from "@/pages/routes/view/RoutesMapHomeView";

export default function RoutesScreen() {
  const { tab } = useLocalSearchParams<{ tab?: string }>();

  if (tab === "mine") {
    return <Redirect href="/routes/mine" />;
  }

  if (tab === "all") {
    return <Redirect href="/routes/explore" />;
  }

  return <RoutesMapHomeView />;
}
