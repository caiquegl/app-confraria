export type EventsFilters = {
  category: string;
  distanceRange: [number, number];
  state: string;
};

export const DEFAULT_EVENTS_FILTERS: EventsFilters = {
  category: "ALL",
  distanceRange: [0, 6],
  state: "ALL",
};
