import { useOnlineStatus } from "../hooks/useOffline";
import { WifiOff, Wifi } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

export function OfflineBanner() {
  const isOnline = useOnlineStatus();
  const { language } = useLanguage();

  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-white px-4 py-2 flex items-center justify-center gap-2 text-sm font-medium shadow-lg animate-in slide-in-from-top">
      <WifiOff className="h-4 w-4" />
      <span>
        {language === "te" 
          ? "మీరు ఆఫ్‌లైన్‌లో ఉన్నారు" 
          : "You are offline"}
      </span>
    </div>
  );
}

export function OnlineIndicator() {
  const isOnline = useOnlineStatus();
  
  return (
    <div className={`flex items-center gap-1.5 text-xs ${isOnline ? "text-green-600" : "text-amber-600"}`}>
      {isOnline ? (
        <>
          <Wifi className="h-3 w-3" />
          <span>Online</span>
        </>
      ) : (
        <>
          <WifiOff className="h-3 w-3" />
          <span>Offline</span>
        </>
      )}
    </div>
  );
}
