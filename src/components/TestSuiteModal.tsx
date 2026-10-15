import React, { useState, useEffect } from 'react';
import { SystemTestSuite, TestResult } from '../test/unitTests';
import {
  PlayCircle,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  RefreshCw,
  Search,
  Filter,
} from 'lucide-react';

interface TestSuiteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TestSuiteModal: React.FC<TestSuiteModalProps> = ({ isOpen, onClose }) => {
  const [results, setResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const runTests = () => {
    setIsRunning(true);
    setTimeout(() => {
      const res = SystemTestSuite.runAllTests();
      setResults(res);
      setIsRunning(false);
    }, 200);
  };

  useEffect(() => {
    if (isOpen && results.length === 0) {
      runTests();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.filter((r) => !r.passed).length;

  const filteredResults = results.filter((r) => {
    if (filterCategory !== 'all' && r.category !== filterCategory) return false;
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto w-full max-w-full">
      <div className="bg-white rounded-2xl max-w-4xl w-full p-4 sm:p-8 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto flex flex-col">
        {/* Modal Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b pb-4">
          <div className="flex items-start sm:items-center space-x-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-slate-900">
                System Verification Test Suite
              </h3>
              <p className="text-xs text-slate-500">
                Mandatory operational assertions verifying Billing, Payroll, Invoicing, Role Isolation &amp; Sync
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end flex-wrap gap-2 w-full sm:w-auto">
            <button
              onClick={runTests}
              disabled={isRunning}
              className="px-3 sm:px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg shadow-xs flex items-center space-x-1.5 transition cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
              <span>Re-run All Tests</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 font-bold text-xl ml-2 cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Scoreboard */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-xs text-slate-500 block uppercase font-medium">Total Test Cases</span>
            <span className="text-2xl font-bold text-slate-900 mt-1">{results.length}</span>
          </div>
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
            <span className="text-xs text-emerald-700 block uppercase font-medium">Passing Assertions</span>
            <span className="text-2xl font-bold text-emerald-800 mt-1">{passedCount}</span>
          </div>
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200">
            <span className="text-xs text-rose-700 block uppercase font-medium">Failed Assertions</span>
            <span className="text-2xl font-bold text-rose-800 mt-1">{failedCount}</span>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-100">
          {['all', 'Billing', 'Payroll', 'Invoicing', 'Security & Sync'].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
                filterCategory === cat
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat === 'all' ? `All ${results.length} Tests` : cat}
            </button>
          ))}
        </div>

        {/* Test Items Checklist */}
        <div className="space-y-2.5 overflow-y-auto flex-1 pr-1">
          {filteredResults.map((test) => (
            <div
              key={test.id}
              className={`p-3.5 rounded-xl border transition flex items-start space-x-3 ${
                test.passed
                  ? 'bg-emerald-50/40 border-emerald-200'
                  : 'bg-rose-50/50 border-rose-300'
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {test.passed ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-600" />
                )}
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex flex-wrap items-center justify-between gap-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-slate-600">Test #{test.id}</span>
                    <span className="text-xs font-bold text-slate-900">{test.title}</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                    {test.category}
                  </span>
                </div>
                <p className={`text-xs ${test.passed ? 'text-emerald-800' : 'text-rose-800 font-medium'}`}>
                  {test.message}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
