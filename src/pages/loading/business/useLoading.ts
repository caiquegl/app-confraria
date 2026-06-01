import { useEffect, useRef } from "react";

import { prepareApp } from "../services/loading.service";
import type { UseLoadingParams } from "../types/loading.types";

export function useLoading({ onComplete }: UseLoadingParams): void {
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    let alive = true;

    prepareApp().then(async (route) => {
      if (!alive) return;
      await onCompleteRef.current?.(route);
    });

    return () => {
      alive = false;
    };
  }, []);
}
