import { initSentry } from "./sentry";

try {
  initSentry();
} catch (error) {
  // Nunca derrubar o app se o Sentry falhar no boot (ex.: pacote desalinhado).
  console.warn("[sentry] Falha ao inicializar:", error);
}
