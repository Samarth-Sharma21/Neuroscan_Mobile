import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  Brain,
  Database,
  Shield,
  Info,
  ExternalLink,
  LogOut,
  ChevronRight,
  Cpu,
  Layers,
} from 'lucide-react-native';
import {
  Colors,
  Spacing,
  BorderRadius,
  FontSize,
  FontFamily,
  Shadows,
} from '../src/constants/theme';
import { useAuth } from '../src/contexts/AuthContext';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/auth' as any);
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.headerBack}>
          <ArrowLeft size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {/* About App */}
        <LinearGradient
          colors={['#0F766E', '#0D9488', '#14B8A6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.aboutCard}>
          <View style={styles.aboutOrb} />
          <View style={styles.aboutIcon}>
            <Brain size={32} color='#fff' />
          </View>
          <Text style={styles.aboutName}>NeuroScan</Text>
          <Text style={styles.aboutVersion}>Version 1.0.0</Text>
          <Text style={styles.aboutDesc}>
            AI-powered dementia detection using HUFA-Net deep learning
            architecture
          </Text>
        </LinearGradient>

        {/* Model Info */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Cpu size={18} color={Colors.primary} />
            <Text style={styles.sectionTitle}>AI Model</Text>
          </View>
          <InfoRow label='Architecture' value='HUFA-Net' />
          <InfoRow label='Accuracy' value='97.1%' />
          <InfoRow label='Classes' value='4 (Dementia stages)' />
          <InfoRow label='Backend' value='HF Spaces' />
        </View>

        {/* Infrastructure */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Database size={18} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Infrastructure</Text>
          </View>
          <InfoRow label='Database' value='Supabase (PostgreSQL)' />
          <InfoRow label='Auth' value='Supabase Auth' />
          <InfoRow label='Storage' value='Row Level Security' />
        </View>

        {/* Database Tables */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Layers size={18} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Database Tables</Text>
          </View>
          <TableItem
            name='neuroscan_profiles'
            desc='User profiles and account data'
          />
          <TableItem
            name='neuroscan_reports'
            desc='Scan reports, predictions & probabilities'
          />
        </View>

        {/* Account */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Shield size={18} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Account</Text>
          </View>
          <InfoRow label='Email' value={user?.email || 'N/A'} />
          <InfoRow
            label='Member since'
            value={new Date(user?.created_at || Date.now()).toLocaleDateString(
              'en-US',
              {
                month: 'short',
                year: 'numeric',
              },
            )}
          />
        </View>

        {/* Disclaimer */}
        <View style={styles.disclaimerCard}>
          <View style={styles.sectionHeader}>
            <Info size={18} color={Colors.warning} />
            <Text style={[styles.sectionTitle, { color: Colors.warning }]}>
              Disclaimer
            </Text>
          </View>
          <Text style={styles.disclaimerText}>
            NeuroScan is a research and educational tool. It is not intended for
            clinical diagnosis or medical decision-making. Always consult a
            qualified healthcare professional for medical advice.
          </Text>
        </View>

        {/* Sign Out */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleLogout}
          activeOpacity={0.8}>
          <LogOut size={20} color='#fff' />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function TableItem({ name, desc }: { name: string; desc: string }) {
  return (
    <View style={styles.tableItem}>
      <View style={styles.tableDot} />
      <View style={{ flex: 1 }}>
        <Text style={styles.tableName}>{name}</Text>
        <Text style={styles.tableDesc}>{desc}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: 14,
  },
  headerBack: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  headerTitle: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.lg,
    color: Colors.textPrimary,
  },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.xl, paddingBottom: 40 },

  /* About card */
  aboutCard: {
    borderRadius: BorderRadius.xl,
    padding: 28,
    alignItems: 'center',
    marginBottom: 16,
    overflow: 'hidden',
  },
  aboutOrb: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.06)',
    top: -40,
    right: -30,
  },
  aboutIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  aboutName: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize['2xl'],
    color: '#fff',
    marginBottom: 4,
  },
  aboutVersion: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 10,
  },
  aboutDesc: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    lineHeight: 20,
  },

  /* Cards */
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: 20,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    ...Shadows.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  sectionTitle: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  infoLabel: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  infoValue: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    maxWidth: '55%',
    textAlign: 'right',
  },

  /* Table items */
  tableItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 14,
  },
  tableDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    marginTop: 6,
  },
  tableName: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
  },
  tableDesc: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  /* Disclaimer */
  disclaimerCard: {
    backgroundColor: 'rgba(245, 158, 11, 0.06)',
    borderRadius: BorderRadius.xl,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.15)',
  },
  disclaimerText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs + 1,
    lineHeight: 20,
    color: Colors.textSecondary,
  },

  /* Logout */
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.danger,
    borderRadius: BorderRadius.full,
    paddingVertical: 16,
    ...Shadows.md,
  },
  logoutText: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.md,
    color: '#fff',
  },
});
