import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, fontWeight, spacing, borderRadius } from '../src/constants/theme';

const APP_VERSION = '1.0.3';
const BUILD = '4';

const LINKS: { icon: string; label: string; url: string }[] = [
  { icon: 'document-text-outline', label: 'Terms of Service', url: 'https://finsnap.app/terms' },
  { icon: 'shield-checkmark-outline', label: 'Privacy Policy', url: 'https://finsnap.app/privacy' },
  { icon: 'logo-github', label: 'GitHub', url: 'https://github.com/finsnap' },
];

export default function AboutScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* App Identity */}
      <View style={styles.appHeader}>
        <View style={styles.appIcon}>
          <Ionicons name="cash" size={48} color={colors.primary} />
        </View>
        <Text style={styles.appName}>FinSnap</Text>
        <Text style={styles.appTagline}>AI-powered expense tracking</Text>
        <Text style={styles.appVersion}>Version {APP_VERSION} (Build {BUILD})</Text>
      </View>

      {/* Description */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.card}>
          <Text style={styles.description}>
            FinSnap helps you track your income and expenses effortlessly. Simply scan a receipt or bank statement and let AI extract the transactions for you. Set budgets, view spending trends, and stay in control of your finances.
          </Text>
        </View>
      </View>

      {/* Links */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Legal & Links</Text>
        <View style={styles.card}>
          {LINKS.map((link, i) => (
            <TouchableOpacity
              key={link.label}
              style={[styles.linkRow, i < LINKS.length - 1 && styles.linkBorder]}
              onPress={() => Linking.openURL(link.url)}
            >
              <Ionicons name={link.icon as any} size={20} color={colors.primary} />
              <Text style={styles.linkLabel}>{link.label}</Text>
              <Ionicons name="open-outline" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <Text style={styles.footer}>Made with ❤️ — FinSnap © {new Date().getFullYear()}</Text>
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
  appHeader: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  appIcon: {
    width: 96,
    height: 96,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  appName: {
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  appTagline: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  appVersion: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: spacing.sm,
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
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  description: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    lineHeight: 22,
    padding: spacing.lg,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  linkBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  linkLabel: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.text,
    fontWeight: fontWeight.medium,
  },
  footer: {
    textAlign: 'center',
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: spacing.md,
  },
});
