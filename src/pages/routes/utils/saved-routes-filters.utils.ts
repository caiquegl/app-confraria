import type {
  RelativePeriod,
  RouteCompletionFilter,
  RouteStatusFilter,
  SavedRoute,
  SavedRouteFilters,
  SavedRouteGroup,
} from "../types/saved-route.types";

export const DEFAULT_ROUTE_FILTERS: SavedRouteFilters = {
  bike: "",
  completion: "ALL",
  endDate: "",
  period: "ALL",
  startDate: "",
  statuses: [],
};

export const QUICK_PERIOD_OPTIONS: { key: Exclude<RelativePeriod, "ALL">; label: string }[] = [
  { key: "TODAY", label: "Hoje" },
  { key: "THIS_WEEK", label: "Esta Semana" },
  { key: "THIS_MONTH", label: "Este Mês" },
  { key: "UPCOMING", label: "Próximos" },
  { key: "NO_DATE", label: "Sem Data" },
];

export const COMPLETION_OPTIONS: { key: Exclude<RouteCompletionFilter, "ALL">; label: string }[] = [
  { key: "TRAVELED", label: "Já viajei" },
  { key: "PLANNED", label: "Planejadas" },
];

export const PERIOD_LABELS: Record<RelativePeriod, string> = {
  ALL: "Todos",
  NO_DATE: "Sem Data",
  THIS_MONTH: "Este Mês",
  THIS_WEEK: "Esta Semana",
  TODAY: "Hoje",
  UPCOMING: "Próximos",
};

export const STATUS_LABELS: Record<RouteStatusFilter, string> = {
  NO_DATE: "Sem Data",
  OFFLINE: "Offline",
  SCHEDULED: "Agendada",
};

export const ONGOING_GROUP_LABEL = "Em andamento";
const GROUP_ORDER = ["Hoje", "Esta Semana", "Este Mês", "Próximos", "Sem Data"];
export const GROUP_DISPLAY_ORDER = [ONGOING_GROUP_LABEL, ...GROUP_ORDER];

const startOfDay = (date: Date) => {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
};

const endOfDay = (date: Date) => {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
};

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const getEndOfWeek = (date: Date) => {
  const normalized = startOfDay(date);
  const day = normalized.getDay();
  const diff = day === 0 ? 0 : 7 - day;
  return endOfDay(addDays(normalized, diff));
};

const getEndOfMonth = (date: Date) => endOfDay(new Date(date.getFullYear(), date.getMonth() + 1, 0));

