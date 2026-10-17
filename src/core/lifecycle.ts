/**
 * Shared process state. During graceful shutdown the readiness probe
 * starts returning 503 so the load balancer stops sending new traffic.
 */
export const lifecycle = {
  isShuttingDown: false,
};
