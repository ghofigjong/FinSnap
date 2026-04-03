import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Modal,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { supabase } from '../../src/lib/supabase';
import { apiRequest } from '../../src/lib/api';
import { Button } from '../../src/components';
import { ScannedLineItem, ScanResult, formatCurrency, CATEGORY_LABELS, CATEGORY_ICONS, EXPENSE_CATEGORIES, INCOME_CATEGORIES, TransactionCategory } from '@finsnap/shared';
import { getAISettings, isAISettingsConfigured, getApiKeyForProvider, AISettings } from '../../src/lib/aiSettings';
import { analyzeWithMLKit } from '../../src/lib/mlkitOcr';
import { useCurrency } from '../../src/contexts/CurrencyContext';
import { colors, fontSize, fontWeight, spacing, borderRadius } from '../../src/constants/theme';

interface EditableItem extends ScannedLineItem {
  key: number;
  selected: boolean;
  editDescription: string;
  editAmount: string;
  editCategory: TransactionCategory;
  isEditing: boolean;
}

function isTotal(item: ScannedLineItem): boolean {
  return /\btotal\b/i.test(item.description);
}

function buildEditableItems(items: ScannedLineItem[]): EditableItem[] {
  const hasTotals = items.some(isTotal);
  return items.map((item, i) => ({
    ...item,
    key: i,
    // Auto-deselect: line items when a total exists, or items with zero amount
    selected: Math.abs(item.amount) > 0 && (hasTotals ? isTotal(item) : true),
    editDescription: item.description,
    editAmount: Math.abs(item.amount) > 0 ? String(Math.abs(item.amount)) : '',
    editCategory: item.category,
    isEditing: Math.abs(item.amount) === 0, // open editor immediately if amount unknown
  }));
}

