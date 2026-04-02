import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { useCurrency } from '../../src/contexts/CurrencyContext';
import { supabase } from '../../src/lib/supabase';
import {
  Budget,
  Transaction,
  TransactionCategory,
  CATEGORY_LABELS,
  CATEGORY_ICONS,
  EXPENSE_CATEGORIES,
  formatCurrency,
  getStartOfMonth,
  getEndOfMonth,
  calculatePercentage,
} from '@finsnap/shared';
import { colors, fontSize, fontWeight, spacing, borderRadius } from '../../src/constants/theme';

interface BudgetWithSpent extends Budget {
  spent: number;
}

const BUDGET_CATEGORIES = EXPENSE_CATEGORIES as unknown as TransactionCategory[];

export default function BudgetScreen() {
  const { user } = useAuth();
  const { currency } = useCurrency();
  const [budgets, setBudgets] = useState<BudgetWithSpent[]>([]);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState<BudgetWithSpent | null>(null);
  const [modalCategory, setModalCategory] = useState<TransactionCategory>('food');
  const [modalAmount, setModalAmount] = useState('');
  const [saving, setSaving] = useState(false);

  const today = new Date();
  const monthLabel = today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const asOfLabel = today.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  const fetchData = async () => {
    if (!user) return;
    try {
      const { data: budgetData, error: budgetError } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user.id);

      if (budgetError) throw budgetError;

      const startOfMonth = getStartOfMonth().toISOString();
      const endOfMonth = getEndOfMonth().toISOString();

      const { data: transactions, error: txError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', startOfMonth)
        .lte('date', endOfMonth);

      if (txError) throw txError;

      const txList: Transaction[] = transactions || [];
      let income = 0;
      let expenses = 0;
      const spentByCategory: Record<string, number> = {};

      txList.forEach((tx) => {
        if (tx.type === 'income') {
          income += tx.amount;
        } else {
          expenses += tx.amount;
          spentByCategory[tx.category] = (spentByCategory[tx.category] || 0) + tx.amount;
        }
      });

      setTotalIncome(income);
      setTotalExpenses(expenses);

      const budgetsWithSpent: BudgetWithSpent[] = (budgetData || []).map((budget) => ({
        ...budget,
        spent: spentByCategory[budget.category] || 0,
      }));

      setBudgets(budgetsWithSpent);
    } catch (error) {
      console.error('Error fetching budget data:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [user])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const openAdd = () => {
    setEditingBudget(null);
    setModalCategory('food');
    setModalAmount('');
    setShowModal(true);
  };

  const openEdit = (budget: BudgetWithSpent) => {
    setEditingBudget(budget);
    setModalCategory(budget.category);
    setModalAmount(String(budget.amount));
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingBudget(null);
  };

  const saveBudget = async () => {
    const amount = parseFloat(modalAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      Alert.alert('Invalid amount', 'Please enter a valid amount greater than 0.');
      return;
    }
    if (!user) return;
    setSaving(true);
    try {
      if (editingBudget) {
        const { error } = await supabase
          .from('budgets')
          .update({ category: modalCategory, amount, updated_at: new Date().toISOString() })
          .eq('id', editingBudget.id);
        if (error) throw error;
      } else {
        const existing = budgets.find((b) => b.category === modalCategory);
        if (existing) {
          Alert.alert(
            'Budget exists',
            `You already have a budget for ${CATEGORY_LABELS[modalCategory]}. Tap ✏️ on that card to edit it.`
          );
          setSaving(false);
          return;
        }
        const { error } = await supabase.from('budgets').insert({
          user_id: user.id,
          category: modalCategory,
          amount,
          period: 'monthly',
          start_date: getStartOfMonth().toISOString().split('T')[0],
        });
        if (error) throw error;
      }
      closeModal();
      await fetchData();
    } catch (error) {
      console.error('Error saving budget:', error);
      Alert.alert('Error', 'Failed to save budget. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const deleteBudget = () => {
    if (!editingBudget) return;
    Alert.alert(
      'Delete Budget',
      `Delete the ${CATEGORY_LABELS[editingBudget.category]} budget?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase.from('budgets').delete().eq('id', editingBudget.id);
              if (error) throw error;
              closeModal();
              await fetchData();
            } catch (error) {
              console.error('Error deleting budget:', error);
              Alert.alert('Error', 'Failed to delete budget.');
            }
          },
        },
      ]
    );
  };

  const net = totalIncome - totalExpenses;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Net Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryMonth}>{monthLabel}</Text>
            <Text style={styles.summaryAsOf}>As of {asOfLabel}</Text>
          </View>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Income</Text>
              <Text style={[styles.summaryAmount, { color: colors.income }]}>
                {formatCurrency(totalIncome, currency)}
              </Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Expenses</Text>
              <Text style={[styles.summaryAmount, { color: colors.expense }]}>
                {formatCurrency(totalExpenses, currency)}
              </Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Net</Text>
              <Text style={[styles.summaryAmount, { color: net >= 0 ? colors.income : colors.expense }]}>
                {net >= 0 ? '+' : ''}{formatCurrency(net, currency)}
              </Text>
            </View>
          </View>
        </View>

        {/* Section Header */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.title}>Monthly Budgets</Text>
            <Text style={styles.subtitle}>Track your spending by category</Text>
          </View>
          <TouchableOpacity style={styles.addButton} onPress={openAdd}>
            <Text style={styles.addButtonText}>+ Add</Text>
          </TouchableOpacity>
        </View>

        {budgets.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No budgets set</Text>
            <Text style={styles.emptySubtext}>Tap "+ Add" to create your first budget</Text>
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
                  <View style={styles.budgetHeaderRight}>
                    <Text
                      style={[
                        styles.budgetStatus,
                        { color: isOverBudget ? colors.expense : colors.textSecondary },
                      ]}
                    >
                      {isOverBudget ? 'Over budget!' : `${formatCurrency(remaining, currency)} left`}
                    </Text>
                    <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(budget)}>
                      <Text style={styles.editBtnIcon}>✏️</Text>
                    </TouchableOpacity>
                  </View>
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
                    Spent: <Text style={styles.spentAmount}>{formatCurrency(budget.spent, currency)}</Text>
                  </Text>
                  <Text style={styles.budgetText}>
                    Budget: <Text style={styles.budgetAmount}>{formatCurrency(budget.amount, currency)}</Text>
                  </Text>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Add / Edit Budget Modal */}
      <Modal visible={showModal} transparent animationType="slide" onRequestClose={closeModal}>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingBudget ? 'Edit Budget' : 'Add Budget'}</Text>
              {editingBudget && (
                <TouchableOpacity onPress={deleteBudget} style={styles.deleteBtn}>
                  <Text style={styles.deleteBtnIcon}>🗑️</Text>
                </TouchableOpacity>
              )}
            </View>

            <Text style={styles.fieldLabel}>Category</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoryScroll}
              contentContainerStyle={styles.categoryScrollContent}
            >
              {BUDGET_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.categoryChip, modalCategory === cat && styles.categoryChipActive]}
                  onPress={() => setModalCategory(cat)}
                >
                  <Text style={styles.categoryChipEmoji}>{CATEGORY_ICONS[cat]}</Text>
                  <Text
                    style={[
                      styles.categoryChipText,
                      modalCategory === cat && styles.categoryChipTextActive,
                    ]}
                  >
                    {CATEGORY_LABELS[cat]}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.fieldLabel}>Monthly Budget Amount</Text>
            <TextInput
              style={styles.amountInput}
              value={modalAmount}
              onChangeText={setModalAmount}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor={colors.textMuted}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={closeModal}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={saveBudget} disabled={saving}>
                <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
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

  // Summary card
  summaryCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  summaryHeader: {
    marginBottom: spacing.md,
  },
  summaryMonth: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  summaryAsOf: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryAmount: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
  summaryDivider: {
    width: 1,
    height: 36,
    backgroundColor: colors.border,
  },

  // Section header
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  addButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
  },
  addButtonText: {
    color: colors.white,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },

  // Empty state
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

  // Budget card
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
  budgetHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
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
  editBtn: {
    padding: spacing.xs,
  },
  editBtnIcon: {
    fontSize: 16,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: colors.card,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  deleteBtn: {
    padding: spacing.xs,
  },
  deleteBtnIcon: {
    fontSize: 20,
  },
  fieldLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  categoryScroll: {
    marginBottom: spacing.lg,
  },
  categoryScrollContent: {
    gap: spacing.sm,
    paddingRight: spacing.md,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.backgroundSecondary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryChipEmoji: {
    fontSize: 14,
  },
  categoryChipText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  categoryChipTextActive: {
    color: colors.white,
  },
  amountInput: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    fontSize: fontSize.xl,
    color: colors.text,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  cancelBtn: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  saveBtn: {
    flex: 2,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  saveBtnText: {
    color: colors.white,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
});
