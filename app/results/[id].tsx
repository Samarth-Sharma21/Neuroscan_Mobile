import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Dimensions,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  Brain,
  BarChart3,
  Info,
  X,
  Maximize2,
} from 'lucide-react-native';
import {
  Colors,
  Spacing,
  BorderRadius,
  FontSize,
  FontFamily,
  Shadows,
  classificationColors,
} from '../../src/constants/theme';
import { fetchReport, type Report } from '../../src/services/api';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

type ImageMode = 'attention' | 'overlay';

export default function ResultsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageMode, setImageMode] = useState<ImageMode>('attention');
  const [fullscreenVisible, setFullscreenVisible] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchReport(id);
        setReport(data);
      } catch (e) {
        console.error('Report load error:', e);
      } finally {
        setLoading(false);
      }
    }
    if (id) load();
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator size='large' color={Colors.primary} />
          <Text style={styles.loadingText}>Loading report...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!report) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Brain size={56} color={Colors.textTertiary} />
          <Text style={styles.errorText}>Report not found</Text>
          <TouchableOpacity
            style={styles.goBackBtn}
            onPress={() => router.back()}>
            <Text style={styles.goBackText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const clsInfo = classificationColors[report.predicted_class] || {
    color: Colors.textSecondary,
    bg: Colors.surfaceHover,
    label: report.predicted_class,
  };
  const confidencePct = Number(report.confidence).toFixed(1);

  // Build available image sources
  const imageSources: { mode: ImageMode; label: string; data: string }[] = [];
  if (report.attention_heatmap) {
    imageSources.push({
      mode: 'attention',
      label: 'Attention Map',
      data: report.attention_heatmap,
    });
  }
  if (report.attention_overlay) {
    imageSources.push({
      mode: 'overlay',
      label: 'HUFA Overlay',
      data: report.attention_overlay,
    });
  }

  const currentImage = imageSources.find((s) => s.mode === imageMode);
  const hasImages = imageSources.length > 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.headerBack}>
          <ArrowLeft size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scan Report</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {/* MRI Image with toggle */}
        <View style={styles.imageSection}>
          <TouchableOpacity
            style={styles.imageBox}
            activeOpacity={hasImages ? 0.85 : 1}
            onPress={() => hasImages && setFullscreenVisible(true)}>
            {currentImage ? (
              <>
                <Image
                  source={{
                    uri: `data:image/png;base64,${currentImage.data}`,
                  }}
                  style={styles.mriImage}
                  resizeMode='contain'
                />
                <View style={styles.expandBadge}>
                  <Maximize2 size={14} color='#fff' />
                </View>
              </>
            ) : (
              <View style={styles.noImage}>
                <Brain size={48} color={Colors.textTertiary} />
                <Text style={styles.noImageText}>No image available</Text>
              </View>
            )}
          </TouchableOpacity>

          {imageSources.length > 1 && (
            <View style={styles.toggleRow}>
              {imageSources.map((src) => (
                <TouchableOpacity
                  key={src.mode}
                  style={[
                    styles.toggleBtn,
                    imageMode === src.mode && styles.toggleActive,
                  ]}
                  onPress={() => setImageMode(src.mode)}>
                  <Text
                    style={[
                      styles.toggleText,
                      imageMode === src.mode && styles.toggleTextActive,
                    ]}>
                    {src.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Prediction Card */}
        <View style={styles.card}>
          <View style={[styles.predBadge, { backgroundColor: clsInfo.bg }]}>
            <View
              style={[styles.predDot, { backgroundColor: clsInfo.color }]}
            />
            <Text style={[styles.predText, { color: clsInfo.color }]}>
              {clsInfo.label}
            </Text>
          </View>

          {report.severity_label && (
            <Text style={styles.severityLabel}>
              Severity: {report.severity_label}
            </Text>
          )}

          {report.class_description && (
            <Text style={styles.classDescription}>
              {report.class_description}
            </Text>
          )}

          <View style={styles.confidenceRow}>
            <Text style={styles.confidenceLabel}>Confidence</Text>
            <Text style={[styles.confidenceValue, { color: clsInfo.color }]}>
              {confidencePct}%
            </Text>
          </View>
          <View style={styles.confidenceBarBg}>
            <View
              style={[
                styles.confidenceBarFill,
                {
                  width: `${Math.min(Number(confidencePct), 100)}%` as any,
                  backgroundColor: clsInfo.color,
                },
              ]}
            />
          </View>
        </View>

        {/* Class Probabilities */}
        {report.probabilities && (
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <BarChart3 size={18} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Class Probabilities</Text>
            </View>
            {Object.entries(report.probabilities).map(
              ([cls, prob]: [string, any]) => {
                const ci = classificationColors[cls];
                // prob may already be a percentage (0-100) or a decimal (0-1)
                const pctValue =
                  Number(prob) > 1 ? Number(prob) : Number(prob) * 100;
                const clampedWidth = Math.min(pctValue, 100);
                return (
                  <View key={cls} style={styles.probRow}>
                    <Text style={styles.probClass} numberOfLines={1}>
                      {ci?.label || cls}
                    </Text>
                    <View style={styles.probBarBg}>
                      <View
                        style={[
                          styles.probBarFill,
                          {
                            width: `${clampedWidth.toFixed(0)}%` as any,
                            backgroundColor: ci?.color || Colors.primary,
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.probValue}>{pctValue.toFixed(1)}%</Text>
                  </View>
                );
              },
            )}
          </View>
        )}

        {/* HUFA Stats */}
        {report.hufa_stats && (
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <Brain size={18} color={Colors.primary} />
              <Text style={styles.sectionTitle}>HUFA Module Stats</Text>
            </View>
            {Object.entries(report.hufa_stats).map(
              ([key, val]: [string, any]) => (
                <View key={key} style={styles.infoRow}>
                  <Text style={styles.infoLabel}>
                    {key
                      .replace(/_/g, ' ')
                      .replace(/\b\w/g, (c: string) => c.toUpperCase())}
                  </Text>
                  <Text style={styles.infoValue}>
                    {typeof val === 'number' ? val.toFixed(4) : String(val)}
                  </Text>
                </View>
              ),
            )}
          </View>
        )}

        {/* Report Details */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Info size={18} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Report Details</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Report ID</Text>
            <Text style={styles.infoValue}>{report.id.slice(0, 8)}...</Text>
          </View>
          {report.model_version && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Model</Text>
              <Text style={styles.infoValue}>{report.model_version}</Text>
            </View>
          )}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Date</Text>
            <Text style={styles.infoValue}>
              {new Date(report.created_at).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </Text>
          </View>
          <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.infoLabel}>Time</Text>
            <Text style={styles.infoValue}>
              {new Date(report.created_at).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
        </View>

        {/* Disclaimer */}
        <View style={styles.noteCard}>
          <Text style={styles.noteTitle}>Disclaimer</Text>
          <Text style={styles.noteText}>
            This is a research tool for educational purposes only. Results
            should not be used for clinical diagnosis. Always consult a
            qualified medical professional.
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Fullscreen Image Modal */}
      <Modal
        visible={fullscreenVisible}
        animationType='fade'
        transparent
        statusBarTranslucent
        onRequestClose={() => setFullscreenVisible(false)}>
        <View style={styles.modalBg}>
          <StatusBar backgroundColor='#000' barStyle='light-content' />

          {/* Close */}
          <TouchableOpacity
            style={styles.modalClose}
            onPress={() => setFullscreenVisible(false)}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <X size={22} color='#fff' />
          </TouchableOpacity>

          {/* Image */}
          {currentImage && (
            <Image
              source={{
                uri: `data:image/png;base64,${currentImage.data}`,
              }}
              style={styles.modalImage}
              resizeMode='contain'
            />
          )}

          {/* Bottom toggle */}
          {imageSources.length > 1 && (
            <View style={styles.modalToggleRow}>
              {imageSources.map((src) => (
                <TouchableOpacity
                  key={src.mode}
                  style={[
                    styles.modalToggleBtn,
                    imageMode === src.mode && styles.modalToggleActive,
                  ]}
                  onPress={() => setImageMode(src.mode)}>
                  <Text
                    style={[
                      styles.modalToggleText,
                      imageMode === src.mode && styles.modalToggleTextActive,
                    ]}>
                    {src.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 12,
  },
  errorText: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.lg,
    color: Colors.textPrimary,
  },
  goBackBtn: {
    marginTop: 8,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  goBackText: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.sm,
    color: '#fff',
  },

  /* Header */
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
  scrollContent: { paddingHorizontal: Spacing.xl, paddingBottom: 40 },

  /* Image */
  imageSection: { marginBottom: 20 },
  imageBox: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    backgroundColor: '#0F172A',
    ...Shadows.md,
  },
  mriImage: { width: '100%', height: '100%' },
  expandBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noImage: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
  noImageText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
  },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceHover,
    borderRadius: BorderRadius.full,
    padding: 4,
    marginTop: 14,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
  },
  toggleActive: {
    backgroundColor: Colors.surface,
    ...Shadows.sm,
  },
  toggleText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  toggleTextActive: {
    color: Colors.primary,
    fontFamily: FontFamily.semiBold,
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
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
  },

  /* Prediction badge */
  predBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: BorderRadius.full,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginBottom: 8,
    gap: 8,
  },
  predDot: { width: 8, height: 8, borderRadius: 4 },
  predText: { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm },
  severityLabel: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  classDescription: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs + 1,
    color: Colors.textTertiary,
    lineHeight: 20,
    marginBottom: 16,
  },

  /* Confidence */
  confidenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  confidenceLabel: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  confidenceValue: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize['3xl'],
  },
  confidenceBarBg: {
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.surfaceHover,
  },
  confidenceBarFill: {
    height: 8,
    borderRadius: 4,
  },

  /* Probabilities */
  probRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  probClass: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    width: 100,
  },
  probBarBg: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.surfaceHover,
    marginHorizontal: 10,
    overflow: 'hidden',
  },
  probBarFill: {
    height: 6,
    borderRadius: 3,
    maxWidth: '100%',
  },
  probValue: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.xs,
    color: Colors.textPrimary,
    width: 48,
    textAlign: 'right',
  },

  /* Info rows */
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
  },

  /* Disclaimer */
  noteCard: {
    backgroundColor: 'rgba(245, 158, 11, 0.06)',
    borderRadius: BorderRadius.xl,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.15)',
  },
  noteTitle: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.sm,
    color: Colors.warning,
    marginBottom: 6,
  },
  noteText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs + 1,
    lineHeight: 20,
    color: Colors.textSecondary,
  },

  /* Fullscreen Modal */
  modalBg: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalClose: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalImage: {
    width: SCREEN_W,
    height: SCREEN_H * 0.7,
  },
  modalToggleRow: {
    position: 'absolute',
    bottom: 50,
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: BorderRadius.full,
    padding: 4,
  },
  modalToggleBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: BorderRadius.full,
  },
  modalToggleActive: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  modalToggleText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.6)',
  },
  modalToggleTextActive: {
    color: '#fff',
    fontFamily: FontFamily.semiBold,
  },
});
