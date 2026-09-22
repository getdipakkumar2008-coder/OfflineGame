export interface NetworkMonitor {
  isOnline(): boolean;
  subscribe(callback: (online: boolean) => void): () => void;
}

/**
 * Wraps navigator.onLine plus the online/offline events. `navigator.onLine` is only a
 * browser connectivity signal (network interface up), not proof the internet is reachable —
 * callers that need stronger guarantees should layer a lightweight health check on top.
 */
class BrowserNetworkMonitor implements NetworkMonitor {
  private listeners = new Set<(online: boolean) => void>();

  constructor() {
    window.addEventListener("online", this.handleOnline);
    window.addEventListener("offline", this.handleOffline);
  }

  isOnline(): boolean {
    return typeof navigator !== "undefined" ? navigator.onLine : true;
  }

  subscribe(callback: (online: boolean) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private handleOnline = (): void => this.notify(true);
  private handleOffline = (): void => this.notify(false);

  private notify(online: boolean): void {
    for (const listener of this.listeners) listener(online);
  }
}

export const networkMonitor: NetworkMonitor = new BrowserNetworkMonitor();
