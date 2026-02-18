import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import {
  Upload,
  Camera,
  ImageIcon,
  X,
  Brain,
  Zap,
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
import { predictScan, saveReport } from '../../src/services/api';
import { useAuth } from '../../src/contexts/AuthContext';

export default function ScanScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState('');

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please grant photo library access to upload MRI scans.',
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: false,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant camera access.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
      allowsEditing: false,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const analyzeScanHandler = async () => {
    if (!imageUri) return;
    try {
      setAnalyzing(true);
      setProgress('Sending to HUFA-Net model...');

      const result = await predictScan(imageUri);
      setProgress('Saving report...');

      let reportId: string | null = null;
      if (user?.id) {
        const saved = await saveReport(user.id, result);
        reportId = saved?.id || null;
      }

      setAnalyzing(false);
      setProgress('');
      setImageUri(null);

      if (reportId) {
        router.push(`/results/${reportId}`);
      } else {
        Alert.alert(
          'Analysis Complete',
          `Prediction: ${result.predicted_class}\nConfidence: ${Number(result.confidence).toFixed(1)}%`,
        );
      }
    } catch (e: any) {
      setAnalyzing(false);
      setProgress('');
      Alert.alert(
        'Error',
        e.message || 'Failed to analyze scan. Please try again.',
      );
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 80 }}
        showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Brain size={24} color={Colors.primary} />
          </View>
          <Text style={styles.title}>Upload MRI Scan</Text>
          <Text style={styles.subtitle}>
            Select a brain MRI image for AI-powered dementia analysis
          </Text>
        </View>

        {/* Upload Area */}
        {!imageUri ? (
          <View style={styles.uploadCard}>
            <View style={styles.uploadDashed}>
              <View style={styles.uploadIconCircle}>
                <Upload size={32} color={Colors.primary} strokeWidth={1.8} />
              </View>
              <Text style={styles.uploadTitle}>Drop your MRI scan here</Text>
              <Text style={styles.uploadHint}>JPEG, PNG, DICOM supported</Text>

              <View style={styles.uploadButtons}>
                <TouchableOpacity
                  style={styles.uploadBtn}
                  onPress={pickImage}
                  activeOpacity={0.7}>
                  <ImageIcon size={18} color={Colors.primary} />
                  <Text style={styles.uploadBtnText}>Gallery</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.uploadBtn}
                  onPress={takePhoto}
                  activeOpacity={0.7}>
                  <Camera size={18} color={Colors.primary} />
                  <Text style={styles.uploadBtnText}>Camera</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.previewCard}>
            <View style={styles.previewImageContainer}>
              <Image
                source={{ uri: imageUri }}
                style={styles.previewImage}
                resizeMode='contain'
              />
              <TouchableOpacity
                style={styles.clearBtn}
                onPress={() => setImageUri(null)}
                activeOpacity={0.7}>
                <X size={16} color='#fff' />
              </TouchableOpacity>
            </View>
            <Text style={styles.previewLabel}>MRI Scan Preview</Text>
          </View>
        )}

        {/* Analyze Button */}
        {imageUri && (
          <TouchableOpacity
            style={[styles.analyzeBtn]}
            onPress={analyzeScanHandler}
            disabled={analyzing}
            activeOpacity={0.85}>
            <LinearGradient
              colors={[...Colors.gradientPrimary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.analyzeBtnInner, analyzing && { opacity: 0.8 }]}>
              {analyzing ? (
                <>
                  <ActivityIndicator color='#fff' size='small' />
                  <Text style={styles.analyzeBtnText}>
                    {progress || 'Analyzing...'}
                  </Text>
                </>
              ) : (
                <>
                  <Zap size={20} color='#fff' />
                  <Text style={styles.analyzeBtnText}>
                    Analyze with HUFA-Net
                  </Text>
                  <ChevronRight size={18} color='#fff' />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* How it works */}
        <View style={styles.howSection}>
          <Text style={styles.howTitle}>How It Works</Text>
          {[
            {
              n: '1',
              t: 'Upload',
              d: 'Select a brain MRI scan image from your device gallery or camera.',
            },
            {
              n: '2',
              t: 'AI Analysis',
              d: 'HUFA-Net processes the MRI and classifies dementia severity.',
            },
            {
              n: '3',
              t: 'Results',
              d: 'View prediction, confidence scores, and attention heatmap.',
            },
          ].map((step) => (
            <View key={step.n} style={styles.stepRow}>
              <LinearGradient
                colors={[...Colors.gradientPrimary]}
                style={styles.stepNum}>
                <Text style={styles.stepNumText}>{step.n}</Text>
              </LinearGradient>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>{step.t}</Text>
                <Text style={styles.stepDesc}>{step.d}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing['2xl'],
    paddingBottom: Spacing.lg,
    alignItems: 'center',
  },
  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize['2xl'],
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Upload
  uploadCard: {
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.xl,
  },
  uploadDashed: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius['2xl'],
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: Colors.primaryLight,
    padding: 36,
    alignItems: 'center',
    ...Shadows.sm,
  },
  uploadIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  uploadTitle: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.lg,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  uploadHint: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
    marginBottom: 24,
  },
  uploadButtons: {
    flexDirection: 'row',
    gap: 14,
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primaryMuted,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.primaryGlow,
  },
  uploadBtnText: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.sm,
    color: Colors.primary,
  },

  // Preview
  previewCard: {
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.xl,
    alignItems: 'center',
  },
  previewImageContainer: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: BorderRadius['2xl'],
    overflow: 'hidden',
    backgroundColor: '#0A0A0A',
    ...Shadows.lg,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  clearBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewLabel: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
    marginTop: Spacing.md,
  },

  // Analyze
  analyzeBtn: {
    marginHorizontal: Spacing.xl,
    marginTop: Spacing['2xl'],
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadows.glow,
  },
  analyzeBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  analyzeBtnText: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.lg,
    color: '#fff',
  },

  // How it works
  howSection: {
    marginTop: Spacing['4xl'],
    paddingHorizontal: Spacing.xl,
  },
  howTitle: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.xl,
    color: Colors.textPrimary,
    marginBottom: Spacing.xl,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.xl,
    gap: 14,
  },
  stepNum: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumText: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.md,
    color: '#fff',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
  },
  stepDesc: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
    lineHeight: 20,
  },
});
