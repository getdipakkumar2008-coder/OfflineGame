import { describe, expect, it, vi } from "vitest";
import { networkMonitor } from "../src/services/network/networkMonitor";

function setOnLine(value: boolean) {
  Object.defineProperty(navigator, "onLine", { value, configurable: true });
}

describe("networkMonitor", () => {
  it("reflects the initial navigator.onLine value", () => {
    setOnLine(true);
    expect(networkMonitor.isOnline()).toBe(true);
    setOnLine(false);
    expect(networkMonitor.isOnline()).toBe(false);
  });

  it("notifies subscribers on offline and online events", () => {
    const callback = vi.fn();
    const unsubscribe = networkMonitor.subscribe(callback);

    window.dispatchEvent(new Event("offline"));
    expect(callback).toHaveBeenLastCalledWith(false);

    window.dispatchEvent(new Event("online"));
    expect(callback).toHaveBeenLastCalledWith(true);

    unsubscribe();
    window.dispatchEvent(new Event("offline"));
    expect(callback).toHaveBeenCalledTimes(2);
  });
});