export const parseTripDate = (value?: string) => {
  if (!value) return null;
  const parsed = new Date(`${value}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const formatTripDateLabel = (
  value?: string,
  options?: Intl.DateTimeFormatOptions,
) => {
  const parsed = parseTripDate(value);
  if (!parsed) return "Sem data";
  return parsed.toLocaleDateString("pt-BR", options ?? { day: "2-digit", month: "short" });
};

const normalizeText = (value?: string) =>
  (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

export const isRouteCompleted = (route: SavedRoute) => route.status === "finished";

export const isRouteOngoing = (route: SavedRoute) => route.status === "in_progress";

const getRouteStatuses = (route: SavedRoute): RouteStatusFilter[] => {
  const statuses: RouteStatusFilter[] = [];
  if (route.status === "scheduled") statuses.push("SCHEDULED");
  if (!route.tripDate) statuses.push("NO_DATE");
  return statuses;
};

const getGroupLabel = (route: SavedRoute, referenceDate: Date) => {
  const routeDate = parseTripDate(route.tripDate);
  if (!routeDate) return "Sem Data";

  const dayStart = startOfDay(referenceDate);
  const weekEnd = getEndOfWeek(referenceDate);
  const monthEnd = getEndOfMonth(referenceDate);

  if (startOfDay(routeDate).getTime() === dayStart.getTime()) return "Hoje";
  if (routeDate <= weekEnd) return "Esta Semana";
  if (routeDate <= monthEnd) return "Este Mês";
  return "Próximos";
};

export function filterSavedRoutes(
  routes: SavedRoute[],
  filters: SavedRouteFilters,
  searchQuery: string,
): SavedRoute[] {
  const normalizedSearch = normalizeText(searchQuery.trim());
  const today = new Date();
  const todayStart = startOfDay(today);
  const weekEnd = getEndOfWeek(today);
  const monthEnd = getEndOfMonth(today);

  return routes
    .filter((route) => {
      const matchesRouteSearch =
        !normalizedSearch ||
        [
          route.title,
          route.originLabel,
          route.destinationLabel,
          route.bikeName,
          route.distanceLabel,
          route.durationLabel,
          route.tripNote ?? "",
          route.tripDate,
          route.tripTime,
        ].some((value) => normalizeText(value).includes(normalizedSearch));

      if (!matchesRouteSearch) return false;
      if (filters.bike && route.bikeName !== filters.bike) return false;

      const routeDate = parseTripDate(route.tripDate);
      const routeStatuses = getRouteStatuses(route);

      if (filters.period === "NO_DATE" && routeDate) return false;
      if (
        filters.period === "TODAY" &&
        (!routeDate || startOfDay(routeDate).getTime() !== todayStart.getTime())
      ) {
        return false;
      }
      if (
        filters.period === "THIS_WEEK" &&
        (!routeDate || routeDate < todayStart || routeDate > weekEnd)
      ) {
        return false;
      }
      if (
        filters.period === "THIS_MONTH" &&
        (!routeDate || routeDate < todayStart || routeDate > monthEnd)
      ) {
        return false;
      }
      if (filters.period === "UPCOMING" && (!routeDate || routeDate <= monthEnd)) {
        return false;
      }

      if (filters.startDate) {
        const startDate = startOfDay(new Date(`${filters.startDate}T00:00:00`));
        if (!routeDate || routeDate < startDate) return false;
      }

      if (filters.endDate) {
        const endDate = endOfDay(new Date(`${filters.endDate}T00:00:00`));
        if (!routeDate || routeDate > endDate) return false;
      }

      if (
        filters.statuses.length > 0 &&
        !filters.statuses.some((status) => routeStatuses.includes(status))
      ) {
        return false;
      }

      if (filters.completion === "TRAVELED" && !isRouteCompleted(route)) return false;
      if (filters.completion === "PLANNED" && isRouteCompleted(route)) return false;

      return true;
    })
    .sort((left, right) => {
      const leftDate = parseTripDate(left.tripDate);
      const rightDate = parseTripDate(right.tripDate);
      const leftIsFuture = leftDate ? leftDate >= todayStart : false;
      const rightIsFuture = rightDate ? rightDate >= todayStart : false;

      if (leftDate && rightDate) {
        if (leftIsFuture && !rightIsFuture) return -1;
        if (!leftIsFuture && rightIsFuture) return 1;
        if (leftIsFuture && rightIsFuture) return leftDate.getTime() - rightDate.getTime();
        return rightDate.getTime() - leftDate.getTime();
      }

      if (leftDate) return -1;
      if (rightDate) return 1;
      return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
    });
}

export function groupSavedRoutes(routes: SavedRoute[]): SavedRouteGroup[] {
  const buckets = new Map<string, SavedRoute[]>();
  const now = new Date();

  const ongoing = routes
    .filter(isRouteOngoing)
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
  const activeOngoingId = ongoing[0]?.id;

  routes.forEach((route) => {
    const label =
      route.id === activeOngoingId ? ONGOING_GROUP_LABEL : getGroupLabel(route, now);
    buckets.set(label, [...(buckets.get(label) ?? []), route]);
  });

  return GROUP_DISPLAY_ORDER.map((label) => ({
    label,
    routes: buckets.get(label) ?? [],
  })).filter((group) => group.routes.length > 0);
}

export function buildActiveFilterChips(
  filters: SavedRouteFilters,
  onChange: (next: SavedRouteFilters) => void,
) {
  const chips: { key: string; label: string; onRemove: () => void }[] = [];

  if (filters.period !== "ALL") {
    chips.push({
      key: "period",
      label: PERIOD_LABELS[filters.period],
      onRemove: () => onChange({ ...filters, period: "ALL" }),
    });
  }

  if (filters.startDate || filters.endDate) {
    const rangeLabel =
      filters.startDate && filters.endDate
        ? `${formatTripDateLabel(filters.startDate, { day: "2-digit", month: "2-digit" })} - ${formatTripDateLabel(filters.endDate, { day: "2-digit", month: "2-digit" })}`
        : filters.startDate
          ? `A partir de ${formatTripDateLabel(filters.startDate, { day: "2-digit", month: "2-digit" })}`
          : `Até ${formatTripDateLabel(filters.endDate, { day: "2-digit", month: "2-digit" })}`;

    chips.push({
      key: "range",
      label: rangeLabel,
      onRemove: () => onChange({ ...filters, endDate: "", startDate: "" }),
    });
  }

  if (filters.bike) {
    chips.push({
      key: "bike",
      label: filters.bike,
      onRemove: () => onChange({ ...filters, bike: "" }),
    });
  }

  filters.statuses.forEach((status) => {
    chips.push({
      key: status,
      label: STATUS_LABELS[status],
      onRemove: () =>
        onChange({
          ...filters,
          statuses: filters.statuses.filter((item) => item !== status),
        }),
    });
  });

  if (filters.completion !== "ALL") {
    chips.push({
      key: "completion",
      label:
        COMPLETION_OPTIONS.find((option) => option.key === filters.completion)?.label ??
        filters.completion,
      onRemove: () => onChange({ ...filters, completion: "ALL" }),
    });
  }

  return chips;
}

export function hasAppliedRouteFilters(filters: SavedRouteFilters) {
  return (
    filters.period !== "ALL" ||
    Boolean(filters.startDate) ||
    Boolean(filters.endDate) ||
    Boolean(filters.bike) ||
    filters.statuses.length > 0 ||
    filters.completion !== "ALL"
  );
}
