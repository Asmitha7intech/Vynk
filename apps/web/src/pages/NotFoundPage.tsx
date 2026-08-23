import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/Button';
import { Home } from 'lucide-react';

export function NotFoundPage() {
  return (
    <div className="py-20 text-center space-y-4">
      <h1 className="text-4xl font-black text-indigo-400 font-mono">404</h1>
      <h2 className="text-xl font-bold">Uncharted Waters</h2>
      <p className="text-xs text-muted-foreground max-w-sm mx-auto">
        The voyage or page you are searching for does not exist or has set sail to another harbor.
      </p>
      <Link to="/">
        <Button size="sm">
          <Home className="w-4 h-4" /> Return to Campus Feed
        </Button>
      </Link>
    </div>
  );
}
