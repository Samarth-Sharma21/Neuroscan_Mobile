import { useState, useEffect, useCallback, useRef } from 'react';
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
  Alert,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import {
  ArrowLeft,
  Brain,
  BarChart3,
  Info,
  X,
  Maximize2,
  Shield,
  AlertTriangle,
  FileText,
  Download,
  Heart,
  MapPin,
  Layers,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronRight,
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
import {
  fetchReport,
  fetchTimeline,
  generatePdfReport,
  type Report,
  type TimelineEntry,
} from '../../src/services/api';
import { useAuth } from '../../src/contexts/AuthContext';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

type ImageMode = 'attention' | 'overlay';

// ─── Helpers ────────────────────────────────────────
function riskColor(level?: string | null) {
  if (!level) return Colors.textTertiary;
  const l = level.toLowerCase();
  if (l.includes('low')) return Colors.success;
  if (l.includes('moderate')) return Colors.warning;
  return Colors.danger;
}

function riskBg(level?: string | null) {
  if (!level) return Colors.surfaceHover;
  const l = level.toLowerCase();
  if (l.includes('low')) return Colors.successBg;
  if (l.includes('moderate')) return Colors.warningBg;
  return Colors.dangerBg;
}

function reliabilityColor(r?: string | null) {
  if (!r) return Colors.textTertiary;
  if (r === 'High') return Colors.success;
  if (r === 'Moderate') return Colors.warning;
  return Colors.danger;
}

// ─── Component ──────────────────────────────────────
export default function ResultsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user, profile } = useAuth();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageMode, setImageMode] = useState<ImageMode>('attention');
  const [fullscreenVisible, setFullscreenVisible] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);
  const timelineScrollRef = useRef<ScrollView>(null);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);

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

  // ─── Timeline ────────────────────────────────────
  useEffect(() => {
    if (user?.id) {
      fetchTimeline(user.id)
        .then(setTimeline)
        .catch(() => {});
    }
  }, [user?.id]);

  // ─── PDF generation helper ────────────────────────
  const _generatePdf = useCallback(async () => {
    if (!report) return null;
    const patientName = profile?.full_name || 'Patient';
    const patientDetails = profile
      ? {
          age: profile.age ?? null,
          sex: profile.sex ?? null,
          date_of_birth: profile.date_of_birth ?? null,
          blood_group: profile.blood_group ?? null,
          known_conditions: profile.known_conditions ?? null,
          current_medications: profile.current_medications ?? null,
          allergies: profile.allergies ?? null,
          family_history: profile.family_history ?? null,
          clinical_notes: profile.clinical_notes ?? null,
        }
      : null;
    return generatePdfReport(
      report,
      patientName,
      patientDetails,
      timeline.length > 1 ? timeline : null,
    );
  }, [report, profile, timeline]);

  // ─── Download directly to device ──────────────────
  const DOWNLOAD_DIR_KEY = 'neuroscan_download_dir';

  const _writeToSafDir = useCallback(
    async (
      dirUri: string,
      fileName: string,
      base64: string,
    ): Promise<boolean> => {
      try {
        const destUri = await FileSystem.StorageAccessFramework.createFileAsync(
          dirUri,
          fileName,
          'application/pdf',
        );
        await FileSystem.writeAsStringAsync(destUri, base64, {
          encoding: FileSystem.EncodingType.Base64,
        });
        return true;
      } catch {
        return false;
      }
    },
    [],
  );

  const handleDownloadPdf = useCallback(async () => {
    if (!report) return;
    setDownloadLoading(true);
    try {
      const fileUri = await _generatePdf();
      if (!fileUri) {
        Alert.alert('Error', 'Failed to generate PDF report.');
        return;
      }

      if (Platform.OS === 'android') {
        const safeName = (profile?.full_name || 'patient')
          .replace(/[^a-zA-Z0-9_-]/g, '_')
          .substring(0, 30);
        const ts = new Date()
          .toISOString()
          .replace(/[:.]/g, '-')
          .substring(0, 19);
        const fileName = `neuroscan_report_${safeName}_${ts}.pdf`;

        const base64 = await FileSystem.readAsStringAsync(fileUri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        // Try previously saved directory first
        const savedDirUri = await AsyncStorage.getItem(DOWNLOAD_DIR_KEY);
        if (savedDirUri) {
          const ok = await _writeToSafDir(savedDirUri, fileName, base64);
          if (ok) {
            Alert.alert('Downloaded', 'PDF saved to your chosen folder.');
            return;
          }
          // Saved dir no longer valid — clear it and ask again
          await AsyncStorage.removeItem(DOWNLOAD_DIR_KEY);
        }

        // First time (or saved dir expired): ask user to pick a folder
        const permissions =
          await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
        if (permissions.granted) {
          // Remember this directory for next time
          await AsyncStorage.setItem(
            DOWNLOAD_DIR_KEY,
            permissions.directoryUri,
          );
          const ok = await _writeToSafDir(
            permissions.directoryUri,
            fileName,
            base64,
          );
          if (ok) {
            Alert.alert(
              'Downloaded',
              'PDF saved! This folder will be used for future downloads.',
            );
          } else {
            Alert.alert('Error', 'Failed to write file.');
          }
        } else {
          // User cancelled picker — fallback to share sheet
          const canShare = await Sharing.isAvailableAsync();
          if (canShare) {
            await Sharing.shareAsync(fileUri, {
              mimeType: 'application/pdf',
              dialogTitle: 'Save NeuroScan Report',
            });
          }
        }
      } else {
        // iOS: use share sheet which lets user save to Files, etc.
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'application/pdf',
            dialogTitle: 'Save NeuroScan Report',
          });
        } else {
          Alert.alert('Success', 'PDF report saved to app documents.');
        }
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'PDF generation failed.');
    } finally {
      setDownloadLoading(false);
    }
  }, [report, profile, _generatePdf, _writeToSafDir]);

  // ─── Share report as PDF ─────────────────────────
  const handleSharePdf = useCallback(async () => {
    if (!report) return;
    setShareLoading(true);
    try {
      const fileUri = await _generatePdf();
      if (!fileUri) {
        Alert.alert('Error', 'Failed to generate PDF report.');
        return;
      }
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Share NeuroScan Report',
        });
      } else {
        Alert.alert('Info', 'Sharing is not available on this device.');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'PDF sharing failed.');
    } finally {
      setShareLoading(false);
    }
  }, [report, _generatePdf]);

  // ─── Loading / Error states ──────────────────────
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
        <TouchableOpacity
          onPress={handleDownloadPdf}
          style={styles.headerBack}
          disabled={downloadLoading || shareLoading}>
          {downloadLoading ? (
            <ActivityIndicator size='small' color={Colors.primary} />
          ) : (
            <Download size={20} color={Colors.primary} />
          )}
        </TouchableOpacity>
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

        {/* ═══ Prediction Card ═══ */}
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

          {/* Confidence Reliability */}
          {report.confidence_reliability && (
            <View style={styles.reliabilityRow}>
              <Shield
                size={14}
                color={reliabilityColor(report.confidence_reliability)}
              />
              <Text style={styles.reliabilityLabel}>Reliability:</Text>
              <Text
                style={[
                  styles.reliabilityValue,
                  {
                    color: reliabilityColor(report.confidence_reliability),
                  },
                ]}>
                {report.confidence_reliability}
              </Text>
            </View>
          )}
        </View>

        {/* ═══ Risk Assessment Card ═══ */}
        {(report.risk_score != null || report.risk_level) && (
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <AlertTriangle size={18} color={riskColor(report.risk_level)} />
              <Text style={styles.sectionTitle}>Risk Assessment</Text>
            </View>

            {/* Risk Level Badge */}
            {report.risk_level && (
              <View
                style={[
                  styles.riskBadge,
                  { backgroundColor: riskBg(report.risk_level) },
                ]}>
                <Text
                  style={[
                    styles.riskBadgeText,
                    { color: riskColor(report.risk_level) },
                  ]}>
                  {report.risk_level}
                </Text>
              </View>
            )}

            {/* Risk Score Meter */}
            {report.risk_score != null && (
              <View style={styles.meterSection}>
                <View style={styles.meterHeader}>
                  <Text style={styles.meterLabel}>Risk Score</Text>
                  <Text
                    style={[
                      styles.meterValue,
                      { color: riskColor(report.risk_level) },
                    ]}>
                    {Number(report.risk_score).toFixed(1)}%
                  </Text>
                </View>
                <View style={styles.meterBarBg}>
                  <View
                    style={[
                      styles.meterBarFill,
                      {
                        width:
                          `${Math.min(Number(report.risk_score), 100)}%` as any,
                        backgroundColor: riskColor(report.risk_level),
                      },
                    ]}
                  />
                </View>
              </View>
            )}

            {/* Attention Coverage */}
            {report.attention_coverage_percent != null && (
              <View style={styles.meterSection}>
                <View style={styles.meterHeader}>
                  <Text style={styles.meterLabel}>Attention Coverage</Text>
                  <Text style={[styles.meterValue, { color: Colors.primary }]}>
                    {Number(report.attention_coverage_percent).toFixed(1)}%
                  </Text>
                </View>
                <View style={styles.meterBarBg}>
                  <View
                    style={[
                      styles.meterBarFill,
                      {
                        width:
                          `${Math.min(Number(report.attention_coverage_percent), 100)}%` as any,
                        backgroundColor: Colors.primary,
                      },
                    ]}
                  />
                </View>
              </View>
            )}

            {/* Normal Comparison */}
            {report.normal_comparison_score != null && (
              <View style={styles.meterSection}>
                <View style={styles.meterHeader}>
                  <Text style={styles.meterLabel}>
                    Compare with Normal Brain
                  </Text>
                  <Text style={[styles.meterValue, { color: Colors.info }]}>
                    {Number(report.normal_comparison_score).toFixed(1)}%
                  </Text>
                </View>
                <View style={styles.meterBarBg}>
                  <View
                    style={[
                      styles.meterBarFill,
                      {
                        width:
                          `${Math.min(Number(report.normal_comparison_score), 100)}%` as any,
                        backgroundColor: Colors.info,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.meterHint}>
                  100% = identical to normal brain pattern
                </Text>
              </View>
            )}
          </View>
        )}

        {/* ═══ Clinical Analysis Card ═══ */}
        {(report.clinical_explanation || report.recommendation) && (
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <Heart size={18} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Clinical Analysis</Text>
            </View>

            {report.clinical_explanation && (
              <View style={styles.clinicalBlock}>
                <Text style={styles.clinicalLabel}>Explanation</Text>
                <Text style={styles.clinicalText}>
                  {report.clinical_explanation}
                </Text>
              </View>
            )}

            {report.recommendation && (
              <View
                style={[
                  styles.recommendationBox,
                  { borderLeftColor: riskColor(report.risk_level) },
                ]}>
                <Text style={styles.clinicalLabel}>Recommendation</Text>
                <Text style={styles.clinicalText}>{report.recommendation}</Text>
              </View>
            )}
          </View>
        )}

        {/* ═══ Class Probabilities ═══ */}
        {report.probabilities && (
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <BarChart3 size={18} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Class Probabilities</Text>
            </View>
            {(() => {
              // Backend always returns percentages (0-100).
              // Sort descending so highest probability is first.
              return Object.entries(report.probabilities)
                .map(
                  ([cls, prob]: [string, any]) =>
                    [cls, Number(prob)] as [string, number],
                )
                .sort((a, b) => b[1] - a[1])
                .map(([cls, pctValue]: [string, number]) => {
                  const ci = classificationColors[cls];
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
                      <Text style={styles.probValue}>
                        {pctValue.toFixed(1)}%
                      </Text>
                    </View>
                  );
                });
            })()}
          </View>
        )}

        {/* ═══ Brain Regions Card ═══ */}
        {report.brain_regions &&
          Array.isArray(report.brain_regions) &&
          report.brain_regions.length > 0 && (
            <View style={styles.card}>
              <View style={styles.sectionHeader}>
                <MapPin size={18} color={Colors.primary} />
                <Text style={styles.sectionTitle}>Affected Brain Regions</Text>
              </View>
              <Text style={styles.regionDisclaimer}>
                Regions are estimated using approximate atlas mapping based on
                attention patterns.
              </Text>
              {[...report.brain_regions]
                .sort(
                  (a: any, b: any) =>
                    (b.attention_percent || 0) - (a.attention_percent || 0),
                )
                .map((region: any, idx: number) => {
                  const pct = Number(region.attention_percent || 0);
                  return (
                    <View key={idx} style={styles.regionRow}>
                      <View style={styles.regionRank}>
                        <Text style={styles.regionRankText}>{idx + 1}</Text>
                      </View>
                      <View style={styles.regionInfo}>
                        <Text style={styles.regionName}>
                          {region.region_name}
                        </Text>
                        <View style={styles.regionBarBg}>
                          <View
                            style={[
                              styles.regionBarFill,
                              {
                                width: `${Math.min(pct, 100)}%` as any,
                              },
                            ]}
                          />
                        </View>
                      </View>
                      <Text style={styles.regionPct}>{pct.toFixed(1)}%</Text>
                    </View>
                  );
                })}
            </View>
          )}

        {/* ═══ HUFA Stats ═══ */}
        {report.hufa_stats && (
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <Layers size={18} color={Colors.primary} />
              <Text style={styles.sectionTitle}>HUFA Module Stats</Text>
            </View>
            {Object.entries(report.hufa_stats).map(
              ([blockKey, stats]: [string, any]) => (
                <View key={blockKey} style={styles.hufaBlock}>
                  <Text style={styles.hufaBlockTitle}>
                    {blockKey
                      .replace(/_/g, ' ')
                      .replace(/\b\w/g, (c: string) => c.toUpperCase())}
                  </Text>
                  {stats && typeof stats === 'object' ? (
                    <>
                      {stats.alpha != null && (
                        <View style={styles.infoRow}>
                          <Text style={styles.infoLabel}>Alpha</Text>
                          <Text style={styles.infoValue}>
                            {Number(stats.alpha).toFixed(4)}
                          </Text>
                        </View>
                      )}
                      {stats.lambda_u != null && (
                        <View style={styles.infoRow}>
                          <Text style={styles.infoLabel}>Lambda U</Text>
                          <Text style={styles.infoValue}>
                            {Number(stats.lambda_u).toFixed(4)}
                          </Text>
                        </View>
                      )}
                      {stats.scale_weights &&
                        Array.isArray(stats.scale_weights) && (
                          <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Scale Weights</Text>
                            <Text style={styles.infoValue}>
                              [
                              {stats.scale_weights
                                .map((w: number) => Number(w).toFixed(4))
                                .join(', ')}
                              ]
                            </Text>
                          </View>
                        )}
                    </>
                  ) : (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Value</Text>
                      <Text style={styles.infoValue}>
                        {typeof stats === 'number'
                          ? stats.toFixed(4)
                          : String(stats ?? 'N/A')}
                      </Text>
                    </View>
                  )}
                </View>
              ),
            )}
          </View>
        )}

        {/* ═══ Report Details ═══ */}
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

        {/* ═══ PDF Download & Share Buttons ═══ */}
        <View style={styles.pdfBtnRow}>
          <TouchableOpacity
            style={[styles.pdfBtn, { flex: 1, marginRight: 8 }]}
            onPress={handleDownloadPdf}
            disabled={downloadLoading || shareLoading}
            activeOpacity={0.85}>
            <LinearGradient
              colors={[...Colors.gradientPrimary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.pdfBtnInner, downloadLoading && { opacity: 0.7 }]}>
              {downloadLoading ? (
                <>
                  <ActivityIndicator color='#fff' size='small' />
                  <Text style={styles.pdfBtnText}>Downloading...</Text>
                </>
              ) : (
                <>
                  <Download size={20} color='#fff' />
                  <Text style={styles.pdfBtnText}>Download</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.shareBtn, { flex: 1, marginLeft: 8 }]}
            onPress={handleSharePdf}
            disabled={downloadLoading || shareLoading}
            activeOpacity={0.85}>
            <View
              style={[styles.shareBtnInner, shareLoading && { opacity: 0.7 }]}>
              {shareLoading ? (
                <>
                  <ActivityIndicator size={18} color={Colors.primary} />
                  <Text style={styles.shareBtnText}>Sharing...</Text>
                </>
              ) : (
                <>
                  <FileText size={20} color={Colors.primary} />
                  <Text style={styles.shareBtnText}>Share Report</Text>
                </>
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* ═══ Scan History & Comparison ═══ */}
        {timeline.length > 1 &&
          (() => {
            // Find current report in timeline
            const currentIdx = timeline.findIndex((t) => t.id === id);
            const currentEntry =
              currentIdx >= 0
                ? timeline[currentIdx]
                : timeline[timeline.length - 1];
            const previousScans = timeline.filter(
              (t) => t.id !== currentEntry.id,
            );

            // Calculate trend vs previous scan
            const prevEntry =
              currentIdx > 0
                ? timeline[currentIdx - 1]
                : previousScans[previousScans.length - 1];
            const riskDelta =
              prevEntry &&
              currentEntry.risk_score != null &&
              prevEntry.risk_score != null
                ? currentEntry.risk_score - prevEntry.risk_score
                : null;

            return (
              <View style={styles.card}>
                <View style={styles.sectionHeader}>
                  <Clock size={20} color={Colors.primary} />
                  <Text style={styles.sectionTitle}>
                    Scan History ({timeline.length} scans)
                  </Text>
                </View>

                {/* Current vs Previous Summary */}
                {prevEntry && (
                  <View style={styles.tlCompareSummary}>
                    <View style={styles.tlCompareCol}>
                      <Text style={styles.tlCompareLabel}>Previous</Text>
                      <View
                        style={[
                          styles.tlCompareBadge,
                          { backgroundColor: riskBg(prevEntry.risk_level) },
                        ]}>
                        <Text
                          style={[
                            styles.tlCompareBadgeText,
                            { color: riskColor(prevEntry.risk_level) },
                          ]}>
                          {prevEntry.predicted_class}
                        </Text>
                      </View>
                      <Text style={styles.tlCompareRisk}>
                        Risk: {prevEntry.risk_score ?? 'N/A'}%
                      </Text>
                    </View>

                    <View style={styles.tlCompareArrow}>
                      {riskDelta != null ? (
                        riskDelta > 0 ? (
                          <TrendingUp size={22} color={Colors.danger} />
                        ) : riskDelta < 0 ? (
                          <TrendingDown size={22} color={Colors.success} />
                        ) : (
                          <Minus size={22} color={Colors.textTertiary} />
                        )
                      ) : (
                        <ChevronRight size={22} color={Colors.textTertiary} />
                      )}
                      {riskDelta != null && riskDelta !== 0 && (
                        <Text
                          style={[
                            styles.tlDeltaText,
                            {
                              color:
                                riskDelta > 0 ? Colors.danger : Colors.success,
                            },
                          ]}>
                          {riskDelta > 0 ? '+' : ''}
                          {riskDelta.toFixed(1)}%
                        </Text>
                      )}
                    </View>

                    <View style={styles.tlCompareCol}>
                      <Text style={styles.tlCompareLabel}>Current</Text>
                      <View
                        style={[
                          styles.tlCompareBadge,
                          { backgroundColor: riskBg(currentEntry.risk_level) },
                        ]}>
                        <Text
                          style={[
                            styles.tlCompareBadgeText,
                            { color: riskColor(currentEntry.risk_level) },
                          ]}>
                          {currentEntry.predicted_class}
                        </Text>
                      </View>
                      <Text style={styles.tlCompareRisk}>
                        Risk: {currentEntry.risk_score ?? 'N/A'}%
                      </Text>
                    </View>
                  </View>
                )}

                {/* Bar chart row */}
                <ScrollView
                  ref={timelineScrollRef}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.tlBarScroll}
                  contentContainerStyle={styles.tlBarScrollContent}
                  onContentSizeChange={() =>
                    timelineScrollRef.current?.scrollToEnd({ animated: false })
                  }>
                  {timeline.map((entry, idx) => {
                    const isCurrent = entry.id === currentEntry.id;
                    const riskVal = entry.risk_score ?? 0;
                    const barH = Math.max(riskVal, 5);
                    const barColor = riskColor(entry.risk_level);
                    const dateLabel = new Date(
                      entry.created_at,
                    ).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                    });
                    return (
                      <View
                        key={entry.id || idx}
                        style={[
                          styles.tlBarGroup,
                          isCurrent && styles.tlBarGroupCurrent,
                        ]}>
                        <Text style={styles.tlBarRiskLabel}>{riskVal}%</Text>
                        <View style={styles.tlBarWrapper}>
                          <View
                            style={[
                              styles.tlBar,
                              { height: `${barH}%`, backgroundColor: barColor },
                              isCurrent && {
                                borderWidth: 2,
                                borderColor: Colors.primary,
                              },
                            ]}
                          />
                        </View>
                        <Text
                          style={[
                            styles.tlBarDate,
                            isCurrent && styles.tlBarDateCurrent,
                          ]}
                          numberOfLines={1}>
                          {dateLabel}
                        </Text>
                        {isCurrent && <View style={styles.tlCurrentDot} />}
                      </View>
                    );
                  })}
                </ScrollView>

                {/* History list */}
                <Text style={styles.tlHistoryTitle}>All Previous Scans</Text>
                {previousScans
                  .slice()
                  .reverse()
                  .map((entry) => {
                    const isImproved =
                      currentEntry.risk_score != null &&
                      entry.risk_score != null &&
                      currentEntry.risk_score < entry.risk_score;
                    const isWorse =
                      currentEntry.risk_score != null &&
                      entry.risk_score != null &&
                      currentEntry.risk_score > entry.risk_score;
                    const dateStr = new Date(
                      entry.created_at,
                    ).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    });
                    return (
                      <TouchableOpacity
                        key={entry.id}
                        style={styles.tlHistoryRow}
                        activeOpacity={0.7}
                        onPress={() => router.push(`/results/${entry.id}`)}>
                        <View
                          style={[
                            styles.tlHistoryDot,
                            { backgroundColor: riskColor(entry.risk_level) },
                          ]}
                        />
                        <View style={styles.tlHistoryInfo}>
                          <Text style={styles.tlHistoryClass}>
                            {entry.predicted_class}
                          </Text>
                          <Text style={styles.tlHistoryDate}>{dateStr}</Text>
                        </View>
                        <View style={styles.tlHistoryRight}>
                          <Text
                            style={[
                              styles.tlHistoryRisk,
                              { color: riskColor(entry.risk_level) },
                            ]}>
                            {entry.risk_score ?? 0}%
                          </Text>
                          {isImproved && (
                            <View style={styles.tlTrendBadgeGreen}>
                              <TrendingDown size={10} color={Colors.success} />
                            </View>
                          )}
                          {isWorse && (
                            <View style={styles.tlTrendBadgeRed}>
                              <TrendingUp size={10} color={Colors.danger} />
                            </View>
                          )}
                        </View>
                        <ChevronRight size={14} color={Colors.textTertiary} />
                      </TouchableOpacity>
                    );
                  })}

                {/* Legend */}
                <View style={styles.timelineLegend}>
                  <View style={styles.timelineLegendItem}>
                    <View
                      style={[
                        styles.timelineDot,
                        { backgroundColor: Colors.success },
                      ]}
                    />
                    <Text style={styles.timelineLegendText}>Low</Text>
                  </View>
                  <View style={styles.timelineLegendItem}>
                    <View
                      style={[
                        styles.timelineDot,
                        { backgroundColor: Colors.warning },
                      ]}
                    />
                    <Text style={styles.timelineLegendText}>Moderate</Text>
                  </View>
                  <View style={styles.timelineLegendItem}>
                    <View
                      style={[
                        styles.timelineDot,
                        { backgroundColor: Colors.danger },
                      ]}
                    />
                    <Text style={styles.timelineLegendText}>High</Text>
                  </View>
                </View>
              </View>
            );
          })()}

        {/* ═══ Disclaimer ═══ */}
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

      {/* ═══ Fullscreen Image Modal ═══ */}
      <Modal
        visible={fullscreenVisible}
        animationType='fade'
        transparent
        statusBarTranslucent
        onRequestClose={() => setFullscreenVisible(false)}>
        <View style={styles.modalBg}>
          <StatusBar backgroundColor='#000' barStyle='light-content' />

          <TouchableOpacity
            style={styles.modalClose}
            onPress={() => setFullscreenVisible(false)}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <X size={22} color='#fff' />
          </TouchableOpacity>

          {currentImage && (
            <Image
              source={{
                uri: `data:image/png;base64,${currentImage.data}`,
              }}
              style={styles.modalImage}
              resizeMode='contain'
            />
          )}

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

