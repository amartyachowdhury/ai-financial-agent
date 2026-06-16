'use client';

import { AlertCircle } from 'lucide-react';

export function ToolWidgetError({
  title,
  message,
}: {
  title: string;
  message?: string;
}) {
  return (
    <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3">
      <div className="flex items-start gap-2 text-sm text-destructive">
        <AlertCircle className="mt-0.5 size-4 shrink-0" />
        <div>
          <p className="font-medium">{title}</p>
          {message && <p className="mt-1 text-destructive/80">{message}</p>}
        </div>
      </div>
    </div>
  );
}

export function isToolError(
  result: unknown,
): result is { error: true; tool: string; message: string } {
  return (
    typeof result === 'object' &&
    result !== null &&
    'error' in result &&
    (result as { error: boolean }).error === true
  );
}
