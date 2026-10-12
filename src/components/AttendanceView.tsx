import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { AttendanceRecord, AttendanceStatus, Employee } from '../types';
import {
  CalendarCheck,
  CheckCircle2,
  Clock,
  Coffee,
  Home,
  Save,
  AlertTriangle,
  WifiOff,
  UserCheck,
  RefreshCw,
  Search,
} from 'lucide-react';

interface EntryRow {
  employee: Employee;
  status: AttendanceStatus;
  payableUnits: number;
  otHours: number;
  otMinutes: number;
  hadBreakfast: boolean;
  hadLunch: boolean;
  hadDinner: boolean;
  hadBoarding: boolean;
  notes: string;
  isExisting: boolean;
  existingId?: string;
  submissionStatus?: AttendanceRecord['submissionStatus'];
}

export const AttendanceView: React.FC = () => {
  const {
    currentUser,
    factories,
    employees,
    attendance,
    batchSaveAttendance,
    isOnline,
    t,
  } = useApp();

  const isSupervisor = currentUser.role === 'supervisor';
  const assignedFactoryIds = currentUser.assignedFactoryIds || [];

  const accessibleFactories = isSupervisor
    ? factories.filter((f) => assignedFactoryIds.includes(f.id))
    : factories;

  const [selectedFactoryId, setSelectedFactoryId] = useState<string>(
    accessibleFactories[0]?.id || ''
  );
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [selectedShift, setSelectedShift] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [entryRows, setEntryRows] = useState<EntryRow[]>([]);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const selectedFactory = factories.find((f) => f.id === selectedFactoryId);

  // Auto-select first accessible factory when factories load
  useEffect(() => {
    if (!selectedFactoryId && accessibleFactories.length > 0) {
      setSelectedFactoryId(accessibleFactories[0].id);
    }
  }, [accessibleFactories, selectedFactoryId]);

  // Set default shift when factory changes
  useEffect(() => {
    if (selectedFactory && selectedFactory.shifts.length > 0) {
      setSelectedShift(selectedFactory.shifts[0].name);
    } else {
      setSelectedShift('General Shift');
    }
  }, [selectedFactoryId, selectedFactory]);

  // Load employees and merge existing attendance records for the selected factory and date
  useEffect(() => {
    if (!selectedFactoryId) return;

    const factoryEmployees = employees.filter(
      (e) => e.currentFactoryId === selectedFactoryId && e.status === 'active'
    );

    const dateAttendance = attendance.filter(
      (a) => a.factoryId === selectedFactoryId && a.date === selectedDate
    );

    const rows: EntryRow[] = factoryEmployees.map((emp) => {
      const existing = dateAttendance.find((a) => a.employeeId === emp.id);

      if (existing) {
        return {
          employee: emp,
          status: existing.status,
          payableUnits: existing.payableUnits,
          otHours: existing.otHours,
          otMinutes: existing.otMinutes,
          hadBreakfast: existing.hadBreakfast,
          hadLunch: existing.hadLunch,
          hadDinner: existing.hadDinner,
          hadBoarding: existing.hadBoarding,
          notes: existing.notes || '',
          isExisting: true,
          existingId: existing.id,
          submissionStatus: existing.submissionStatus,
        };
      }

      // Default values for new entry
      return {
        employee: emp,
        status: 'present',
        payableUnits: 1.0,
        otHours: 0,
        otMinutes: 0,
        hadBreakfast: emp.eligibleForMeals,
        hadLunch: emp.eligibleForMeals,
        hadDinner: false,
        hadBoarding: emp.eligibleForBoarding,
        notes: '',
        isExisting: false,
      };
    });

    setEntryRows(rows);
  }, [selectedFactoryId, selectedDate, employees, attendance]);

  const updateRow = (empId: string, updates: Partial<EntryRow>) => {
    setEntryRows((prev) =>
      prev.map((row) => (row.employee.id === empId ? { ...row, ...updates } : row))
    );
  };

  const setStatusForEmployee = (empId: string, status: AttendanceStatus) => {
    let units = 1.0;
    if (status === 'half_day') units = 0.5;
    if (status === 'absent' || status === 'leave') units = 0;

    updateRow(empId, { status, payableUnits: units });
  };

  const handleMarkAllPresent = () => {
    setEntryRows((prev) =>
      prev.map((row) => ({
        ...row,
        status: 'present',
        payableUnits: 1.0,
      }))
    );
  };

  const handleSaveAttendance = async () => {
    if (!selectedFactory) return;
    setIsSaving(true);
    setSaveSuccessMsg('');

    try {
      const recordsToSave: AttendanceRecord[] = entryRows.map((row) => {
        const totalOtHours = Number(row.otHours) + Number(row.otMinutes) / 60;
        const now = new Date().toISOString();

        return {
          id: row.existingId || `att-${row.employee.id}-${selectedDate}`,
          employeeId: row.employee.id,
          employeeName: row.employee.fullName,
          employeeGender: row.employee.gender,
          factoryId: selectedFactory.id,
          factoryName: selectedFactory.name,
          date: selectedDate,
          shift: selectedShift,
          status: row.status,
          payableUnits: row.payableUnits,
          otHours: Number(row.otHours) || 0,
          otMinutes: Number(row.otMinutes) || 0,
          totalOtHours,
          hadBreakfast: row.hadBreakfast,
          hadLunch: row.hadLunch,
          hadDinner: row.hadDinner,
          hadBoarding: row.hadBoarding,
          notes: row.notes,
          recordedBy: currentUser.id,
          supervisorName: currentUser.name,
          // Admin submissions are auto-approved; supervisor submissions require Admin OT approval
          submissionStatus:
            row.isExisting && row.submissionStatus === 'approved'
              ? 'approved'
              : currentUser.role === 'admin'
              ? 'approved'
              : 'submitted',
          billable:
            row.isExisting && row.submissionStatus === 'approved'
              ? true
              : currentUser.role === 'admin',
          syncStatus: isOnline ? 'synced' : 'pending',
          createdAt: row.isExisting ? now : now,
          updatedAt: now,
        };
      });

      await batchSaveAttendance(recordsToSave);
      setSaveSuccessMsg(
        isOnline
          ? `Successfully saved attendance for ${recordsToSave.length} helpers on ${selectedDate}!`
          : `Saved ${recordsToSave.length} records offline in IndexedDB. Will sync automatically when connected.`
      );

      setTimeout(() => setSaveSuccessMsg(''), 4500);
    } catch (err: any) {
      alert(`Error saving attendance: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredRows = entryRows.filter((r) =>
    r.employee.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.employee.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-5 w-full max-w-full overflow-hidden">
      {/* Top Controls Card */}
      <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center space-x-2">
              <CalendarCheck className="w-5 h-5 text-emerald-600" />
              <span>{t.attendance.markAttendance}</span>
            </h2>
            <p className="text-xs text-slate-500">
              Mobile-first daily entry for factory helpers, hours, overtime, and meals
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleMarkAllPresent}
              className="px-3 py-1.5 text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition cursor-pointer"
            >
              {t.attendance.markAllPresent}
            </button>
            <button
              onClick={handleSaveAttendance}
              disabled={isSaving || filteredRows.length === 0}
              className="px-4 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow-xs flex items-center space-x-1.5 transition cursor-pointer disabled:opacity-50"
            >
              {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{isOnline ? t.common.save : 'Save Offline (IndexedDB)'}</span>
            </button>
          </div>
        </div>

        {/* Selection Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
          {/* Factory Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              {t.attendance.selectFactory}
            </label>
            <select
              value={selectedFactoryId}
              onChange={(e) => setSelectedFactoryId(e.target.value)}
              className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              {accessibleFactories.map((fac) => (
                <option key={fac.id} value={fac.id}>
                  {fac.code} - {fac.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              {t.attendance.selectDate}
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Shift Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              {t.attendance.selectShift}
            </label>
            <select
              value={selectedShift}
              onChange={(e) => setSelectedShift(e.target.value)}
              className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              {selectedFactory?.shifts.map((s) => (
                <option key={s.id} value={s.name}>
                  {s.name} ({s.startTime} - {s.endTime})
                </option>
              )) || <option value="General Shift">General Shift (08:00 - 17:00)</option>}
            </select>
          </div>
        </div>

        {/* Search Helper Filter */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search helper name or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        {/* Success feedback toast */}
        {saveSuccessMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs rounded-lg flex items-center space-x-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{saveSuccessMsg}</span>
          </div>
        )}
      </div>

      {/* Helper Attendance Cards (Optimized for Android Touch & Desktop) */}
      <div className="space-y-3">
        {filteredRows.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-500">
            <UserCheck className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-semibold">No helpers assigned to this factory.</p>
            <p className="text-xs text-slate-400 mt-1">
              Assign helpers to this factory in the Helpers &amp; Wages module.
            </p>
          </div>
        ) : (
          filteredRows.map((row) => {
            const emp = row.employee;
            return (
              <div
                key={emp.id}
                className={`bg-white rounded-xl p-4 border transition ${
                  row.status === 'present'
                    ? 'border-emerald-300 shadow-xs'
                    : row.status === 'half_day'
                    ? 'border-amber-300'
                    : 'border-slate-200 opacity-90'
                }`}
              >
                {/* Employee Info Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="flex items-center space-x-2.5">
                    <span className="px-2 py-0.5 text-xs font-bold bg-slate-100 text-slate-700 rounded border border-slate-300">
                      {emp.id}
                    </span>
                    <span className="font-bold text-slate-800 text-sm">{emp.fullName}</span>
                    <span
                      className={`text-[11px] px-1.5 py-0.5 rounded font-semibold ${
                        emp.gender === 'male'
                          ? 'bg-blue-50 text-blue-700'
                          : 'bg-purple-50 text-purple-700'
                      }`}
                    >
                      {emp.gender === 'male' ? 'Male' : 'Female'}
                    </span>
                    <span className="text-[11px] px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded font-bold">
                      Helper
                    </span>
                  </div>

                  {row.isExisting && (
                    <div className="flex items-center space-x-1 text-xs">
                      <span className="text-slate-400">Status:</span>
                      <span
                        className={`font-semibold px-2 py-0.5 rounded text-[11px] ${
                          row.submissionStatus === 'approved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {row.submissionStatus === 'approved' ? 'Approved & Billable' : 'Submitted (Pending OT Approval)'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Entry Form Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3">
                  {/* Attendance Status Buttons */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">
                      Attendance Status
                    </label>
                    <div className="grid grid-cols-4 gap-1">
                      {(['present', 'half_day', 'absent', 'leave'] as AttendanceStatus[]).map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setStatusForEmployee(emp.id, st)}
                          className={`py-1.5 text-xs font-semibold rounded-lg border transition cursor-pointer ${
                            row.status === st
                              ? st === 'present'
                                ? 'bg-emerald-600 text-white border-emerald-600'
                                : st === 'half_day'
                                ? 'bg-amber-500 text-white border-amber-500'
                                : st === 'leave'
                                ? 'bg-indigo-600 text-white border-indigo-600'
                                : 'bg-rose-600 text-white border-rose-600'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {st === 'present'
                            ? 'Present'
                            : st === 'half_day'
                            ? '0.5 Day'
                            : st === 'absent'
                            ? 'Absent'
                            : 'Leave'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Overtime Hours & Minutes */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1.5 flex items-center justify-between">
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Overtime (Hours &amp; Mins)</span>
                      </span>
                      <span className="text-slate-400 text-[10px]">
                        Exact: {row.otHours}h {row.otMinutes}m
                      </span>
                    </label>
                    <div className="flex items-center space-x-2">
                      <div className="flex-1">
                        <select
                          value={row.otHours}
                          onChange={(e) => updateRow(emp.id, { otHours: Number(e.target.value) })}
                          className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-1.5 focus:outline-none"
                        >
                          {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((h) => (
                            <option key={h} value={h}>
                              {h} hrs
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex-1">
                        <select
                          value={row.otMinutes}
                          onChange={(e) => updateRow(emp.id, { otMinutes: Number(e.target.value) })}
                          className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-1.5 focus:outline-none"
                        >
                          {[0, 15, 30, 45].map((m) => (
                            <option key={m} value={m}>
                              {m} mins
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Fast thumb shortcuts */}
                    <div className="flex items-center space-x-1 pt-1.5">
                      <button
                        type="button"
                        onClick={() => updateRow(emp.id, { otHours: 0, otMinutes: 0 })}
                        className="px-2 py-0.5 text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold cursor-pointer"
                      >
                        0h
                      </button>
                      <button
                        type="button"
                        onClick={() => updateRow(emp.id, { otHours: 1, otMinutes: 0 })}
                        className="px-2 py-0.5 text-[10px] bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded font-semibold cursor-pointer"
                      >
                        +1h
                      </button>
                      <button
                        type="button"
                        onClick={() => updateRow(emp.id, { otHours: 2, otMinutes: 0 })}
                        className="px-2 py-0.5 text-[10px] bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded font-semibold cursor-pointer"
                      >
                        +2h
                      </button>
                      <button
                        type="button"
                        onClick={() => updateRow(emp.id, { otHours: 1, otMinutes: 30 })}
                        className="px-2 py-0.5 text-[10px] bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded font-semibold cursor-pointer"
                      >
                        +1.5h
                      </button>
                    </div>
                  </div>

                  {/* Meals & Boarding Checkboxes */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1.5 flex items-center space-x-1">
                      <Coffee className="w-3.5 h-3.5 text-slate-400" />
                      <span>Meals &amp; Boarding (Actual)</span>
                    </label>
                    <div className="flex items-center space-x-2 text-xs">
                      {/* Breakfast */}
                      <label
                        className={`flex items-center space-x-1 px-2 py-1 rounded border cursor-pointer ${
                          row.hadBreakfast
                            ? 'bg-amber-50 text-amber-900 border-amber-300 font-bold'
                            : 'bg-slate-50 text-slate-500 border-slate-200'
                        }`}
                        title="Breakfast provided"
                      >
                        <input
                          type="checkbox"
                          checked={row.hadBreakfast}
                          onChange={(e) => updateRow(emp.id, { hadBreakfast: e.target.checked })}
                          className="rounded text-amber-600 focus:ring-0"
                        />
                        <span>B</span>
                      </label>

                      {/* Lunch */}
                      <label
                        className={`flex items-center space-x-1 px-2 py-1 rounded border cursor-pointer ${
                          row.hadLunch
                            ? 'bg-amber-50 text-amber-900 border-amber-300 font-bold'
                            : 'bg-slate-50 text-slate-500 border-slate-200'
                        }`}
                        title="Lunch provided"
                      >
                        <input
                          type="checkbox"
                          checked={row.hadLunch}
                          onChange={(e) => updateRow(emp.id, { hadLunch: e.target.checked })}
                          className="rounded text-amber-600 focus:ring-0"
                        />
                        <span>L</span>
                      </label>

                      {/* Dinner */}
                      <label
                        className={`flex items-center space-x-1 px-2 py-1 rounded border cursor-pointer ${
                          row.hadDinner
                            ? 'bg-amber-50 text-amber-900 border-amber-300 font-bold'
                            : 'bg-slate-50 text-slate-500 border-slate-200'
                        }`}
                        title="Dinner provided"
                      >
                        <input
                          type="checkbox"
                          checked={row.hadDinner}
                          onChange={(e) => updateRow(emp.id, { hadDinner: e.target.checked })}
                          className="rounded text-amber-600 focus:ring-0"
                        />
                        <span>D</span>
                      </label>

                      {/* Boarding */}
                      <label
                        className={`flex items-center space-x-1 px-2 py-1 rounded border cursor-pointer ${
                          row.hadBoarding
                            ? 'bg-blue-50 text-blue-900 border-blue-300 font-bold'
                            : 'bg-slate-50 text-slate-500 border-slate-200'
                        }`}
                        title="Boarding Quarters used"
                      >
                        <input
                          type="checkbox"
                          checked={row.hadBoarding}
                          onChange={(e) => updateRow(emp.id, { hadBoarding: e.target.checked })}
                          className="rounded text-blue-600 focus:ring-0"
                        />
                        <span>Hostel</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Real-time Mobile Live Summary Bar */}
      {entryRows.length > 0 && (
        <div className="sticky bottom-16 sm:bottom-4 z-20 bg-slate-900/95 backdrop-blur-md text-white p-3.5 rounded-2xl shadow-xl border border-slate-800 flex items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center space-x-3 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Present</span>
              <strong className="text-emerald-400 font-bold text-sm">
                {entryRows.filter((r) => r.status === 'present').length}
              </strong>
              <span className="text-slate-500 text-[10px]"> / {entryRows.length}</span>
            </div>
            <div className="h-6 w-px bg-slate-800"></div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Overtime</span>
              <strong className="text-amber-400 font-bold text-sm">
                {entryRows.reduce((sum, r) => sum + (Number(r.otHours) + Number(r.otMinutes) / 60), 0)}h
              </strong>
            </div>
            <div className="h-6 w-px bg-slate-800"></div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">0.5 Day</span>
              <strong className="text-slate-200 font-bold text-sm">
                {entryRows.filter((r) => r.status === 'half_day').length}
              </strong>
            </div>
          </div>

          <button
            onClick={handleSaveAttendance}
            disabled={isSaving}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl shadow-xs flex items-center space-x-1.5 transition cursor-pointer disabled:opacity-50"
          >
            {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>Save Attendance</span>
          </button>
        </div>
      )}
    </div>
  );
};
