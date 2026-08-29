export function isFreeRouteLimitError(error: unknown): boolean {
  const response = (error as { response?: { data?: { code?: string } } })?.response?.data;
  if (response?.code === "FREE_ROUTE_LIMIT") return true;

  // Alguns clientes Axios embutem o body em message JSON / nested.
  const nested = (error as { response?: { data?: { message?: { code?: string } } } })?.response
    ?.data?.message;
  if (nested && typeof nested === "object" && nested.code === "FREE_ROUTE_LIMIT") {
    return true;
  }

  return false;
}
