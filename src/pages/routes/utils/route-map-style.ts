import type { MapStyleElement } from "react-native-maps";

export const ROUTE_PLANNER_MAP_STYLE: MapStyleElement[] = [
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
    stylers: [{ color: "#eef1e8" }],
  },
  {
    featureType: "water",
    elementType: "geometry.fill",
    stylers: [{ color: "#dbe4ec" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#d8dece" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#c9d1bc" }],
  },
];

export const ROUTE_NAVIGATION_MAP_STYLE_NIGHT: MapStyleElement[] = [
  { elementType: "geometry", stylers: [{ color: "#1f2428" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#8a9199" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#1f2428" }] },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#38414a" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#212a33" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#17263c" }],
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
