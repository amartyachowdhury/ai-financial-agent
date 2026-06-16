'use client';

import { AlertTriangle } from 'lucide-react';
import { useEffect, useState } from 'react';

const DISCLAIMER_KEY = 'financial-agent-disclaimer-dismissed';

export function EducationalDisclaimer() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(DISCLAIMER_KEY);
    if (!dismissed) {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  return (
    <div className="mx-4 mb-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-400" />
        <div className="flex-1 space-y-1">
          <p className="font-medium text-amber-200">Educational use only</p>
          <p className="text-amber-100/90">
            This tool is for learning and research — not for real trading or
            investment decisions. Past performance does not indicate future
            results. Consult a financial advisor before investing.
          </p>
        </div>
        <button
          type="button"
          className="shrink-0 text-amber-300 hover:text-amber-100"
          onClick={() => {
            localStorage.setItem(DISCLAIMER_KEY, 'true');
            setVisible(false);
          }}
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
