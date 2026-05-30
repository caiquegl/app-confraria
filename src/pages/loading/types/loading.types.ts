export type AppRoute = "feed" | "landing";

export type LoadingViewProps = {
  onComplete?: (route: AppRoute) => void | Promise<void>;
  durationMs?: number;
};

export type UseLoadingParams = {
  onComplete?: (route: AppRoute) => void | Promise<void>;
};
