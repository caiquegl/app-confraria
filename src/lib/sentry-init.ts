import { initFaro } from "./faro";
import { initSentry } from "./sentry";

try {
  initSentry();
} catch (error) {
  // Nunca derrubar o app se o Sentry falhar no boot (ex.: pacote desalinhado).
  console.warn("[sentry] Falha ao inicializar:", error);
}

void initFaro().catch((error) => {
  console.warn("[faro] Falha ao inicializar:", error);
});
