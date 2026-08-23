import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Check, X, Sparkles } from 'lucide-react';
import { Card } from '../components/Card';
import { Avatar } from '../components/Avatar';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { api } from '../lib/api';
import { User } from '@vynk/types';
import { Link } from 'react-router-dom';

export function NetworkPage() {
  const [activeTab, setActiveTab] = useState<'CONNECTIONS' | 'PENDING' | 'SUGGESTIONS'>('CONNECTIONS');
  const [connections, setConnections] = useState<User[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNetworkData = async () => {
    setIsLoading(true);
    try {
      const [conn, pend, sugg] = await Promise.all([
        api.getConnections().catch(() => []),
        api.getPendingRequests().catch(() => []),
        api.searchUsers('').catch(() => []),
      ]);
      setConnections(conn || []);
      setPendingRequests(pend || []);
      setSuggestions(sugg || []);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNetworkData();
    api.trackEvent('network_page_viewed');
  }, []);

  const handleAccept = async (requestId: string) => {
    await api.acceptVynkRequest(requestId);
    fetchNetworkData();
  };

  const handleReject = async (requestId: string) => {
    await api.rejectVynkRequest(requestId);
    fetchNetworkData();
  };

  const handleConnect = async (targetUserId: string) => {
    await api.sendVynkRequest(targetUserId);
    setSuggestions((prev) => prev.filter((s) => s.id !== targetUserId));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight">Your Vynks & Network Graph</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Direct 1-on-1 messaging is unlocked once a mutual Vynk connection is accepted.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border pb-3">
        {[
          { id: 'CONNECTIONS', label: `My Vynks (${connections.length})` },
          { id: 'PENDING', label: `Pending Requests (${pendingRequests.length})` },
          { id: 'SUGGESTIONS', label: 'People You Might Vibe With' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'CONNECTIONS' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {connections.length === 0 ? (
            <div className="col-span-2 p-12 text-center text-xs text-muted-foreground bg-card rounded-2xl border border-border">
              Your network is looking a little lonely 👀. Discover and Vynk with student builders.
            </div>
          ) : (
            connections.map((student) => (
              <Card key={student.id} className="p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar src={student.avatarUrl} fallback={student.displayName} size="md" />
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold truncate">{student.displayName}</h4>
                    <p className="text-xs text-muted-foreground truncate">{student.headline || student.department}</p>
                    <span className="text-[11px] text-emerald-400 font-semibold">● Connected</span>
                  </div>
                </div>
                <Link to="/messages">
                  <Button size="sm" variant="outline" className="text-xs">
                    Chat
                  </Button>
                </Link>
              </Card>
            ))
          )}
        </div>
      )}

      {activeTab === 'PENDING' && (
        <div className="space-y-3">
          {pendingRequests.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground bg-card rounded-2xl border border-border">
              No pending connection requests right now.
            </div>
          ) : (
            pendingRequests.map((req) => (
              <Card key={req.id} className="p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar src={req.sender?.avatarUrl} fallback={req.sender?.displayName || 'Student'} size="md" />
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold truncate">{req.sender?.displayName}</h4>
                    <p className="text-xs text-muted-foreground truncate">{req.sender?.college} · {req.sender?.department}</p>
                    <span className="text-xs text-indigo-400 font-semibold">{req.sender?.headline}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" onClick={() => handleAccept(req.id)} className="text-xs">
                    <Check className="w-3.5 h-3.5" /> Accept
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleReject(req.id)} className="text-xs">
                    <X className="w-3.5 h-3.5" /> Decline
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {activeTab === 'SUGGESTIONS' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {suggestions.length === 0 ? (
            <div className="col-span-2 p-8 text-center text-xs text-muted-foreground bg-card rounded-2xl border border-border">
              No new suggestions right now.
            </div>
          ) : (
            suggestions.map((student) => (
              <Card key={student.id} className="p-4 flex flex-col justify-between space-y-3 border-indigo-500/20">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar src={student.avatarUrl} fallback={student.displayName} size="md" />
                    <div>
                      <h4 className="text-sm font-bold">{student.displayName}</h4>
                      <p className="text-xs text-muted-foreground">{student.department || student.college}</p>
                    </div>
                  </div>
                  <Badge variant="accent" className="text-[10px] font-mono">You might vibe</Badge>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">{student.headline || 'Student Builder'}</p>
                <div className="flex justify-end pt-1">
                  <Button size="sm" variant="outline" onClick={() => handleConnect(student.id)} className="w-full text-xs">
                    <UserPlus className="w-3.5 h-3.5" /> Send Vynk Request
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
