import type { MapStyleElement } from "react-native-maps";

import type { AppColors } from "@/theme";
import { lightColors } from "@/theme/colors";

export function getRoutePlannerMapStyle(colors: AppColors): MapStyleElement[] {
  return [
    {
      featureType: "poi",
      stylers: [{ visibility: "off" }],
    },
    {
      featureType: "transit",
      stylers: [{ visibility: "off" }],
    },
    {
      featureType: "road",
      elementType: "labels.icon",
      stylers: [{ visibility: "off" }],
    },
    {
      featureType: "administrative.land_parcel",
      stylers: [{ visibility: "off" }],
    },
    {
      featureType: "landscape",
      elementType: "geometry.fill",
      stylers: [{ color: colors.map.plannerLandscape }],
    },
    {
      featureType: "water",
      elementType: "geometry.fill",
      stylers: [{ color: colors.map.plannerWater }],
    },
    {
      featureType: "road",
      elementType: "geometry.stroke",
      stylers: [{ color: colors.map.plannerRoadStroke }],
    },
    {
      featureType: "road.highway",
      elementType: "geometry.stroke",
      stylers: [{ color: colors.map.plannerHighwayStroke }],
    },
  ];
}

export function getRouteNavigationMapStyleNight(colors: AppColors): MapStyleElement[] {
  return [
    { elementType: "geometry", stylers: [{ color: colors.map.navigationGeometry }] },
    { elementType: "labels.text.fill", stylers: [{ color: colors.map.navigationLabelFill }] },
    { elementType: "labels.text.stroke", stylers: [{ color: colors.map.navigationLabelStroke }] },
    {
      featureType: "road",
      elementType: "geometry",
      stylers: [{ color: colors.map.navigationRoad }],
    },
    {
      featureType: "road",
      elementType: "geometry.stroke",
      stylers: [{ color: colors.map.navigationRoadStroke }],
    },
    {
      featureType: "water",
      elementType: "geometry",
      stylers: [{ color: colors.map.navigationWater }],
    },
    {
      featureType: "poi",
      stylers: [{ visibility: "off" }],
    },
    {
      featureType: "transit",
      stylers: [{ visibility: "off" }],
    },
  ];
}

/** @deprecated Use `getRoutePlannerMapStyle(useTheme().colors)`. */
export const ROUTE_PLANNER_MAP_STYLE = getRoutePlannerMapStyle(lightColors);

/** @deprecated Use `getRouteNavigationMapStyleNight(useTheme().colors)`. */
export const ROUTE_NAVIGATION_MAP_STYLE_NIGHT = getRouteNavigationMapStyleNight(lightColors);
