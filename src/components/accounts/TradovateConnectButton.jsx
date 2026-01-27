import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link2, Unlink, RefreshCw, Loader2 } from 'lucide-react';
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function TradovateConnectButton({ environment }) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const isConnected = user?.[`tradovate_${environment}_tokens`];
  const lastSync = user?.[`tradovate_${environment}_last_sync`];

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const response = await base44.functions.invoke('tradovateAuthStart', { environment });
      if (response.data.auth_url) {
        window.location.href = response.data.auth_url;
      }
    } catch (error) {
      toast.error(`Failed to connect: ${error.message}`);
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm(`Disconnect Tradovate ${environment}?`)) return;
    
    try {
      await base44.functions.invoke('tradovateDisconnect', { environment });
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      toast.success(`Tradovate ${environment} disconnected`);
    } catch (error) {
      toast.error(`Failed to disconnect: ${error.message}`);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const response = await base44.functions.invoke('tradovateSync', { environment });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['trades'] });
      toast.success(`Synced ${response.data.total_trades} trades`);
    } catch (error) {
      toast.error(`Sync failed: ${error.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="flex-1 p-4 rounded-lg bg-white/5 border border-white/10">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="font-medium text-white capitalize">{environment}</p>
          {isConnected && lastSync && (
            <p className="text-xs text-gray-400">Last sync: {new Date(lastSync).toLocaleString()}</p>
          )}
        </div>
        <Badge 
          variant="outline" 
          className={cn(
            isConnected 
              ? "border-emerald-500/30 text-emerald-400" 
              : "border-gray-500/30 text-gray-400"
          )}
        >
          {isConnected ? 'Connected' : 'Not Connected'}
        </Badge>
      </div>

      <div className="flex gap-2">
        {!isConnected ? (
          <Button
            onClick={handleConnect}
            disabled={isConnecting}
            className="flex-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30"
          >
            {isConnecting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Link2 className="w-4 h-4 mr-2" />
            )}
            Connect
          </Button>
        ) : (
          <>
            <Button
              onClick={handleSync}
              disabled={isSyncing}
              className="flex-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/30"
            >
              {isSyncing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Sync
            </Button>
            <Button
              onClick={handleDisconnect}
              variant="outline"
              size="icon"
              className="border-red-500/30 text-red-400 hover:bg-red-500/10"
            >
              <Unlink className="w-4 h-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}