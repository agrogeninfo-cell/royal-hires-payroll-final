import React, { useState } from 'react';
import { todayLocalDate } from '../utils/date';
import { useApp } from '../context/AppContext';
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
  const [startDate, setStartDate] = useState(todayLocalDate());
  const [status, setStatus] = useState<Employee['status']>('active');
  const [currentFactoryId, setCurrentFactoryId] = useState('');
  const [wageArrangement, setWageArrangement] = useState<WageArrangement>('daily');
  const [wageRate, setWageRate] = useState<number>(2200);
  const [eligibleForMeals, setEligibleForMeals] = useState(true);
  const [eligibleForBoarding, setEligibleForBoarding] = useState(false);
  const [boardingLocationId, setBoardingLocationId] = useState('');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const openCreateModal = () => {
    setEditingEmployee(null);
    setId(`EMP-${100 + employees.length + 1}`);
    setFullName('');
    setNic('');
    setPhone('+94 7');
    setAddress('');
    setGender('male');
    setEmergencyContact('');
    setStartDate(todayLocalDate());
    setStatus('active');
    setCurrentFactoryId(factories[0]?.id || '');
    setWageArrangement('daily');
    setWageRate(2200);
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
      setErrorMsg('Full name, NIC, and Employee ID are required.');
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
      setSuccessMsg(`Saved helper ${employeeToSave.fullName} successfully.`);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      setErrorMsg(err.message);
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
        paymentDate: todayLocalDate(),
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
                    <span>Agreed Wage:</span>
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
                    placeholder="e.g. EMP-101"
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
                  onChange={(e) => setFullName(e.target.value)}
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
                    onChange={(e) => setGender(e.target.value as any)}
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
                    onChange={(e) => setCurrentFactoryId(e.target.value)}
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
                      Agreed Rate in LKR *
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
