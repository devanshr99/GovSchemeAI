'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../lib/api';
import { EligibilityRequest } from '../../types/eligibility';
import { useRouter } from 'next/navigation';
import { 
  User, 
  IndianRupee, 
  Calendar, 
  MapPin, 
  Sparkles, 
  UserCheck, 
  AlertTriangle,
  Loader2,
  Briefcase
} from 'lucide-react';

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
      className="gov-card p-6 sm:p-7 space-y-6 relative overflow-hidden border border-white/[0.08]"
      aria-labelledby="form-heading-title"
    >
      {/* Top Subtle Stripe Accent */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-600 via-purple-400 to-cyan-500" />

      {/* Error Banner */}
      {formError && (
        <div 
          role="alert"
          aria-live="assertive"
          className="flex items-start gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-sm text-rose-300 animate-fade-in"
        >
          <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" aria-hidden="true" />
          <div className="flex-1">
            <p className="font-semibold text-rose-300">Validation Notice</p>
            <p className="text-xs text-rose-400 mt-0.5">{formError}</p>
          </div>
          <button
            type="button"
            onClick={() => setFormError(null)}
            aria-label="Dismiss error"
            className="ml-auto text-rose-400 hover:text-rose-200 transition-colors text-xs font-bold cursor-pointer shrink-0 p-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Form Header */}
      <div className="border-b border-white/[0.06] pb-4">
        <h2 id="form-heading-title" className="font-heading text-lg sm:text-xl font-bold text-slate-100 flex items-center gap-2">
          <UserCheck className="h-5 w-5 text-purple-400" aria-hidden="true" />
          <span>Citizen Eligibility Quick-Scan</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Instant rule-based matching against Central and State welfare matrices.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Age */}
        <div className="space-y-1.5">
          <label htmlFor="age-input" className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-purple-400" aria-hidden="true" />
            <span>{t('labelAge')}</span>
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
            className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#0E1017] border border-white/[0.08] text-slate-100 focus:border-purple-500"
            required
          />
        </div>

        {/* Gender */}
        <div className="space-y-1.5">
          <label htmlFor="gender-select" className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <User className="h-3.5 w-3.5 text-purple-400" aria-hidden="true" />
            <span>{t('labelGender')}</span>
          </label>
          <select
            id="gender-select"
            value={gender}
            onChange={(e) => {
              const val = e.target.value as 'male' | 'female' | 'other';
              setGender(val);
              setIsWoman(val === 'female');
            }}
            className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#0E1017] border border-white/[0.08] text-slate-100 focus:border-purple-500"
          >
            <option value="male">{t('genderMale')}</option>
            <option value="female">{t('genderFemale')}</option>
            <option value="other">{t('genderOther')}</option>
          </select>
        </div>

        {/* State */}
        <div className="space-y-1.5">
          <label htmlFor="state-select" className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-purple-400" aria-hidden="true" />
            <span>{t('labelState')}</span>
          </label>
          <select
            id="state-select"
            value={state}
            onChange={(e) => setState(e.target.value)}
            className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#0E1017] border border-white/[0.08] text-slate-100 focus:border-purple-500"
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
          <label htmlFor="district-select" className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-purple-400" aria-hidden="true" />
            <span>{t('labelDistrict')}</span>
          </label>
          <select
            id="district-select"
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#0E1017] border border-white/[0.08] text-slate-100 focus:border-purple-500"
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
          <label htmlFor="income-input" className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <IndianRupee className="h-3.5 w-3.5 text-purple-400" aria-hidden="true" />
            <span>{t('labelAnnualIncome')} (₹/year)</span>
          </label>
          <input
            id="income-input"
            type="number"
            min="0"
            step="1000"
            value={annualIncome}
            onChange={(e) => setAnnualIncome(parseFloat(e.target.value) || 0)}
            className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#0E1017] border border-white/[0.08] text-slate-100 focus:border-purple-500"
            required
          />
        </div>

        {/* Category */}
        <div className="space-y-1.5">
          <label htmlFor="category-select" className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <User className="h-3.5 w-3.5 text-purple-400" aria-hidden="true" />
            <span>{t('labelCategory')}</span>
          </label>
          <select
            id="category-select"
            value={category}
            onChange={(e) => setCategory(e.target.value as 'general' | 'obc' | 'sc' | 'st')}
            className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#0E1017] border border-white/[0.08] text-slate-100 focus:border-purple-500"
          >
            <option value="general">{t('categoryGeneral')}</option>
            <option value="obc">{t('categoryObc')}</option>
            <option value="sc">{t('categorySc')}</option>
            <option value="st">{t('categorySt')}</option>
          </select>
        </div>

        {/* Occupation */}
        <div className="space-y-1.5 sm:col-span-2">
          <label htmlFor="occupation-select" className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Briefcase className="h-3.5 w-3.5 text-purple-400" aria-hidden="true" />
            <span>{t('labelOccupation')}</span>
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
            className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#0E1017] border border-white/[0.08] text-slate-100 focus:border-purple-500"
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
          <div className="space-y-1.5 sm:col-span-2 animate-fade-in">
            <label htmlFor="land-input" className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-purple-400" aria-hidden="true" />
              <span>{t('labelLand')} (Hectares)</span>
            </label>
            <input
              id="land-input"
              type="number"
              min="0"
              step="0.1"
              value={landHolding}
              onChange={(e) => setLandHolding(parseFloat(e.target.value) || 0)}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#0E1017] border border-white/[0.08] text-slate-100 focus:border-purple-500"
            />
          </div>
        )}
      </div>

      {/* Welfare Criteria Switches Grid */}
      <fieldset className="border-t border-white/[0.06] pt-4 space-y-2.5">
        <legend className="text-[10px] text-slate-400 uppercase tracking-wider font-extrabold mb-1">
          Target Welfare Parameters
        </legend>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {/* Disability */}
          <label 
            htmlFor="disability-checkbox" 
            className="flex items-center gap-2 p-2.5 rounded-xl bg-[#0E1017] border border-white/[0.08] hover:border-purple-500/40 cursor-pointer select-none transition-colors"
          >
            <input
              id="disability-checkbox"
              type="checkbox"
              checked={disability}
              onChange={(e) => setDisability(e.target.checked)}
              className="h-4 w-4 rounded accent-purple-600 cursor-pointer"
            />
            <span className="text-xs font-medium text-slate-300">{t('labelDisability')}</span>
          </label>

          {/* BPL */}
          <label 
            htmlFor="bpl-checkbox"
            className="flex items-center gap-2 p-2.5 rounded-xl bg-[#0E1017] border border-white/[0.08] hover:border-purple-500/40 cursor-pointer select-none transition-colors"
          >
            <input
              id="bpl-checkbox"
              type="checkbox"
              checked={isBpl}
              onChange={(e) => setIsBpl(e.target.checked)}
              className="h-4 w-4 rounded accent-purple-600 cursor-pointer"
            />
            <span className="text-xs font-medium text-slate-300">{t('labelBpl')}</span>
          </label>

          {/* Student */}
          <label 
            htmlFor="student-checkbox"
            className="flex items-center gap-2 p-2.5 rounded-xl bg-[#0E1017] border border-white/[0.08] hover:border-purple-500/40 cursor-pointer select-none transition-colors"
          >
            <input
              id="student-checkbox"
              type="checkbox"
              checked={isStudent}
              onChange={(e) => {
                setIsStudent(e.target.checked);
                if (e.target.checked) setOccupation('student');
              }}
              className="h-4 w-4 rounded accent-purple-600 cursor-pointer"
            />
            <span className="text-xs font-medium text-slate-300">{t('labelStudent')}</span>
          </label>

          {/* Farmer */}
          <label 
            htmlFor="farmer-checkbox"
            className="flex items-center gap-2 p-2.5 rounded-xl bg-[#0E1017] border border-white/[0.08] hover:border-purple-500/40 cursor-pointer select-none transition-colors"
          >
            <input
              id="farmer-checkbox"
              type="checkbox"
              checked={isFarmer}
              onChange={(e) => {
                setIsFarmer(e.target.checked);
                if (e.target.checked) setOccupation('farmer');
              }}
              className="h-4 w-4 rounded accent-purple-600 cursor-pointer"
            />
            <span className="text-xs font-medium text-slate-300">{t('labelFarmer')}</span>
          </label>

          {/* Woman */}
          <label 
            htmlFor="woman-checkbox"
            className="flex items-center gap-2 p-2.5 rounded-xl bg-[#0E1017] border border-white/[0.08] hover:border-purple-500/40 cursor-pointer select-none transition-colors"
          >
            <input
              id="woman-checkbox"
              type="checkbox"
              checked={isWoman}
              onChange={(e) => setIsWoman(e.target.checked)}
              className="h-4 w-4 rounded accent-purple-600 cursor-pointer"
            />
            <span className="text-xs font-medium text-slate-300">{t('labelWoman')}</span>
          </label>

          {/* Senior */}
          <label 
            htmlFor="senior-checkbox"
            className="flex items-center gap-2 p-2.5 rounded-xl bg-[#0E1017] border border-white/[0.08] hover:border-purple-500/40 cursor-pointer select-none transition-colors"
          >
            <input
              id="senior-checkbox"
              type="checkbox"
              checked={isSenior}
              onChange={(e) => {
                setIsSenior(e.target.checked);
                if (e.target.checked && age < 60) setAge(60);
              }}
              className="h-4 w-4 rounded accent-purple-600 cursor-pointer"
            />
            <span className="text-xs font-medium text-slate-300">{t('labelSenior')}</span>
          </label>
        </div>
      </fieldset>

      {/* Submit Button */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={formLoading}
          className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold shadow-md shadow-purple-600/25 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2 text-xs"
        >
          {formLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              <span>{t('buttonChecking')}</span>
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 text-purple-200" aria-hidden="true" />
              <span>Evaluate Eligible Schemes</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default EligibilityForm;
