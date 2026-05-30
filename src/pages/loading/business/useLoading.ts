import { useEffect } from "react";

import { prepareApp } from "../services/loading.service";
import type { UseLoadingParams } from "../types/loading.types";

export function useLoading({ onComplete }: UseLoadingParams): void {
  useEffect(() => {
    let alive = true;

    prepareApp().then(async (route) => {
      if (alive) await onComplete?.(route);
    });

    return () => {
      alive = false;
    };
  }, [onComplete]);
}
