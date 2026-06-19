import { z } from 'zod';

import { auth } from '@/app/(auth)/auth';
import {
  validateFinancialDatasetsKey,
  validateOpenAIKey,
} from '@/lib/server/validate-api-key';

const requestSchema = z.object({
  apiKey: z.string().min(1),
  type: z.enum(['openai', 'financial']).default('openai'),
});

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const json = await request.json();
  const parsed = requestSchema.safeParse(json);

  if (!parsed.success) {
    return Response.json(
      { isValid: false, error: 'API key is required' },
      { status: 400 },
    );
  }

  const result =
    parsed.data.type === 'financial'
      ? await validateFinancialDatasetsKey(parsed.data.apiKey)
      : await validateOpenAIKey(parsed.data.apiKey);
  return Response.json(result);
}
