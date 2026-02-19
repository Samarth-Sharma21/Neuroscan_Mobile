import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  Brain,
  Shield,
  Info,
  ExternalLink,
  LogOut,
  ChevronRight,
  Cpu,
  Heart,
  Save,
  Check,
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
import { updateProfile } from '../src/services/api';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, profile, signOut, refreshProfile } = useAuth();

  // Clinical form state
  const [clinicalForm, setClinicalForm] = useState({
    age: '',
    sex: '',
    date_of_birth: '',
    blood_group: '',
    known_conditions: '',
    current_medications: '',
    allergies: '',
    family_history: '',
    clinical_notes: '',
  });
  const [clinicalSaving, setClinicalSaving] = useState(false);
  const [clinicalSaved, setClinicalSaved] = useState(false);

  // Pre-fill from profile
  useEffect(() => {
    if (profile) {
      setClinicalForm({
        age: profile.age != null ? String(profile.age) : '',
        sex: profile.sex || '',
        date_of_birth: profile.date_of_birth || '',
        blood_group: profile.blood_group || '',
        known_conditions: profile.known_conditions || '',
        current_medications: profile.current_medications || '',
        allergies: profile.allergies || '',
        family_history: profile.family_history || '',
        clinical_notes: profile.clinical_notes || '',
      });
    }
  }, [profile]);

  const handleClinicalSave = useCallback(async () => {
    if (!user?.id) return;
    setClinicalSaving(true);
    setClinicalSaved(false);

    const ageNum =
      clinicalForm.age.trim() === '' ? null : parseInt(clinicalForm.age, 10);

    if (ageNum !== null && (isNaN(ageNum) || ageNum < 0 || ageNum > 130)) {
      Alert.alert('Invalid', 'Age must be between 0 and 130.');
      setClinicalSaving(false);
      return;
    }

    const success = await updateProfile(user.id, {
      age: ageNum,
      sex: clinicalForm.sex || null,
      date_of_birth: clinicalForm.date_of_birth || null,
      blood_group: clinicalForm.blood_group || null,
      known_conditions: clinicalForm.known_conditions || null,
      current_medications: clinicalForm.current_medications || null,
      allergies: clinicalForm.allergies || null,
      family_history: clinicalForm.family_history || null,
      clinical_notes: clinicalForm.clinical_notes || null,
    });

    setClinicalSaving(false);
    if (success) {
      setClinicalSaved(true);
      await refreshProfile();
      setTimeout(() => setClinicalSaved(false), 3000);
    } else {
      Alert.alert('Error', 'Could not save clinical details.');
    }
  }, [user?.id, clinicalForm, refreshProfile]);

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

        {/* Clinical Profile */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Heart size={18} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Clinical Profile</Text>
          </View>
          <Text style={styles.clinicalHint}>
            Optional details included in generated PDF reports. Leave blank if
            unavailable.
          </Text>

          {/* Age */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Age</Text>
            <TextInput
              style={styles.fieldInput}
              value={clinicalForm.age}
              onChangeText={(v) => setClinicalForm((f) => ({ ...f, age: v }))}
              placeholder='e.g. 68'
              placeholderTextColor={Colors.textTertiary}
              keyboardType='numeric'
              maxLength={3}
            />
          </View>

          {/* Sex selector */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Sex</Text>
            <View style={styles.sexRow}>
              {['Male', 'Female', 'Other'].map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[
                    styles.sexBtn,
                    clinicalForm.sex === opt && styles.sexBtnActive,
                  ]}
                  onPress={() =>
                    setClinicalForm((f) => ({
                      ...f,
                      sex: f.sex === opt ? '' : opt,
                    }))
                  }>
                  <Text
                    style={[
                      styles.sexBtnText,
                      clinicalForm.sex === opt && styles.sexBtnTextActive,
                    ]}>
                    {opt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Date of Birth */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Date of Birth</Text>
            <TextInput
              style={styles.fieldInput}
              value={clinicalForm.date_of_birth}
              onChangeText={(v) =>
                setClinicalForm((f) => ({ ...f, date_of_birth: v }))
              }
              placeholder='YYYY-MM-DD'
              placeholderTextColor={Colors.textTertiary}
            />
          </View>

          {/* Blood Group */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Blood Group</Text>
            <TextInput
              style={styles.fieldInput}
              value={clinicalForm.blood_group}
              onChangeText={(v) =>
                setClinicalForm((f) => ({ ...f, blood_group: v }))
              }
              placeholder='e.g. B+'
              placeholderTextColor={Colors.textTertiary}
            />
          </View>

          {/* Known Conditions */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Known Conditions</Text>
            <TextInput
              style={[styles.fieldInput, styles.fieldTextArea]}
              value={clinicalForm.known_conditions}
              onChangeText={(v) =>
                setClinicalForm((f) => ({ ...f, known_conditions: v }))
              }
              placeholder='Diabetes, hypertension, etc.'
              placeholderTextColor={Colors.textTertiary}
              multiline
              numberOfLines={2}
              textAlignVertical='top'
            />
          </View>

          {/* Current Medications */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Current Medications</Text>
            <TextInput
              style={[styles.fieldInput, styles.fieldTextArea]}
              value={clinicalForm.current_medications}
              onChangeText={(v) =>
                setClinicalForm((f) => ({ ...f, current_medications: v }))
              }
              placeholder='List active medications'
              placeholderTextColor={Colors.textTertiary}
              multiline
              numberOfLines={2}
              textAlignVertical='top'
            />
          </View>

          {/* Allergies */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Allergies</Text>
            <TextInput
              style={[styles.fieldInput, styles.fieldTextArea]}
              value={clinicalForm.allergies}
              onChangeText={(v) =>
                setClinicalForm((f) => ({ ...f, allergies: v }))
              }
              placeholder='Drug/food/environment allergies'
              placeholderTextColor={Colors.textTertiary}
              multiline
              numberOfLines={2}
              textAlignVertical='top'
            />
          </View>

          {/* Family History */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Family History</Text>
            <TextInput
              style={[styles.fieldInput, styles.fieldTextArea]}
              value={clinicalForm.family_history}
              onChangeText={(v) =>
                setClinicalForm((f) => ({ ...f, family_history: v }))
              }
              placeholder='Family neurological history'
              placeholderTextColor={Colors.textTertiary}
              multiline
              numberOfLines={2}
              textAlignVertical='top'
            />
          </View>

          {/* Clinical Notes */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Clinical Notes</Text>
            <TextInput
              style={[
                styles.fieldInput,
                styles.fieldTextArea,
                { minHeight: 80 },
              ]}
              value={clinicalForm.clinical_notes}
              onChangeText={(v) =>
                setClinicalForm((f) => ({ ...f, clinical_notes: v }))
              }
              placeholder='Additional notes for reports'
              placeholderTextColor={Colors.textTertiary}
              multiline
              numberOfLines={3}
              textAlignVertical='top'
            />
          </View>

          {/* Save button */}
          <TouchableOpacity
            style={[
              styles.clinicalSaveBtn,
              clinicalSaved && { backgroundColor: Colors.success },
            ]}
            onPress={handleClinicalSave}
            disabled={clinicalSaving}
            activeOpacity={0.8}>
            {clinicalSaving ? (
              <ActivityIndicator size='small' color='#fff' />
            ) : clinicalSaved ? (
              <>
                <Check size={18} color='#fff' />
                <Text style={styles.clinicalSaveBtnText}>Saved!</Text>
              </>
            ) : (
              <>
                <Save size={18} color='#fff' />
                <Text style={styles.clinicalSaveBtnText}>
                  Save Clinical Details
                </Text>
              </>
            )}
          </TouchableOpacity>
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

  /* Clinical Profile */
  clinicalHint: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs + 1,
    color: Colors.textTertiary,
    lineHeight: 18,
    marginBottom: 16,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  fieldInput: {
    backgroundColor: Colors.surfaceHover,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
  },
  fieldTextArea: {
    minHeight: 56,
    paddingTop: 12,
  },
  sexRow: {
    flexDirection: 'row',
    gap: 10,
  },
  sexBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceHover,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    alignItems: 'center',
  },
  sexBtnActive: {
    backgroundColor: Colors.primaryMuted,
    borderColor: Colors.primary,
  },
  sexBtnText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  sexBtnTextActive: {
    color: Colors.primary,
    fontFamily: FontFamily.semiBold,
  },
  clinicalSaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: 14,
    marginTop: 4,
  },
  clinicalSaveBtnText: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.md,
    color: '#fff',
  },
});
