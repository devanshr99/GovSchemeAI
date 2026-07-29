export interface SchemeCard {
  id: string;
  name: string;
  name_hi?: string;
  slug: string;
  ministry?: string;
  department?: string;
  level?: string;
  state_code?: string;
  benefits_amount?: string;
  scheme_type: string[];
  tags: string[];
  category_name?: string;
  category_slug?: string;
  category_icon?: string;
  hub_category?: 'student' | 'startup' | 'farmer' | 'women' | 'youth' | string;
  is_active: boolean;
  
  // Advanced eligibility metrics
  match_score?: number;
  match_percentage?: number;
  confidence_score?: number;
  reasons_eligible?: string[];
  reasons_ineligible?: string[];
  alternative_schemes?: SchemeCard[];
}

export interface SchemeDetail extends SchemeCard {
  description?: string;
  description_hi?: string;
  benefits?: string;
  benefits_hi?: string;
  required_documents: string[];
  application_process?: string;
  application_process_hi?: string;
  application_url?: string;
  official_website?: string;
  helpline?: string;
  deadline?: string;
  launched_date?: string;
  eligibility_rules_summary: string[];
  ai_summary?: string;
  related_schemes?: SchemeCard[];
  similar_schemes?: SchemeCard[];
  industry?: string;
  funding_stage?: string;
  renewal_terms?: string;
}

export interface SchemeListResponse {
  total: number;
  page: number;
  page_size: number;
  schemes: SchemeCard[];
}

export interface Category {
  id: number;
  slug: string;
  name: string;
  name_hi?: string;
  icon?: string;
  color?: string;
}

