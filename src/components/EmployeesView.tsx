import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { getSupabaseClient } from '../services/authService';
import { Employee, WageArrangement, EmployeePayment } from '../types';
import {
  Users,
  Plus,
  Edit2,
  DollarSign,
  Coffee,
  Home,
  AlertCircle,
  Search,
  Filter,
  CheckCircle2,
  ShieldAlert,
  CreditCard,
} from 'lucide-react';

export const EmployeesView: React.FC = () => {
  const {
    currentUser,
    employees,
    factories,
    boardingLocations,
    saveEmployee,
    savePayment,
    payments,
    t,
  } = useApp();

  const isSupervisor = currentUser.role === 'supervisor';

  const [search, setSearch] = useState('');
  const [filterFactory, setFilterFactory] = useState('all');
  const [filterGender, setFilterGender] = useState('all');

  // Employee Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  // Advance Modal
  const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false);
  const [advanceEmployee, setAdvanceEmployee] = useState<Employee | null>(null);
  const [advanceAmount, setAdvanceAmount] = useState<number>(2000);
  const [advanceNotes, setAdvanceNotes] = useState('');
  const [advanceRef, setAdvanceRef] = useState('');

  // Form Fields
  const [id, setId] = useState('');
  const [fullName, setFullName] = useState('');
  const [nic, setNic] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState<Employee['status']>('active');
  const [currentFactoryId, setCurrentFactoryId] = useState('');
  const [wageArrangement, setWageArrangement] = useState<WageArrangement>('daily');
  const [wageRate, setWageRate] = useState<number>(0);
  const [eligibleForMeals, setEligibleForMeals] = useState(true);
  const [eligibleForBoarding, setEligibleForBoarding] = useState(false);
  const [boardingLocationId, setBoardingLocationId] = useState('');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [portalPinEmployee, setPortalPinEmployee] = useState<Employee | null>(null);
  const [portalPin, setPortalPin] = useState('');
  const [portalPinError, setPortalPinError] = useState('');
  const [portalPinSaving, setPortalPinSaving] = useState(false);
  const [portalPinIssued, setPortalPinIssued] = useState(false);

  const getFactoryWage = (factoryId: string, workerGender: 'male' | 'female') => {
    const factory = factories.find((item) => item.id === factoryId);
    if (!factory) return 0;
    const specificRate = workerGender === 'male' ? factory.wageMaleRate : factory.wageFemaleRate;
    return Number(specificRate ?? factory.wageSameRate ?? 0);
  };

  const generateMemberId = (name: string, existing: Employee[]) => {
    const initials = name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0].toUpperCase()).join('') || 'XX';
    const used = new Set(existing.map((employee) => employee.id.toUpperCase()));
    let sequence = 200;
    let candidate = 'RH' + initials + sequence;
    while (used.has(candidate)) { sequence += 1; candidate = 'RH' + initials + sequence; }
    return candidate;
  };

  const printIdCard = (employee: Employee, factoryName: string) => {
    const popup = window.open('', '_blank', 'width=900,height=600');
    if (!popup) { setErrorMsg('Please allow pop-ups to preview/print the ID card.'); return; }
    const escapeHtml = (value: string) => value.replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch] || ch));
    popup.document.write('<!doctype html><html><head><title>Royal Hires ID Card</title><meta name="viewport" content="width=device-width,initial-scale=1"><style>*{box-sizing:border-box}body{margin:0;padding:24px;background:#f1f5f9;font-family:Arial,sans-serif}.card{width:856px;height:540px;max-width:100%;margin:auto;border-radius:24px;overflow:hidden;background:#062d27;color:#fff;border:5px solid #d7ad63}.head{padding:28px 34px;background:#0a3d34;border-bottom:3px solid #d7ad63}.brand{font-size:30px;font-weight:800;letter-spacing:1px}.sub{color:#e8d4a6;font-size:13px;letter-spacing:2px;margin-top:5px}.body{padding:30px 36px}.id{font-size:34px;font-weight:900;color:#d7ad63;letter-spacing:2px}.name{font-size:32px;font-weight:800;margin:16px 0 8px}.role{font-size:17px;color:#e8d4a6}.details{font-size:16px;line-height:1.8;margin-top:20px}.factory{padding:16px 36px;background:#d7ad63;color:#062d27;font-weight:700}@media print{body{padding:0;background:white}.card{print-color-adjust:exact;-webkit-print-color-adjust:exact}}</style></head><body><div class="card"><div class="head"><div class="brand">ROYAL HIRES PRIVATE LIMITED</div><div class="sub">EMPLOYEE IDENTIFICATION CARD</div></div><div class="body"><div class="id">' + escapeHtml(employee.id) + '</div><div class="name">' + escapeHtml(employee.fullName) + '</div><div class="role">FACTORY WORKER</div><div class="details">Phone: ' + escapeHtml(employee.phone || '-') + '<br>NIC: ' + escapeHtml(employee.nic || '-') + '<br>Valid while employment is active</div></div><div class="factory">' + escapeHtml(factoryName) + ' · MALABE, SRI LANKA</div></div><script>window.onload=function(){window.print()}</script></body></html>');
    popup.document.close();
  };

  const openCreateModal = () => {
    setEditingEmployee(null);
    setId(generateMemberId('', employees));
    setFullName('');
    setNic('');
    setPhone('+94 7');
    setAddress('');
    setGender('male');
    setEmergencyContact('');
    setStartDate(new Date().toISOString().split('T')[0]);
    setStatus('active');
    setCurrentFactoryId(factories[0]?.id || '');
    setWageArrangement('daily');
    setWageRate(getFactoryWage(factories[0]?.id || '', 'male'));
    setEligibleForMeals(true);
    setEligibleForBoarding(false);
    setBoardingLocationId(boardingLocations[0]?.id || '');
    setNotes('');
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const openEditModal = (emp: Employee) => {
    setEditingEmployee(emp);
    setId(emp.id);
    setFullName(emp.fullName);
    setNic(emp.nic);
    setPhone(emp.phone);
    setAddress(emp.address);
    setGender(emp.gender);
    setEmergencyContact(emp.emergencyContact || '');
    setStartDate(emp.startDate);
    setStatus(emp.status);
    setCurrentFactoryId(emp.currentFactoryId);
    setWageArrangement(emp.wageArrangement);
    setWageRate(emp.wageRate);
    setEligibleForMeals(emp.eligibleForMeals);
    setEligibleForBoarding(emp.eligibleForBoarding);
    setBoardingLocationId(emp.boardingLocationId || '');
    setNotes(emp.notes || '');
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const openAdvanceModal = (emp: Employee) => {
    setAdvanceEmployee(emp);
    setAdvanceAmount(2000);
    setAdvanceRef(`ADV-${Date.now().toString().slice(-4)}`);
    setAdvanceNotes('Mid-period wage advance');
    setIsAdvanceModalOpen(true);
  };

  const handleSaveEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!fullName.trim() || !nic.trim() || !id.trim()) {
      setErrorMsg('Full name, NIC, and Member ID are required.');
      return;
    }

    if (employees.some((employee) => employee.id.toUpperCase() === id.trim().toUpperCase() && employee.id !== editingEmployee?.id)) {
      setErrorMsg('This Member ID already exists. Please use a unique ID.');
      return;
    }
    if (employees.some((employee) => employee.nic.trim().toUpperCase() === nic.trim().toUpperCase() && employee.id !== editingEmployee?.id)) {
      setErrorMsg('This NIC is already registered to another worker.');
      return;
    }

    if (wageRate <= 0) {
      setErrorMsg('Wage rate must be greater than zero.');
      return;
    }

    try {
      const now = new Date().toISOString();
      const employeeToSave: Employee = {
        id: id.trim().toUpperCase(),
        fullName: fullName.trim(),
        nic: nic.trim().toUpperCase(),
        phone: phone.trim(),
        address: address.trim(),
        gender,
        emergencyContact: emergencyContact.trim(),
        startDate,
        status,
        designation: 'Helper', // MANDATORY BUSINESS RULE
        currentFactoryId,
        wageArrangement,
        wageRate: Number(wageRate),
        eligibleForMeals,
        eligibleForBoarding,
        boardingLocationId: eligibleForBoarding ? boardingLocationId : undefined,
        notes: notes.trim(),
        createdAt: editingEmployee?.createdAt || now,
        updatedAt: now,
      };

      await saveEmployee(employeeToSave);
      setIsModalOpen(false);
      setSuccessMsg(`Saved worker ${employeeToSave.fullName} successfully.`);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const openPortalPinModal = (employee: Employee) => {
    setPortalPinEmployee(employee);
    const digits = new Uint32Array(1);
    crypto.getRandomValues(digits);
    setPortalPin(String(100000 + (digits[0] % 900000)));
    setPortalPinError('');
    setPortalPinIssued(false);
  };

  const handleSetPortalPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!portalPinEmployee || currentUser.role !== 'admin') return;
    if (!/^\\d{6,10}$/.test(portalPin)) {
      setPortalPinError('PIN must contain 6–10 digits.');
      return;
    }
    setPortalPinSaving(true);
    setPortalPinError('');
    try {
      const { data, error } = await getSupabaseClient().functions.invoke('worker-portal', {
        body: { action: 'admin-set-pin', memberId: portalPinEmployee.id, pin: portalPin },
      });
      if (error) throw new Error('Unable to reach the portal service. Check the portal migration and function deployment.');
      if (!data?.ok) throw new Error(data?.error || 'PIN could not be saved.');
      setPortalPinIssued(true);
      setSuccessMsg('Portal PIN set for ' + portalPinEmployee.fullName + '.');
      setTimeout(() => setSuccessMsg(''), 8000);
    } catch (err: any) {
      setPortalPinError(err?.message || 'Could not set worker PIN.');
    } finally {
      setPortalPinSaving(false);
    }
  };

  const handleRecordAdvance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!advanceEmployee) return;

    try {
      const payment: EmployeePayment = {
        id: `PAY-ADV-${Date.now()}`,
        employeeId: advanceEmployee.id,
        employeeName: advanceEmployee.fullName,
        paymentType: 'advance',
        amount: Number(advanceAmount),
        paymentDate: new Date().toISOString().split('T')[0],
        paymentMethod: 'cash',
        referenceNumber: advanceRef,
        notes: advanceNotes,
        recordedBy: currentUser.id,
        createdAt: new Date().toISOString(),
      };

      await savePayment(payment);
      setIsAdvanceModalOpen(false);
      setSuccessMsg(`Recorded LKR ${payment.amount} advance for ${advanceEmployee.fullName}`);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filteredEmployees = employees.filter((emp) => {
    if (filterFactory !== 'all' && emp.currentFactoryId !== filterFactory) return false;
    if (filterGender !== 'all' && emp.gender !== filterGender) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        emp.fullName.toLowerCase().includes(q) ||
        emp.id.toLowerCase().includes(q) ||
        emp.nic.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 w-full max-w-full overflow-hidden">
      {/* Header */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-bold text-slate-800 flex items-center space-x-2">
              <Users className="w-5 h-5 text-emerald-600" />
              <span>Helper Workforce &amp; Agreed Wage Rates</span>
            </h2>
            <span className="px-2 py-0.5 text-xs font-bold bg-emerald-100 text-emerald-800 rounded">
              Fixed Designation: Helper
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage agency helpers, Sri Lankan NIC verification, factory assignments, and agreed wages
          </p>
        </div>

        {!isSupervisor && (
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-xs flex items-center space-x-1.5 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Register New Helper</span>
          </button>
        )}
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs rounded-lg flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">{successMsg}</span>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by name, ID or NIC..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none"
          />
        </div>

        <div>
          <select
            value={filterFactory}
            onChange={(e) => setFilterFactory(e.target.value)}
            className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 focus:outline-none"
          >
            <option value="all">All Assigned Factories</option>
            {factories.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={filterGender}
            onChange={(e) => setFilterGender(e.target.value)}
            className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 focus:outline-none"
          >
            <option value="all">All Genders</option>
            <option value="male">Male Helpers Only</option>
            <option value="female">Female Helpers Only</option>
          </select>
        </div>
      </div>

      {/* Employee Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEmployees.map((emp) => {
          const fac = factories.find((f) => f.id === emp.currentFactoryId);
          const empAdvances = payments.filter(
            (p) => p.employeeId === emp.id && p.paymentType === 'advance'
          );
          const totalAdvances = empAdvances.reduce((sum, p) => sum + p.amount, 0);

          return (
            <div
              key={emp.id}
              className="bg-white rounded-xl border border-slate-200 hover:border-emerald-300 p-4 shadow-xs flex flex-col justify-between transition"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold px-2 py-0.5 bg-slate-100 rounded text-slate-800">
                    {emp.id}
                  </span>
                  <div className="flex items-center space-x-1.5">
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        emp.gender === 'male'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}
                    >
                      {emp.gender === 'male' ? 'Male' : 'Female'}
                    </span>
                    <span className="text-[11px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">
                      Helper
                    </span>
                  </div>
                </div>

                <h3 className="font-bold text-slate-900 text-base mt-2">{emp.fullName}</h3>
                <p className="text-xs text-slate-500">NIC: <strong className="text-slate-700">{emp.nic}</strong></p>
                <p className="text-xs text-slate-500 mt-0.5">Phone: {emp.phone || '-'}</p>

                {/* Factory Assignment Banner */}
                <div className="mt-3 p-2 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                  <span className="text-slate-400 block text-[10px] uppercase">Assigned Factory</span>
                  <span className="font-bold text-slate-800">{fac?.name || 'Unassigned'}</span>
                </div>

                {/* Wage and Benefits Specs */}
                <div className="mt-2.5 p-2.5 bg-emerald-50/50 rounded-lg border border-emerald-100 text-xs space-y-1">
                  <div className="flex justify-between items-center text-emerald-950 font-bold">
                    <span>Worker Wage:</span>
                    <span>
                      LKR {emp.wageRate.toLocaleString()} /{' '}
                      <span className="capitalize font-normal text-slate-600">{emp.wageArrangement}</span>
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-slate-600 text-[11px] pt-1 border-t border-emerald-100">
                    <span>Meal Eligibility:</span>
                    <span className={emp.eligibleForMeals ? 'text-emerald-700 font-semibold' : 'text-slate-400'}>
                      {emp.eligibleForMeals ? 'Eligible' : 'Not Eligible'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-slate-600 text-[11px]">
                    <span>Hostel Boarding:</span>
                    <span className={emp.eligibleForBoarding ? 'text-blue-700 font-semibold' : 'text-slate-400'}>
                      {emp.eligibleForBoarding ? 'Boarding Active' : 'No'}
                    </span>
                  </div>

                  {totalAdvances > 0 && (
                    <div className="flex justify-between items-center text-amber-800 font-semibold text-[11px] pt-1 border-t border-emerald-100">
                      <span>Total Advances:</span>
                      <span>LKR {totalAdvances.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>

              {!isSupervisor && (
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => openAdvanceModal(emp)}
                    className="px-2.5 py-1 text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-800 rounded border border-amber-200 transition cursor-pointer"
                  >
                    + Record Advance
                  </button>
                  {currentUser.role === 'admin' && (
                    <button
                      onClick={() => openPortalPinModal(emp)}
                      className="px-2.5 py-1 text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded border border-emerald-200 transition cursor-pointer"
                    >
                      Set Portal PIN
                    </button>
                  )}
                  <button
                    onClick={() => printIdCard(emp, fac?.name || 'Royal Hires')}
                    className="px-2.5 py-1 text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-800 rounded border border-amber-200 transition cursor-pointer flex items-center gap-1"
                  >
                    <CreditCard className="w-3.5 h-3.5" /> ID Card
                  </button>
                  <button
                    onClick={() => openEditModal(emp)}
                    className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition cursor-pointer"
                  >
                    Edit Helper
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {portalPinEmployee && currentUser.role === 'admin' && (
        <div className="fixed inset-0 z-[70] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div>
              <h3 className="font-bold text-lg text-slate-900">Worker Portal PIN</h3>
              <p className="text-sm text-slate-600 mt-1">Issue a private PIN for {portalPinEmployee.fullName} ({portalPinEmployee.id}). The worker can use it to view only their own approved salary slips and meal bill.</p>
            </div>
            {portalPinIssued ? (
              <div className="space-y-4">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                  <p className="text-sm font-semibold text-emerald-900">PIN created successfully</p>
                  <p className="text-xs text-emerald-800 mt-1">This is the only time the PIN is shown. Share it privately with the worker. If you close this window, it cannot be retrieved.</p>
                  <div className="mt-3 flex items-center gap-2">
                    <code className="flex-1 rounded-lg bg-white border border-emerald-200 p-3 text-xl font-black tracking-[0.25em]">{portalPin}</code>
                    <button type="button" onClick={() => navigator.clipboard?.writeText(portalPin)} className="px-3 py-2 bg-white border border-emerald-300 rounded-lg font-semibold text-sm">Copy</button>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button type="button" onClick={() => { setPortalPinEmployee(null); setPortalPin(''); setPortalPinError(''); setPortalPinIssued(false); }} className="px-4 py-2 bg-emerald-700 text-white rounded-lg font-bold">Done</button>
                </div>
              </div>
            ) : (
            <form onSubmit={handleSetPortalPin} className="space-y-3">
              <label className="block text-sm font-semibold text-slate-700">6-digit temporary PIN</label>
              <input
                type="password"
                inputMode="numeric"
                autoComplete="new-password"
                pattern="[0-9]{6,10}"
                minLength={6}
                maxLength={10}
                required
                value={portalPin}
                onChange={(e) => setPortalPin(e.target.value.replace(/\D/g, '').slice(0, 10))}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 text-lg tracking-[0.25em]"
              />
              <p className="text-xs text-slate-500">A random 6-digit PIN is generated. You may change it before saving. The PIN is stored as a salted hash and cannot be recovered later.</p>
              {portalPinError && <div role="alert" className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">{portalPinError}</div>}
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => { setPortalPinEmployee(null); setPortalPin(''); setPortalPinError(''); }} className="px-4 py-2 border border-slate-300 rounded-lg font-semibold">Cancel</button>
                <button type="submit" disabled={portalPinSaving} className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg font-bold disabled:opacity-50">{portalPinSaving ? 'Saving…' : 'Set PIN'}</button>
              </div>
            </form>
            )}
          </div>
        </div>
      )}

      {/* Helper Registration / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base text-slate-900 flex items-center space-x-2">
                <Users className="w-5 h-5 text-emerald-600" />
                <span>{editingEmployee ? `Edit Helper: ${editingEmployee.fullName}` : 'Register New Helper'}</span>
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

            <form onSubmit={handleSaveEmployee} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Employee ID *</label>
                  <input
                    type="text"
                    required
                    value={id}
                    onChange={(e) => setId(e.target.value)}
                    placeholder="e.g. RHTD200"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-bold uppercase"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Fixed Designation</label>
                  <input
                    type="text"
                    disabled
                    value="Helper"
                    className="w-full bg-slate-100 border border-slate-300 rounded-lg p-2 font-bold text-slate-600 cursor-not-allowed"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Fixed by company policy. No job categories.</p>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => { setFullName(e.target.value); if (!editingEmployee) setId(generateMemberId(e.target.value, employees)); }}
                  placeholder="e.g. Kasun Bandara"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">NIC / ID Reference *</label>
                  <input
                    type="text"
                    required
                    value={nic}
                    onChange={(e) => setNic(e.target.value)}
                    placeholder="e.g. 199512345678 or 926543210V"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 uppercase"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Gender *</label>
                  <select
                    value={gender}
                    onChange={(e) => { const nextGender = e.target.value as 'male' | 'female'; setGender(nextGender); if (!editingEmployee) setWageRate(getFactoryWage(currentFactoryId, nextGender)); }}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                  >
                    <option value="male">Male Helper</option>
                    <option value="female">Female Helper</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Telephone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+94 77 123 4567"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Emergency Contact</label>
                  <input
                    type="text"
                    value={emergencyContact}
                    onChange={(e) => setEmergencyContact(e.target.value)}
                    placeholder="e.g. Spouse (+94 77 999 8881)"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Residential Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. No. 12, Temple Rd, Gampaha"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                />
              </div>

              {/* Factory Assignment & Agreed Wage Configuration */}
              <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-200 space-y-3">
                <h4 className="font-bold text-slate-800">Factory Assignment &amp; Wage Terms</h4>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Assigned Factory *</label>
                  <select
                    value={currentFactoryId}
                    onChange={(e) => { const nextFactoryId = e.target.value; setCurrentFactoryId(nextFactoryId); if (!editingEmployee) setWageRate(getFactoryWage(nextFactoryId, gender)); }}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2"
                  >
                    {factories.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name} ({f.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Wage Arrangement *</label>
                    <select
                      value={wageArrangement}
                      onChange={(e) => setWageArrangement(e.target.value as any)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2"
                    >
                      <option value="daily">Daily Wage (Standard)</option>
                      <option value="weekly">Weekly Wage (Agreed 6-day basis)</option>
                      <option value="monthly">Monthly Wage (Agreed 26-day basis)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Auto-filled Worker Wage (LKR) *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={wageRate}
                      onChange={(e) => setWageRate(Number(e.target.value))}
                      placeholder="e.g. 2200"
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 font-bold text-emerald-700"
                    />
                  </div>
                </div>
              </div>

              {/* Meals & Boarding Eligibility */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <h4 className="font-bold text-slate-800">Deduction Eligibilities</h4>
                <div className="flex flex-col sm:flex-row gap-4 pt-1">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={eligibleForMeals}
                      onChange={(e) => setEligibleForMeals(e.target.checked)}
                      className="rounded text-emerald-600"
                    />
                    <span className="font-semibold text-slate-700">Eligible for Meal Deductions</span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={eligibleForBoarding}
                      onChange={(e) => setEligibleForBoarding(e.target.checked)}
                      className="rounded text-blue-600"
                    />
                    <span className="font-semibold text-slate-700">Eligible for Boarding Facility</span>
                  </label>
                </div>

                {eligibleForBoarding && (
                  <div className="pt-2">
                    <label className="block font-semibold text-slate-600 mb-1">Boarding Location</label>
                    <select
                      value={boardingLocationId}
                      onChange={(e) => setBoardingLocationId(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2"
                    >
                      {boardingLocations.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name} (LKR {b.dailyRate}/day)
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

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
                  Save Helper
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Advance Modal */}
      {isAdvanceModalOpen && advanceEmployee && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base text-slate-900">
                Record Advance: {advanceEmployee.fullName}
              </h3>
              <button
                onClick={() => setIsAdvanceModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRecordAdvance} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Advance Amount in LKR *</label>
                <input
                  type="number"
                  required
                  min="100"
                  value={advanceAmount}
                  onChange={(e) => setAdvanceAmount(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-bold text-base text-amber-700"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Voucher / Reference No</label>
                <input
                  type="text"
                  value={advanceRef}
                  onChange={(e) => setAdvanceRef(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Reason / Notes</label>
                <textarea
                  rows={2}
                  value={advanceNotes}
                  onChange={(e) => setAdvanceNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsAdvanceModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-bold shadow-xs cursor-pointer"
                >
                  Confirm Advance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
