import * as SecureStore from 'expo-secure-store';

export type AIProvider = 'finsnap' | 'gemini' | 'ocr';
export type GeminiModel = 'gemini-2.0-flash' | 'gemini-2.0-flash-lite' | 'gemini-2.5-flash' | 'gemini-2.5-flash-lite';

export interface AISettings {
  provider: AIProvider;
  geminiApiKey: string;
  geminiModel: GeminiModel;
  currency: string;
}

const KEYS = {
  provider: 'ai_provider',
  geminiApiKey: 'ai_gemini_key',
  geminiModel: 'ai_gemini_model',
  currency: 'app_currency',
};

const DEFAULT_SETTINGS: AISettings = {
  provider: 'finsnap',
  geminiApiKey: '',
  geminiModel: 'gemini-2.0-flash',
  currency: 'USD',
};

export async function getAISettings(): Promise<AISettings> {
  const [provider, geminiApiKey, geminiModel, currency] = await Promise.all([
    SecureStore.getItemAsync(KEYS.provider),
    SecureStore.getItemAsync(KEYS.geminiApiKey),
    SecureStore.getItemAsync(KEYS.geminiModel),
    SecureStore.getItemAsync(KEYS.currency),
  ]);

  return {
    provider: (provider as AIProvider) || DEFAULT_SETTINGS.provider,
    geminiApiKey: geminiApiKey || '',
    geminiModel: (geminiModel as GeminiModel) || DEFAULT_SETTINGS.geminiModel,
    currency: currency || DEFAULT_SETTINGS.currency,
  };
}

export async function saveAISettings(settings: Partial<AISettings>): Promise<void> {
  const saves: Promise<void>[] = [];

  if (settings.provider !== undefined) {
    saves.push(SecureStore.setItemAsync(KEYS.provider, settings.provider));
  }
  if (settings.geminiApiKey !== undefined) {
    saves.push(SecureStore.setItemAsync(KEYS.geminiApiKey, settings.geminiApiKey));
  }
  if (settings.geminiModel !== undefined) {
    saves.push(SecureStore.setItemAsync(KEYS.geminiModel, settings.geminiModel));
  }
  if (settings.currency !== undefined) {
    saves.push(SecureStore.setItemAsync(KEYS.currency, settings.currency));
  }

  await Promise.all(saves);
}

export function getApiKeyForProvider(settings: AISettings): string {
  switch (settings.provider) {
    case 'gemini': return settings.geminiApiKey;
    case 'finsnap':
    case 'ocr':
    default: return '';
  }
}

export function isAISettingsConfigured(settings: AISettings): boolean {
  if (settings.provider === 'ocr') return true;
  if (settings.provider === 'finsnap') return true;
  return getApiKeyForProvider(settings).trim().length > 0;
}
