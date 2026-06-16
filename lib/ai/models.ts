// Define your models here.

export type ModelTier = 'low' | 'medium' | 'high';

export interface Model {
  id: string;
  label: string;
  apiIdentifier: string;
  description: string;
  tier: ModelTier;
  supportsVision: boolean;
}

export const models: Array<Model> = [
  {
    id: 'gpt-4.1-nano-2025-04-14',
    label: 'GPT 4.1 nano',
    apiIdentifier: 'gpt-4.1-nano-2025-04-14',
    description: 'Fastest, most cost-effective GPT-4.1 model',
    tier: 'low',
    supportsVision: true,
  },
  {
    id: 'gpt-4.1-mini-2025-04-14',
    label: 'GPT 4.1 mini',
    apiIdentifier: 'gpt-4.1-mini-2025-04-14',
    description: 'Balance between intelligence, speed, and cost',
    tier: 'medium',
    supportsVision: true,
  },
  {
    id: 'gpt-4.1-2025-04-14',
    label: 'GPT 4.1',
    apiIdentifier: 'gpt-4.1-2025-04-14',
    description: 'Flagship model for complex tasks',
    tier: 'high',
    supportsVision: true,
  },
  {
    id: 'gpt-4o',
    label: 'GPT-4o',
    apiIdentifier: 'gpt-4o',
    description: 'Omni-purpose model for complex tasks and images',
    tier: 'high',
    supportsVision: true,
  },
] as const;

export const DEFAULT_MODEL_NAME: string = 'gpt-4.1-nano-2025-04-14';

export const MODEL_TIER_LABELS: Record<ModelTier, string> = {
  low: 'Lower cost',
  medium: 'Balanced',
  high: 'Higher cost',
};

export function modelSupportsVision(modelId: string): boolean {
  return models.find((model) => model.id === modelId)?.supportsVision ?? false;
}
