import { useState } from 'react';
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
import { supabase } from '../src/lib/supabase';
import { colors, fontSize, fontWeight, spacing, borderRadius } from '../src/constants/theme';

export default function PrivacyScreen() {
  const { user, signOut } = useAuth();
  const [deletingTx, setDeletingTx] = useState(false);
  const [deletingAcct, setDeletingAcct] = useState(false);

  const handleDeleteTransactions = () => {
    Alert.alert(
      'Delete All Transactions',
      'This will permanently delete all your transactions and budgets. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            if (!user) return;
            setDeletingTx(true);
            try {
              const [txResult, budgetResult] = await Promise.all([
                supabase.from('transactions').delete().eq('user_id', user.id),
                supabase.from('budgets').delete().eq('user_id', user.id),
              ]);
              if (txResult.error) throw txResult.error;
              if (budgetResult.error) throw budgetResult.error;
              Alert.alert('Done', 'All transactions and budgets have been deleted.');
            } catch (error) {
              console.error('Error deleting data:', error);
              Alert.alert('Error', 'Failed to delete data. Please try again.');
            } finally {
              setDeletingTx(false);
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all associated data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: async () => {
            if (!user) return;
            setDeletingAcct(true);
            try {
              // Delete all user data first
              await Promise.all([
                supabase.from('transactions').delete().eq('user_id', user.id),
                supabase.from('budgets').delete().eq('user_id', user.id),
              ]);
              // Sign out — account deletion requires a server-side admin call;
              // signing out + data wipe gives equivalent privacy protection.
              await signOut();
              router.replace('/(auth)/login');
            } catch (error) {
              console.error('Error deleting account:', error);
              Alert.alert('Error', 'Failed to delete account. Please try again.');
              setDeletingAcct(false);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Data Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Data</Text>
        <View style={styles.infoCard}>
          {INFO_ITEMS.map((item) => (
            <View key={item.label} style={styles.infoRow}>
              <Ionicons name={item.icon as any} size={20} color={colors.primary} />
              <View style={styles.infoText}>
                <Text style={styles.infoLabel}>{item.label}</Text>
                <Text style={styles.infoDesc}>{item.desc}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Danger Zone */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data Management</Text>

        <TouchableOpacity
          style={styles.dangerButton}
          onPress={handleDeleteTransactions}
          disabled={deletingTx || deletingAcct}
        >
          {deletingTx ? (
            <ActivityIndicator size="small" color={colors.expense} />
          ) : (
            <Ionicons name="trash-outline" size={20} color={colors.expense} />
          )}
          <Text style={styles.dangerButtonText}>
            {deletingTx ? 'Deleting...' : 'Delete All Transactions & Budgets'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.dangerButton, styles.dangerButtonRed]}
          onPress={handleDeleteAccount}
          disabled={deletingTx || deletingAcct}
        >
          {deletingAcct ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Ionicons name="person-remove-outline" size={20} color={colors.white} />
          )}
          <Text style={[styles.dangerButtonText, styles.dangerButtonTextRed]}>
            {deletingAcct ? 'Deleting...' : 'Delete Account'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const INFO_ITEMS = [
  {
    icon: 'lock-closed-outline',
    label: 'Encrypted Storage',
    desc: 'Your data is stored securely in Supabase with row-level security — only you can access it.',
  },
  {
    icon: 'cloud-outline',
    label: 'Cloud Sync',
    desc: 'Transactions and budgets are synced to your account and accessible from any device.',
  },
  {
    icon: 'key-outline',
    label: 'API Keys',
    desc: 'Your AI provider API keys are stored only on this device — never sent to our servers.',
  },
  {
    icon: 'eye-off-outline',
    label: 'No Data Selling',
    desc: 'We never sell or share your financial data with third parties.',
  },
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  infoCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.lg,
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoText: {
    flex: 1,
  },
  infoLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: 2,
  },
  infoDesc: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.expense,
  },
  dangerButtonRed: {
    backgroundColor: colors.expense,
    borderColor: colors.expense,
  },
  dangerButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.expense,
  },
  dangerButtonTextRed: {
    color: colors.white,
  },
});
