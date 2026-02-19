import { supabase } from '../lib/supabase';
import * as FileSystem from 'expo-file-system/legacy';

const API_URL = process.env.EXPO_PUBLIC_API_URL!;
const HF_TOKEN = process.env.EXPO_PUBLIC_HF_ACCESS_TOKEN!;

// ─── Types ──────────────────────────────────────────
export interface BrainRegion {
  region_name: string;
  attention_percent: number;
}

export interface PredictionResult {
  predicted_class: string;
  confidence: number; // already a percentage e.g. 97.10
  probabilities: Record<string, number>;
  prediction_id?: string;
  severity_level?: number;
  severity_label?: string;
  class_description?: string;
  input_filename?: string;
  model_version?: string;
  attention_heatmap?: string; // base64
  attention_overlay?: string; // base64
  hufa_stats?: Record<string, any>;
  brain_regions?: BrainRegion[];
  risk_score?: number;
  risk_level?: string;
  attention_coverage_percent?: number;
  confidence_reliability?: string;
  clinical_explanation?: string;
  recommendation?: string;
  normal_comparison_score?: number;
}

export interface Report {
  id: string;
  user_id: string;
  predicted_class: string;
  confidence: number;
  probabilities: Record<string, number>;
  prediction_id?: string;
  severity_level?: number;
  severity_label?: string;
  class_description?: string;
  input_filename?: string;
  model_version?: string;
  attention_heatmap?: string;
  attention_overlay?: string;
  hufa_stats?: Record<string, any>;
  brain_regions?: BrainRegion[];
  risk_score?: number;
  risk_level?: string;
  attention_coverage_percent?: number;
  confidence_reliability?: string;
  clinical_explanation?: string;
  recommendation?: string;
  normal_comparison_score?: number;
  created_at: string;
}

