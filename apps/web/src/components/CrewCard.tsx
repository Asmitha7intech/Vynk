import React, { useState } from 'react';
import { Shield, Sparkles, Users, Clock, ArrowRight, FileText } from 'lucide-react';
import { Card, CardHeader, CardContent, CardFooter } from './Card';
import { Avatar } from './Avatar';
import { Badge } from './Badge';
import { Button } from './Button';
import { Crew } from '@vynk/types';
import { TeamAgreementModal } from './TeamAgreementModal';
import { MatchingAnalysisModal } from './MatchingAnalysisModal';

export function CrewCard({ crew }: { crew: Crew }) {
  const [showAgreement, setShowAgreement] = useState(false);
  const [showMatching, setShowMatching] = useState(false);

  return (
    <Card className="hover:border-indigo-500/40 transition-all flex flex-col justify-between">
      <div>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-black text-lg">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground leading-tight">{crew.name}</h3>
                <span className="text-xs text-indigo-400 font-semibold">{crew.category}</span>
              </div>
            </div>
            <Badge variant={crew.isRecruiting ? 'success' : 'outline'} className="text-[10px]">
              {crew.isRecruiting ? 'Recruiting' : 'Full Crew'}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground leading-relaxed">{crew.description}</p>

          {crew.targetHackathon && (
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/20">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Target: {crew.targetHackathon}</span>
            </div>
          )}

          {/* Missing Roles Required */}
          <div className="space-y-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">
              Open Roles Needed:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {crew.requirements.map((req) => (
                <div
                  key={req.id}
                  className="px-2.5 py-1 rounded-xl bg-muted/60 border border-border text-xs flex items-center gap-1.5 font-medium"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                  <span>{req.roleName}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Current Roster */}
          <div className="space-y-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">
              Active Crew ({crew.members.length}/{crew.maxMembers}):
            </span>
            <div className="flex items-center gap-2">
              {crew.members.map((member) => (
                <div key={member.id} title={`${member.user.displayName} - ${member.assignedRoleName}`}>
                  <Avatar src={member.user.avatarUrl} fallback={member.user.displayName} size="sm" />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </div>

      <CardFooter className="pt-3 border-t border-border/50 justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
          <Clock className="w-3.5 h-3.5" />
          <span>{crew.commitmentHoursPerWeek} hrs/wk</span>
        </div>

        <div className="flex items-center gap-2">
          {crew.agreement && (
            <Button variant="outline" size="sm" onClick={() => setShowAgreement(true)} className="text-xs">
              <FileText className="w-3.5 h-3.5" /> Agreement
            </Button>
          )}

          <Button size="sm" onClick={() => setShowMatching(true)} className="text-xs">
            <Sparkles className="w-3.5 h-3.5" /> AI Match
          </Button>
        </div>
      </CardFooter>

      {/* Modals */}
      {crew.agreement && (
        <TeamAgreementModal
          isOpen={showAgreement}
          onClose={() => setShowAgreement(false)}
          agreement={crew.agreement}
          crewName={crew.name}
        />
      )}

      <MatchingAnalysisModal
        isOpen={showMatching}
        onClose={() => setShowMatching(false)}
        crew={crew}
      />
    </Card>
  );
}
