import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ScrollView,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Stethoscope,
  Star,
  Clock,
  Phone,
  MessageCircle,
  Calendar,
  MapPin,
  Globe,
  ChevronDown,
  ChevronUp,
} from 'lucide-react-native';
import {
  Colors,
  Spacing,
  BorderRadius,
  FontSize,
  FontFamily,
  Shadows,
} from '../../src/constants/theme';
import { useAuth } from '../../src/contexts/AuthContext';

/* ── Same doctor data as the website (hardcoded, not from Supabase) ── */
const DOCTORS = [
  {
    id: 'd1',
    name: 'Dr. Ananya Sharma',
    specialty: 'Neurologist',
    hospital: 'AIIMS, New Delhi',
    experience: '18 years',
    rating: 4.9,
    reviews: 342,
    initials: 'AS',
    available: true,
    nextSlot: 'Today, 3:00 PM',
    fee: '\u20B9800',
    languages: ['English', 'Hindi'],
    bio: "Specializes in neurodegenerative disorders, with extensive research in Alzheimer's and dementia diagnostics.",
  },
  {
    id: 'd2',
    name: 'Dr. Rajesh Menon',
    specialty: 'Geriatric Psychiatrist',
    hospital: 'Fortis Hospital, Mumbai',
    experience: '14 years',
    rating: 4.8,
    reviews: 218,
    initials: 'RM',
    available: true,
    nextSlot: 'Tomorrow, 10:00 AM',
    fee: '\u20B9700',
    languages: ['English', 'Hindi', 'Malayalam'],
    bio: 'Focuses on cognitive decline in the elderly, behavioral management, and caregiver counseling.',
  },
  {
    id: 'd3',
    name: 'Dr. Priya Nair',
    specialty: 'Neuroradiologist',
    hospital: 'Apollo Hospitals, Chennai',
    experience: '12 years',
    rating: 4.7,
    reviews: 156,
    initials: 'PN',
    available: false,
    nextSlot: 'Feb 20, 11:00 AM',
    fee: '\u20B9900',
    languages: ['English', 'Tamil'],
    bio: 'Expert in MRI brain imaging and interpretation, specializing in early detection of neurodegenerative changes.',
  },
  {
    id: 'd4',
    name: 'Dr. Vikram Desai',
    specialty: 'Neuropsychologist',
    hospital: 'Manipal Hospital, Bangalore',
    experience: '10 years',
    rating: 4.6,
    reviews: 189,
    initials: 'VD',
    available: true,
    nextSlot: 'Today, 5:30 PM',
    fee: '\u20B9650',
    languages: ['English', 'Hindi', 'Kannada'],
    bio: 'Provides cognitive assessments, neuropsychological testing, and rehabilitation plans for dementia patients.',
  },
  {
    id: 'd5',
    name: 'Dr. Meera Kapoor',
    specialty: 'Neurologist',
    hospital: 'Max Hospital, Gurugram',
    experience: '22 years',
    rating: 4.9,
    reviews: 487,
    initials: 'MK',
    available: true,
    nextSlot: 'Today, 4:15 PM',
    fee: '\u20B91200',
    languages: ['English', 'Hindi', 'Punjabi'],
    bio: 'Renowned neurologist specializing in dementia care, movement disorders, and clinical trials for neurodegenerative diseases.',
  },
  {
    id: 'd6',
    name: 'Dr. Arjun Patel',
    specialty: 'Geriatrician',
    hospital: 'Kokilaben Hospital, Mumbai',
    experience: '16 years',
    rating: 4.7,
    reviews: 264,
    initials: 'AP',
    available: false,
    nextSlot: 'Feb 21, 9:00 AM',
    fee: '\u20B9750',
    languages: ['English', 'Hindi', 'Gujarati'],
    bio: 'Specializes in comprehensive geriatric assessment and long-term management of dementia and age-related conditions.',
  },
];

const SPECIALTIES = [
  'All',
  'Neurologist',
  'Geriatric Psychiatrist',
  'Neuroradiologist',
  'Neuropsychologist',
  'Geriatrician',
];

type Doctor = (typeof DOCTORS)[number];

