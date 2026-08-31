export type ListLoadError = "initial" | "refresh" | "pagination" | null;

export type ListLoadKind =
  | "loading"
  | "success-with-data"
  | "success-empty"
  | "filtered-empty"
  | "initial-error"
  | "refresh-error-with-stale-data"
  | "pagination-error-with-data";

export function nextListLoadError(hasLoadedOnce: boolean): Exclude<
  ListLoadError,
  "pagination" | null
> {
  return hasLoadedOnce ? "refresh" : "initial";
}

export function deriveListLoadKind(input: {
  error: ListLoadError;
  filteredCount: number;
  hasFilters: boolean;
  hasLoadedOnce: boolean;
  isLoading: boolean;
  itemCount: number;
}): ListLoadKind {
  if (input.error === "initial" && input.itemCount === 0) {
    return "initial-error";
  }

  if (!input.hasLoadedOnce && input.isLoading) {
    return "loading";
  }

  if (input.isLoading && input.itemCount === 0) {
    return "loading";
  }

  if (input.error === "refresh" && input.itemCount > 0) {
    return "refresh-error-with-stale-data";
  }

  if (input.error === "pagination" && input.itemCount > 0) {
    return "pagination-error-with-data";
  }

  if (input.itemCount === 0) {
    return "success-empty";
  }

  if (input.filteredCount === 0 && input.hasFilters) {
    return "filtered-empty";
  }

  return "success-with-data";
}
