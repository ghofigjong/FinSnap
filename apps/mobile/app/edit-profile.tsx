import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/contexts/AuthContext';
import { getAISettings, saveAISettings } from '../src/lib/aiSettings';
import { useCurrency } from '../src/contexts/CurrencyContext';
import { colors, fontSize, spacing, borderRadius } from '../src/constants/theme';

const CURRENCIES: { value: string; label: string; symbol: string }[] = [
  { value: 'USD', label: 'US Dollar', symbol: '$' },
  { value: 'EUR', label: 'Euro', symbol: '€' },
  { value: 'GBP', label: 'British Pound', symbol: '£' },
  { value: 'JPY', label: 'Japanese Yen', symbol: '¥' },
  { value: 'AUD', label: 'Australian Dollar', symbol: 'A$' },
  { value: 'CAD', label: 'Canadian Dollar', symbol: 'C$' },
  { value: 'CHF', label: 'Swiss Franc', symbol: 'Fr' },
  { value: 'CNY', label: 'Chinese Yuan', symbol: '¥' },
  { value: 'INR', label: 'Indian Rupee', symbol: '₹' },
  { value: 'SGD', label: 'Singapore Dollar', symbol: 'S$' },
  { value: 'HKD', label: 'Hong Kong Dollar', symbol: 'HK$' },
  { value: 'MYR', label: 'Malaysian Ringgit', symbol: 'RM' },
  { value: 'PHP', label: 'Philippine Peso', symbol: '₱' },
  { value: 'IDR', label: 'Indonesian Rupiah', symbol: 'Rp' },
  { value: 'THB', label: 'Thai Baht', symbol: '฿' },
  { value: 'KRW', label: 'South Korean Won', symbol: '₩' },
];

export default function EditProfileScreen() {
  const { user } = useAuth();
  const { refresh: refreshCurrency } = useCurrency();
  const [currency, setCurrency] = useState('USD');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getAISettings().then(s => {
      setCurrency(s.currency || 'USD');
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveAISettings({ currency });
      await refreshCurrency();
      router.back();
    } catch {
      Alert.alert('Error', 'Failed to save profile.');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Account info (read-only) */}
      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Name</Text>
          <Text style={styles.infoValue}>{user?.user_metadata?.full_name || '—'}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Email</Text>
          <Text style={styles.infoValue}>{user?.email}</Text>
        </View>
      </View>

      {/* Preferred Currency */}
      <Text style={styles.sectionTitle}>Preferred Currency</Text>
      <Text style={styles.sectionSubtitle}>Used for displaying all amounts in the app.</Text>
      <View style={styles.currencyGrid}>
        {CURRENCIES.map(c => (
          <TouchableOpacity
            key={c.value}
            style={[
              styles.currencyOption,
              currency === c.value && styles.currencyOptionSelected,
            ]}
            onPress={() => setCurrency(c.value)}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.currencySymbol,
              currency === c.value && { color: colors.primary },
            ]}>{c.symbol}</Text>
            <Text style={[
              styles.currencyCode,
              currency === c.value && { color: colors.primary },
            ]}>{c.value}</Text>
            <Text style={styles.currencyLabel} numberOfLines={1}>{c.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.saveButton, saving && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={saving}
        activeOpacity={0.8}
      >
        {saving ? (
          <ActivityIndicator color={colors.white} size="small" />
        ) : (
          <Text style={styles.saveButtonText}>Save</Text>
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
  infoCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
    marginTop: spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  infoLabel: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
  infoValue: {
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: '500',
    flexShrink: 1,
    textAlign: 'right',
    marginLeft: spacing.md,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '600',
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  sectionSubtitle: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginBottom: spacing.md,
  },
  currencyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  currencyOption: {
    width: '30%',
    flexGrow: 1,
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  currencyOptionSelected: {
    borderColor: colors.primary,
  },
  currencySymbol: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  currencyCode: {
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: '600',
    marginTop: 1,
  },
  currencyLabel: {
    color: colors.textMuted,
    fontSize: 10,
    marginTop: 1,
    textAlign: 'center',
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
