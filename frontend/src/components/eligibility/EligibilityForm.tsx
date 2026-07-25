'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../lib/api';
import { EligibilityRequest } from '../../types/eligibility';
import { useRouter } from 'next/navigation';
import { User, DollarSign, Calendar, MapPin, Sparkles, UserCheck, AlertTriangle, ArrowRight } from 'lucide-react';

export const EligibilityForm: React.FC = () => {
  const { checkEligibility, language, t } = useApp();
  const router = useRouter();

  // Form states
  const [age, setAge] = useState<number>(25);
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('female');
  const [state, setState] = useState<string>('UP');
  const [district, setDistrict] = useState<string>('');
  const [occupation, setOccupation] = useState<string>('farmer');
  const [annualIncome, setAnnualIncome] = useState<number>(80000);
  const [category, setCategory] = useState<'general' | 'obc' | 'sc' | 'st'>('general');
  const [disability, setDisability] = useState<boolean>(false);
  const [isBpl, setIsBpl] = useState<boolean>(false);

  // Status flags
  const [isStudent, setIsStudent] = useState<boolean>(false);
  const [isFarmer, setIsFarmer] = useState<boolean>(true);
  const [isWoman, setIsWoman] = useState<boolean>(true);
  const [isSenior, setIsSenior] = useState<boolean>(false);
  const [landHolding, setLandHolding] = useState<number>(1.2);

  // Loaded location lists
  const [statesList, setStatesList] = useState<Array<{ code: string; name: string; name_hi?: string }>>([]);
  const [districtsList, setDistrictsList] = useState<Array<{ id: number; name: string; name_hi?: string }>>([]);
  const [formLoading, setFormLoading] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch states on mount
    api.getStates()
      .then(res => setStatesList(res))
      .catch(err => console.error('Failed to load states', err));
  }, []);

  useEffect(() => {
    // Fetch districts when state changes
    if (state) {
      api.getDistricts(state)
        .then(res => {
          setDistrictsList(res);
          if (res.length > 0) {
            setDistrict(res[0].name);
          } else {
            setDistrict('');
          }
        })
        .catch(err => {
          console.error('Failed to load districts', err);
          setDistrictsList([]);
          setDistrict('');
        });
    }
  }, [state]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);

    // Validate inputs
    if (age < 0) {
      setFormError(t('valAgeMin'));
      setFormLoading(false);
      return;
    }
    if (age > 120) {
      setFormError(t('valAgeMax'));
      setFormLoading(false);
      return;
    }
    if (annualIncome < 0) {
      setFormError(t('valIncomeMin'));
      setFormLoading(false);
      return;
    }
    if (isFarmer && landHolding < 0) {
      setFormError(t('valLandMin'));
      setFormLoading(false);
      return;
    }

    const payload: EligibilityRequest = {
      age,
      gender,
      state,
      district: district || undefined,
      occupation,
      annual_income: annualIncome,
      category,
      disability,
      is_student: isStudent,
      is_farmer: isFarmer,
      is_woman: isWoman,
      is_senior_citizen: isSenior,
      is_bpl: isBpl,
      land_holding_hectares: isFarmer ? landHolding : undefined,
      language: (language === 'hi' ? 'hi' : 'en') as 'en' | 'hi',
    };

    try {
      await checkEligibility(payload);
      router.push('/results');
    } catch (err: unknown) {
      console.error('Eligibility check failed:', err);
      if (err instanceof TypeError && err.message.includes('fetch')) {
        setFormError(t('backendOfflineError'));
      } else if (err instanceof Error) {
        setFormError(err.message || t('generalFormError'));
      } else {
        setFormError(t('generalFormError'));
      }
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <form 
      onSubmit={handleSubmit} 
      className="glass-panel rounded-xl p-6 sm:p-8 space-y-6"
      aria-labelledby="form-heading-title"
    >
      {/* Inline Error Banner */}
      {formError && (
        <div 
          role="alert"
          aria-live="assertive"
          className="flex items-start gap-3 p-4 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-sm text-[#991B1B] animate-fade-in"
        >
          <AlertTriangle className="h-5 w-5 text-[#DC2626] shrink-0 mt-0.5" aria-hidden="true" />
          <div className="flex-1">
            <p className="font-semibold text-[#991B1B]">Error</p>
            <p className="text-xs text-[#B91C1C] mt-0.5">{formError}</p>
          </div>
          <button
            type="button"
            onClick={() => setFormError(null)}
            aria-label="Dismiss error"
            className="ml-auto text-[#B91C1C] hover:text-[#7F1D1D] transition-colors text-xs font-bold cursor-pointer shrink-0 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:outline-none p-1 rounded"
          >
            ✕
          </button>
        </div>
      )}

      <div className="border-b border-[#E5E7EB] pb-4">
        <h2 id="form-heading-title" className="text-xl font-bold text-[#111827] flex items-center gap-2">
          <UserCheck className="h-5 w-5 text-[#0F766E]" aria-hidden="true" />
          {t('formHeading')}
        </h2>
        <p className="text-xs text-[#6B7280] mt-1">{t('formSubheading')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Age */}
        <div className="space-y-1.5">
          <label htmlFor="age-input" className="text-sm font-medium text-[#374151] flex items-center gap-1.5">
            <Calendar className="h-4 w-4 text-[#0F766E]" aria-hidden="true" />
            {t('labelAge')}
          </label>
          <input
            id="age-input"
            type="number"
            min="0"
            max="120"
            value={age}
            onChange={(e) => {
              const val = parseInt(e.target.value) || 0;
              setAge(val);
              setIsSenior(val >= 60);
            }}
            className="w-full rounded-lg px-4 py-2.5 text-sm bg-white border border-[#E5E7EB] text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
            required
          />
        </div>

        {/* Gender */}
        <div className="space-y-1.5">
          <label htmlFor="gender-select" className="text-sm font-medium text-[#374151] flex items-center gap-1.5">
            <User className="h-4 w-4 text-[#0F766E]" aria-hidden="true" />
            {t('labelGender')}
          </label>
          <select
            id="gender-select"
            value={gender}
            onChange={(e) => {
              const val = e.target.value as any;
              setGender(val);
              setIsWoman(val === 'female');
            }}
            className="w-full rounded-lg px-4 py-2.5 text-sm bg-white border border-[#E5E7EB] text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
          >
            <option value="male">{t('genderMale')}</option>
            <option value="female">{t('genderFemale')}</option>
            <option value="other">{t('genderOther')}</option>
          </select>
        </div>

        {/* State */}
        <div className="space-y-1.5">
          <label htmlFor="state-select" className="text-sm font-medium text-[#374151] flex items-center gap-1.5">
            <MapPin className="h-4 w-4 text-[#0F766E]" aria-hidden="true" />
            {t('labelState')}
          </label>
          <select
            id="state-select"
            value={state}
            onChange={(e) => setState(e.target.value)}
            className="w-full rounded-lg px-4 py-2.5 text-sm bg-white border border-[#E5E7EB] text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
          >
            {statesList.map((s) => (
              <option key={s.code} value={s.code}>
                {language === 'hi' && s.name_hi ? s.name_hi : s.name}
              </option>
            ))}
          </select>
        </div>

        {/* District */}
        <div className="space-y-1.5">
          <label htmlFor="district-select" className="text-sm font-medium text-[#374151] flex items-center gap-1.5">
            <MapPin className="h-4 w-4 text-[#0F766E]" aria-hidden="true" />
            {t('labelDistrict')}
          </label>
          <select
            id="district-select"
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            className="w-full rounded-lg px-4 py-2.5 text-sm bg-white border border-[#E5E7EB] text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] disabled:bg-[#F9FAFB] disabled:text-[#9CA3AF]"
            disabled={districtsList.length === 0}
          >
            {districtsList.map((d) => (
              <option key={d.id} value={d.name}>
                {language === 'hi' && d.name_hi ? d.name_hi : d.name}
              </option>
            ))}
            {districtsList.length === 0 && (
              <option value="">No districts loaded</option>
            )}
          </select>
        </div>

        {/* Annual Income */}
        <div className="space-y-1.5">
          <label htmlFor="income-input" className="text-sm font-medium text-[#374151] flex items-center gap-1.5">
            <DollarSign className="h-4 w-4 text-[#0F766E]" aria-hidden="true" />
            {t('labelAnnualIncome')}
          </label>
          <input
            id="income-input"
            type="number"
            min="0"
            step="1000"
            value={annualIncome}
            onChange={(e) => setAnnualIncome(parseFloat(e.target.value) || 0)}
            className="w-full rounded-lg px-4 py-2.5 text-sm bg-white border border-[#E5E7EB] text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
            required
          />
        </div>

        {/* Category */}
        <div className="space-y-1.5">
          <label htmlFor="category-select" className="text-sm font-medium text-[#374151] flex items-center gap-1.5">
            <User className="h-4 w-4 text-[#0F766E]" aria-hidden="true" />
            {t('labelCategory')}
          </label>
          <select
            id="category-select"
            value={category}
            onChange={(e) => setCategory(e.target.value as any)}
            className="w-full rounded-lg px-4 py-2.5 text-sm bg-white border border-[#E5E7EB] text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
          >
            <option value="general">{t('categoryGeneral')}</option>
            <option value="obc">{t('categoryObc')}</option>
            <option value="sc">{t('categorySc')}</option>
            <option value="st">{t('categorySt')}</option>
          </select>
        </div>

        {/* Occupation */}
        <div className="space-y-1.5">
          <label htmlFor="occupation-select" className="text-sm font-medium text-[#374151] flex items-center gap-1.5">
            <User className="h-4 w-4 text-[#0F766E]" aria-hidden="true" />
            {t('labelOccupation')}
          </label>
          <select
            id="occupation-select"
            value={occupation}
            onChange={(e) => {
              const val = e.target.value;
              setOccupation(val);
              setIsFarmer(val === 'farmer');
              setIsStudent(val === 'student');
            }}
            className="w-full rounded-lg px-4 py-2.5 text-sm bg-white border border-[#E5E7EB] text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
          >
            <option value="farmer">{t('occupationFarmer')}</option>
            <option value="student">{t('occupationStudent')}</option>
            <option value="housewife">{t('occupationHomemaker')}</option>
            <option value="unemployed">{t('occupationUnemployed')}</option>
            <option value="salaried">{t('occupationSalaried')}</option>
            <option value="self_employed">{t('occupationBusiness')}</option>
            <option value="laborer">{t('occupationLaborer')}</option>
          </select>
        </div>

        {/* Land holding (if farmer) */}
        {isFarmer && (
          <div className="space-y-1.5 animate-fade-in">
            <label htmlFor="land-input" className="text-sm font-medium text-[#374151] flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-[#0F766E]" aria-hidden="true" />
              {t('labelLand')}
            </label>
            <input
              id="land-input"
              type="number"
              min="0"
              step="0.1"
              value={landHolding}
              onChange={(e) => setLandHolding(parseFloat(e.target.value) || 0)}
              className="w-full rounded-lg px-4 py-2.5 text-sm bg-white border border-[#E5E7EB] text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
            />
          </div>
        )}
      </div>

      {/* Switches Grid */}
      <fieldset className="border-t border-[#E5E7EB] pt-6 space-y-4">
        <legend className="text-xs text-[#6B7280] uppercase tracking-wider font-semibold mb-2">Additional Qualifications</legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Disability */}
          <label 
            htmlFor="disability-checkbox" 
            className="flex items-center gap-3 p-3 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB] hover:border-[#D1D5DB] cursor-pointer select-none transition-all focus-within:ring-2 focus-within:ring-[#0F766E]/20 focus-within:outline-none"
          >
            <input
              id="disability-checkbox"
              type="checkbox"
              checked={disability}
              onChange={(e) => setDisability(e.target.checked)}
              className="h-4 w-4 rounded accent-[#0F766E] cursor-pointer focus:outline-none"
            />
            <span className="text-sm font-medium text-[#374151]">{t('labelDisability')}</span>
          </label>

          {/* BPL */}
          <label 
            htmlFor="bpl-checkbox"
            className="flex items-center gap-3 p-3 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB] hover:border-[#D1D5DB] cursor-pointer select-none transition-all focus-within:ring-2 focus-within:ring-[#0F766E]/20 focus-within:outline-none"
          >
            <input
              id="bpl-checkbox"
              type="checkbox"
              checked={isBpl}
              onChange={(e) => setIsBpl(e.target.checked)}
              className="h-4 w-4 rounded accent-[#0F766E] cursor-pointer focus:outline-none"
            />
            <span className="text-sm font-medium text-[#374151]">{t('labelBpl')}</span>
          </label>

          {/* Student status */}
          <label 
            htmlFor="student-checkbox"
            className="flex items-center gap-3 p-3 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB] hover:border-[#D1D5DB] cursor-pointer select-none transition-all focus-within:ring-2 focus-within:ring-[#0F766E]/20 focus-within:outline-none"
          >
            <input
              id="student-checkbox"
              type="checkbox"
              checked={isStudent}
              onChange={(e) => {
                setIsStudent(e.target.checked);
                if (e.target.checked) setOccupation('student');
              }}
              className="h-4 w-4 rounded accent-[#0F766E] cursor-pointer focus:outline-none"
            />
            <span className="text-sm font-medium text-[#374151]">{t('labelStudent')}</span>
          </label>

          {/* Farmer status */}
          <label 
            htmlFor="farmer-checkbox"
            className="flex items-center gap-3 p-3 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB] hover:border-[#D1D5DB] cursor-pointer select-none transition-all focus-within:ring-2 focus-within:ring-[#0F766E]/20 focus-within:outline-none"
          >
            <input
              id="farmer-checkbox"
              type="checkbox"
              checked={isFarmer}
              onChange={(e) => {
                setIsFarmer(e.target.checked);
                if (e.target.checked) setOccupation('farmer');
              }}
              className="h-4 w-4 rounded accent-[#0F766E] cursor-pointer focus:outline-none"
            />
            <span className="text-sm font-medium text-[#374151]">{t('labelFarmer')}</span>
          </label>

          {/* Woman status */}
          <label 
            htmlFor="woman-checkbox"
            className="flex items-center gap-3 p-3 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB] hover:border-[#D1D5DB] cursor-pointer select-none transition-all focus-within:ring-2 focus-within:ring-[#0F766E]/20 focus-within:outline-none"
          >
            <input
              id="woman-checkbox"
              type="checkbox"
              checked={isWoman}
              onChange={(e) => setIsWoman(e.target.checked)}
              className="h-4 w-4 rounded accent-[#0F766E] cursor-pointer focus:outline-none"
            />
            <span className="text-sm font-medium text-[#374151]">{t('labelWoman')}</span>
          </label>

          {/* Senior Citizen */}
          <label 
            htmlFor="senior-checkbox"
            className="flex items-center gap-3 p-3 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB] hover:border-[#D1D5DB] cursor-pointer select-none transition-all focus-within:ring-2 focus-within:ring-[#0F766E]/20 focus-within:outline-none"
          >
            <input
              id="senior-checkbox"
              type="checkbox"
              checked={isSenior}
              onChange={(e) => setIsSenior(e.target.checked)}
              className="h-4 w-4 rounded accent-[#0F766E] cursor-pointer focus:outline-none"
            />
            <span className="text-sm font-medium text-[#374151]">{t('labelSenior')}</span>
          </label>
        </div>
      </fieldset>

      <div className="pt-4 flex justify-end">
        <button
          type="submit"
          disabled={formLoading}
          className="w-full sm:w-auto px-8 py-3 bg-[#0F766E] hover:bg-[#0D5F59] text-white rounded-lg font-semibold shadow-sm hover:shadow transition-all cursor-pointer flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-[#0F766E]/30 focus-visible:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {formLoading ? t('buttonChecking') : t('buttonCheck')}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </form>
  );
};
export default EligibilityForm;
