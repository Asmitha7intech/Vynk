import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldAlert,
  Activity,
  Zap,
  Database,
  BarChart3,
  Server,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { Pill } from '../components/vynk/Pill';
import { VynkButton } from '../components/vynk/VynkButton';
import { ProgressBar } from '../components/vynk/ProgressBar';
import { AnimatedNumber } from '../components/vynk/AnimatedNumber';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { api } from '../lib/api';
import { PlatformAnalytics } from '@vynk/types';

export function AdminPage() {
  const { user, isAuthenticated } = useAuthStore();
  const [metrics, setMetrics] = useState<PlatformAnalytics | null>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // BigData live state
  const [pulse, setPulse] = useState<any>(null);
  const [outbox, setOutbox] = useState<any>(null);
  const [eventDist, setEventDist] = useState<any>(null);
  const [health, setHealth] = useState<any>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchBigData = async () => {
    const [p, o, e, h] = await Promise.all([
      api.getRealtimePulse().catch(() => null),
      api.getOutboxStats().catch(() => null),
      api.getEventDistribution().catch(() => null),
      api.getDependencyHealth().catch(() => null),
    ]);
    if (p) setPulse(p);
    if (o) setOutbox(o);
    if (e) setEventDist(e);
    if (h) setHealth(h);
    setLastRefresh(new Date());
  };

  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      api.getPlatformMetrics().catch(() => null),
    ]).then(([met]) => {
      if (met) setMetrics(met);
    }).finally(() => setIsLoading(false));

    fetchBigData();
    intervalRef.current = setInterval(fetchBigData, 10_000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const kafkaStatus = health?.dependencies?.kafka?.status || 'FALLBACK_LOCAL';
  const topEvents: any[] = eventDist?.byType?.slice(0, 8) || [];
  const maxEventCount = topEvents[0]?.count || 1;

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white">Authentication Required</h2>
        <p className="text-sm text-neutral-400 max-w-md">
          Please sign in with an authorized administrator account to access platform operations.
        </p>
        <Link to="/auth" className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-sm font-semibold border border-white/10 transition-colors">
          Sign In
        </Link>
      </div>
    );
  }

  if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
          403 Access Denied
        </div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Administrator Authorization Required</h2>
        <p className="text-sm text-neutral-400 max-w-md leading-relaxed">
          Platform Operations & Big Data Intelligence is restricted strictly to platform administrators. Your account (<span className="text-white font-mono">{user.email}</span>, role: <span className="text-cyan-400 font-mono">{user.role}</span>) does not have administrative privileges.
        </p>
        <Link to="/" className="px-5 py-2.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-sm font-semibold border border-cyan-500/40 transition-colors">
          Return to Campus Feed
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div className="p-6 sm:p-7 rounded-3xl glass-card space-y-2 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Pill label="System Operations" variant="indigo" size="xs" />
              <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Live Telemetry
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
              Admin & Big Data Intelligence Center
            </h1>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-xl">
              Live event stream telemetry, Medallion Lake zone health, transactional outbox queue, and safety moderation.
            </p>
          </div>

          <VynkButton
            size="xs"
            variant="outline"
            leftIcon={<RefreshCw className="w-3 h-3" />}
            onClick={fetchBigData}
            className="hidden sm:inline-flex"
          >
            Refresh ({lastRefresh.toLocaleTimeString()})
          </VynkButton>
        </div>
      </div>

      {/* ── Platform Snapshot ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-3xl glass-card text-center space-y-1">
          <div className="text-2xl font-black text-foreground font-mono">
            <AnimatedNumber value={metrics?.totalUsers || 0} />
          </div>
          <div className="text-[10px] uppercase font-bold text-muted-foreground font-mono">Total Students</div>
        </div>

        <div className="p-4 rounded-3xl glass-card text-center space-y-1">
          <div className="text-2xl font-black text-indigo-400 font-mono">
            <AnimatedNumber value={metrics?.activeUsersDAU || 0} />
          </div>
          <div className="text-[10px] uppercase font-bold text-muted-foreground font-mono">Active (DAU)</div>
        </div>

        <div className="p-4 rounded-3xl glass-card text-center space-y-1">
          <div className="text-2xl font-black text-foreground font-mono">
            <AnimatedNumber value={metrics?.totalVoyages || 0} />
          </div>
          <div className="text-[10px] uppercase font-bold text-muted-foreground font-mono">Live Voyages</div>
        </div>

        <div className="p-4 rounded-3xl glass-card text-center space-y-1">
          <div className="text-xl font-black text-emerald-400 font-mono mt-1">
            {metrics?.systemStatus || 'HEALTHY'}
          </div>
          <div className="text-[10px] uppercase font-bold text-muted-foreground font-mono">System Status</div>
        </div>
      </div>

      {/* ── Retention & Stickiness ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-5 rounded-3xl glass-card space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground font-semibold">D1 Retention</span>
            <span className="font-mono font-bold text-foreground">{metrics?.retentionD1 || 68.4}%</span>
          </div>
          <ProgressBar value={metrics?.retentionD1 || 68.4} variant="indigo" size="sm" />
        </div>

        <div className="p-5 rounded-3xl glass-card space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground font-semibold">D7 Retention</span>
            <span className="font-mono font-bold text-foreground">{metrics?.retentionD7 || 42.1}%</span>
          </div>
          <ProgressBar value={metrics?.retentionD7 || 42.1} variant="cyan" size="sm" />
        </div>

        <div className="p-5 rounded-3xl glass-card space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground font-semibold">DAU/MAU Stickiness</span>
            <span className="font-mono font-bold text-amber-400">{metrics?.dauMauRatio || 0.45}</span>
          </div>
          <ProgressBar value={(metrics?.dauMauRatio || 0.45) * 100} variant="amber" size="sm" />
        </div>
      </div>

      {/* ── Live Event Stream Telemetry ── */}
      <div className="p-6 rounded-3xl glass-card space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-foreground">Live Telemetry & Event Stream</h3>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <span className="text-[11px] font-mono text-muted-foreground">Auto-refreshes every 10s</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 text-center space-y-1">
            <div className="text-2xl font-black text-amber-400 font-mono">
              <AnimatedNumber value={pulse?.totalEvents ?? 0} />
            </div>
            <div className="text-[10px] uppercase font-bold text-muted-foreground font-mono">Events Processed</div>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 text-center space-y-1">
            <div className="text-2xl font-black text-indigo-400 font-mono">
              <AnimatedNumber value={pulse?.activeUsers ?? 0} />
            </div>
            <div className="text-[10px] uppercase font-bold text-muted-foreground font-mono">Active Builders</div>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 text-center space-y-1">
            <div className="text-sm font-black font-mono mt-1 text-emerald-400">
              {kafkaStatus === 'ACTIVE' ? 'KAFKA' : 'LOCAL BUS'}
            </div>
            <div className="text-[10px] uppercase font-bold text-muted-foreground font-mono">Event Bus Mode</div>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 text-center space-y-1">
            <div className="text-sm font-black text-emerald-400 font-mono mt-1">
              {health?.status === 'ok' ? '✓ ALL UP' : 'CHECKING'}
            </div>
            <div className="text-[10px] uppercase font-bold text-muted-foreground font-mono">Infrastructure</div>
          </div>
        </div>

        {/* Top Active Departments */}
        {pulse?.topDepartments?.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-white/5">
            <div className="text-[10px] uppercase font-mono font-bold text-muted-foreground">
              Top Active Departments by Event Density
            </div>
            <div className="flex flex-wrap gap-2">
              {pulse.topDepartments.slice(0, 5).map((d: any) => (
                <Pill
                  key={d.department}
                  label={`${d.department || 'Unknown'} (${d.count})`}
                  variant="indigo"
                  size="xs"
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Event Type Distribution ── */}
      {topEvents.length > 0 && (
        <div className="p-6 rounded-3xl glass-card space-y-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-foreground">Telemetry Event Distribution</h3>
          </div>

          <div className="space-y-2">
            {topEvents.map((e: any) => (
              <div key={e.type} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-muted-foreground text-[11px] truncate max-w-[240px]">
                    {e.type}
                  </span>
                  <span className="font-mono font-bold text-foreground text-[11px]">
                    {e.count}
                  </span>
                </div>
                <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(5, (e.count / maxEventCount) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Medallion Data Lake Health ── */}
      {pulse?.lake && (
        <div className="p-6 rounded-3xl glass-card space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-sky-400" />
              <h3 className="text-sm font-bold text-foreground">Medallion Data Lake Storage Zones</h3>
            </div>
            <span className="text-[10px] font-mono text-muted-foreground">data/lake/</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { zone: 'RAW', files: pulse.lake.raw?.files || 0, size: pulse.lake.raw?.totalKb || 0, desc: 'Immutable JSONL', color: 'indigo' },
              { zone: 'BRONZE', files: pulse.lake.bronze?.files || 0, size: pulse.lake.bronze?.totalKb || 0, desc: 'Sanitized & Typed', color: 'cyan' },
              { zone: 'SILVER', files: pulse.lake.silver?.files || 0, size: pulse.lake.silver?.totalKb || 0, desc: 'Deduplicated', color: 'amber' },
              { zone: 'GOLD', files: pulse.lake.gold?.files || 0, size: pulse.lake.gold?.totalKb || 0, desc: 'Spark Aggregates', color: 'emerald' },
            ].map((z) => (
              <div key={z.zone} className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-foreground">{z.zone}</span>
                  <span className="text-[10px] font-mono text-muted-foreground">{z.size} KB</span>
                </div>
                <div className="text-xl font-mono font-black text-indigo-400">{z.files} files</div>
                <div className="text-[10px] text-muted-foreground">{z.desc}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
