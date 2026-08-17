import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, RefreshCw, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { subscribeToNetworkStatus, isAppOnline, getSyncQueue } from '../lib/offlineStorage';
import { syncOfflineQueue } from '../lib/db';

interface OfflineStatusBannerProps {
  userId?: string;
  onSyncComplete?: () => void;
}

export const OfflineStatusBanner: React.FC<OfflineStatusBannerProps> = ({ userId, onSyncComplete }) => {
  const [online, setOnline] = useState<boolean>(isAppOnline());
  const [justReconnected, setJustReconnected] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncCount, setSyncCount] = useState<number>(0);
  const [pendingChanges, setPendingChanges] = useState<number>(0);

  useEffect(() => {
    // Vérifier les modifications en attente au chargement
    if (userId) {
      setPendingChanges(getSyncQueue(userId).length);
    }

    const unsubscribe = subscribeToNetworkStatus(async (isNowOnline) => {
      setOnline(isNowOnline);

      if (isNowOnline) {
        setJustReconnected(true);
        if (userId) {
          setIsSyncing(true);
          const result = await syncOfflineQueue(userId);
          setSyncCount(result.synced);
          setPendingChanges(0);
          setIsSyncing(false);
          if (onSyncComplete) onSyncComplete();
        }

        const timer = setTimeout(() => {
          setJustReconnected(false);
        }, 5000);

        return () => clearTimeout(timer);
      } else {
        setJustReconnected(false);
        if (userId) {
          setPendingChanges(getSyncQueue(userId).length);
        }
      }
    });

    return () => unsubscribe();
  }, [userId, onSyncComplete]);

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 pointer-events-none px-4 w-full max-w-md">
      <AnimatePresence>
        {!online && (
          <motion.div
            key="offline-banner"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="pointer-events-auto bg-amber-950/90 text-amber-100 border border-amber-500/40 px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-md flex items-center justify-between gap-3 text-xs font-medium"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0 border border-amber-500/30 text-amber-400">
                <WifiOff className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-amber-200 flex items-center gap-1.5">
                  <span>Mode Hors-Ligne Actif</span>
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                </div>
                <div className="text-[11px] text-amber-300/80">
                  {pendingChanges > 0
                    ? `${pendingChanges} modification(s) enregistrée(s) en local`
                    : 'Vos cartes et données restent modifiables localement'}
                </div>
              </div>
            </div>
            <div className="bg-amber-500/15 text-amber-300 px-2.5 py-1 rounded-lg text-[10px] font-bold shrink-0 border border-amber-500/20 uppercase tracking-wider">
              Local OK
            </div>
          </motion.div>
        )}

        {online && justReconnected && (
          <motion.div
            key="reconnected-banner"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="pointer-events-auto bg-emerald-950/90 text-emerald-100 border border-emerald-500/40 px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-md flex items-center justify-between gap-3 text-xs font-medium"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0 border border-emerald-500/30 text-emerald-400">
                {isSyncing ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-emerald-300" />
                ) : (
                  <Wifi className="w-4 h-4 text-emerald-400" />
                )}
              </div>
              <div>
                <div className="font-bold text-emerald-200 flex items-center gap-1.5">
                  <span>Connexion Rétablie</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div className="text-[11px] text-emerald-300/80">
                  {isSyncing
                    ? 'Synchronisation des données en cours...'
                    : syncCount > 0
                    ? `${syncCount} modification(s) synchronisée(s) avec succès`
                    : 'Application connectée et synchronisée'}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
