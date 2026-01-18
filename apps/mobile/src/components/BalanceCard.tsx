import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { formatCurrency } from '@finsnap/shared';
import { colors, borderRadius, fontSize, fontWeight, spacing } from '../constants/theme';

interface BalanceCardProps {
  totalIncome: number;
  totalExpenses: number;
}

export function BalanceCard({ totalIncome, totalExpenses }: BalanceCardProps) {
  const balance = totalIncome - totalExpenses;
  const balanceColor = balance >= 0 ? colors.income : colors.expense;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Current Balance</Text>
      <Text style={[styles.balance, { color: balanceColor }]}>
        {formatCurrency(balance)}
      </Text>
      <View style={styles.row}>
        <View style={styles.stat}>
          <View style={[styles.indicator, { backgroundColor: colors.income }]} />
          <View>
            <Text style={styles.statLabel}>Income</Text>
            <Text style={[styles.statValue, { color: colors.income }]}>
              +{formatCurrency(totalIncome)}
            </Text>
          </View>
        </View>
        <View style={styles.divider} />
        <View style={styles.stat}>
          <View style={[styles.indicator, { backgroundColor: colors.expense }]} />
          <View>
            <Text style={styles.statLabel}>Expenses</Text>
            <Text style={[styles.statValue, { color: colors.expense }]}>
              -{formatCurrency(totalExpenses)}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  label: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    textAlign: 'center',
  },
  balance: {
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.bold,
    textAlign: 'center',
    marginVertical: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  indicator: {
    width: 4,
    height: 32,
    borderRadius: borderRadius.sm,
  },
  statLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
  },
  statValue: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    marginTop: spacing.xs,
  },
  divider: {
    width: 1,
    backgroundColor: colors.border,
  },
});
