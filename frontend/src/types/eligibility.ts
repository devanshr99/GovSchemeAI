import { SchemeCard } from './scheme';

export interface EligibilityRequest {
  age: number;
  gender: 'male' | 'female' | 'other';
  state: string;
  district?: string;
  occupation: string;
  annual_income: number;
  category: 'general' | 'obc' | 'sc' | 'st';
  disability: boolean;
  is_student: boolean;
  is_farmer: boolean;
  is_woman: boolean;
  is_senior_citizen: boolean;
  is_bpl: boolean;
  land_holding_hectares?: number;
  language: 'en' | 'hi';
}

export interface EligibleSchemeResult extends SchemeCard {
  match_score: number;
  rules_matched: number;
  rules_total: number;
  ai_explanation?: string;
  benefits?: string;
  benefits_hi?: string;
  required_documents?: string[];
  application_url?: string;
  helpline?: string;
  deadline?: string;
  rules_evaluation?: string[];
}

export interface EligibilityResponse {
  total_schemes_checked: number;
  eligible_count: number;
  schemes: EligibleSchemeResult[];
  profile_summary: string;
  ai_summary?: string;
}
