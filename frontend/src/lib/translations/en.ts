export const en = {
  // Navigation & Layout
  title: "GovSchemeAI",
  subtitle: "National Government Schemes Portal",
  findSchemes: "Eligibility Checker",
  browseSchemes: "All Schemes",
  chatAssistant: "Scheme Advisor",
  about: "About Portal",
  adminPanel: "Admin",
  logout: "Logout",
  navMenuLabel: "Main navigation menu",
  langPickerLabel: "Change language",
  activeLangLabel: "Active language is English",
  comingSoon: "Coming Soon",
  back: "Back",

  // Landing / Hero Section
  heroTitle: "Discover Government Schemes You Qualify For",
  heroSubtitle: "Enter your citizen profile details to evaluate eligibility against official Central and State government scheme guidelines.",
  startChecking: "Check Scheme Eligibility",
  schemesChecked: "schemes indexed",
  eligibleMatches: "eligible schemes found",
  activeSchemes: "Active Schemes",
  categories: "Sectors",

  // Profile Form Labels & Attributes
  formHeading: "Citizen Profile Questionnaire",
  formSubheading: "Evaluated locally against department rules. No data is stored.",
  labelAge: "Age (Years)",
  labelGender: "Gender",
  genderMale: "Male",
  genderFemale: "Female",
  genderOther: "Other",
  labelState: "State / Union Territory",
  labelDistrict: "District",
  labelOccupation: "Occupation Category",
  labelAnnualIncome: "Annual Family Income (₹)",
  labelCategory: "Social Category",
  categoryGeneral: "General",
  categoryObc: "OBC",
  categorySc: "SC",
  categorySt: "ST",
  labelDisability: "Person with Disability (PwD)",
  labelBpl: "Below Poverty Line (BPL Card)",
  labelFarmer: "Farmer / Agricultural Worker",
  labelLand: "Land Holding (Hectares)",
  labelStudent: "Currently Enrolled Student",
  labelWoman: "Applying as Woman Beneficiary",
  labelSenior: "Senior Citizen (60+)",
  buttonCheck: "Check Scheme Eligibility",
  buttonChecking: "Evaluating Criteria...",
  resetForm: "Reset Questionnaire",

  // Occupations List
  occupationFarmer: "Farmer / Agriculture",
  occupationStudent: "Student / Learner",
  occupationHomemaker: "Homemaker",
  occupationUnemployed: "Unemployed Jobseeker",
  occupationSalaried: "Salaried Employee",
  occupationBusiness: "MSME / Self-Employed",
  occupationLaborer: "Daily Wage Worker",

  // Form Validation & Errors
  valAgeMin: "Age cannot be negative",
  valAgeMax: "Age cannot exceed 120 years",
  valIncomeMin: "Annual income cannot be negative",
  valLandMin: "Land holding cannot be negative",
  backendOfflineError: "Cannot connect to the portal backend service. Please check your network connection.",
  generalFormError: "Failed to evaluate scheme eligibility. Please try again.",

  // Results & Schemes Card UI
  matchedResults: "Eligible Government Schemes",
  matchScore: "Eligibility Score",
  benefits: "Scheme Benefits",
  documents: "Required Verification Documents",
  applicationProcess: "Application Workflow",
  applyNow: "Official Apply Link",
  helpline: "Toll-Free Helpline",
  deadline: "Application Deadline",
  explainWhy: "Analyze Criteria",
  close: "Close",
  aiSummaryTitle: "Eligibility Evaluation Summary",
  noDeadline: "Open / Ongoing Scheme",
  loadingSchemes: "Loading scheme records...",
  noSchemesFound: "No government schemes matched your criteria.",
  emptyStatesTitle: "No Schemes Found",
  emptyStatesDesc: "Try adjusting your search query, state, or category filters.",
  loadMore: "Load More Schemes",

  // Chat Interface
  chatPromptPlaceholder: "Ask about application steps, documents, or scheme guidelines...",
  chatWelcome: "Welcome to the Digital Scheme Advisor. I can help answer questions regarding eligibility criteria, required documentation, and application procedures for Central and State schemes.",
  chatSources: "Official Sources",
  chatSending: "Querying records...",
  chatError: "Service temporarily unavailable. Please retry.",
  searchPlaceholder: "Search schemes by title, ministry, or keywords...",
  filterLevel: "Government Level",
  filterCategory: "Target Sector",
  allLevels: "All Levels",
  central: "Central Government",
  state: "State Government",
  allCategories: "All Sectors",

  // Offline / Error States UI
  offlineTitle: "Portal Network Disconnected",
  offlineDesc: "Please check your internet connection. Some live features may be paused.",
  retryBtn: "Reconnect Now",
  successMessage: "Information saved successfully!",
  errorTitle: "Unexpected Error",
  errorDesc: "Something went wrong. Please refresh the page.",

  // Accessibility Announcements
  loadingIndicator: "Loading content, please wait...",
  profileResetAnnounce: "Profile data cleared successfully",
  langChangedAnnounce: "Language changed successfully"
};

export type TranslationType = typeof en;

