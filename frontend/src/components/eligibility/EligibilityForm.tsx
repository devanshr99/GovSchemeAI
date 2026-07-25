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
    api.getStates()
      .then(res => setStatesList(res))
      .catch(err => console.error('Failed to load states', err));
  }, []);

  useEffect(() => {
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
      className="glass-panel rounded-2xl p-6 sm:p-8 space-y-6"
      aria-labelledby="form-heading-title"
    >
      {/* Inline Error Banner */}
      {formError && (
        <div 
          role="alert"
          aria-live="assertive"
          className="flex items-start gap-3 p-4 rounded-xl bg-[#FEF2F2] border border-[#FEE2E2] text-sm text-[#F04438] animate-fade-in"
        >
          <AlertTriangle className="h-5 w-5 text-[#F04438] shrink-0 mt-0.5" aria-hidden="true" />
          <div className="flex-1">
            <p className="font-semibold text-[#B42318]">Validation Error</p>
            <p className="text-xs text-[#B42318] mt-0.5">{formError}</p>
          </div>
          <button
            type="button"
            onClick={() => setFormError(null)}
            aria-label="Dismiss error"
            className="ml-auto text-[#B42318] hover:text-[#912018] transition-colors text-xs font-bold cursor-pointer shrink-0 p-1 rounded"
          >
            ✕
          </button>
        </div>
      )}

      <div className="border-b border-[#E4E7EC] pb-4">
        <h2 id="form-heading-title" className="text-xl font-bold text-[#101828] flex items-center gap-2">
          <UserCheck className="h-5 w-5 text-[#2563EB]" aria-hidden="true" />
          {t('formHeading')}
        </h2>
        <p className="text-xs text-[#667085] mt-1">{t('formSubheading')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Age */}
        <div className="space-y-1.5">
          <label htmlFor="age-input" className="text-xs font-semibold text-[#344054] flex items-center gap-1.5 uppercase tracking-wide">
            <Calendar className="h-3.5 w-3.5 text-[#2563EB]" aria-hidden="true" />
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
            className="w-full rounded-xl px-3.5 py-2.5 text-sm bg-white border border-[#E4E7EC] text-[#101828] focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
            required
          />
        </div>

        {/* Gender */}
        <div className="space-y-1.5">
          <label htmlFor="gender-select" className="text-xs font-semibold text-[#344054] flex items-center gap-1.5 uppercase tracking-wide">
            <User className="h-3.5 w-3.5 text-[#2563EB]" aria-hidden="true" />
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
            className="w-full rounded-xl px-3.5 py-2.5 text-sm bg-white border border-[#E4E7EC] text-[#101828] focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
          >
            <option value="male">{t('genderMale')}</option>
            <option value="female">{t('genderFemale')}</option>
            <option value="other">{t('genderOther')}</option>
          </select>
        </div>

        {/* State */}
        <div className="space-y-1.5">
          <label htmlFor="state-select" className="text-xs font-semibold text-[#344054] flex items-center gap-1.5 uppercase tracking-wide">
            <MapPin className="h-3.5 w-3.5 text-[#2563EB]" aria-hidden="true" />
            {t('labelState')}
          </label>
          <select
            id="state-select"
            value={state}
            onChange={(e) => setState(e.target.value)}
            className="w-full rounded-xl px-3.5 py-2.5 text-sm bg-white border border-[#E4E7EC] text-[#101828] focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
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
          <label htmlFor="district-select" className="text-xs font-semibold text-[#344054] flex items-center gap-1.5 uppercase tracking-wide">
            <MapPin className="h-3.5 w-3.5 text-[#2563EB]" aria-hidden="true" />
            {t('labelDistrict')}
          </label>
          <select
            id="district-select"
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            className="w-full rounded-xl px-3.5 py-2.5 text-sm bg-white border border-[#E4E7EC] text-[#101828] focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] disabled:bg-[#F8FAFC] disabled:text-[#98A2B3]"
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
          <label htmlFor="income-input" className="text-xs font-semibold text-[#344054] flex items-center gap-1.5 uppercase tracking-wide">
            <DollarSign className="h-3.5 w-3.5 text-[#2563EB]" aria-hidden="true" />
            {t('labelAnnualIncome')}
          </label>
          <input
            id="income-input"
            type="number"
            min="0"
            step="1000"
            value={annualIncome}
            onChange={(e) => setAnnualIncome(parseFloat(e.target.value) || 0)}
            className="w-full rounded-xl px-3.5 py-2.5 text-sm bg-white border border-[#E4E7EC] text-[#101828] focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
            required
          />
        </div>

        {/* Category */}
        <div className="space-y-1.5">
          <label htmlFor="category-select" className="text-xs font-semibold text-[#344054] flex items-center gap-1.5 uppercase tracking-wide">
            <User className="h-3.5 w-3.5 text-[#2563EB]" aria-hidden="true" />
            {t('labelCategory')}
          </label>
          <select
            id="category-select"
            value={category}
            onChange={(e) => setCategory(e.target.value as any)}
            className="w-full rounded-xl px-3.5 py-2.5 text-sm bg-white border border-[#E4E7EC] text-[#101828] focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
          >
            <option value="general">{t('categoryGeneral')}</option>
            <option value="obc">{t('categoryObc')}</option>
            <option value="sc">{t('categorySc')}</option>
            <option value="st">{t('categorySt')}</option>
          </select>
        </div>

        {/* Occupation */}
        <div className="space-y-1.5">
          <label htmlFor="occupation-select" className="text-xs font-semibold text-[#344054] flex items-center gap-1.5 uppercase tracking-wide">
            <User className="h-3.5 w-3.5 text-[#2563EB]" aria-hidden="true" />
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
            className="w-full rounded-xl px-3.5 py-2.5 text-sm bg-white border border-[#E4E7EC] text-[#101828] focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
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
            <label htmlFor="land-input" className="text-xs font-semibold text-[#344054] flex items-center gap-1.5 uppercase tracking-wide">
              <Sparkles className="h-3.5 w-3.5 text-[#2563EB]" aria-hidden="true" />
              {t('labelLand')}
            </label>
            <input
              id="land-input"
              type="number"
              min="0"
              step="0.1"
              value={landHolding}
              onChange={(e) => setLandHolding(parseFloat(e.target.value) || 0)}
              className="w-full rounded-xl px-3.5 py-2.5 text-sm bg-white border border-[#E4E7EC] text-[#101828] focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
            />
          </div>
        )}
      </div>

      {/* Switches Grid */}
      <fieldset className="border-t border-[#E4E7EC] pt-6 space-y-4">
        <legend className="text-xs text-[#667085] uppercase tracking-wider font-semibold mb-2">Additional Qualifications</legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <label 
            htmlFor="disability-checkbox" 
            className="flex items-center gap-3 p-3 rounded-xl bg-[#F8FAFC] border border-[#E4E7EC] hover:border-[#D0D5DD] cursor-pointer select-none transition-all"
          >
            <input
              id="disability-checkbox"
              type="checkbox"
              checked={disability}
              onChange={(e) => setDisability(e.target.checked)}
              className="h-4 w-4 rounded accent-[#2563EB] cursor-pointer focus:outline-none"
            />
            <span className="text-sm font-medium text-[#344054]">{t('labelDisability')}</span>
          </label>

          <label 
            htmlFor="bpl-checkbox"
            className="flex items-center gap-3 p-3 rounded-xl bg-[#F8FAFC] border border-[#E4E7EC] hover:border-[#D0D5DD] cursor-pointer select-none transition-all"
          >
            <input
              id="bpl-checkbox"
              type="checkbox"
              checked={isBpl}
              onChange={(e) => setIsBpl(e.target.checked)}
              className="h-4 w-4 rounded accent-[#2563EB] cursor-pointer focus:outline-none"
            />
            <span className="text-sm font-medium text-[#344054]">{t('labelBpl')}</span>
          </label>

          <label 
            htmlFor="student-checkbox"
            className="flex items-center gap-3 p-3 rounded-xl bg-[#F8FAFC] border border-[#E4E7EC] hover:border-[#D0D5DD] cursor-pointer select-none transition-all"
          >
            <input
              id="student-checkbox"
              type="checkbox"
              checked={isStudent}
              onChange={(e) => {
                setIsStudent(e.target.checked);
                if (e.target.checked) setOccupation('student');
              }}
              className="h-4 w-4 rounded accent-[#2563EB] cursor-pointer focus:outline-none"
            />
            <span className="text-sm font-medium text-[#344054]">{t('labelStudent')}</span>
          </label>

          <label 
            htmlFor="farmer-checkbox"
            className="flex items-center gap-3 p-3 rounded-xl bg-[#F8FAFC] border border-[#E4E7EC] hover:border-[#D0D5DD] cursor-pointer select-none transition-all"
          >
            <input
              id="farmer-checkbox"
              type="checkbox"
              checked={isFarmer}
              onChange={(e) => {
                setIsFarmer(e.target.checked);
                if (e.target.checked) setOccupation('farmer');
              }}
              className="h-4 w-4 rounded accent-[#2563EB] cursor-pointer focus:outline-none"
            />
            <span className="text-sm font-medium text-[#344054]">{t('labelFarmer')}</span>
          </label>

          <label 
            htmlFor="woman-checkbox"
            className="flex items-center gap-3 p-3 rounded-xl bg-[#F8FAFC] border border-[#E4E7EC] hover:border-[#D0D5DD] cursor-pointer select-none transition-all"
          >
            <input
              id="woman-checkbox"
              type="checkbox"
              checked={isWoman}
              onChange={(e) => setIsWoman(e.target.checked)}
              className="h-4 w-4 rounded accent-[#2563EB] cursor-pointer focus:outline-none"
            />
            <span className="text-sm font-medium text-[#344054]">{t('labelWoman')}</span>
          </label>

          <label 
            htmlFor="senior-checkbox"
            className="flex items-center gap-3 p-3 rounded-xl bg-[#F8FAFC] border border-[#E4E7EC] hover:border-[#D0D5DD] cursor-pointer select-none transition-all"
          >
            <input
              id="senior-checkbox"
              type="checkbox"
              checked={isSenior}
              onChange={(e) => setIsSenior(e.target.checked)}
              className="h-4 w-4 rounded accent-[#2563EB] cursor-pointer focus:outline-none"
            />
            <span className="text-sm font-medium text-[#344054]">{t('labelSenior')}</span>
          </label>
        </div>
      </fieldset>

      <div className="pt-4 flex justify-end">
        <button
          type="submit"
          disabled={formLoading}
          className="w-full sm:w-auto px-8 py-3 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl font-semibold text-sm shadow-sm hover:shadow transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {formLoading ? t('buttonChecking') : t('buttonCheck')}
          <ArrowRight className="h-4 w-4 stroke-[2]" aria-hidden="true" />
        </button>
      </div>
    </form>
  );
};

export default EligibilityForm;
