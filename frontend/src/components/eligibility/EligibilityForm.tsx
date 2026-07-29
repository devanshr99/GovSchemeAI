'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../lib/api';
import { EligibilityRequest } from '../../types/eligibility';
import { useRouter } from 'next/navigation';
import { User, DollarSign, Calendar, MapPin, UserCheck, AlertTriangle, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';

export const EligibilityForm: React.FC = () => {
  const { checkEligibility, language, t } = useApp();
  const router = useRouter();

  // Active Form Step (1: Demographics, 2: Income & Occupation, 3: Social Category & Criteria)
  const [activeStep, setActiveStep] = useState<number>(1);

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

    if (age < 0 || age > 120) {
      setFormError(t(age < 0 ? 'valAgeMin' : 'valAgeMax'));
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
      className="gov-card rounded-3xl p-6 sm:p-8 space-y-6 border border-slate-200 shadow-md bg-white"
      aria-labelledby="form-heading-title"
    >
      {/* Inline Error Banner */}
      {formError && (
        <div 
          role="alert"
          aria-live="assertive"
          className="flex items-start gap-3 p-4 rounded-2xl bg-red-50 border border-red-200 text-sm text-red-800 animate-fade-in"
        >
          <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" aria-hidden="true" />
          <div className="flex-1">
            <p className="font-bold text-red-900">Validation Notice</p>
            <p className="text-xs text-red-700 mt-0.5">{formError}</p>
          </div>
          <button
            type="button"
            onClick={() => setFormError(null)}
            aria-label="Dismiss error"
            className="text-red-500 hover:text-red-700 transition-colors text-xs font-bold cursor-pointer shrink-0 p-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header Title & Subtitle */}
      <div className="border-b border-slate-100 pb-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h2 id="form-heading-title" className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2.5">
            <UserCheck className="h-5 w-5 text-blue-600" aria-hidden="true" />
            {t('formHeading')}
          </h2>
          <span className="text-[10px] uppercase font-extrabold tracking-wider px-2.5 py-1 rounded-md bg-blue-50 border border-blue-200 text-blue-800 w-fit">
            Official Evaluation Engine
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-1">{t('formSubheading')}</p>

        {/* Step Navigation Progress Bar */}
        <div className="flex items-center gap-2 mt-5 pt-3 border-t border-slate-100">
          {[
            { num: 1, label: 'Basic Profile' },
            { num: 2, label: 'Income & Work' },
            { num: 3, label: 'Special Criteria' }
          ].map((s) => (
            <button
              key={s.num}
              type="button"
              onClick={() => setActiveStep(s.num)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold transition-all border ${
                activeStep === s.num
                  ? 'bg-blue-50 text-blue-800 border-blue-300 shadow-2xs font-bold'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span className={`h-5 w-5 rounded-full text-[10px] font-bold flex items-center justify-center ${
                activeStep === s.num ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
              }`}>
                {s.num}
              </span>
              <span className="hidden sm:inline">{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Step 1: Basic Profile */}
      {activeStep === 1 && (
        <div className="space-y-5 animate-fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Age */}
            <div className="space-y-1.5">
              <label htmlFor="age-input" className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-blue-600" aria-hidden="true" />
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
                className="w-full rounded-xl px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-blue-600"
                required
              />
            </div>

            {/* Gender */}
            <div className="space-y-1.5">
              <label htmlFor="gender-select" className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-blue-600" aria-hidden="true" />
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
                className="w-full rounded-xl px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-blue-600"
              >
                <option value="male">{t('genderMale')}</option>
                <option value="female">{t('genderFemale')}</option>
                <option value="other">{t('genderOther')}</option>
              </select>
            </div>

            {/* State */}
            <div className="space-y-1.5">
              <label htmlFor="state-select" className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-blue-600" aria-hidden="true" />
                {t('labelState')}
              </label>
              <select
                id="state-select"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full rounded-xl px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-blue-600"
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
              <label htmlFor="district-select" className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-blue-600" aria-hidden="true" />
                {t('labelDistrict')}
              </label>
              <select
                id="district-select"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full rounded-xl px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-blue-600"
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
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setActiveStep(2)}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-sm"
            >
              <span>Next: Income & Work</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Income & Occupation */}
      {activeStep === 2 && (
        <div className="space-y-5 animate-fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Annual Income */}
            <div className="space-y-1.5">
              <label htmlFor="income-input" className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <DollarSign className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
                {t('labelAnnualIncome')}
              </label>
              <input
                id="income-input"
                type="number"
                min="0"
                step="1000"
                value={annualIncome}
                onChange={(e) => setAnnualIncome(parseFloat(e.target.value) || 0)}
                className="w-full rounded-xl px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-blue-600"
                required
              />
            </div>

            {/* Occupation */}
            <div className="space-y-1.5">
              <label htmlFor="occupation-select" className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-blue-600" aria-hidden="true" />
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
                className="w-full rounded-xl px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-blue-600"
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

            {/* Category */}
            <div className="space-y-1.5 sm:col-span-2">
              <label htmlFor="category-select" className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-blue-600" aria-hidden="true" />
                {t('labelCategory')}
              </label>
              <select
                id="category-select"
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full rounded-xl px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-blue-600"
              >
                <option value="general">{t('categoryGeneral')}</option>
                <option value="obc">{t('categoryObc')}</option>
                <option value="sc">{t('categorySc')}</option>
                <option value="st">{t('categorySt')}</option>
              </select>
            </div>

            {/* Land Holding */}
            {isFarmer && (
              <div className="space-y-1.5 sm:col-span-2 bg-blue-50 p-3.5 rounded-xl border border-blue-200 animate-fade-in">
                <label htmlFor="land-input" className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
                  {t('labelLand')}
                </label>
                <input
                  id="land-input"
                  type="number"
                  min="0"
                  step="0.1"
                  value={landHolding}
                  onChange={(e) => setLandHolding(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-xl px-3.5 py-2 text-sm bg-white border border-slate-200 text-slate-900"
                />
              </div>
            )}
          </div>

          <div className="flex justify-between pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setActiveStep(1)}
              className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => setActiveStep(3)}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-sm"
            >
              <span>Next: Special Qualifications</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Special Qualifications */}
      {activeStep === 3 && (
        <div className="space-y-5 animate-fade-in">
          <fieldset className="space-y-3">
            <legend className="text-xs text-slate-700 font-bold uppercase tracking-wider mb-2">
              Citizen Category Checkbox Qualifications
            </legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { id: 'disability-cb', state: disability, setter: setDisability, label: t('labelDisability') },
                { id: 'bpl-cb', state: isBpl, setter: setIsBpl, label: t('labelBpl') },
                { id: 'student-cb', state: isStudent, setter: (val: boolean) => { setIsStudent(val); if (val) setOccupation('student'); }, label: t('labelStudent') },
                { id: 'farmer-cb', state: isFarmer, setter: (val: boolean) => { setIsFarmer(val); if (val) setOccupation('farmer'); }, label: t('labelFarmer') },
                { id: 'woman-cb', state: isWoman, setter: setIsWoman, label: t('labelWoman') },
                { id: 'senior-cb', state: isSenior, setter: setIsSenior, label: t('labelSenior') },
              ].map((item) => (
                <label
                  key={item.id}
                  htmlFor={item.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none ${
                    item.state
                      ? 'bg-blue-50 border-blue-300 text-blue-900 font-bold'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <input
                    id={item.id}
                    type="checkbox"
                    checked={item.state}
                    onChange={(e) => item.setter(e.target.checked)}
                    className="h-4 w-4 rounded accent-blue-600 cursor-pointer"
                  />
                  <span className="text-xs font-medium">{item.label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setActiveStep(2)}
              className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              Back
            </button>

            <button
              type="submit"
              disabled={formLoading}
              className="px-7 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 text-xs"
            >
              {formLoading ? (
                <>
                  <div className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{t('buttonChecking')}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{t('buttonCheck')}</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </form>
  );
};
export default EligibilityForm;


