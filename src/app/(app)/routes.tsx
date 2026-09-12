import { Redirect, router, useLocalSearchParams } from "expo-router";
import { useCallback, useMemo } from "react";

import type { QuickRoutePlace } from "@/pages/routes/types/quick-route.types";
import { RoutesMapHomeView } from "@/pages/routes/view/RoutesMapHomeView";

export default function RoutesScreen() {
  const params = useLocalSearchParams<{
    tab?: string;
    destinationLat?: string;
    destinationLng?: string;
    destinationTitle?: string;
    destinationSubtitle?: string;
    destinationPlaceId?: string;
  }>();

  if (params.tab === "mine") {
    return <Redirect href="/routes/mine" />;
  }

  if (params.tab === "all") {
    return <Redirect href="/routes/explore" />;
  }

  const initialDestination = useMemo<QuickRoutePlace | null>(() => {
    const lat = Number(params.destinationLat);
    const lng = Number(params.destinationLng);
    if (!params.destinationLat || !params.destinationLng || Number.isNaN(lat) || Number.isNaN(lng)) {
      return null;
    }

    const title = params.destinationTitle?.trim() || "Destino do evento";
    const placeId = params.destinationPlaceId?.trim() || `gps:${lat},${lng}`;

    return {
      description: title,
      latitude: lat,
      longitude: lng,
      mainText: title,
      placeId,
      reference: placeId,
      secondaryText: params.destinationSubtitle?.trim() || "",
      types: [],
    };
  }, [
    params.destinationLat,
    params.destinationLng,
    params.destinationPlaceId,
    params.destinationSubtitle,
    params.destinationTitle,
  ]);

  const handleClearInitialDestination = useCallback(() => {
    router.setParams({
      destinationLat: undefined,
      destinationLng: undefined,
      destinationTitle: undefined,
      destinationSubtitle: undefined,
      destinationPlaceId: undefined,
    });
  }, []);

  return (
    <RoutesMapHomeView
      initialDestination={initialDestination}
      onClearInitialDestination={handleClearInitialDestination}
    />
  );
}

