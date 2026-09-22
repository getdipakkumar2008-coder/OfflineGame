import { useEffect, useState } from "react";
import { networkMonitor } from "../services/network/networkMonitor";

export function useNetworkStatus(): boolean {
  const [isOnline, setIsOnline] = useState(() => networkMonitor.isOnline());

  useEffect(() => {
    return networkMonitor.subscribe(setIsOnline);
  }, []);

  return isOnline;
}
