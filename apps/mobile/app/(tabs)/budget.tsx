import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { supabase } from '../../src/lib/supabase';
import {
  Budget,
  Transaction,
  CATEGORY_LABELS,
  CATEGORY_ICONS,
  formatCurrency,
  getStartOfMonth,
  getEndOfMonth,
  calculatePercentage,
} from '@finsnap/shared';
import { colors, fontSize, fontWeight, spacing, borderRadius } from '../../src/constants/theme';

interface BudgetWithSpent extends Budget {
  spent: number;
}

export default function BudgetScreen() {
  const { user } = useAuth();
  const [budgets, setBudgets] = useState<BudgetWithSpent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBudgets = async () => {
    if (!user) return;

    try {
      // Fetch budgets
      const { data: budgetData, error: budgetError } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user.id);

      if (budgetError) throw budgetError;

      // Fetch this month's expenses
      const startOfMonth = getStartOfMonth().toISOString();
      const endOfMonth = getEndOfMonth().toISOString();

      const { data: transactions, error: txError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'expense')
        .gte('date', startOfMonth)
        .lte('date', endOfMonth);

      if (txError) throw txError;

      // Calculate spent amount per category
      const spentByCategory: Record<string, number> = {};
      (transactions || []).forEach((tx: Transaction) => {
        spentByCategory[tx.category] = (spentByCategory[tx.category] || 0) + tx.amount;
      });

      // Merge budget with spent
      const budgetsWithSpent: BudgetWithSpent[] = (budgetData || []).map((budget) => ({
        ...budget,
        spent: spentByCategory[budget.category] || 0,
      }));

      setBudgets(budgetsWithSpent);
    } catch (error) {
      console.error('Error fetching budgets:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchBudgets();
    }, [user])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchBudgets();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary}
        />
      }
    >
      <Text style={styles.title}>Monthly Budgets</Text>
      <Text style={styles.subtitle}>Track your spending against budgets</Text>

      {budgets.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No budgets set</Text>
          <Text style={styles.emptySubtext}>
            Set up budgets to track your spending by category
          </Text>
        </View>
      ) : (
        budgets.map((budget) => {
          const percentage = calculatePercentage(budget.spent, budget.amount);
          const isOverBudget = budget.spent > budget.amount;
          const remaining = Math.max(0, budget.amount - budget.spent);

          return (
            <View key={budget.id} style={styles.budgetCard}>
              <View style={styles.budgetHeader}>
                <View style={styles.budgetInfo}>
                  <Text style={styles.categoryIcon}>
                    {CATEGORY_ICONS[budget.category] || '📌'}
                  </Text>
                  <Text style={styles.categoryName}>
                    {CATEGORY_LABELS[budget.category] || budget.category}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.budgetStatus,
                    { color: isOverBudget ? colors.expense : colors.textSecondary },
                  ]}
                >
                  {isOverBudget ? 'Over budget!' : `${formatCurrency(remaining)} left`}
                </Text>
              </View>

              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${Math.min(percentage, 100)}%`,
                        backgroundColor: isOverBudget ? colors.expense : colors.primary,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>{percentage}%</Text>
              </View>

              <View style={styles.budgetDetails}>
                <Text style={styles.spentText}>
                  Spent: <Text style={styles.spentAmount}>{formatCurrency(budget.spent)}</Text>
                </Text>
                <Text style={styles.budgetText}>
                  Budget: <Text style={styles.budgetAmount}>{formatCurrency(budget.amount)}</Text>
                </Text>
              </View>
            </View>
          );
        })
      )}
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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
  },
  emptySubtext: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  budgetCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  budgetInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  categoryIcon: {
    fontSize: 24,
  },
  categoryName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  budgetStatus: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
  progressText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
    width: 40,
    textAlign: 'right',
  },
  budgetDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  spentText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  spentAmount: {
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  budgetText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  budgetAmount: {
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
});
