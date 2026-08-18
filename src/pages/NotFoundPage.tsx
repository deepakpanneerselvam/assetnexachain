import React from 'react';
import { AlertCircle, ArrowLeft } from 'lucide-react';

interface NotFoundPageProps {
  onGoHome: () => void;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({ onGoHome }) => {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center text-center px-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mb-4">
        <AlertCircle className="h-8 w-8" />
      </div>
      <h1 className="text-xl font-bold text-white">Page or View Not Found</h1>
      <p className="mt-2 text-sm text-zinc-400 max-w-md">
        The requested URL parameter or tab view does not exist. The protocol has safely routed you back to the main terminal.
      </p>
      <button
        onClick={onGoHome}
        className="mt-6 flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-black hover:bg-amber-400 transition"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Return to Primary Explorer</span>
      </button>
    </div>
  );
};
