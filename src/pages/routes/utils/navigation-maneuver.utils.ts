import type { Ionicons } from "@expo/vector-icons";

type ManeuverIconName = keyof typeof Ionicons.glyphMap;

const MANEUVER_ICON_MAP: Record<string, ManeuverIconName> = {
  DEPART: "navigate",
  DESTINATION: "flag",
  DESTINATION_LEFT: "flag",
  DESTINATION_RIGHT: "flag",
  STRAIGHT: "arrow-up",
  TURN_LEFT: "arrow-back",
  TURN_RIGHT: "arrow-forward",
  TURN_SHARP_LEFT: "return-down-back",
  TURN_SHARP_RIGHT: "return-down-forward",
  TURN_SLIGHT_LEFT: "arrow-back",
  TURN_SLIGHT_RIGHT: "arrow-forward",
  UTURN_LEFT: "return-up-back",
  UTURN_RIGHT: "return-up-forward",
  RAMP_LEFT: "arrow-back",
  RAMP_RIGHT: "arrow-forward",
  MERGE: "git-merge",
  FORK_LEFT: "git-branch",
  FORK_RIGHT: "git-branch",
  ROUNDABOUT_LEFT: "sync",
  ROUNDABOUT_RIGHT: "sync",
};

export function getManeuverIconName(maneuver: string | null | undefined): ManeuverIconName {
  if (!maneuver) return "navigate";
  return MANEUVER_ICON_MAP[maneuver] ?? "navigate";
}

export function getManeuverLabel(instructions: string | null | undefined): string {
  return instructions?.trim() || "Siga em frente";
}
