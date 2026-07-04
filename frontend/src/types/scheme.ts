export interface SchemeCard {
  id: string;
  name: string;
  name_hi?: string;
  slug: string;
  ministry?: string;
  level?: string;
  state_code?: string;
  benefits_amount?: string;
  scheme_type: string[];
  tags: string[];
  category_name?: string;
  category_icon?: string;
  is_active: boolean;
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
