import * as SecureStore from 'expo-secure-store';

export type AIProvider = 'gemini' | 'openai' | 'ocr';
export type GeminiModel = 'gemini-2.0-flash' | 'gemini-2.0-flash-lite' | 'gemini-2.5-flash' | 'gemini-2.5-flash-lite';

export interface AISettings {
  provider: AIProvider;
  geminiApiKey: string;
  geminiModel: GeminiModel;
  openaiApiKey: string;
  currency: string;
}

const KEYS = {
  provider: 'ai_provider',
  geminiApiKey: 'ai_gemini_key',
  geminiModel: 'ai_gemini_model',
  openaiApiKey: 'ai_openai_key',
  currency: 'app_currency',
};

const DEFAULT_SETTINGS: AISettings = {
  provider: 'gemini',
  geminiApiKey: '',
  geminiModel: 'gemini-2.0-flash',
  openaiApiKey: '',
  currency: 'USD',
};

export async function getAISettings(): Promise<AISettings> {
  const [provider, geminiApiKey, geminiModel, openaiApiKey, currency] = await Promise.all([
    SecureStore.getItemAsync(KEYS.provider),
    SecureStore.getItemAsync(KEYS.geminiApiKey),
    SecureStore.getItemAsync(KEYS.geminiModel),
    SecureStore.getItemAsync(KEYS.openaiApiKey),
    SecureStore.getItemAsync(KEYS.currency),
  ]);

  return {
    provider: (provider as AIProvider) || DEFAULT_SETTINGS.provider,
    geminiApiKey: geminiApiKey || '',
    geminiModel: (geminiModel as GeminiModel) || DEFAULT_SETTINGS.geminiModel,
    openaiApiKey: openaiApiKey || '',
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
  if (settings.openaiApiKey !== undefined) {
    saves.push(SecureStore.setItemAsync(KEYS.openaiApiKey, settings.openaiApiKey));
  }
  if (settings.currency !== undefined) {
    saves.push(SecureStore.setItemAsync(KEYS.currency, settings.currency));
  }

  await Promise.all(saves);
}

export function getApiKeyForProvider(settings: AISettings): string {
  switch (settings.provider) {
    case 'gemini': return settings.geminiApiKey;
    case 'openai': return settings.openaiApiKey;
    case 'ocr': return '';
    default: return '';
  }
}

export function isAISettingsConfigured(settings: AISettings): boolean {
  if (settings.provider === 'ocr') return true;
  return getApiKeyForProvider(settings).trim().length > 0;
}
