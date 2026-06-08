import { useEffect } from "react";
import { setVideoCacheSizeAsync } from "expo-video";

const VIDEO_CACHE_SIZE_BYTES = 1024 * 1024 * 1024;

let didConfigureVideoCache = false;

export function useConfigureVideoCache() {
  useEffect(() => {
    if (didConfigureVideoCache) return;

    didConfigureVideoCache = true;
    void setVideoCacheSizeAsync(VIDEO_CACHE_SIZE_BYTES).catch(() => {
      didConfigureVideoCache = false;
    });
  }, []);
}