// ─── Styles ─────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
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
  noImage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
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

  /* Reliability */
  reliabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.cardBorder,
  },
  reliabilityLabel: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  reliabilityValue: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.sm,
  },

  /* Risk Assessment */
  riskBadge: {
    alignSelf: 'flex-start',
    borderRadius: BorderRadius.full,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 16,
  },
  riskBadgeText: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.sm,
  },

  /* Meter bars */
  meterSection: {
    marginBottom: 16,
  },
  meterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  meterLabel: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  meterValue: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.lg,
  },
  meterBarBg: {
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.surfaceHover,
  },
  meterBarFill: {
    height: 8,
    borderRadius: 4,
  },
  meterHint: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    marginTop: 4,
    fontStyle: 'italic',
  },

  /* Clinical Analysis */
  clinicalBlock: {
    marginBottom: 16,
  },
  clinicalLabel: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  clinicalText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  recommendationBox: {
    borderLeftWidth: 3,
    paddingLeft: 14,
    paddingVertical: 12,
    backgroundColor: Colors.surfaceHover,
    borderRadius: BorderRadius.sm,
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

  /* Brain Regions */
  regionDisclaimer: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    fontStyle: 'italic',
    marginBottom: 14,
    lineHeight: 16,
  },
  regionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  regionRank: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  regionRankText: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.xs,
    color: Colors.primary,
  },
  regionInfo: {
    flex: 1,
  },
  regionName: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  regionBarBg: {
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.surfaceHover,
    overflow: 'hidden',
  },
  regionBarFill: {
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  regionPct: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.xs,
    color: Colors.textPrimary,
    width: 44,
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
    flexShrink: 1,
    textAlign: 'right',
  },

  /* HUFA block card */
  hufaBlock: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  hufaBlockTitle: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.sm,
    color: Colors.primary,
    marginBottom: Spacing.xs,
    textTransform: 'capitalize',
  },

  /* PDF & Share Buttons */
  pdfBtnRow: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  pdfBtn: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadows.glow,
  },
  pdfBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  pdfBtnText: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.md,
    color: '#fff',
  },
  shareBtn: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  shareBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    gap: 10,
    backgroundColor: Colors.surface,
  },
  shareBtnText: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.md,
    color: Colors.primary,
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

  /* ─── Scan History & Comparison ─── */
  tlCompareSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceHover,
    borderRadius: BorderRadius.xl,
    padding: 16,
    marginBottom: 16,
  },
  tlCompareCol: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  tlCompareLabel: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tlCompareBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
  },
  tlCompareBadgeText: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.xs,
  },
  tlCompareRisk: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  tlCompareArrow: {
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 8,
  },
  tlDeltaText: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.xs,
  },

  /* Bar chart (horizontal scroll) */
  tlBarScroll: {
    marginBottom: 16,
  },
  tlBarScrollContent: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 150,
    paddingVertical: 8,
    gap: 6,
  },
  tlBarGroup: {
    alignItems: 'center',
    width: 44,
  },
  tlBarGroupCurrent: {
    width: 52,
  },
  tlBarRiskLabel: {
    fontFamily: FontFamily.medium,
    fontSize: 9,
    color: Colors.textTertiary,
    marginBottom: 4,
  },
  tlBarWrapper: {
    width: '100%',
    height: 100,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  tlBar: {
    width: '65%',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    minHeight: 4,
  },
  tlBarDate: {
    fontSize: 9,
    color: Colors.textTertiary,
    marginTop: 4,
    textAlign: 'center',
    fontFamily: FontFamily.regular,
  },
  tlBarDateCurrent: {
    fontFamily: FontFamily.bold,
    color: Colors.primary,
  },
  tlCurrentDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
    marginTop: 3,
  },

  /* History list */
  tlHistoryTitle: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    marginBottom: 10,
    marginTop: 4,
  },
  tlHistoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
    gap: 10,
  },
  tlHistoryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  tlHistoryInfo: {
    flex: 1,
  },
  tlHistoryClass: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
  },
  tlHistoryDate: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  tlHistoryRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tlHistoryRisk: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.sm,
  },
  tlTrendBadgeGreen: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.successBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tlTrendBadgeRed: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.dangerBg,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Legend (shared) */
  timelineLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 14,
  },
  timelineLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  timelineLegendText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontFamily: FontFamily.regular,
  },
});