export default function ScanScreen() {
  const { session } = useAuth();
  const { currency } = useCurrency();
  const [image, setImage] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [editableItems, setEditableItems] = useState<EditableItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [aiSettings, setAiSettings] = useState<AISettings | null>(null);

  useFocusEffect(
    useCallback(() => {
      getAISettings().then(setAiSettings);
    }, [])
  );

  const toggleSelect = (key: number) =>
    setEditableItems(prev => prev.map(i => i.key === key ? { ...i, selected: !i.selected } : i));

  const startEdit = (key: number) =>
    setEditableItems(prev => prev.map(i => i.key === key ? { ...i, isEditing: true } : i));

  const confirmEdit = (key: number) =>
    setEditableItems(prev => prev.map(i => i.key === key ? { ...i, isEditing: false } : i));

  const updateField = (key: number, field: 'editDescription' | 'editAmount', text: string) =>
    setEditableItems(prev => prev.map(i => i.key === key ? { ...i, [field]: text } : i));

  const updateCategory = (key: number, cat: TransactionCategory) =>
    setEditableItems(prev => prev.map(i => i.key === key ? { ...i, editCategory: cat } : i));

  const pickImage = async (useCamera: boolean) => {
    const permission = useCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permission.status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant access to continue');
      return;
    }

    const result = useCamera
      ? await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          quality: 0.5,
          base64: true,
        })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          quality: 0.5,
          base64: true,
        });

    if (!result.canceled && result.assets[0]) {
      setImage(result.assets[0].uri);
      setEditableItems([]);
      scanImage(result.assets[0].base64!, result.assets[0].uri);
    }
  };

  const scanImage = async (base64: string, uri: string) => {
    if (!session?.access_token) {
      Alert.alert('Error', 'Please sign in to scan receipts');
      return;
    }

    const settings = await getAISettings();

    if (!isAISettingsConfigured(settings)) {
      Alert.alert(
        'AI Not Configured',
        'Please set up your AI provider and API key in Settings before scanning.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Go to Settings', onPress: () => router.push('/settings') },
        ]
      );
      return;
    }

    setScanning(true);
    try {
      // OCR runs on-device via Google ML Kit — no server call needed
      if (settings.provider === 'ocr') {
        const items = await analyzeWithMLKit(uri);
        setEditableItems(buildEditableItems(items));
        return;
      }

      const response = await apiRequest<ScanResult>('/api/scan', {
        method: 'POST',
        body: {
          image: base64,
          provider: settings.provider,
          apiKey: getApiKeyForProvider(settings),
          geminiModel: settings.geminiModel,
        },
        token: session.access_token,
      });

      if (response.success && response.items) {
        setEditableItems(buildEditableItems(response.items));
      } else {
        Alert.alert('Scan Failed', response.error || 'Could not extract items from image');
      }
    } catch (error: any) {
      if (error?.status === 429) {
        Alert.alert(
          'Daily Limit Reached',
          error.message,
          [
            { text: 'Use My Own Key', onPress: () => router.push('/settings') },
            { text: 'Upgrade to Pro', onPress: () => router.push('/settings') },
            { text: 'Cancel', style: 'cancel' },
          ]
        );
      } else {
        Alert.alert('Error', error.message || 'Failed to scan image');
      }
    } finally {
      setScanning(false);
    }
  };

  const saveTransactions = async () => {
    const selected = editableItems.filter(i => i.selected);
    if (!session?.user?.id || selected.length === 0) return;

    // Validate amounts before hitting the DB
    const invalid = selected.filter(i => {
      const v = parseFloat(i.editAmount);
      return !Number.isFinite(v) || v <= 0;
    });
    if (invalid.length > 0) {
      Alert.alert(
        'Invalid Amount',
        `${invalid.length} item${invalid.length > 1 ? 's have' : ' has'} an amount of 0 or invalid. Please edit ${invalid.length > 1 ? 'them' : 'it'} before saving.`
      );
      return;
    }

    setSaving(true);
    try {
      const transactions = selected.map((item) => ({
        user_id: session.user.id,
        amount: Math.abs(parseFloat(item.editAmount)),
        type: item.type,
        category: item.editCategory,
        description: item.editDescription.trim() || item.description,
        merchant: item.merchant || null,
        date: item.date,
      }));

      const { error } = await supabase.from('transactions').insert(transactions);

      if (error) throw error;

      Alert.alert('Success', `${selected.length} transaction${selected.length !== 1 ? 's' : ''} saved!`, [
        { text: 'OK', onPress: () => router.push('/(tabs)/transactions') },
      ]);

      setImage(null);
      setEditableItems([]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save transactions');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {!image ? (
        <View style={styles.uploadSection}>
          <Text style={styles.title}>Scan Receipt or Statement</Text>
          <Text style={styles.subtitle}>
            Take a photo or upload an image to automatically extract transactions
          </Text>

          <View style={styles.optionsContainer}>
            <TouchableOpacity
              style={styles.option}
              onPress={() => pickImage(true)}
            >
              <View style={styles.optionIcon}>
                <Ionicons name="camera" size={32} color={colors.primary} />
              </View>
              <Text style={styles.optionTitle}>Take Photo</Text>
              <Text style={styles.optionSubtitle}>Use camera to capture</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.option}
              onPress={() => pickImage(false)}
            >
              <View style={styles.optionIcon}>
                <Ionicons name="images" size={32} color={colors.primary} />
              </View>
              <Text style={styles.optionTitle}>Upload Image</Text>
              <Text style={styles.optionSubtitle}>Choose from gallery</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.resultsSection}>
          <Image source={{ uri: image }} style={styles.previewImage} />

          {scanning ? (
            <View style={styles.scanningContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.scanningText}>Analyzing image with AI...</Text>
            </View>
          ) : editableItems.length > 0 ? (
            <>
              <View style={styles.resultsTitleRow}>
                <Text style={styles.resultsTitle}>
                  {editableItems.filter(i => i.selected).length} of {editableItems.length} selected
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    const allSelected = editableItems.every(i => i.selected);
                    setEditableItems(prev => prev.map(i => ({ ...i, selected: !allSelected })));
                  }}
                >
                  <Text style={styles.selectAllText}>
                    {editableItems.every(i => i.selected) ? 'Deselect All' : 'Select All'}
                  </Text>
                </TouchableOpacity>
              </View>

              {editableItems.map((item) => (
                <View key={item.key} style={[styles.resultItem, item.selected && styles.resultItemSelected]}>
                  {item.isEditing ? (
                    <View style={styles.editRow}>
                      <TextInput
                        style={styles.editInput}
                        value={item.editDescription}
                        onChangeText={t => updateField(item.key, 'editDescription', t)}
                        placeholder="Description"
                        placeholderTextColor={colors.textMuted}
                      />
                      <View style={styles.editAmountRow}>
                        <TextInput
                          style={[styles.editInput, styles.editAmountInput]}
                          value={item.editAmount}
                          onChangeText={t => updateField(item.key, 'editAmount', t)}
                          keyboardType="decimal-pad"
                          placeholder="0.00"
                          placeholderTextColor={colors.textMuted}
                        />
                        <TouchableOpacity style={styles.confirmBtn} onPress={() => confirmEdit(item.key)}>
                          <Ionicons name="checkmark" size={20} color={colors.white} />
                        </TouchableOpacity>
                      </View>
                      {/* Category picker */}
                      <Text style={styles.editLabel}>Category</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                        {[...(item.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES)].map(cat => (
                          <TouchableOpacity
                            key={cat}
                            style={[
                              styles.categoryChip,
                              item.editCategory === cat && styles.categoryChipSelected,
                            ]}
                            onPress={() => updateCategory(item.key, cat as TransactionCategory)}
                          >
                            <Text style={styles.categoryChipIcon}>{CATEGORY_ICONS[cat]}</Text>
                            <Text style={[
                              styles.categoryChipText,
                              item.editCategory === cat && styles.categoryChipTextSelected,
                            ]}>{CATEGORY_LABELS[cat]}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.resultRow}
                      onPress={() => toggleSelect(item.key)}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={item.selected ? 'checkbox' : 'square-outline'}
                        size={22}
                        color={item.selected ? colors.primary : colors.textMuted}
                      />
                      <View style={styles.resultLeft}>
                        <Text style={styles.resultDescription}>{item.editDescription}</Text>
                        <Text style={styles.resultCategory}>
                          {CATEGORY_ICONS[item.editCategory]} {CATEGORY_LABELS[item.editCategory] || item.editCategory}
                          {item.merchant ? ` • ${item.merchant}` : ''}
                        </Text>
                      </View>
                      <Text style={[
                        styles.resultAmount,
                        { color: item.type === 'income' ? colors.income : colors.expense },
                      ]}>
                        {item.type === 'income' ? '+' : '-'}
                        {formatCurrency(Math.abs(parseFloat(item.editAmount) || item.amount), currency)}
                      </Text>
                      <TouchableOpacity
                        style={styles.editBtn}
                        onPress={() => startEdit(item.key)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons name="pencil-outline" size={16} color={colors.textMuted} />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  )}
                </View>
              ))}

              <View style={styles.actions}>
                <Button
                  title={`Save Selected (${editableItems.filter(i => i.selected).length})`}
                  onPress={saveTransactions}
                  loading={saving}
                  disabled={editableItems.filter(i => i.selected).length === 0}
                />
                <Button
                  title="Scan Another"
                  variant="outline"
                  onPress={() => {
                    setImage(null);
                    setEditableItems([]);
                  }}
                />
              </View>
            </>
          ) : (
            <View style={styles.noResults}>
              <Text style={styles.noResultsText}>No transactions found</Text>
              <Button
                title="Try Again"
                variant="outline"
                onPress={() => {
                  setImage(null);
                  setEditableItems([]);
                }}
              />
            </View>
          )}
        </View>
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
  uploadSection: {
    flex: 1,
    alignItems: 'center',
    paddingTop: spacing.xxl,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xxl,
  },
  optionsContainer: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  option: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    alignItems: 'center',
  },
  optionIcon: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.full,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  optionTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  optionSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  resultsSection: {
    flex: 1,
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
  },
  scanningContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  scanningText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  resultsTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  resultsTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  selectAllText: {
    color: colors.primary,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  resultItem: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  resultItemSelected: {
    borderColor: colors.primary,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.sm,
  },
  resultLeft: {
    flex: 1,
  },
  editRow: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  editInput: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.text,
    fontSize: fontSize.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  editAmountRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  editAmountInput: {
    flex: 1,
  },
  confirmBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBtn: {
    padding: spacing.xs,
  },
  editLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
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
  resultDescription: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  resultCategory: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textTransform: 'capitalize',
  },
  resultAmount: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
  actions: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  noResults: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.md,
  },
  noResultsText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
});
