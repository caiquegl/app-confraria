import { api } from "./api";
import reactotron from "./reactotron";

export function setupReactotronAxios() {
  api.interceptors.request.use((config) => {
    reactotron.display?.({
      name: "→ REQUEST",
      value: {
        url: `${config.baseURL ?? ""}${config.url ?? ""}`,
        method: config.method?.toUpperCase(),
        data: config.data,
        params: config.params,
        headers: config.headers,
      },
      important: true,
    });
    return config;
  });

  api.interceptors.response.use(
    (response) => {
      reactotron.display?.({
        name: "← RESPONSE",
        value: {
          url: response.config.url,
          status: response.status,
          data: response.data,
        },
      });
      return response;
    },
    (error) => {
      reactotron.display?.({
        name: "✗ ERROR",
        value: {
          url: error.config?.url,
          status: error.response?.status,
          data: error.response?.data,
          message: error.message,
        },
        important: true,
      });
      return Promise.reject(error);
    },
  );
}
