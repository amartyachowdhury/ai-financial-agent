import type { MessageAttachment } from '@/lib/api/validation';

type TextPart = { type: 'text'; text: string };
type ImagePart = { type: 'image'; image: string };

export type UserMessageContent = string | Array<TextPart | ImagePart>;

export function buildCoreUserContent({
  text,
  attachments = [],
}: {
  text: string;
  attachments?: MessageAttachment[];
}): UserMessageContent {
  if (attachments.length === 0) {
    return text;
  }

  return [
    { type: 'text', text },
    ...attachments.map((attachment) => ({
      type: 'image' as const,
      image: attachment.url,
    })),
  ];
}

export function extractTextFromUserContent(content: UserMessageContent): string {
  if (typeof content === 'string') {
    return content;
  }

  return content
    .filter((part): part is TextPart => part.type === 'text')
    .map((part) => part.text)
    .join('\n');
}

export function extractAttachmentsFromContent(
  content: unknown,
): MessageAttachment[] {
  if (!Array.isArray(content)) {
    return [];
  }

  return content
    .filter(
      (part): part is ImagePart =>
        typeof part === 'object' &&
        part !== null &&
        'type' in part &&
        part.type === 'image' &&
        'image' in part &&
        typeof part.image === 'string',
    )
    .map((part, index) => ({
      url: part.image,
      name: `attachment-${index + 1}`,
      contentType: 'image/jpeg',
    }));
}
