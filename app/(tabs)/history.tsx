import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronRight, FileText, ScanLine, Trash2 } from 'lucide-react-native';
import {
  Colors,
  Spacing,
  BorderRadius,
  FontSize,
  FontFamily,
  Shadows,
  classificationColors,
} from '../../src/constants/theme';
import {
  fetchReports,
  deleteReport,
  type Report,
} from '../../src/services/api';
import { useAuth } from '../../src/contexts/AuthContext';

export default function HistoryScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadReports = useCallback(async () => {
    if (!user?.id) return;
    try {
      const data = await fetchReports(user.id);
      setReports(data);
    } catch (e) {
      console.error('History fetch error:', e);
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

  const handleDelete = async (id: string) => {
    const ok = await deleteReport(id);
    if (ok) {
      setReports((prev) => prev.filter((r) => r.id !== id));
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderItem = ({ item }: { item: Report }) => {
    const cls = classificationColors[item.predicted_class] || {
      color: Colors.textTertiary,
      bg: Colors.borderLight,
      label: item.predicted_class,
    };

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/results/${item.id}`)}
        activeOpacity={0.7}>
        <View style={styles.cardLeft}>
          <View style={[styles.statusStrip, { backgroundColor: cls.color }]} />
          <View style={styles.cardInfo}>
            <View style={styles.cardTopRow}>
              <View style={[styles.predBadge, { backgroundColor: cls.bg }]}>
                <Text style={[styles.predBadgeText, { color: cls.color }]}>
                  {cls.label}
                </Text>
              </View>
              <Text style={styles.confidence}>
                {Number(item.confidence).toFixed(1)}%
              </Text>
            </View>
            <Text style={styles.cardDate}>
              {formatDate(item.created_at)} at {formatTime(item.created_at)}
            </Text>
          </View>
        </View>
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => handleDelete(item.id)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Trash2 size={16} color={Colors.textTertiary} />
          </TouchableOpacity>
          <ChevronRight size={18} color={Colors.textTertiary} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Scan History</Text>
        <Text style={styles.subtitle}>
          {reports.length} report{reports.length !== 1 ? 's' : ''}{' '}
        </Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size='large' color={Colors.primary} />
        </View>
      ) : reports.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <FileText size={40} color={Colors.textTertiary} strokeWidth={1.5} />
          </View>
          <Text style={styles.emptyTitle}>No Reports Yet</Text>
          <Text style={styles.emptyDesc}>
            Upload your first MRI scan to see results here.
          </Text>
          <TouchableOpacity
            style={styles.emptyBtn}
            onPress={() => router.push('/(tabs)/scan')}
            activeOpacity={0.85}>
            <ScanLine size={18} color='#fff' />
            <Text style={styles.emptyBtnText}>Upload Scan</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={reports}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing['2xl'],
    paddingBottom: Spacing.lg,
  },
  title: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize['2xl'],
    color: Colors.textPrimary,
  },
  subtitle: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { paddingHorizontal: Spacing.xl, paddingBottom: 120 },

  // Card
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    ...Shadows.sm,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusStrip: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: 14,
  },
  cardInfo: { flex: 1 },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  predBadge: {
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  predBadgeText: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.xs,
  },
  confidence: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.sm,
    color: Colors.primary,
  },
  cardDate: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  deleteBtn: {
    padding: 6,
  },

  // Empty
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing['3xl'],
  },
  emptyIcon: {
    width: 88,
    height: 88,
    borderRadius: 24,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.xl,
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  emptyDesc: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 22,
  },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 28,
    paddingVertical: 14,
    ...Shadows.glow,
  },
  emptyBtnText: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.md,
    color: '#fff',
  },
});
