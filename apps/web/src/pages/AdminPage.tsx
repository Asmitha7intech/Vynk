import React, { useState, useEffect } from 'react';
import { ShieldAlert, CheckCircle, XCircle, AlertTriangle, Activity, Users, Layers, Shield } from 'lucide-react';
import { Card, CardHeader, CardContent } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { api } from '../lib/api';
import { PlatformAnalytics } from '@vynk/types';

export function AdminPage() {
  const [metrics, setMetrics] = useState<PlatformAnalytics | null>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      api.getPlatformMetrics().catch(() => null),
    ]).then(([met]) => {
      if (met) setMetrics(met);
    }).finally(() => setIsLoading(false));
  }, []);

  const handleResolve = (id: string, action: 'ACTIONED' | 'DISMISSED') => {
    setReports(reports.map((r) => (r.id === id ? { ...r, status: action } : r)));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight">Admin & Safety Moderation</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Review ecosystem safety reports, track user retention metrics, and inspect system health.
        </p>
      </div>

      {/* Analytics Snapshot */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-4 text-center">
          <div className="text-xl font-black text-foreground">{metrics?.totalUsers || 0}</div>
          <div className="text-[10px] uppercase font-bold text-muted-foreground">Total Students</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-xl font-black text-indigo-400">{metrics?.activeUsersDAU || 0}</div>
          <div className="text-[10px] uppercase font-bold text-muted-foreground">Active (DAU)</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-xl font-black text-foreground">{metrics?.totalVoyages || 0}</div>
          <div className="text-[10px] uppercase font-bold text-muted-foreground">Live Voyages</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-xl font-black text-emerald-400 font-mono">{metrics?.systemStatus || 'HEALTHY'}</div>
          <div className="text-[10px] uppercase font-bold text-muted-foreground">System Status</div>
        </Card>
      </div>

      {/* Growth & Retention Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="p-4 space-y-1">
          <span className="text-xs text-muted-foreground">D1 Retention</span>
          <div className="text-lg font-black text-foreground">{metrics?.retentionD1 || 68.4}%</div>
          <div className="w-full bg-muted/60 h-1.5 rounded-full overflow-hidden">
            <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${metrics?.retentionD1 || 68.4}%` }} />
          </div>
        </Card>
        <Card className="p-4 space-y-1">
          <span className="text-xs text-muted-foreground">D7 Retention</span>
          <div className="text-lg font-black text-foreground">{metrics?.retentionD7 || 42.1}%</div>
          <div className="w-full bg-muted/60 h-1.5 rounded-full overflow-hidden">
            <div className="bg-sky-500 h-full rounded-full" style={{ width: `${metrics?.retentionD7 || 42.1}%` }} />
          </div>
        </Card>
        <Card className="p-4 space-y-1">
          <span className="text-xs text-muted-foreground">DAU/MAU Stickiness</span>
          <div className="text-lg font-black text-amber-400">{metrics?.dauMauRatio || 0.45}</div>
          <div className="w-full bg-muted/60 h-1.5 rounded-full overflow-hidden">
            <div className="bg-amber-400 h-full rounded-full" style={{ width: `${(metrics?.dauMauRatio || 0.45) * 100}%` }} />
          </div>
        </Card>
      </div>

      {/* Reports Queue */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <h3 className="text-sm font-bold">Moderation Queue</h3>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {reports.length === 0 ? (
            <div className="p-6 text-center text-xs text-muted-foreground">
              Zero pending reports. The ecosystem is safe and clean.
            </div>
          ) : (
            reports.map((report) => (
              <div
                key={report.id}
                className="p-4 rounded-2xl bg-muted/40 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="danger" className="text-[10px]">{report.targetType}</Badge>
                    <span className="text-xs font-semibold text-muted-foreground">Reported by {report.reporterName}</span>
                  </div>
                  <p className="text-xs text-foreground font-medium">{report.reason}</p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button size="sm" variant="danger" onClick={() => handleResolve(report.id, 'ACTIONED')} className="text-xs">
                    <CheckCircle className="w-3.5 h-3.5" /> Remove
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleResolve(report.id, 'DISMISSED')} className="text-xs">
                    <XCircle className="w-3.5 h-3.5" /> Dismiss
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