// ─── ML Prediction via HF Spaces (same as website) ──
export async function predictScan(imageUri: string): Promise<PredictionResult> {
  const formData = new FormData();
  const filename = imageUri.split('/').pop() || 'scan.jpg';
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : 'image/jpeg';

  formData.append('file', {
    uri: imageUri,
    name: filename,
    type,
  } as any);

  const response = await fetch(`${API_URL}/predict`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${HF_TOKEN}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Prediction failed: ${response.status} ${text}`);
  }

  const data = await response.json();
  return {
    predicted_class: data.predicted_class || data.prediction,
    confidence: data.confidence,
    probabilities: data.probabilities,
    prediction_id: data.prediction_id,
    severity_level: data.severity_level,
    severity_label: data.severity_label,
    class_description: data.class_description,
    input_filename: data.input_filename,
    model_version: data.model_version,
    attention_heatmap: data.attention_heatmap,
    attention_overlay: data.attention_overlay,
    hufa_stats: data.hufa_stats,
    brain_regions: data.brain_regions,
    risk_score: data.risk_score,
    risk_level: data.risk_level,
    attention_coverage_percent: data.attention_coverage_percent,
    confidence_reliability: data.confidence_reliability,
    clinical_explanation: data.clinical_explanation,
    recommendation: data.recommendation,
    normal_comparison_score: data.normal_comparison_score,
  };
}

// ─── Save report to Supabase ──────────────────────
export async function saveReport(
  userId: string,
  result: PredictionResult,
): Promise<Report | null> {
  const { data, error } = await supabase
    .from('neuroscan_reports')
    .insert({
      user_id: userId,
      predicted_class: result.predicted_class,
      confidence: result.confidence,
      probabilities: result.probabilities,
      prediction_id: result.prediction_id || null,
      severity_level: result.severity_level ?? null,
      severity_label: result.severity_label || null,
      class_description: result.class_description || null,
      input_filename: result.input_filename || null,
      model_version: result.model_version || null,
      attention_heatmap: result.attention_heatmap || null,
      attention_overlay: result.attention_overlay || null,
      hufa_stats: result.hufa_stats || null,
      brain_regions: result.brain_regions || null,
      risk_score: result.risk_score ?? null,
      risk_level: result.risk_level || null,
      attention_coverage_percent: result.attention_coverage_percent ?? null,
      confidence_reliability: result.confidence_reliability || null,
      clinical_explanation: result.clinical_explanation || null,
      recommendation: result.recommendation || null,
      normal_comparison_score: result.normal_comparison_score ?? null,
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving report:', error);
    return null;
  }
  return data;
}

// ─── Fetch user reports from Supabase ─────────────
export async function fetchReports(userId: string): Promise<Report[]> {
  const { data, error } = await supabase
    .from('neuroscan_reports')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching reports:', error);
    return [];
  }
  return data || [];
}

// ─── Fetch a single report ─────────────────────────
export async function fetchReport(reportId: string): Promise<Report | null> {
  const { data, error } = await supabase
    .from('neuroscan_reports')
    .select('*')
    .eq('id', reportId)
    .single();

  if (error) {
    console.error('Error fetching report:', error);
    return null;
  }
  return data;
}

// ─── Delete a report ────────────────────────────────
export async function deleteReport(reportId: string): Promise<boolean> {
  const { error } = await supabase
    .from('neuroscan_reports')
    .delete()
    .eq('id', reportId);

  if (error) {
    console.error('Error deleting report:', error);
    return false;
  }
  return true;
}

// ─── Update profile ─────────────────────────────────
export async function updateProfile(
  userId: string,
  updates: {
    full_name?: string;
    avatar_url?: string;
    age?: number | null;
    sex?: string | null;
    date_of_birth?: string | null;
    blood_group?: string | null;
    known_conditions?: string | null;
    current_medications?: string | null;
    allergies?: string | null;
    family_history?: string | null;
    clinical_notes?: string | null;
  },
): Promise<boolean> {
  const { error } = await supabase
    .from('neuroscan_profiles')
    .update(updates)
    .eq('id', userId);

  if (error) {
    console.error('Error updating profile:', error);
    return false;
  }
  return true;
}

// ─── Fetch timeline data for a user ─────────────────
export interface TimelineEntry {
  id: string;
  predicted_class: string;
  confidence: number | null;
  severity_label: string | null;
  risk_score: number | null;
  risk_level: string | null;
  created_at: string;
}

export async function fetchTimeline(userId: string): Promise<TimelineEntry[]> {
  const { data, error } = await supabase
    .from('neuroscan_reports')
    .select(
      'id, predicted_class, confidence, severity_label, risk_score, risk_level, created_at',
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching timeline:', error);
    return [];
  }
  return data || [];
}

// ─── Generate PDF report ────────────────────────────
export async function generatePdfReport(
  report: Report,
  patientName?: string,
  patientDetails?: Record<string, any> | null,
  timelineHistory?: TimelineEntry[] | null,
): Promise<string | null> {
  try {
    const payload: Record<string, any> = {
      predicted_class: report.predicted_class,
      confidence: report.confidence,
      probabilities: report.probabilities,
      severity_level: report.severity_level,
      severity_label: report.severity_label,
      class_description: report.class_description,
      model_version: report.model_version,
      risk_score: report.risk_score,
      risk_level: report.risk_level,
      attention_coverage_percent: report.attention_coverage_percent,
      confidence_reliability: report.confidence_reliability,
      clinical_explanation: report.clinical_explanation,
      recommendation: report.recommendation,
      normal_comparison_score: report.normal_comparison_score,
      brain_regions: report.brain_regions,
      hufa_stats: report.hufa_stats,
      attention_heatmap: report.attention_heatmap,
      attention_overlay: report.attention_overlay,
      patient_name: patientName || 'Patient',
      patient_details: patientDetails || {},
      timeline_history: timelineHistory || [],
    };

    // Build local filename
    const safeName = (patientName || 'patient')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .substring(0, 30);
    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, '-')
      .substring(0, 19);
    const filename = `neuroscan_report_${safeName}_${timestamp}.pdf`;
    const fileUri = `${FileSystem.documentDirectory}${filename}`;

    // POST fetch + arrayBuffer → base64 conversion (RN compatible)
    const response = await fetch(`${API_URL}/report/pdf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${HF_TOKEN}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      throw new Error(`PDF generation failed: ${response.status} ${errText}`);
    }

    // Convert response to base64 using arrayBuffer (works in RN)
    const arrayBuffer = await response.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64data = btoa(binary);

    await FileSystem.writeAsStringAsync(fileUri, base64data, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Verify file was written
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    if (!fileInfo.exists) {
      throw new Error('PDF file was not saved');
    }

    return fileUri;
  } catch (e) {
    console.error('PDF generation error:', e);
    return null;
  }
}
