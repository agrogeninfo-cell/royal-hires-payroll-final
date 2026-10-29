import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Factory, BillingRateMethod } from '../types';
import {
  Building2,
  Plus,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Coffee,
  DollarSign,
  ShieldCheck,
} from 'lucide-react';

export const FactoriesView: React.FC = () => {
  const { currentUser, factories, saveFactory, allUsers, t } = useApp();
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [rateReviewConfirmed, setRateReviewConfirmed] = useState(false);
  const [editingFactory, setEditingFactory] = useState<Factory | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [address, setAddress] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [active, setActive] = useState(true);
  const [invoicePeriod, setInvoicePeriod] = useState<Factory['invoicePeriod']>('weekly');
  const [overtimeEnabled, setOvertimeEnabled] = useState(true);
  const [employeeOvertimeRateHourly, setEmployeeOvertimeRateHourly] = useState<number>(350);
  const [factoryOvertimeRateHourly, setFactoryOvertimeRateHourly] = useState<number>(500);

  // Employee wage rates paid to workers; separate from customer billing rates.
  const [wageSameRate, setWageSameRate] = useState<number>(2200);
  const [wageMaleRate, setWageMaleRate] = useState<number>(2500);
  const [wageFemaleRate, setWageFemaleRate] = useState<number>(2100);

  // Billing Rate Form State (CRITICAL)
  const [billingMethod, setBillingMethod] = useState<BillingRateMethod>('SAME_RATE_FOR_ALL');
  const [sameRate, setSameRate] = useState<number>(3000);
  const [maleRate, setMaleRate] = useState<number>(3200);
  const [femaleRate, setFemaleRate] = useState<number>(2900);
  const [nightMaleRateText, setNightMaleRateText] = useState('');
  const [nightFemaleRateText, setNightFemaleRateText] = useState('');
  const [billingEffectiveFrom, setBillingEffectiveFrom] = useState('2026-01-01');
  const [billingEffectiveTo, setBillingEffectiveTo] = useState('');
  const [specialBillingDatesText, setSpecialBillingDatesText] = useState('');

  // Meal rates
  const [breakfastRate, setBreakfastRate] = useState(150);
  const [lunchRate, setLunchRate] = useState(250);
  const [dinnerRate, setDinnerRate] = useState(200);

  // Assigned supervisors
  const [selectedSupervisors, setSelectedSupervisors] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState('');

  const supervisors = allUsers.filter((u) => u.role === 'supervisor');

  const openCreateModal = () => {
    setRateReviewConfirmed(false);
    setEditingFactory(null);
    setName('');
    setCode(`FAC-0${factories.length + 1}`);
    setAddress('');
    setContactPerson('');
    setContactPhone('+94 11 ');
    setActive(true);
    setInvoicePeriod('weekly');
    setOvertimeEnabled(true);
    setEmployeeOvertimeRateHourly(350);
    setFactoryOvertimeRateHourly(500);
    setWageSameRate(2200);
    setWageMaleRate(2500);
    setWageFemaleRate(2100);
    setBillingMethod('SAME_RATE_FOR_ALL');
    setSameRate(3000);
    setMaleRate(3200);
    setFemaleRate(2900);
    setNightMaleRateText('');
    setNightFemaleRateText('');
    setBillingEffectiveFrom(new Date().toISOString().split('T')[0]);
    setBillingEffectiveTo('');
    setSpecialBillingDatesText('');
    setBreakfastRate(150);
    setLunchRate(250);
    setDinnerRate(200);
    setSelectedSupervisors([]);
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const openEditModal = (fac: Factory) => {
    setRateReviewConfirmed(false);
    setEditingFactory(fac);
    setName(fac.name);
    setCode(fac.code);
    setAddress(fac.address);
    setContactPerson(fac.contactPerson);
    setContactPhone(fac.contactPhone);
    setActive(fac.active);
    setInvoicePeriod(fac.invoicePeriod);
    setOvertimeEnabled(fac.overtimeEnabled);
    setEmployeeOvertimeRateHourly(fac.employeeOvertimeRateHourly);
    setFactoryOvertimeRateHourly(fac.factoryOvertimeRateHourly);
    setWageSameRate(fac.wageSameRate ?? 2200);
    setWageMaleRate(fac.wageMaleRate ?? 2500);
    setWageFemaleRate(fac.wageFemaleRate ?? 2100);
    setBillingMethod(fac.billingMethod);
    setSameRate(fac.sameRate ?? 3000);
    setMaleRate(fac.maleRate ?? 3200);
    setFemaleRate(fac.femaleRate ?? 2900);
    setNightMaleRateText(fac.nightMaleRate == null ? '' : String(fac.nightMaleRate));
    setNightFemaleRateText(fac.nightFemaleRate == null ? '' : String(fac.nightFemaleRate));
    setBillingEffectiveFrom(fac.billingEffectiveFrom || '2026-01-01');
    setBillingEffectiveTo(fac.billingEffectiveTo || '');
    setSpecialBillingDatesText((fac.specialBillingDates || []).join(', '));
    setBreakfastRate(fac.breakfastRate);
    setLunchRate(fac.lunchRate);
    setDinnerRate(fac.dinnerRate);
    setSelectedSupervisors(fac.supervisorIds || []);
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim() || !code.trim()) {
      setErrorMsg('Factory name and code are required.');
      return;
    }
    if (!rateReviewConfirmed) {
      setErrorMsg('Confirm that rates, shifts, overtime, meal charges and effective dates match the approved factory rate sheet before saving to cloud.');
      return;
    }

    // Rate validation according to selected Method
    if (billingMethod === 'SAME_RATE_FOR_ALL') {
      if (sameRate === undefined || sameRate === null || isNaN(sameRate) || sameRate <= 0) {
        setErrorMsg('Validation Error: A positive standard daily billing rate is required for Method A.');
        return;
      }
    } else if (billingMethod === 'SEPARATE_MALE_FEMALE_RATES') {
      if (maleRate === undefined || isNaN(maleRate) || maleRate <= 0) {
        setErrorMsg('Validation Error: Male Helper daily billing rate is required and must be positive.');
        return;
      }
      if (femaleRate === undefined || isNaN(femaleRate) || femaleRate <= 0) {
        setErrorMsg('Validation Error: Female Helper daily billing rate is required and must be positive.');
        return;
      }
    }

    if (employeeOvertimeRateHourly <= 0 || factoryOvertimeRateHourly <= 0) {
      setErrorMsg('Validation Error: Both employee OT pay rate and factory OT billing rate must be configured.');
      return;
    }

    try {
      const now = new Date().toISOString();
      const factoryToSave: Factory = {
        id: editingFactory?.id || `fac-${code.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        code: code.trim().toUpperCase(),
        name: name.trim(),
        address: address.trim(),
        contactPerson: contactPerson.trim(),
        contactPhone: contactPhone.trim(),
        active,
        invoicePeriod,
        shifts: editingFactory?.shifts || [
          { id: 'sh-1', name: 'General Shift', startTime: '08:00', endTime: '17:00', standardHours: 8 },
        ],
        overtimeEnabled,
        employeeOvertimeRateHourly: Number(employeeOvertimeRateHourly),
        factoryOvertimeRateHourly: Number(factoryOvertimeRateHourly),
        wageSameRate: Number(wageSameRate),
        wageMaleRate: Number(wageMaleRate),
        wageFemaleRate: Number(wageFemaleRate),
        billingMethod,
        sameRate: billingMethod === 'SAME_RATE_FOR_ALL' ? Number(sameRate) : undefined,
        maleRate: billingMethod === 'SEPARATE_MALE_FEMALE_RATES' ? Number(maleRate) : undefined,
        femaleRate: billingMethod === 'SEPARATE_MALE_FEMALE_RATES' ? Number(femaleRate) : undefined,
        nightMaleRate: name.trim().toLowerCase() === 'millennium teas' && nightMaleRateText !== '' ? Number(nightMaleRateText) : undefined,
        nightFemaleRate: name.trim().toLowerCase() === 'millennium teas' && nightFemaleRateText !== '' ? Number(nightFemaleRateText) : undefined,
        billingEffectiveFrom,
        specialBillingDates: specialBillingDatesText.split(',').map((date) => date.trim()).filter((date) => /^\d{4}-\d{2}-\d{2}$/.test(date)),
        billingEffectiveTo: billingEffectiveTo || undefined,
        breakfastRate: Number(breakfastRate),
        lunchRate: Number(lunchRate),
        dinnerRate: Number(dinnerRate),
        supervisorIds: selectedSupervisors,
        createdAt: editingFactory?.createdAt || now,
        updatedAt: now,
      };

      await saveFactory(factoryToSave);
      setIsModalOpen(false);
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  return (
    <div className="space-y-6 w-full max-w-full overflow-hidden">
      {/* Header */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center space-x-2">
            <Building2 className="w-5 h-5 text-emerald-600" />
            <span>Factory Management &amp; Independent Billing Rates</span>
          </h2>
          <p className="text-xs text-slate-500">
            Configure factory-specific rate methods (Same Rate For All vs Separate Male &amp; Female), overtime, and meal charges
          </p>
        </div>

        {currentUser.role === 'admin' && (
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-xs flex items-center space-x-1.5 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Factory</span>
          </button>
        )}
      </div>

      {/* Factories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {factories.map((fac) => (
          <div
            key={fac.id}
            className="bg-white rounded-xl border border-slate-200 hover:border-emerald-300 p-5 shadow-xs flex flex-col justify-between transition"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold px-2 py-0.5 bg-slate-100 rounded text-slate-700">
                  {fac.code}
                </span>
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                    fac.active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {fac.active ? 'Active' : 'Inactive'}
                </span>
              </div>

              <h3 className="font-bold text-slate-900 text-base mt-2">{fac.name}</h3>
              <p className="text-xs text-slate-500 mt-0.5">{fac.address || 'Site address not configured'}</p>
              {(fac.id === 'fac-empire-teas' || fac.id === 'fac-millennium-teas') && !fac.active && (
                <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900">
                  Rate configuration required. Add the approved factory-specific rates before activating or assigning helpers.
                </p>
              )}

              {/* Rate Card Highlight */}
              <div className="mt-4 p-3 rounded-lg bg-emerald-50/60 border border-emerald-200 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-emerald-900 font-semibold">Rate Method:</span>
                  <span className="font-bold text-emerald-800">
                    {fac.billingMethod === 'SAME_RATE_FOR_ALL'
                      ? 'Method A (Same Rate For All)'
                      : 'Method B (Male / Female Rates)'}
                  </span>
                </div>

                {fac.billingMethod === 'SAME_RATE_FOR_ALL' ? (
                  <div className="flex justify-between items-center text-sm font-bold text-emerald-950 pt-1">
                    <span>Standard Helper Rate:</span>
                    <span className="text-emerald-700">LKR {fac.sameRate?.toLocaleString()} / day</span>
                  </div>
                ) : (
                  <div className="pt-1 space-y-1 text-xs">
                    <div className="flex justify-between items-center text-blue-900 font-bold">
                      <span>Male Helper Rate:</span>
                      <span className="text-blue-700">LKR {fac.maleRate?.toLocaleString()} / day</span>
                    </div>
                    <div className="flex justify-between items-center text-purple-900 font-bold">
                      <span>Female Helper Rate:</span>
                      <span className="text-purple-700">LKR {fac.femaleRate?.toLocaleString()} / day</span>
                    </div>
                  </div>
                )}

                <div className="text-[11px] text-slate-500 pt-1 border-t border-emerald-200 flex justify-between">
                  <span>Effective From: {fac.billingEffectiveFrom}</span>
                  {fac.billingEffectiveTo && <span>To: {fac.billingEffectiveTo}</span>}
                </div>
              </div>

              {/* Overtime & Meals Specs */}
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600">
                <div className="p-2 bg-slate-50 rounded border border-slate-100">
                  <span className="text-[10px] text-slate-400 block uppercase">OT Billing</span>
                  <strong className="text-slate-800">LKR {fac.factoryOvertimeRateHourly} / hr</strong>
                </div>
                <div className="p-2 bg-slate-50 rounded border border-slate-100">
                  <span className="text-[10px] text-slate-400 block uppercase">OT Worker Pay</span>
                  <strong className="text-slate-800">LKR {fac.employeeOvertimeRateHourly} / hr</strong>
                </div>
              </div>

              {/* Meals */}
              <div className="mt-2 text-[11px] text-slate-500 flex justify-between px-1">
                <span>Breakfast: LKR {fac.breakfastRate}</span>
                <span>Lunch: LKR {fac.lunchRate}</span>
                <span>Dinner: LKR {fac.dinnerRate}</span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Billing Cycle: <strong className="text-slate-700 capitalize">{fac.invoicePeriod}</strong>
              </span>
              {currentUser.role === 'admin' && (
                <button
                  onClick={() => openEditModal(fac)}
                  className="px-3 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg flex items-center space-x-1 transition cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Configure Rates</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Edit / Create Factory Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base text-slate-900 flex items-center space-x-2">
                <Building2 className="w-5 h-5 text-emerald-600" />
                <span>
                  {editingFactory ? `Configure Rates: ${editingFactory.name}` : 'Create New Factory'}
                </span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-300 text-rose-800 text-xs rounded-lg flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              {/* Basic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Factory Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Kelani Textiles PLC"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Factory Code *</label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="e.g. FAC-KELANI"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Factory Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Industrial Zone, Kelaniya"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Contact Person</label>
                  <input
                    type="text"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    placeholder="e.g. Mr. Rohan Gunasekara"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="+94 11 291 5566"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                  />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-3">
                <h4 className="font-bold text-sm text-slate-900">Worker Wage Rates (Paid to Labour)</h4>
                <p className="text-[11px] text-slate-600">Separate from factory invoice rates. These rates auto-fill when registering a worker.</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div><label className="block font-semibold text-slate-700 mb-1">Same wage (LKR/day)</label><input type="number" min="1" required value={wageSameRate} onChange={(e) => setWageSameRate(Number(e.target.value))} className="w-full bg-white border border-slate-300 rounded-lg p-2 font-bold" /></div>
                  <div><label className="block font-semibold text-slate-700 mb-1">Male wage (LKR/day)</label><input type="number" min="1" required value={wageMaleRate} onChange={(e) => setWageMaleRate(Number(e.target.value))} className="w-full bg-white border border-slate-300 rounded-lg p-2 font-bold" /></div>
                  <div><label className="block font-semibold text-slate-700 mb-1">Female wage (LKR/day)</label><input type="number" min="1" required value={wageFemaleRate} onChange={(e) => setWageFemaleRate(Number(e.target.value))} className="w-full bg-white border border-slate-300 rounded-lg p-2 font-bold" /></div>
                </div>
              </div>

              {/* CRITICAL BILLING METHOD SELECTION */}
              <div className="p-4 rounded-xl bg-slate-50 border-2 border-emerald-300 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 flex items-center space-x-1.5">
                      <DollarSign className="w-4 h-4 text-emerald-600" />
                      <span>Daily Helper Billing Rate Configuration</span>
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Independent per factory. No Job Category dimension. All workers are Helpers.
                    </p>
                  </div>
                </div>

                {/* Rate Method Radio selection */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <label
                    className={`p-3 rounded-lg border cursor-pointer transition ${
                      billingMethod === 'SAME_RATE_FOR_ALL'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold'
                        : 'bg-white border-slate-200 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="billingMethod"
                        value="SAME_RATE_FOR_ALL"
                        checked={billingMethod === 'SAME_RATE_FOR_ALL'}
                        onChange={() => setBillingMethod('SAME_RATE_FOR_ALL')}
                        className="text-emerald-600 focus:ring-0"
                      />
                      <span className="text-xs">Method A — SAME_RATE_FOR_ALL</span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-normal mt-1 pl-5">
                      One daily billing rate applies to every Helper supplied, regardless of gender.
                    </p>
                  </label>

                  <label
                    className={`p-3 rounded-lg border cursor-pointer transition ${
                      billingMethod === 'SEPARATE_MALE_FEMALE_RATES'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold'
                        : 'bg-white border-slate-200 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="billingMethod"
                        value="SEPARATE_MALE_FEMALE_RATES"
                        checked={billingMethod === 'SEPARATE_MALE_FEMALE_RATES'}
                        onChange={() => setBillingMethod('SEPARATE_MALE_FEMALE_RATES')}
                        className="text-emerald-600 focus:ring-0"
                      />
                      <span className="text-xs">Method B — SEPARATE_MALE_FEMALE_RATES</span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-normal mt-1 pl-5">
                      Male and female Helpers have separate daily billing rates at this factory.
                    </p>
                  </label>
                </div>

                {/* Conditional Dynamic Inputs */}
                {billingMethod === 'SAME_RATE_FOR_ALL' ? (
                  <div className="pt-2">
                    <label className="block font-bold text-slate-800 mb-1">
                      Standard Daily Billing Rate in LKR (All Helpers) *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={sameRate}
                      onChange={(e) => setSameRate(Number(e.target.value))}
                      placeholder="e.g. 3000"
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 font-bold text-sm text-emerald-700"
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="block font-bold text-blue-900 mb-1">
                        Male Helper Daily Billing Rate in LKR *
                      </label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={maleRate}
                        onChange={(e) => setMaleRate(Number(e.target.value))}
                        placeholder="e.g. 3200"
                        className="w-full bg-white border border-slate-300 rounded-lg p-2 font-bold text-sm text-blue-700"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-purple-900 mb-1">
                        Female Helper Daily Billing Rate in LKR *
                      </label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={femaleRate}
                        onChange={(e) => setFemaleRate(Number(e.target.value))}
                        placeholder="e.g. 2900"
                        className="w-full bg-white border border-slate-300 rounded-lg p-2 font-bold text-sm text-purple-700"
                      />
                    </div>
                  </div>
                )}

                {name.trim().toLowerCase() === 'millennium teas' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3">
                    <div><label className="block font-semibold text-slate-700 mb-1">Night Shift Male Rate (LKR, optional)</label><input type="number" min="1" value={nightMaleRateText} onChange={(e) => setNightMaleRateText(e.target.value)} placeholder="Not in supplied reference" className="w-full bg-white border border-slate-300 rounded-lg p-2" /></div>
                    <div><label className="block font-semibold text-slate-700 mb-1">Night Shift Female Rate (LKR, optional)</label><input type="number" min="1" value={nightFemaleRateText} onChange={(e) => setNightFemaleRateText(e.target.value)} placeholder="Not in supplied reference" className="w-full bg-white border border-slate-300 rounded-lg p-2" /></div>
                    <p className="sm:col-span-2 text-[11px] text-amber-800">The uploaded summary reference does not provide night-shift rates. Enter approved rates here before invoicing night-shift attendance.</p>
                  </div>
                )}

                {/* Effective Dates */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">
                      Billing Effective Start Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={billingEffectiveFrom}
                      onChange={(e) => setBillingEffectiveFrom(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">
                      Effective End Date (Optional)
                    </label>
                    <input
                      type="date"
                      value={billingEffectiveTo}
                      onChange={(e) => setBillingEffectiveTo(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2"
                    />
                  </div>
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 space-y-2">
                <label className="block font-semibold text-slate-700 mb-1">Special Billing Dates (Poya / approved holidays)</label>
                <input value={specialBillingDatesText} onChange={(e) => setSpecialBillingDatesText(e.target.value)} placeholder="YYYY-MM-DD, YYYY-MM-DD" className="w-full bg-white border border-slate-300 rounded-lg p-2 text-sm" />
                <p className="text-[11px] text-slate-600">Empire Teas: add confirmed Poya/holiday dates as YYYY-MM-DD, separated by commas. These dates use the Sunday/Poya special billing rate.</p>
              </div>

              {/* Overtime Configuration */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-800 flex items-center space-x-1.5">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span>Overtime Configuration</span>
                  </h4>
                  <label className="flex items-center space-x-1.5 font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={overtimeEnabled}
                      onChange={(e) => setOvertimeEnabled(e.target.checked)}
                      className="rounded text-emerald-600"
                    />
                    <span>Enable Overtime</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Factory OT Billing Rate (LKR / hr) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={factoryOvertimeRateHourly}
                      onChange={(e) => setFactoryOvertimeRateHourly(Number(e.target.value))}
                      placeholder="e.g. 500"
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 font-bold text-emerald-700"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Employee OT Pay Rate (LKR / hr) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={employeeOvertimeRateHourly}
                      onChange={(e) => setEmployeeOvertimeRateHourly(Number(e.target.value))}
                      placeholder="e.g. 350"
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 font-bold text-blue-700"
                    />
                  </div>
                </div>
              </div>

              {/* Meals Configuration */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <h4 className="font-bold text-slate-800 flex items-center space-x-1.5">
                  <Coffee className="w-4 h-4 text-amber-700" />
                  <span>Configured Meal Rates (LKR per meal)</span>
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-slate-600 mb-1">Breakfast (LKR)</label>
                    <input
                      type="number"
                      value={breakfastRate}
                      onChange={(e) => setBreakfastRate(Number(e.target.value))}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">Lunch (LKR)</label>
                    <input
                      type="number"
                      value={lunchRate}
                      onChange={(e) => setLunchRate(Number(e.target.value))}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">Dinner (LKR)</label>
                    <input
                      type="number"
                      value={dinnerRate}
                      onChange={(e) => setDinnerRate(Number(e.target.value))}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 font-semibold"
                    />
                  </div>
                </div>
              </div>

              <label className="flex items-start gap-2.5 rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs leading-5 text-amber-950">
                <input type="checkbox" checked={rateReviewConfirmed} onChange={(event) => setRateReviewConfirmed(event.target.checked)} className="mt-1 accent-emerald-700" />
                <span>I verified the daily rates, OT rates, shifts, special-day rules, meal charges and effective dates against the approved rate sheet. Saving sends this configuration to cloud and enables payroll/invoicing for this factory once the server confirms it.</span>
              </label>
              <div className="flex justify-end space-x-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-100 font-semibold text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold shadow-xs cursor-pointer"
                >
                  Save Factory &amp; Rates
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
