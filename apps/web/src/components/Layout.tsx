import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { RightPanel } from './RightPanel';
import { MobileNav } from './MobileNav';
import { CreatePostModal } from './CreatePostModal';
import { LevelUpCelebration } from './LevelUpCelebration';
import { CommandPalette } from './vynk/CommandPalette';
import { NeonFlowBackground } from './effects/NeonFlowBackground';

import { VynkErrorBoundary } from './vynk/VynkErrorBoundary';

interface LayoutProps {
  showRightPanel?: boolean;
}

export function Layout({ showRightPanel = true }: LayoutProps) {
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  React.useEffect(() => {
    const handler = () => setIsCreatePostOpen(true);
    window.addEventListener('vynk:open-create-post', handler);
    return () => window.removeEventListener('vynk:open-create-post', handler);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-indigo-500/30 selection:text-indigo-400 relative">
      {/* Global Cursor-Reactive Neon Flow Canvas Backdrop */}
      <NeonFlowBackground />

      {/* Sticky App Header */}
      <Navbar
        onOpenCreatePost={() => setIsCreatePostOpen(true)}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
      />

      {/* Main 3-Column Shell */}
      <div className="flex-1 flex justify-center w-full max-w-[1600px] mx-auto relative z-10">
        <Sidebar onOpenCreatePost={() => setIsCreatePostOpen(true)} />

        <main className="flex-1 min-w-0 px-4 py-6 md:px-6 lg:px-8 max-w-4xl pb-24 lg:pb-12">
          <VynkErrorBoundary>
            <Outlet />
          </VynkErrorBoundary>
        </main>

        {showRightPanel && <RightPanel />}
      </div>

      {/* Mobile Navigation */}
      <MobileNav onOpenCreate={() => setIsCreatePostOpen(true)} />

      {/* Global Modals & Command Palette */}
      <CreatePostModal
        isOpen={isCreatePostOpen}
        onClose={() => setIsCreatePostOpen(false)}
      />
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onOpenCreatePost={() => setIsCreatePostOpen(true)}
      />
      <LevelUpCelebration />
    </div>
  );
}
