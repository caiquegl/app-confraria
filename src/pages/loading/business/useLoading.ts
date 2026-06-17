import { useEffect, useRef } from "react";

import { prepareApp } from "../services/loading.service";
import type { UseLoadingParams } from "../types/loading.types";

export function useLoading({ onComplete }: UseLoadingParams): void {
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

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
