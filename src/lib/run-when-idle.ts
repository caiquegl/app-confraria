type IdleRequestCallback = (deadline: { didTimeout: boolean; timeRemaining: () => number }) => void;

function getRequestIdleCallback(): ((callback: IdleRequestCallback) => number) | null {
  const idleCallback = (
    globalThis as typeof globalThis & {
      requestIdleCallback?: (callback: IdleRequestCallback) => number;
    }
  ).requestIdleCallback;

  return typeof idleCallback === "function" ? idleCallback.bind(globalThis) : null;
}

export function runWhenIdle(task: () => void): void {
  const requestIdleCallback = getRequestIdleCallback();

  if (requestIdleCallback) {
    requestIdleCallback(() => {
      task();
    });
    return;
  }

  setTimeout(task, 0);
}
