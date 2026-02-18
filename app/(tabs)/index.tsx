import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Upload,
  Brain,
  Activity,
  Shield,
  ChevronRight,
  Sparkles,
  Settings,
} from 'lucide-react-native';
import { useAuth } from '../../src/contexts/AuthContext';
import {
  Colors,
  Spacing,
  BorderRadius,
  FontSize,
  FontFamily,
  Shadows,
} from '../../src/constants/theme';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const firstName = profile?.full_name?.split(' ')[0] || 'there';

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 80 }}>
        {/* Hero Section */}
        <LinearGradient
          colors={['#0F766E', '#0D9488', '#14B8A6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}>
          {/* Decorative orbs */}
          <View
            style={[
              styles.orb,
              { width: 200, height: 200, top: -60, right: -40 },
            ]}
          />
          <View
            style={[
              styles.orb,
              { width: 120, height: 120, bottom: 20, left: -30 },
            ]}
          />

          <SafeAreaView edges={['top']}>
            <View style={styles.heroHeader}>
              <View>
                <Text style={styles.greeting}>Hello, {firstName}</Text>
                <Text style={styles.heroDate}>
                  {new Date().toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.settingsBtn}
                onPress={() => router.push('/settings')}
                activeOpacity={0.7}>
                <Settings size={20} color='rgba(255,255,255,0.9)' />
              </TouchableOpacity>
            </View>

            <View style={styles.heroContent}>
              <View style={styles.badge}>
                <Sparkles size={12} color='#FCD34D' />
                <Text style={styles.badgeText}>HUFA-Net AI Model</Text>
              </View>
              <Text style={styles.heroTitle}>
                Detect Dementia{'\n'}From Brain MRI
              </Text>
              <Text style={styles.heroSubtitle}>
                Upload an MRI scan and get instant AI-powered classification
                with attention heatmaps.
              </Text>
              <TouchableOpacity
                style={styles.heroCta}
                onPress={() => router.push('/(tabs)/scan')}
                activeOpacity={0.85}>
                <Upload
                  size={18}
                  color={Colors.primaryDark}
                  strokeWidth={2.5}
                />
                <Text style={styles.heroCtaText}>Upload MRI Scan</Text>
                <ChevronRight size={18} color={Colors.primaryDark} />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </LinearGradient>

        {/* Quick Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>4</Text>
            <Text style={styles.statLabel}>Dementia{'\n'}Classes</Text>
          </View>
          <View style={[styles.statCard, styles.statCardAccent]}>
            <Text style={[styles.statNumber, { color: Colors.primary }]}>
              97.89%
            </Text>
            <Text style={styles.statLabel}>Model{'\n'}Accuracy</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>HUFA</Text>
            <Text style={styles.statLabel}>Attention{'\n'}Module</Text>
          </View>
        </View>

        {/* Features Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>FEATURES</Text>
          <Text style={styles.sectionTitle}>What NeuroScan Offers</Text>

          <View style={styles.featuresGrid}>
            {[
              {
                icon: <Brain size={24} color={Colors.primary} />,
                title: 'Dementia Classification',
                desc: 'Four-class staging: Non-Demented, Very Mild, Mild, and Moderate Dementia.',
              },
              {
                icon: <Activity size={24} color={Colors.primary} />,
                title: 'Attention Heatmaps',
                desc: 'Visualize which brain regions the HUFA module attends to during analysis.',
              },
              {
                icon: <Shield size={24} color={Colors.primary} />,
                title: 'Confidence Scores',
                desc: 'Detailed probability breakdowns per class with overall confidence.',
              },
              {
                icon: <Upload size={24} color={Colors.primary} />,
                title: 'Instant Analysis',
                desc: 'Upload any brain MRI and receive results in seconds with our cloud AI.',
              },
            ].map((item, i) => (
              <View key={i} style={styles.featureCard}>
                <View style={styles.featureIconBox}>{item.icon}</View>
                <View style={styles.featureTextWrap}>
                  <Text style={styles.featureTitle}>{item.title}</Text>
                  <Text style={styles.featureDesc}>{item.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* CTA Card */}
        <View style={styles.ctaSection}>
          <LinearGradient
            colors={[...Colors.gradientPrimary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.ctaCard}>
            <View style={styles.ctaOrb} />
            <Text style={styles.ctaTitle}>Ready to Analyze?</Text>
            <Text style={styles.ctaSubtitle}>
              Upload your MRI scan and see NeuroScan in action.
            </Text>
            <TouchableOpacity
              style={styles.ctaBtn}
              onPress={() => router.push('/(tabs)/scan')}
              activeOpacity={0.85}>
              <Text style={styles.ctaBtnText}>Start Scanning</Text>
              <ChevronRight size={18} color={Colors.primaryDark} />
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  hero: {
    paddingBottom: 48,
    paddingHorizontal: Spacing.xl,
    overflow: 'hidden',
  },
  orb: {
    position: 'absolute',
    borderRadius: 9999,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: Spacing.lg,
  },
  greeting: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.xl,
    color: '#fff',
  },
  heroDate: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.65)',
    marginTop: 2,
  },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroContent: {
    marginTop: Spacing['3xl'],
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: BorderRadius.full,
    paddingHorizontal: 14,
    paddingVertical: 6,
    gap: 6,
    marginBottom: Spacing.lg,
  },
  badgeText: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.xs,
    color: '#fff',
    letterSpacing: 0.8,
  },
  heroTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 32,
    lineHeight: 40,
    color: '#fff',
    marginBottom: Spacing.md,
  },
  heroSubtitle: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.md,
    lineHeight: 22,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: Spacing['2xl'],
  },
  heroCta: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderRadius: BorderRadius.full,
    paddingHorizontal: 24,
    paddingVertical: 14,
    gap: 8,
    ...Shadows.md,
  },
  heroCtaText: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.md,
    color: Colors.primaryDark,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: Spacing.xl,
    marginTop: -24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    ...Shadows.sm,
  },
  statCardAccent: {
    borderWidth: 1.5,
    borderColor: Colors.primaryMuted,
  },
  statNumber: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.xl,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    textAlign: 'center',
    lineHeight: 14,
  },

  // Features
  section: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing['4xl'],
  },
  sectionLabel: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.xs,
    letterSpacing: 1.5,
    color: Colors.primary,
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize['2xl'],
    color: Colors.textPrimary,
    marginBottom: Spacing.xl,
  },
  featuresGrid: {
    gap: 14,
  },
  featureCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: 16,
    ...Shadows.sm,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  featureIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureTextWrap: {
    flex: 1,
  },
  featureTitle: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  featureDesc: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    lineHeight: 18,
    color: Colors.textSecondary,
  },

  // CTA
  ctaSection: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing['4xl'],
  },
  ctaCard: {
    borderRadius: BorderRadius['2xl'],
    padding: 32,
    alignItems: 'center',
    overflow: 'hidden',
  },
  ctaOrb: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.08)',
    top: -40,
    right: -30,
  },
  ctaTitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize['2xl'],
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  ctaSubtitle: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.md,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: BorderRadius.full,
    paddingHorizontal: 28,
    paddingVertical: 14,
    gap: 6,
  },
  ctaBtnText: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.md,
    color: Colors.primaryDark,
  },
});
