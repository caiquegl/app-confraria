import { getUpdateInfo, type UpdateInfo } from "@/lib/updates";

export function useHomeVersion(): UpdateInfo {
  return getUpdateInfo();
}
