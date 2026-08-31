export function isFreeRouteLimitError(error: unknown): boolean {
  return getErrorCode(error) === "FREE_ROUTE_LIMIT";
}

export function isPremiumRouteStyleError(error: unknown): boolean {
  return getErrorCode(error) === "PREMIUM_ROUTE_STYLE";
}

function getErrorCode(error: unknown): string | undefined {
  const response = (error as { response?: { data?: { code?: string } } })?.response?.data;
  if (typeof response?.code === "string") return response.code;

  const nested = (error as { response?: { data?: { message?: { code?: string } } } })?.response
    ?.data?.message;
  if (nested && typeof nested === "object" && typeof nested.code === "string") {
    return nested.code;
  }

  return undefined;
}
