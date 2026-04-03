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

const FAQ: { q: string; a: string }[] = [
  {
    q: 'How do I scan a receipt?',
    a: 'Go to the Scan tab, tap the camera icon to take a photo or choose an image from your gallery. The AI will extract all transactions automatically.',
  },
  {
    q: 'Why is my receipt date showing today\'s date?',
    a: 'If the receipt doesn\'t have a visible date, FinSnap defaults to today\'s date. You can edit the date by tapping the transaction in the Transactions tab.',
  },
  {
    q: 'How do I add my own AI API key?',
    a: 'Go to Profile → AI Settings. You can enter your Google Gemini or OpenAI API key. Keys are stored securely on your device only.',
  },
  {
    q: 'Can I edit a transaction after it\'s saved?',
    a: 'Yes — tap any transaction on the Transactions tab to open the edit screen where you can change the type, description, amount, category, and date.',
  },
  {
    q: 'How do I set a budget?',
    a: 'Go to the Budget tab and tap "+ Add" to create a budget for any spending category. You can edit or delete budgets at any time.',
  },
  {
    q: 'What currencies are supported?',
    a: 'FinSnap supports 16 currencies. You can change your preferred currency in Profile → Edit Profile.',
  },
  {
    q: 'Is my data secure?',
    a: 'Yes — your transactions are stored in a secure database with row-level security. Your AI API keys are stored only on your device.',
  },
];

export default function HelpScreen() {
  const [expanded, setExpanded] = React.useState<number | null>(null);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Contact */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contact Us</Text>
        <TouchableOpacity
          style={styles.contactCard}
          onPress={() => Linking.openURL('mailto:support@finsnap.app')}
        >
          <Ionicons name="mail-outline" size={22} color={colors.primary} />
          <View style={styles.contactText}>
            <Text style={styles.contactLabel}>Email Support</Text>
            <Text style={styles.contactValue}>support@finsnap.app</Text>
          </View>
          <Ionicons name="open-outline" size={18} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* FAQ */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
        <View style={styles.faqContainer}>
          {FAQ.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.faqItem, index < FAQ.length - 1 && styles.faqBorder]}
              onPress={() => setExpanded(expanded === index ? null : index)}
              activeOpacity={0.7}
            >
              <View style={styles.faqHeader}>
                <Text style={styles.faqQuestion}>{item.q}</Text>
                <Ionicons
                  name={expanded === index ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={colors.textMuted}
                />
              </View>
              {expanded === index && (
                <Text style={styles.faqAnswer}>{item.a}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

// Need React for useState
import React from 'react';

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
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    gap: spacing.md,
  },
  contactText: {
    flex: 1,
  },
  contactLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  contactValue: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  faqContainer: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  faqItem: {
    padding: spacing.lg,
  },
  faqBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  faqQuestion: {
    flex: 1,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.text,
    lineHeight: 22,
  },
  faqAnswer: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    lineHeight: 20,
  },
});
