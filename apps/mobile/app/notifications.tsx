import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { colors, fontSize, fontWeight, spacing, borderRadius } from '../src/constants/theme';

const KEYS = {
  budgetAlerts: 'notif_budget_alerts',
  weeklyDigest: 'notif_weekly_digest',
  transactionConfirm: 'notif_tx_confirm',
};

interface NotifSettings {
  budgetAlerts: boolean;
  weeklyDigest: boolean;
  transactionConfirm: boolean;
}

const DEFAULTS: NotifSettings = {
  budgetAlerts: true,
  weeklyDigest: true,
  transactionConfirm: false,
};

const ITEMS: { key: keyof NotifSettings; title: string; description: string }[] = [
  {
    key: 'budgetAlerts',
    title: 'Budget Alerts',
    description: 'Get notified when you\'re close to or over a budget limit',
  },
  {
    key: 'weeklyDigest',
    title: 'Weekly Summary',
    description: 'Receive a weekly digest of your spending and income',
  },
  {
    key: 'transactionConfirm',
    title: 'Transaction Confirmations',
    description: 'Get notified when a new transaction is added',
  },
];

export default function NotificationsScreen() {
  const [settings, setSettings] = useState<NotifSettings>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<keyof NotifSettings | null>(null);

  useEffect(() => {
    const load = async () => {
      const [budgetAlerts, weeklyDigest, transactionConfirm] = await Promise.all([
        SecureStore.getItemAsync(KEYS.budgetAlerts),
        SecureStore.getItemAsync(KEYS.weeklyDigest),
        SecureStore.getItemAsync(KEYS.transactionConfirm),
      ]);
      setSettings({
        budgetAlerts: budgetAlerts === null ? DEFAULTS.budgetAlerts : budgetAlerts === 'true',
        weeklyDigest: weeklyDigest === null ? DEFAULTS.weeklyDigest : weeklyDigest === 'true',
        transactionConfirm: transactionConfirm === null ? DEFAULTS.transactionConfirm : transactionConfirm === 'true',
      });
      setLoading(false);
    };
    load();
  }, []);

  const toggle = async (key: keyof NotifSettings) => {
    const next = !settings[key];
    setSettings((prev) => ({ ...prev, [key]: next }));
    setSaving(key);
    await SecureStore.setItemAsync(KEYS[key], String(next));
    setSaving(null);
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
      <Text style={styles.note}>
        Manage which notifications FinSnap sends you. Changes are saved automatically.
      </Text>

      <View style={styles.section}>
        {ITEMS.map((item, index) => (
          <View
            key={item.key}
            style={[
              styles.row,
              index < ITEMS.length - 1 && styles.rowBorder,
            ]}
          >
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>{item.title}</Text>
              <Text style={styles.rowDesc}>{item.description}</Text>
            </View>
            {saving === item.key ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Switch
                value={settings[item.key]}
                onValueChange={() => toggle(item.key)}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.white}
              />
            )}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  note: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  section: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowText: {
    flex: 1,
  },
  rowTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: 2,
  },
  rowDesc: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});
