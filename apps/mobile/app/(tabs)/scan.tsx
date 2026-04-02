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
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { supabase } from '../../src/lib/supabase';
import { apiRequest } from '../../src/lib/api';
import { Button } from '../../src/components';
import { ScannedLineItem, ScanResult, formatCurrency } from '@finsnap/shared';
import { getAISettings, isAISettingsConfigured, getApiKeyForProvider, AISettings } from '../../src/lib/aiSettings';
import { useCurrency } from '../../src/contexts/CurrencyContext';
import { colors, fontSize, fontWeight, spacing, borderRadius } from '../../src/constants/theme';

export default function ScanScreen() {
  const { session } = useAuth();
  const { currency } = useCurrency();
  const [image, setImage] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [results, setResults] = useState<ScannedLineItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [aiSettings, setAiSettings] = useState<AISettings | null>(null);

  useFocusEffect(
    useCallback(() => {
      getAISettings().then(setAiSettings);
    }, [])
  );

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
          quality: 0.8,
          base64: true,
        })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          quality: 0.8,
          base64: true,
        });

    if (!result.canceled && result.assets[0]) {
      setImage(result.assets[0].uri);
      setResults([]);
      scanImage(result.assets[0].base64!);
    }
  };

  const scanImage = async (base64: string) => {
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
        setResults(response.items);
      } else {
        Alert.alert('Scan Failed', response.error || 'Could not extract items from image');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to scan image');
    } finally {
      setScanning(false);
    }
  };

  const saveTransactions = async () => {
    if (!session?.user?.id || results.length === 0) return;

    setSaving(true);
    try {
      const transactions = results.map((item) => ({
        user_id: session.user.id,
        amount: Math.abs(item.amount),
        type: item.type,
        category: item.category,
        description: item.description,
        merchant: item.merchant || null,
        date: item.date,
      }));

      const { error } = await supabase.from('transactions').insert(transactions);

      if (error) throw error;

      Alert.alert('Success', `${results.length} transactions saved!`, [
        { text: 'OK', onPress: () => router.push('/(tabs)/transactions') },
      ]);

      setImage(null);
      setResults([]);
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
          ) : results.length > 0 ? (
            <>
              <Text style={styles.resultsTitle}>
                Found {results.length} transaction{results.length > 1 ? 's' : ''}
              </Text>

              {results.map((item, index) => (
                <View key={index} style={styles.resultItem}>
                  <View style={styles.resultLeft}>
                    <Text style={styles.resultDescription}>{item.description}</Text>
                    <Text style={styles.resultCategory}>
                      {item.category} • {item.merchant || 'Unknown'}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.resultAmount,
                      { color: item.type === 'income' ? colors.income : colors.expense },
                    ]}
                  >
                    {item.type === 'income' ? '+' : '-'}
                    {formatCurrency(Math.abs(item.amount), currency)}
                  </Text>
                </View>
              ))}

              <View style={styles.actions}>
                <Button
                  title="Save All"
                  onPress={saveTransactions}
                  loading={saving}
                />
                <Button
                  title="Scan Another"
                  variant="outline"
                  onPress={() => {
                    setImage(null);
                    setResults([]);
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
                  setResults([]);
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
  resultsTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  resultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  resultLeft: {
    flex: 1,
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
