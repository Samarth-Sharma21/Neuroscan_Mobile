import { supabase } from '../lib/supabase';
import * as FileSystem from 'expo-file-system';

const API_URL = process.env.EXPO_PUBLIC_API_URL!;
const HF_TOKEN = process.env.EXPO_PUBLIC_HF_ACCESS_TOKEN!;

// ─── Types ──────────────────────────────────────────
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
}

export interface Report {
  id: string;
  user_id: string;
  predicted_class: string;
  confidence: number; // already a percentage e.g. 97.10
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
    confidence: data.confidence, // already a percentage from API
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
  updates: { full_name?: string; avatar_url?: string },
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
