import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TextInput } from '../src/components';
import {
  AIProvider,
  AISettings,
  GeminiModel,
  getAISettings,
  saveAISettings,
} from '../src/lib/aiSettings';
import { checkProStatus, purchasePro, restorePurchases, syncPlanToSupabase } from '../src/lib/purchases';
import { useAuth } from '../src/contexts/AuthContext';
import { colors, fontSize, fontWeight, spacing, borderRadius } from '../src/constants/theme';

const GEMINI_MODELS: { value: GeminiModel; label: string; description: string }[] = [
  { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash', description: 'Fastest, recommended. Free tier.' },
  { value: 'gemini-2.0-flash-lite', label: 'Gemini 2.0 Flash Lite', description: 'Lighter & faster, slightly lower accuracy.' },
  { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', description: 'Latest generation, best accuracy.' },
  { value: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash Lite', description: 'Lightest 2.5 model, highest rate limits.' },
];

const PROVIDERS: { value: AIProvider; label: string; icon: string; description: string }[] = [
  {
    value: 'finsnap',
    label: 'FinSnap AI (Default)',
    icon: 'flash-outline',
    description: '3 free scans/day powered by Gemini. No setup needed.',
  },
  {
    value: 'gemini',
    label: 'My Gemini Key',
    icon: 'sparkles-outline',
    description: 'Use your own API key for unlimited scanning.',
  },
  {
    value: 'ocr',
    label: 'OCR Only (Offline)',
    icon: 'scan-outline',
    description: 'Free on-device text extraction. No key required.',
  },
];

export default function SettingsScreen() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<AISettings>({
    provider: 'finsnap',
    geminiApiKey: '',
    geminiModel: 'gemini-2.0-flash',
    currency: 'USD',
  });
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isPro, setIsPro] = useState(false);
  const [purchasingPro, setPurchasingPro] = useState(false);
  const [restoringPro, setRestoringPro] = useState(false);

  useEffect(() => {
    Promise.all([getAISettings(), checkProStatus()]).then(([s, pro]) => {
      setSettings(s);
      setIsPro(pro);
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveAISettings(settings);
      router.back();
    } catch {
      Alert.alert('Error', 'Failed to save settings.');
      setSaving(false);
    }
  };

  const handleUpgrade = async () => {
    setPurchasingPro(true);
    try {
      const pro = await purchasePro();
      setIsPro(pro);
      if (pro && user?.id) await syncPlanToSupabase(user.id, true);
      if (pro) Alert.alert('Welcome to Pro!', 'You now have 25 AI scans per day.');
    } catch (e: any) {
      if (!e.userCancelled) Alert.alert('Purchase failed', e.message ?? 'Something went wrong.');
    } finally {
      setPurchasingPro(false);
    }
  };

  const handleRestore = async () => {
    setRestoringPro(true);
    try {
      const pro = await restorePurchases();
      setIsPro(pro);
      if (pro && user?.id) await syncPlanToSupabase(user.id, true);
      Alert.alert(pro ? 'Pro restored!' : 'No purchases found', pro ? 'Your Pro subscription is active.' : 'No previous Pro purchase was found.');
    } catch (e: any) {
      Alert.alert('Restore failed', e.message ?? 'Something went wrong.');
    } finally {
      setRestoringPro(false);
    }
  };

  const selectedProvider = PROVIDERS.find(p => p.value === settings.provider)!;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* AI Provider */}
      <Text style={styles.sectionTitle}>Scanning Method</Text>
      <Text style={styles.sectionSubtitle}>
        Choose how receipts and statements are analyzed.
      </Text>

      {/* Pro upgrade card */}
      <View style={styles.proCard}>
        <View style={styles.proCardHeader}>
          <Ionicons name="star" size={18} color={colors.warning} />
          <Text style={styles.proCardTitle}>FinSnap Pro — $2.99/month</Text>
          {isPro && (
            <View style={styles.proActiveBadge}>
              <Text style={styles.proActiveBadgeText}>Active</Text>
            </View>
          )}
        </View>
        <Text style={styles.proCardBody}>
          {isPro
            ? 'You have 25 AI scans/day. Thank you for supporting FinSnap!'
            : 'Upgrade for 25 AI scans/day using FinSnap\'s key. No setup, no API key needed.'}
        </Text>
        {!isPro && (
          <TouchableOpacity
            style={[styles.proCardBtn, purchasingPro && { opacity: 0.6 }]}
            onPress={handleUpgrade}
            disabled={purchasingPro}
            activeOpacity={0.8}
          >
            {purchasingPro ? (
              <ActivityIndicator color={colors.black} size="small" />
            ) : (
              <Text style={styles.proCardBtnText}>Upgrade to Pro</Text>
            )}
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.restoreLink}
          onPress={handleRestore}
          disabled={restoringPro}
          activeOpacity={0.7}
        >
          {restoringPro ? (
            <ActivityIndicator color={colors.textMuted} size="small" />
          ) : (
            <Text style={styles.restoreLinkText}>Restore purchases</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.providerList}>
        {PROVIDERS.map(provider => (
          <TouchableOpacity
            key={provider.value}
            style={[
              styles.providerCard,
              settings.provider === provider.value && styles.providerCardSelected,
            ]}
            onPress={() => setSettings(s => ({ ...s, provider: provider.value }))}
            activeOpacity={0.7}
          >
            <View style={styles.providerCardLeft}>
              <View style={[
                styles.providerIcon,
                settings.provider === provider.value && styles.providerIconSelected,
              ]}>
                <Ionicons
                  name={provider.icon as any}
                  size={22}
                  color={settings.provider === provider.value ? colors.white : colors.textSecondary}
                />
              </View>
              <View style={styles.providerInfo}>
                <Text style={styles.providerLabel}>{provider.label}</Text>
                <Text style={styles.providerDescription}>{provider.description}</Text>
              </View>
            </View>
            {settings.provider === provider.value && (
              <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
            )}
          </TouchableOpacity>
        ))}
      </View>

      {settings.provider === 'gemini' && (
        <View style={styles.keySection}>
          <Text style={[styles.sectionTitle, { marginTop: spacing.lg }]}>Your Gemini API Key</Text>
          <Text style={[styles.sectionSubtitle, { marginBottom: spacing.sm }]}>
            Stored securely on your device only. Never sent to FinSnap.
          </Text>
          <TextInput
            label="Gemini API Key"
            value={settings.geminiApiKey}
            onChangeText={v => setSettings(s => ({ ...s, geminiApiKey: v }))}
            placeholder="AIza..."
            placeholderTextColor={colors.textMuted}
            secureTextEntry={!showGeminiKey}
            autoCapitalize="none"
            autoCorrect={false}
            rightIcon={
              <TouchableOpacity onPress={() => setShowGeminiKey(v => !v)}>
                <Ionicons
                  name={showGeminiKey ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={colors.textMuted}
                />
              </TouchableOpacity>
            }
          />
          <TouchableOpacity
            style={styles.getKeyLink}
            onPress={() => Linking.openURL('https://aistudio.google.com/app/apikey')}
          >
            <Ionicons name="open-outline" size={14} color={colors.primary} />
            <Text style={styles.getKeyLinkText}>Get a free Gemini API key</Text>
          </TouchableOpacity>

          <Text style={[styles.sectionTitle, { marginTop: spacing.lg, marginBottom: spacing.xs }]}>Model</Text>
          <Text style={[styles.sectionSubtitle, { marginBottom: spacing.sm }]}>All models support vision and are free tier eligible.</Text>
          <View style={styles.modelList}>
            {GEMINI_MODELS.map(m => (
              <TouchableOpacity
                key={m.value}
                style={[
                  styles.modelOption,
                  settings.geminiModel === m.value && styles.modelOptionSelected,
                ]}
                onPress={() => setSettings(s => ({ ...s, geminiModel: m.value }))}
                activeOpacity={0.7}
              >
                <View style={styles.modelOptionLeft}>
                  <Text style={[
                    styles.modelLabel,
                    settings.geminiModel === m.value && { color: colors.primary },
                  ]}>{m.label}</Text>
                  <Text style={styles.modelDescription}>{m.description}</Text>
                </View>
                {settings.geminiModel === m.value && (
                  <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {settings.provider === 'ocr' && (
        <View style={styles.ocrNote}>
          <Ionicons name="information-circle-outline" size={20} color={colors.info} />
          <Text style={styles.ocrNoteText}>
            OCR mode uses free on-device text extraction. No API key required — works offline, but accuracy is lower than AI scanning.
          </Text>
        </View>
      )}

      {/* Currency */}
      {/* Moved to Edit Profile screen */}

      <TouchableOpacity
        style={[styles.saveButton, saving && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={saving}
        activeOpacity={0.8}
      >
        {saving ? (
          <ActivityIndicator color={colors.white} size="small" />
        ) : (
          <Text style={styles.saveButtonText}>Save Settings</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '600',
    marginBottom: spacing.xs,
    marginTop: spacing.lg,
  },
  sectionSubtitle: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginBottom: spacing.md,
  },
  providerList: {
    gap: spacing.sm,
  },
  modelList: {
    gap: spacing.xs,
  },
  modelOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  modelOptionSelected: {
    borderColor: colors.primary,
  },
  modelOptionLeft: {
    flex: 1,
  },
  modelLabel: {
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  modelDescription: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginTop: 1,
  },
  providerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  providerCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.card,
  },
  providerCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  providerIcon: {
    width: 42,
    height: 42,
    borderRadius: borderRadius.md,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  providerIconSelected: {
    backgroundColor: colors.primary,
  },
  providerInfo: {
    flex: 1,
  },
  providerLabel: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '600',
    marginBottom: 2,
  },
  providerDescription: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    lineHeight: 16,
  },
  keySection: {
    marginTop: spacing.md,
  },
  getKeyLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.xs,
    marginLeft: 2,
  },
  getKeyLinkText: {
    color: colors.primary,
    fontSize: fontSize.sm,
  },
  ocrNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.info,
    marginTop: spacing.md,
  },
  ocrNoteText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    flex: 1,
    lineHeight: 20,
  },
  proCard: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.warning,
    marginBottom: spacing.md,
  },
  proCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  proCardTitle: {
    color: colors.warning,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  proCardBody: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  proCardBtn: {
    backgroundColor: colors.warning,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  proCardBtnText: {
    color: colors.black,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  proActiveBadge: {
    backgroundColor: colors.success,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    marginLeft: spacing.xs,
  },
  proActiveBadgeText: {
    color: colors.white,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  restoreLink: {
    alignItems: 'center',
    paddingTop: spacing.sm,
  },
  restoreLinkText: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: colors.white,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
});