export default function DoctorsScreen() {
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState('All');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredDoctors =
    activeFilter === 'All'
      ? DOCTORS
      : DOCTORS.filter((d) => d.specialty === activeFilter);

  const requireAuth = (action: string) => {
    if (!user) {
      Alert.alert('Sign In Required', `Please sign in to ${action}.`);
      return false;
    }
    return true;
  };

  const handleChat = (doc: Doctor) => {
    if (!requireAuth('chat with doctors')) return;
    Alert.alert(
      'Chat',
      `Chat with ${doc.name} will be available soon. We're working on enabling in-app messaging.`,
    );
  };

  const handleCall = (doc: Doctor) => {
    if (!requireAuth('call doctors')) return;
    Alert.alert('Call', `Connecting you with ${doc.name}...`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Call Now',
        onPress: () => Linking.openURL('tel:+911234567890'),
      },
    ]);
  };

  const handleBook = (doc: Doctor) => {
    if (!requireAuth('book appointments')) return;
    Alert.alert(
      'Book Appointment',
      `Next available slot with ${doc.name}:\n${doc.nextSlot}\nFee: ${doc.fee}\n\nAppointment booking will be available soon.`,
    );
  };

  const renderDoctor = ({ item }: { item: Doctor }) => {
    const expanded = expandedId === item.id;
    return (
      <View style={styles.card}>
        <TouchableOpacity
          style={styles.cardHeader}
          activeOpacity={0.7}
          onPress={() => setExpandedId(expanded ? null : item.id)}>
          {/* Avatar */}
          <LinearGradient
            colors={
              item.available
                ? ([...Colors.gradientPrimary] as [string, string, ...string[]])
                : (['#94A3B8', '#64748B'] as [string, string, ...string[]])
            }
            style={styles.avatar}>
            <Text style={styles.avatarText}>{item.initials}</Text>
          </LinearGradient>

          {/* Info */}
          <View style={styles.cardInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.name} numberOfLines={1}>
                {item.name}
              </Text>
              {item.available && <View style={styles.availDot} />}
            </View>
            <Text style={styles.specialty}>{item.specialty}</Text>
            <View style={styles.metaRow}>
              <Star size={12} color='#F59E0B' fill='#F59E0B' />
              <Text style={styles.rating}>
                {item.rating} ({item.reviews})
              </Text>
              <Text style={styles.metaDivider}>|</Text>
              <Text style={styles.experience}>{item.experience}</Text>
            </View>
          </View>

          {/* Expand */}
          {expanded ? (
            <ChevronUp size={18} color={Colors.textTertiary} />
          ) : (
            <ChevronDown size={18} color={Colors.textTertiary} />
          )}
        </TouchableOpacity>

        {expanded && (
          <View style={styles.expandedSection}>
            {/* Details */}
            <Text style={styles.bio}>{item.bio}</Text>

            <View style={styles.detailRow}>
              <MapPin size={14} color={Colors.textTertiary} />
              <Text style={styles.detailText}>{item.hospital}</Text>
            </View>
            <View style={styles.detailRow}>
              <Clock size={14} color={Colors.textTertiary} />
              <Text style={styles.detailText}>Next: {item.nextSlot}</Text>
            </View>
            <View style={styles.detailRow}>
              <Globe size={14} color={Colors.textTertiary} />
              <Text style={styles.detailText}>{item.languages.join(', ')}</Text>
            </View>

            <View style={styles.feeRow}>
              <Text style={styles.feeLabel}>Consultation Fee</Text>
              <Text style={styles.feeValue}>{item.fee}</Text>
            </View>

            {/* Actions */}
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => handleChat(item)}
                activeOpacity={0.7}>
                <MessageCircle size={16} color={Colors.primary} />
                <Text style={styles.actionText}>Chat</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => handleCall(item)}
                activeOpacity={0.7}>
                <Phone size={16} color={Colors.primary} />
                <Text style={styles.actionText}>Call</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, styles.bookBtn]}
                onPress={() => handleBook(item)}
                activeOpacity={0.7}>
                <Calendar size={16} color='#fff' />
                <Text style={[styles.actionText, { color: '#fff' }]}>Book</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Stethoscope size={24} color={Colors.primary} />
        <Text style={styles.title}>Doctors</Text>
        <Text style={styles.subtitle}>
          Consult specialists for your scan results
        </Text>
      </View>

      {/* Specialty Filter */}
      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}>
          {SPECIALTIES.map((sp) => (
            <TouchableOpacity
              key={sp}
              style={[
                styles.filterChip,
                activeFilter === sp && styles.filterChipActive,
              ]}
              onPress={() => setActiveFilter(sp)}
              activeOpacity={0.7}>
              <Text
                style={[
                  styles.filterText,
                  activeFilter === sp && styles.filterTextActive,
                ]}>
                {sp}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Doctor List */}
      <FlatList
        data={filteredDoctors}
        keyExtractor={(item) => item.id}
        renderItem={renderDoctor}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Stethoscope size={40} color={Colors.textTertiary} />
            <Text style={styles.emptyText}>
              No doctors found for this specialty.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing['2xl'],
    paddingBottom: Spacing.md,
  },
  title: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize['2xl'],
    color: Colors.textPrimary,
    marginTop: Spacing.sm,
  },
  subtitle: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 4,
  },

  /* Filter */
  filterContainer: {
    paddingBottom: Spacing.md,
  },
  filterScroll: {
    paddingHorizontal: Spacing.xl,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  filterChipActive: {
    backgroundColor: Colors.primaryMuted,
    borderColor: Colors.primaryLight,
  },
  filterText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  filterTextActive: {
    color: Colors.primary,
    fontFamily: FontFamily.semiBold,
  },

  /* List */
  list: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: 120,
  },

  /* Card */
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginBottom: 12,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarText: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.md,
    color: '#fff',
  },
  cardInfo: { flex: 1 },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    flexShrink: 1,
  },
  availDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#22C55E',
  },
  specialty: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    color: Colors.primary,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  rating: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  metaDivider: {
    color: Colors.textTertiary,
    fontSize: FontSize.xs,
    marginHorizontal: 2,
  },
  experience: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
  },

  /* Expanded */
  expandedSection: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.cardBorder,
    paddingTop: Spacing.md,
  },
  bio: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 14,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  detailText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs + 1,
    color: Colors.textSecondary,
  },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.primaryMuted,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 6,
    marginBottom: 16,
  },
  feeLabel: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  feeValue: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.md,
    color: Colors.primary,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.primaryMuted,
    borderWidth: 1,
    borderColor: Colors.primaryGlow,
  },
  bookBtn: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  actionText: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.sm,
    color: Colors.primary,
  },

  /* Empty */
  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
    gap: 12,
  },
  emptyText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
});
