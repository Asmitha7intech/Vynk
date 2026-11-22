import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/Button';
import { Home } from 'lucide-react';

export function NotFoundPage() {
  return (
    <div className="py-20 text-center space-y-5">
      <div className="w-16 h-16 mx-auto flex items-center justify-center p-1 opacity-80">
        <img
          src="/vynk-logo.png"
          alt="VYNK"
          className="w-full h-full object-contain"
        />
      </div>
      <div className="space-y-1.5">
        <h1 className="text-4xl font-black text-indigo-400 font-mono">404</h1>
        <h2 className="text-xl font-bold text-foreground">Uncharted Waters</h2>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
          The voyage or page you are searching for does not exist or has set sail to another campus harbor.
        </p>
      </div>
      <Link to="/">
        <Button size="sm">
          <Home className="w-4 h-4" /> Return to Campus Feed
        </Button>
      </Link>
    </div>
  );
}
