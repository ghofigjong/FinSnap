import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/contexts/AuthContext';
import { supabase } from '../../src/lib/supabase';
import { TransactionCard } from '../../src/components';
import {
  Transaction,
  TransactionCategory,
  TransactionType,
  CATEGORY_LABELS,
  CATEGORY_ICONS,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
} from '@finsnap/shared';
import { useCurrency } from '../../src/contexts/CurrencyContext';
import { colors, fontSize, fontWeight, spacing, borderRadius } from '../../src/constants/theme';

type FilterType = 'all' | 'income' | 'expense';

interface EditState {
  transaction: Transaction;
  description: string;
  amount: string;
  category: TransactionCategory;
  type: TransactionType;
}

export default function TransactionsScreen() {
  const { user } = useAuth();
  const { currency } = useCurrency();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [editState, setEditState] = useState<EditState | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchTransactions = async () => {
    if (!user) return;

    try {
      let query = supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('type', filter);
      }

      const { data, error } = await query.limit(50);

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchTransactions();
    }, [user, filter])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTransactions();
    setRefreshing(false);
  };

  const openEdit = (t: Transaction) => {
    setEditState({
      transaction: t,
      description: t.description,
      amount: String(t.amount),
      category: t.category,
      type: t.type,
    });
  };

  const saveEdit = async () => {
    if (!editState) return;
    const amount = parseFloat(editState.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase
        .from('transactions')
        .update({
          description: editState.description.trim() || editState.transaction.description,
          amount,
          category: editState.category,
          type: editState.type,
        })
        .eq('id', editState.transaction.id);
      if (error) throw error;
      setEditState(null);
      fetchTransactions();
    } catch (e: any) {
      console.error('Update error:', e.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteTransaction = async (id: string) => {
    try {
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (error) throw error;
      setEditState(null);
      fetchTransactions();
    } catch (e: any) {
      console.error('Delete error:', e.message);
    }
  };

  const FilterButton = ({ type, label }: { type: FilterType; label: string }) => (
    <TouchableOpacity
      style={[styles.filterButton, filter === type && styles.filterButtonActive]}
      onPress={() => setFilter(type)}
    >
      <Text style={[styles.filterText, filter === type && styles.filterTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.filterContainer}>
        <FilterButton type="all" label="All" />
        <FilterButton type="income" label="Income" />
        <FilterButton type="expense" label="Expenses" />
      </View>

      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TransactionCard transaction={item} onPress={() => openEdit(item)} />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={64} color={colors.textMuted} />
            <Text style={styles.emptyText}>No transactions found</Text>
            <Text style={styles.emptySubtext}>
              Your transactions will appear here
            </Text>
          </View>
        }
      />

      {/* Edit Modal */}
      <Modal
        visible={!!editState}
        transparent
        animationType="slide"
        onRequestClose={() => setEditState(null)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Transaction</Text>
              <View style={styles.modalHeaderActions}>
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => {
                    if (!editState) return;
                    setEditState(null);
                    deleteTransaction(editState.transaction.id);
                  }}
                >
                  <Ionicons name="trash-outline" size={20} color={colors.expense} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setEditState(null)}>
                  <Ionicons name="close" size={24} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
            </View>

            {editState && (
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Type toggle */}
                <View style={styles.typeToggle}>
                  {(['expense', 'income'] as TransactionType[]).map(t => (
                    <TouchableOpacity
                      key={t}
                      style={[styles.typeBtn, editState.type === t && (t === 'expense' ? styles.typeBtnExpense : styles.typeBtnIncome)]}
                      onPress={() => setEditState(s => s ? { ...s, type: t, category: t === 'income' ? 'salary' : 'food' } : s)}
                    >
                      <Text style={[styles.typeBtnText, editState.type === t && styles.typeBtnTextActive]}>
                        {t === 'expense' ? 'Expense' : 'Income'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Description */}
                <Text style={styles.fieldLabel}>Description</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={editState.description}
                  onChangeText={v => setEditState(s => s ? { ...s, description: v } : s)}
                  placeholder="Description"
                  placeholderTextColor={colors.textMuted}
                />

                {/* Amount */}
                <Text style={styles.fieldLabel}>Amount</Text>
                <TextInput
                  style={[styles.fieldInput, !Number.isFinite(parseFloat(editState.amount)) || parseFloat(editState.amount) <= 0 ? styles.fieldInputError : null]}
                  value={editState.amount}
                  onChangeText={v => setEditState(s => s ? { ...s, amount: v } : s)}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor={colors.textMuted}
                />

                {/* Category */}
                <Text style={styles.fieldLabel}>Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                  {[...(editState.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES)].map(cat => (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.categoryChip, editState.category === cat && styles.categoryChipSelected]}
                      onPress={() => setEditState(s => s ? { ...s, category: cat as TransactionCategory } : s)}
                    >
                      <Text style={styles.categoryChipIcon}>{CATEGORY_ICONS[cat]}</Text>
                      <Text style={[styles.categoryChipText, editState.category === cat && styles.categoryChipTextSelected]}>
                        {CATEGORY_LABELS[cat]}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <TouchableOpacity
                  style={[styles.saveBtn, saving && { opacity: 0.6 }]}
                  onPress={saveEdit}
                  disabled={saving}
                >
                  {saving
                    ? <ActivityIndicator color={colors.white} size="small" />
                    : <Text style={styles.saveBtnText}>Save Changes</Text>
                  }
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  filterContainer: {
    flexDirection: 'row',
    padding: spacing.md,
    gap: spacing.sm,
  },
  filterButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: colors.card,
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
  },
  filterText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  filterTextActive: {
    color: colors.white,
  },
  listContent: {
    padding: spacing.md,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  emptySubtext: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editRowBtn: {
    padding: spacing.sm,
    marginLeft: spacing.xs,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalSheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  modalHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  deleteBtn: {
    padding: spacing.xs,
  },
  typeToggle: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  typeBtnExpense: {
    borderColor: colors.expense,
    backgroundColor: colors.backgroundSecondary,
  },
  typeBtnIncome: {
    borderColor: colors.income,
    backgroundColor: colors.backgroundSecondary,
  },
  typeBtnText: {
    color: colors.textSecondary,
    fontWeight: '600',
    fontSize: fontSize.sm,
  },
  typeBtnTextActive: {
    color: colors.text,
  },
  fieldLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: '600',
    marginBottom: spacing.xs,
    marginTop: spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fieldInput: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.text,
    fontSize: fontSize.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  fieldInputError: {
    borderColor: colors.expense,
  },
  categoryScroll: {
    marginBottom: spacing.xs,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.card,
    borderRadius: borderRadius.full,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    marginRight: spacing.xs,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  categoryChipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.backgroundSecondary,
  },
  categoryChipIcon: {
    fontSize: 14,
  },
  categoryChipText: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    fontWeight: '500',
  },
  categoryChipTextSelected: {
    color: colors.primary,
    fontWeight: '700',
  },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  saveBtnText: {
    color: colors.white,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
});
