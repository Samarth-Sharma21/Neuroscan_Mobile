import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Settings,
  Clock,
  FileText,
  Activity,
  Hash,
  LogOut,
  ChevronRight,
} from 'lucide-react-native';
import {
  Colors,
  Spacing,
  BorderRadius,
  FontSize,
  FontFamily,
  Shadows,
} from '../../src/constants/theme';
import { fetchReports, type Report } from '../../src/services/api';
import { useAuth } from '../../src/contexts/AuthContext';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, profile, signOut } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadReports = useCallback(async () => {
    if (!user?.id) return;
    try {
      const data = await fetchReports(user.id);
      setReports(data);
    } catch (e) {
      console.error('Stats fetch error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const onRefresh = () => {
    setRefreshing(true);
    loadReports();
  };

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

  const displayName =
    profile?.full_name || user?.email?.split('@')[0] || 'User';
  const initials = displayName
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  const email = user?.email || '';

  // Compute stats from reports
  const totalScans = reports.length;
  const latestResult =
    reports.length > 0 ? reports[0].predicted_class : 'No scans yet';
  const latestConfidence =
    reports.length > 0 ? Number(reports[0].confidence).toFixed(1) : '0';
  const uniqueClasses = new Set(reports.map((r) => r.predicted_class)).size;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 80 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
          />
        }>
        {/* Profile Header */}
        <LinearGradient
          colors={['#0F766E', '#0D9488', '#14B8A6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.profileHeader}>
          <View style={styles.orbBg} />
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.profileName}>{displayName}</Text>
          <Text style={styles.profileEmail}>{email}</Text>
          <View style={styles.memberBadge}>
            <Text style={styles.memberText}>
              Member since{' '}
              {new Date(user?.created_at || Date.now()).toLocaleDateString(
                'en-US',
                { month: 'long', year: 'numeric' },
              )}
            </Text>
          </View>
        </LinearGradient>

        {/* Stats Bento Grid */}
        <View style={styles.statsSection}>
          <Text style={styles.statsTitle}>Dashboard</Text>

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size='large' color={Colors.primary} />
            </View>
          ) : (
            <View style={styles.bentoGrid}>
              <View style={styles.bentoRow}>
                <View style={styles.statCard}>
                  <View style={styles.statIconBox}>
                    <FileText size={20} color={Colors.primary} />
                  </View>
                  <Text style={styles.statValue}>{totalScans}</Text>
                  <Text style={styles.statLabel}>TOTAL SCANS</Text>
                </View>
                <View style={styles.statCard}>
                  <View style={styles.statIconBox}>
                    <Image
                      source={require('../../assets/images/neuroscan-logo4.png')}
                      style={{ width: 24, height: 24 }}
                      resizeMode='contain'
                    />
                  </View>
                  <Text
                    style={[styles.statValue, styles.statValueSmall]}
                    numberOfLines={2}>
                    {latestResult}
                  </Text>
                  <Text style={styles.statLabel}>LATEST RESULT</Text>
                </View>
              </View>
              <View style={styles.bentoRow}>
                <View style={styles.statCard}>
                  <View style={styles.statIconBox}>
                    <Activity size={20} color={Colors.primary} />
                  </View>
                  <Text style={styles.statValue}>{latestConfidence}%</Text>
                  <Text style={styles.statLabel}>CONFIDENCE</Text>
                </View>
                <View style={styles.statCard}>
                  <View style={styles.statIconBox}>
                    <Hash size={20} color={Colors.primary} />
                  </View>
                  <Text style={styles.statValue}>{uniqueClasses}</Text>
                  <Text style={styles.statLabel}>UNIQUE CLASSES</Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsSection}>
          <Text style={styles.actionsTitle}>Quick Actions</Text>

          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => router.push('/(tabs)/history')}
            activeOpacity={0.7}>
            <View style={styles.actionIconBox}>
              <Clock size={20} color={Colors.primary} />
            </View>
            <Text style={styles.actionLabel}>Scan History</Text>
            <ChevronRight size={18} color={Colors.textTertiary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => router.push('/settings')}
            activeOpacity={0.7}>
            <View style={styles.actionIconBox}>
              <Settings size={20} color={Colors.primary} />
            </View>
            <Text style={styles.actionLabel}>Settings</Text>
            <ChevronRight size={18} color={Colors.textTertiary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionRow, styles.logoutRow]}
            onPress={handleLogout}
            activeOpacity={0.7}>
            <View
              style={[
                styles.actionIconBox,
                { backgroundColor: Colors.dangerBg },
              ]}>
              <LogOut size={20} color={Colors.danger} />
            </View>
            <Text style={[styles.actionLabel, { color: Colors.danger }]}>
              Sign Out
            </Text>
            <ChevronRight size={18} color={Colors.danger} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  profileHeader: {
    paddingTop: Spacing['3xl'],
    paddingBottom: 40,
    alignItems: 'center',
    overflow: 'hidden',
  },
  orbBg: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.06)',
    top: -60,
    right: -40,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize['2xl'],
    color: '#fff',
  },
  profileName: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.xl,
    color: '#fff',
    marginBottom: 4,
  },
  profileEmail: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 12,
  },
  memberBadge: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: BorderRadius.full,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  memberText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.xs,
    color: 'rgba(255,255,255,0.85)',
  },

  // Stats
  statsSection: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing['2xl'],
  },
  statsTitle: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.xl,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },
  loadingBox: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bentoGrid: {
    gap: 12,
  },
  bentoRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    ...Shadows.sm,
  },
  statIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize['2xl'],
    color: Colors.textPrimary,
    marginBottom: 4,
    textAlign: 'center',
  },
  statValueSmall: {
    fontSize: FontSize.md,
  },
  statLabel: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.xs - 1,
    color: Colors.textTertiary,
    letterSpacing: 0.8,
    textAlign: 'center',
  },

  // Actions
  actionsSection: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing['3xl'],
  },
  actionsTitle: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.xl,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    ...Shadows.sm,
  },
  logoutRow: {
    marginTop: Spacing.sm,
    borderColor: 'rgba(239, 68, 68, 0.12)',
  },
  actionIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  actionLabel: {
    flex: 1,
    fontFamily: FontFamily.medium,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
  },
});
