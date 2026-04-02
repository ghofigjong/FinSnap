import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Transaction, CATEGORY_ICONS, formatCurrency, formatDate } from '@finsnap/shared';
import { colors, borderRadius, fontSize, fontWeight, spacing } from '../constants/theme';
import { useCurrency } from '../contexts/CurrencyContext';

interface TransactionCardProps {
  transaction: Transaction;
  onPress?: () => void;
}

export function TransactionCard({ transaction, onPress }: TransactionCardProps) {
  const { currency } = useCurrency();
  const isExpense = transaction.type === 'expense';
  const amountColor = isExpense ? colors.expense : colors.income;
  const amountPrefix = isExpense ? '-' : '+';

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>
          {CATEGORY_ICONS[transaction.category] || '📌'}
        </Text>
      </View>
      <View style={styles.details}>
        <Text style={styles.description} numberOfLines={1}>
          {transaction.description}
        </Text>
        <Text style={styles.merchant} numberOfLines={1}>
          {transaction.merchant || transaction.category}
        </Text>
      </View>
      <View style={styles.amountContainer}>
        <Text style={[styles.amount, { color: amountColor }]}>
          {amountPrefix}{formatCurrency(transaction.amount, currency)}
        </Text>
        <Text style={styles.date}>{formatDate(transaction.date)}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  icon: {
    fontSize: 24,
  },
  details: {
    flex: 1,
    marginRight: spacing.md,
  },
  description: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
  },
  merchant: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
    textTransform: 'capitalize',
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
  date: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
  },
});
