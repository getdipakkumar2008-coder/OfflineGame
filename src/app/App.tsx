import { useNetworkStatus } from "../hooks/useNetworkStatus";
import { OnlineApplication } from "../components/OnlineApplication";
import { OfflineGame } from "../components/OfflineGame";
import "../styles/game.css";

export function App() {
  const isOnline = useNetworkStatus();
  return isOnline ? <OnlineApplication /> : <OfflineGame />;
}
