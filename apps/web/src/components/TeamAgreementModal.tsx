import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { FileText, CheckCircle2, Clock, MessageSquare, Scale, Calendar } from 'lucide-react';
import { TeamAgreement } from '@vynk/types';

interface TeamAgreementModalProps {
  isOpen: boolean;
  onClose: () => void;
  agreement: TeamAgreement;
  crewName: string;
}

export function TeamAgreementModal({ isOpen, onClose, agreement, crewName }: TeamAgreementModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Team Agreement · ${crewName}`} maxWidth="xl">
      <div className="space-y-4 text-xs">
        <p className="text-muted-foreground leading-relaxed">
          The Team Agreement sets explicit expectations to prevent miscommunication, missed deadlines, and unequal commitments across crew members.
        </p>

        <div className="space-y-3 p-4 rounded-2xl bg-muted/40 border border-border">
          <div className="flex items-start gap-2.5">
            <Clock className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="text-foreground block font-bold">Weekly Commitment</strong>
              <span className="text-muted-foreground">{agreement.weeklyHours} hours per week minimum dedicated build time.</span>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <MessageSquare className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="text-foreground block font-bold">Communication Protocol</strong>
              <span className="text-muted-foreground">Primary Channel: {agreement.primaryChannel}</span>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <Scale className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="text-foreground block font-bold">Decision-Making Method</strong>
              <span className="text-muted-foreground">Protocol: {agreement.decisionProtocol}</span>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <Calendar className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="text-foreground block font-bold">Sync Schedule</strong>
              <span className="text-muted-foreground">{agreement.meetingSchedule}</span>
            </div>
          </div>
        </div>

        {agreement.codeStandardRules?.length > 0 && (
          <div className="space-y-2 p-4 rounded-2xl bg-muted/40 border border-border">
            <strong className="text-foreground block font-bold">Code & Quality Standards:</strong>
            <ul className="space-y-1 list-disc list-inside text-muted-foreground">
              {agreement.codeStandardRules.map((rule, idx) => (
                <li key={idx}>{rule}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex items-center gap-2 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold">
          <CheckCircle2 className="w-4 h-4" />
          <span>Agreement Verified & Signed by Active Crew Members</span>
        </div>

        <div className="flex justify-end pt-2">
          <Button onClick={onClose} size="sm">
            Close Agreement
          </Button>
        </div>
      </div>
    </Modal>
  );
}
