export interface SchemeCard {
  id: string;
  name: string;
  name_hi?: string;
  slug: string;
  ministry?: string;
  ministry_name?: string;
  level?: string;
  state_code?: string;
  state_name?: string;
  benefits_amount?: string;
  scheme_type: string[];
  tags: string[];
  category_name?: string;
  category_icon?: string;
  application_url?: string;
  portal_url?: string;
  is_active: boolean;
}

export interface SchemeDetail extends SchemeCard {
  description?: string;
  description_hi?: string;
  benefits?: string;
  benefits_description?: string;
  benefits_hi?: string;
  required_documents: string[];
  documents_required?: string;
  eligibility_criteria?: string;
  eligibility_criteria_hi?: string;
  application_process?: string;
  application_process_hi?: string;
  application_url?: string;
  official_website?: string;
  portal_url?: string;
  helpline?: string;
  deadline?: string;
  launched_date?: string;
  eligibility_rules_summary: string[];
  ai_summary?: string;
  related_schemes?: SchemeCard[];
  similar_schemes?: SchemeCard[];
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
