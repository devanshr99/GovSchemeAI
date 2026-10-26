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
  Briefcase,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  ShieldCheck
} from 'lucide-react';

export const EligibilityForm: React.FC = () => {
  const { checkEligibility, language } = useApp();
  const router = useRouter();

  // Wizard Step: 1, 2, or 3
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Form states
  const [age, setAge] = useState<number>(28);
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('female');
  const [state, setState] = useState<string>('UP');
  const [district, setDistrict] = useState<string>('');
  const [occupation, setOccupation] = useState<string>('farmer');
  const [annualIncome, setAnnualIncome] = useState<number>(120000);
  const [category, setCategory] = useState<'general' | 'obc' | 'sc' | 'st'>('general');
  const [disability, setDisability] = useState<boolean>(false);
  const [isBpl, setIsBpl] = useState<boolean>(false);

  // Additional status flags
  const [isStudent, setIsStudent] = useState<boolean>(false);
  const [isFarmer, setIsFarmer] = useState<boolean>(true);
  const [isWoman, setIsWoman] = useState<boolean>(true);
  const [landHolding, setLandHolding] = useState<number>(1.5);

  // Loaded location lists
  const [statesList, setStatesList] = useState<Array<{ code: string; name: string }>>([]);
  const [districtsList, setDistrictsList] = useState<Array<{ id: number; name: string }>>([]);
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

  // Handlers for responsive flag syncing
  const handleOccupationChange = (val: string) => {
    setOccupation(val);
    if (val === 'farmer') {
      setIsFarmer(true);
      setIsStudent(false);
    } else if (val === 'student') {
      setIsStudent(true);
      setIsFarmer(false);
    } else {
      setIsFarmer(false);
      setIsStudent(false);
    }
  };

  const handleGenderChange = (val: 'male' | 'female' | 'other') => {
    setGender(val);
    setIsWoman(val === 'female');
  };

  const validateStep = (step: number): boolean => {
    setFormError(null);
    if (step === 1) {
      if (age < 0 || age > 120) {
        setFormError('Please enter a valid age between 0 and 120 years.');
        return false;
      }
      if (!state) {
        setFormError('Please select your state of residence.');
        return false;
      }
    } else if (step === 2) {
      if (annualIncome < 0) {
        setFormError('Annual household income cannot be negative.');
        return false;
      }
    } else if (step === 3) {
      if (isFarmer && landHolding < 0) {
        setFormError('Land holding acreage cannot be negative.');
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(3, prev + 1));
    }
  };

  const handleBack = () => {
    setFormError(null);
    setCurrentStep(prev => Math.max(1, prev - 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(3)) return;

    setFormLoading(true);
    setFormError(null);

    const payload: EligibilityRequest = {
      age,
      gender,
      state,
      district: district || undefined,
      occupation,
      annual_income: annualIncome,
      category,
      disability,
      is_bpl: isBpl,
      is_student: isStudent,
      is_farmer: isFarmer,
      is_woman: isWoman,
      is_senior_citizen: age >= 60,
      land_holding_hectares: isFarmer ? landHolding : 0,
      language: (language === 'hi' ? 'hi' : 'en'),
    };

    try {
      const res = await checkEligibility(payload);
      if (res && res.schemes) {
        router.push('/results');
      } else {
        setFormError('No schemes matched your criteria. You can adjust parameters and try again.');
      }
    } catch (err: unknown) {
      console.error('Eligibility submission error:', err);
      setFormError('Failed to process eligibility. Please check backend connection.');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="gov-card p-6 sm:p-7 rounded-3xl border border-white/[0.1] bg-[#0E1422] shadow-2xl space-y-6">
      
      {/* Form Header */}
      <div className="space-y-1.5 pb-4 border-b border-white/[0.08]">
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-400 uppercase tracking-wider">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Eligibility Quick-Scan</span>
          </div>
          <span className="text-[11px] font-bold text-slate-400">
            Step {currentStep} of 3
          </span>
        </div>
        <h3 className="font-heading text-lg sm:text-xl font-bold text-slate-100">
          Find Your Eligible Welfare Schemes
        </h3>
        <p className="text-xs text-slate-400">
          Answer 3 brief questions to scan all 130+ central and state ministry benefits.
        </p>

        {/* Step Progress Bar */}
        <div className="w-full bg-white/[0.06] h-1.5 rounded-full overflow-hidden mt-3">
          <div 
            className="bg-gradient-to-r from-blue-600 to-amber-500 h-full transition-all duration-300 rounded-full"
            style={{ width: `${(currentStep / 3) * 100}%` }}
          />
        </div>
      </div>

      {formError && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-center gap-2 animate-fade-in">
          <AlertTriangle className="h-4 w-4 shrink-0 text-red-400" />
          <span>{formError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* STEP 1: Personal & Location */}
        {currentStep === 1 && (
          <div className="space-y-4 animate-fade-in">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-blue-400" />
                  <span>Age (Years)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  max="120"
                  value={age}
                  onChange={(e) => setAge(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-xs bg-[#080C15] border border-white/[0.1] text-slate-100"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                  <User className="h-3.5 w-3.5 text-blue-400" />
                  <span>Gender</span>
                </label>
                <select
                  value={gender}
                  onChange={(e) => handleGenderChange(e.target.value as 'male' | 'female' | 'other')}
                  className="w-full px-3 py-2 text-xs bg-[#080C15] border border-white/[0.1] text-slate-100"
                >
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="other">Other / Transgender</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-blue-400" />
                <span>State of Residence</span>
              </label>
              <select
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#080C15] border border-white/[0.1] text-slate-100"
                required
              >
                {statesList.map(st => (
                  <option key={st.code} value={st.code}>{st.name}</option>
                ))}
              </select>
            </div>

            {districtsList.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-slate-400" />
                  <span>District (Optional)</span>
                </label>
                <select
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#080C15] border border-white/[0.1] text-slate-100"
                >
                  <option value="">All Districts in {state}</option>
                  {districtsList.map(d => (
                    <option key={d.id} value={d.name}>{d.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: Socio-Economic Profile */}
        {currentStep === 2 && (
          <div className="space-y-4 animate-fade-in">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                <IndianRupee className="h-3.5 w-3.5 text-emerald-400" />
                <span>Annual Household Income (₹)</span>
              </label>
              <input
                type="number"
                min="0"
                step="5000"
                value={annualIncome}
                onChange={(e) => setAnnualIncome(parseInt(e.target.value) || 0)}
                placeholder="e.g. 150000"
                className="w-full px-3 py-2 text-xs bg-[#080C15] border border-white/[0.1] text-slate-100"
                required
              />
              <span className="text-[10px] text-slate-400">Total yearly income of family from all sources</span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                <UserCheck className="h-3.5 w-3.5 text-blue-400" />
                <span>Social Category</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as 'general' | 'obc' | 'sc' | 'st')}
                className="w-full px-3 py-2 text-xs bg-[#080C15] border border-white/[0.1] text-slate-100"
              >
                <option value="general">General</option>
                <option value="obc">OBC (Other Backward Class)</option>
                <option value="sc">SC (Scheduled Caste)</option>
                <option value="st">ST (Scheduled Tribe)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <label className="flex items-center gap-2 p-2.5 rounded-xl bg-[#080C15] border border-white/[0.08] cursor-pointer hover:border-white/[0.15] transition-colors">
                <input
                  type="checkbox"
                  checked={isBpl}
                  onChange={(e) => setIsBpl(e.target.checked)}
                  className="rounded text-blue-600"
                />
                <span className="text-xs text-slate-200 font-medium">BPL / Ration Card</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-xl bg-[#080C15] border border-white/[0.08] cursor-pointer hover:border-white/[0.15] transition-colors">
                <input
                  type="checkbox"
                  checked={disability}
                  onChange={(e) => setDisability(e.target.checked)}
                  className="rounded text-blue-600"
                />
                <span className="text-xs text-slate-200 font-medium">Persons with Disability</span>
              </label>
            </div>
          </div>
        )}

        {/* STEP 3: Occupation & Sector */}
        {currentStep === 3 && (
          <div className="space-y-4 animate-fade-in">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                <Briefcase className="h-3.5 w-3.5 text-amber-400" />
                <span>Primary Occupation</span>
              </label>
              <select
                value={occupation}
                onChange={(e) => handleOccupationChange(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#080C15] border border-white/[0.1] text-slate-100"
              >
                <option value="farmer">Farmer / Agricultural Worker</option>
                <option value="student">Student / Scholar</option>
                <option value="business">Micro-Entrepreneur / Business / MSME</option>
                <option value="unemployed">Unemployed / Jobseeker</option>
                <option value="salaried">Salaried (Private / Govt)</option>
                <option value="homemaker">Homemaker</option>
                <option value="other">Other / Self-Employed</option>
              </select>
            </div>

            {occupation === 'farmer' && (
              <div className="space-y-1.5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 animate-fade-in">
                <label className="text-xs font-semibold text-emerald-300">
                  Land Holding (Acres)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={landHolding}
                  onChange={(e) => setLandHolding(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-xs bg-[#080C15] border border-white/[0.1] text-slate-100"
                />
                <span className="text-[10px] text-slate-400">PM-KISAN and crop insurance eligibility depends on landholding category</span>
              </div>
            )}

            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[11px] text-blue-300 flex items-start gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                Your demographic inputs remain strictly confidential on your local device.
              </span>
            </div>
          </div>
        )}

        {/* Wizard Navigation Buttons */}
        <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between gap-3">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-[#080C15] border border-white/[0.08] hover:border-white/[0.15] flex items-center gap-1 transition-colors cursor-pointer"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Back</span>
            </button>
          ) : (
            <span className="text-[11px] text-slate-500">Free citizen service</span>
          )}

          {currentStep < 3 ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer ml-auto"
            >
              <span>Continue</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={formLoading}
              className="px-6 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 transition-all flex items-center gap-2 shadow-md cursor-pointer ml-auto disabled:opacity-50"
            >
              {formLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-slate-950" />
                  <span>Scanning 130+ Schemes...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 text-slate-950" />
                  <span>Reveal My Matches</span>
                </>
              )}
            </button>
          )}
        </div>

      </form>
    </div>
  );
};

export default EligibilityForm;
