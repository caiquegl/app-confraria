import { api } from "@/lib/api";
import { apiRoutes } from "@/lib/api-routes";

export type AppVersionPolicy = {
  androidStoreUrl: string | null;
  iosStoreUrl: string | null;
  messageOta: string | null;
  messageStore: string | null;
  minAppVersion: string | null;
  minOtaVersion: number | null;
};

export async function fetchAppVersionPolicy(
  channel: string,
): Promise<AppVersionPolicy> {
  const { data } = await api.get<AppVersionPolicy>(
    apiRoutes.app.versionPolicy(channel),
  );
  return data;
}
