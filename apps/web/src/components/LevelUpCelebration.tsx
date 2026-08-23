import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Trophy, Sparkles, Shield, ArrowUp } from 'lucide-react';
import { useGamificationStore } from '../stores/gamificationStore';

export function LevelUpCelebration() {
  const { showLevelUpModal, levelUpData, closeLevelUpModal } = useGamificationStore();

  if (!showLevelUpModal || !levelUpData) return null;

  return (
    <Modal isOpen={showLevelUpModal} onClose={closeLevelUpModal} maxWidth="sm">
      <div className="py-6 text-center space-y-4">
        {/* Animated Celebration Icon */}
        <div className="relative inline-block">
          <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-indigo-500 via-sky-400 to-amber-400 opacity-75 blur-md animate-pulse" />
          <div className="relative w-20 h-20 rounded-3xl bg-indigo-950 border-2 border-indigo-400/50 flex items-center justify-center text-amber-400 shadow-2xl mx-auto">
            <Trophy className="w-10 h-10 animate-bounce" />
          </div>
        </div>

        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5 fill-current" />
            <span>LEVEL UP UNLOCKED</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-foreground">
            Level {levelUpData.newLevel} · {levelUpData.levelTitle}
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Your technical contributions and quest achievements have elevated your reputation rank on VYNK!
          </p>
        </div>

        <div className="p-3 rounded-2xl bg-muted/40 border border-border text-xs font-mono font-bold text-indigo-400">
          Accumulated Growth: {levelUpData.xp} XP
        </div>

        <Button onClick={closeLevelUpModal} className="w-full shadow-lg shadow-indigo-500/20">
          Claim Rank & Continue Rising
        </Button>
      </div>
    </Modal>
  );
}
