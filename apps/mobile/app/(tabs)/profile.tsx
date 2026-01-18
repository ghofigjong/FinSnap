import { View, Text, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/contexts/AuthContext';
import { Button } from '../../src/components';
import { colors, fontSize, fontWeight, spacing, borderRadius } from '../../src/constants/theme';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              router.replace('/(auth)/login');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to sign out');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={48} color={colors.textMuted} />
        </View>
        <Text style={styles.name}>{user?.user_metadata?.full_name || 'User'}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>

        <View style={styles.menuItem}>
          <Ionicons name="person-outline" size={24} color={colors.textSecondary} />
          <Text style={styles.menuText}>Edit Profile</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </View>

        <View style={styles.menuItem}>
          <Ionicons name="notifications-outline" size={24} color={colors.textSecondary} />
          <Text style={styles.menuText}>Notifications</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </View>

        <View style={styles.menuItem}>
          <Ionicons name="shield-outline" size={24} color={colors.textSecondary} />
          <Text style={styles.menuText}>Privacy & Security</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App</Text>

        <View style={styles.menuItem}>
          <Ionicons name="help-circle-outline" size={24} color={colors.textSecondary} />
          <Text style={styles.menuText}>Help & Support</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </View>

        <View style={styles.menuItem}>
          <Ionicons name="information-circle-outline" size={24} color={colors.textSecondary} />
          <Text style={styles.menuText}>About</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </View>
      </View>

      <View style={styles.signOutContainer}>
        <Button
          title="Sign Out"
          variant="outline"
          onPress={handleSignOut}
          icon={<Ionicons name="log-out-outline" size={20} color={colors.primary} />}
        />
      </View>

      <Text style={styles.version}>FinSnap v1.0.0</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: borderRadius.full,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  name: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  email: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  menuText: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.text,
  },
  signOutContainer: {
    marginTop: 'auto',
    marginBottom: spacing.md,
  },
  version: {
    textAlign: 'center',
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
});
