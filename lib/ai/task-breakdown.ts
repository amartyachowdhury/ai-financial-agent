import 'server-only';

import { generateObject } from 'ai';
import { z } from 'zod';

import { customModel } from '@/lib/ai';

const taskSchema = z.object({
  task_name: z.string(),
  class: z.string().describe('The name of the sub-task'),
});

export function isTaskBreakdownEnabled(): boolean {
  return process.env.ENABLE_TASK_BREAKDOWN === 'true';
}

export async function generateTaskBreakdown({
  query,
  modelApiKey,
}: {
  query: string;
  modelApiKey: string;
}): Promise<string[]> {
  const { object } = await generateObject({
    model: customModel('gpt-4.1-nano-2025-04-14', modelApiKey),
    output: 'array',
    schema: taskSchema,
    prompt: `You are a financial reasoning agent.
Given the following user query: ${query},
break it down to small, tightly-scoped sub-tasks
that need to be taken to answer the query.

Your task breakdown should:
- Be comprehensive and cover all aspects needed to fully answer the query
- Follow a logical research sequence from basic information to deeper analysis
- Include 1-3 tasks maximum - fewer is better as long as they cover the complete question
- Prioritize the most essential research steps and consolidate similar actions
- Start with gathering fundamental data before moving to analysis and comparison
- Make thought processes transparent to users who will see these tasks
- Show a clear progression of reasoning that builds toward the answer

Format requirements:
- Include the ticker or company name where appropriate
- Use present progressive tense (e.g., "Analyzing", "Retrieving", "Comparing")
- Keep task names short (3-7 words) but specific and informative
- Make tasks distinct with no overlap or redundancy
- Begin with data collection tasks, then move to analysis tasks

Examples of good task sequences:
- "Retrieving AAPL financials", "Analyzing AAPL performance trends"
- "Finding top tech stocks", "Evaluating financial health"
- "Comparing AAPL and MSFT metrics"`,
  });

  return object.map((task) => task.task_name);
}

export function appendTaskBreakdownToUserMessage({
  originalUserContent,
  taskNames,
}: {
  originalUserContent: string;
  taskNames: string[];
}) {
  const taskList = taskNames.join('\n');

  return `Original question: ${originalUserContent}\n\nResearch tasks:\n${taskList}`;
}
