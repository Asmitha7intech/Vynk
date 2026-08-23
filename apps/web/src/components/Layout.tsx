import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { RightPanel } from './RightPanel';
import { MobileNav } from './MobileNav';
import { CreatePostModal } from './CreatePostModal';
import { LevelUpCelebration } from './LevelUpCelebration';

interface LayoutProps {
  showRightPanel?: boolean;
}

export function Layout({ showRightPanel = true }: LayoutProps) {
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-indigo-500 selection:text-white">
      <Navbar onOpenCreatePost={() => setIsCreatePostOpen(true)} />

      <div className="flex-1 flex justify-center w-full max-w-[1600px] mx-auto">
        <Sidebar onOpenCreatePost={() => setIsCreatePostOpen(true)} />

        <main className="flex-1 min-w-0 px-4 py-6 md:px-6 lg:px-8 max-w-4xl pb-24 lg:pb-12">
          <Outlet />
        </main>

        {showRightPanel && <RightPanel />}
      </div>

      <MobileNav />

      {/* Global Modals */}
      <CreatePostModal isOpen={isCreatePostOpen} onClose={() => setIsCreatePostOpen(false)} />
      <LevelUpCelebration />
    </div>
  );
}
