import { useLocalSearchParams } from "expo-router";

import { RouteCreateView } from "@/pages/routes/view/RouteCreateView";

export default function RouteEditScreen() {
  const { routeId } = useLocalSearchParams<{ routeId?: string }>();

  return <RouteCreateView editRouteId={routeId ?? null} />;
}
