export function isFreeEventLimitError(error: unknown): boolean {
  return getErrorCode(error) === "FREE_EVENT_LIMIT";
}

function getErrorCode(error: unknown): string | undefined {
  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    typeof (error as { code?: unknown }).code === "string"
  ) {
    return (error as { code: string }).code;
  }

  const response = (error as { response?: { data?: { code?: string } } })?.response?.data;
  if (typeof response?.code === "string") return response.code;

  const nested = (error as { response?: { data?: { message?: { code?: string } } } })?.response
    ?.data?.message;
  if (nested && typeof nested === "object" && typeof nested.code === "string") {
    return nested.code;
  }

  return undefined;
}
