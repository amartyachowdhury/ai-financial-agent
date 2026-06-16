import 'server-only';

import { nanoid } from 'nanoid';

const MIME_TO_EXTENSION: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
};

export function buildUploadPath(contentType: string): string {
  const extension = MIME_TO_EXTENSION[contentType] ?? 'bin';

  return `uploads/${nanoid()}.${extension}`;
}
