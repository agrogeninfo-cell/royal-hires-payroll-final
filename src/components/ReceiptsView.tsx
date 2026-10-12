import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { FactoryReceipt, ReceiptAllocation, FactoryInvoice } from '../types';
import { InvoicingService } from '../services/invoicingService';
import {
  Receipt,
  Plus,
  CheckCircle2,
  AlertCircle,
  Building2,
  DollarSign,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export const ReceiptsView: React.FC = () => {
  const {
    currentUser,
    factories,
    invoices,
    receipts,
    saveReceipt,
    saveInvoice,
    t,
  } = useApp();

  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [isAllocateModalOpen, setIsAllocateModalOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<FactoryReceipt | null>(null);

  // Form Fields
  const [receiptNumber, setReceiptNumber] = useState<string>(`RCT-2026-00${receipts.length + 1}`);
  const [factoryId, setFactoryId] = useState<string>(factories[0]?.id || '');
  const [amount, setAmount] = useState<number>(50000);
  const [paymentMethod, setPaymentMethod] = useState<'bank_transfer' | 'cheque' | 'cash'>('bank_transfer');
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>('');
  const [allocationAmount, setAllocationAmount] = useState<number>(0);
  const [feedback, setFeedback] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  React.useEffect(() => {
    if (!factoryId && factories.length > 0) {
      setFactoryId(factories[0].id);
    }
  }, [factories, factoryId]);

  const handleRecordReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    const fac = factories.find((f) => f.id === factoryId);
    if (!fac) return;

    if (amount <= 0) {
      alert('Receipt amount must be greater than zero.');
      return;
    }

    try {
      const newReceipt: FactoryReceipt = {
        id: `RCT-${Date.now()}`,
        receiptNumber,
        factoryId: fac.id,
        factoryName: fac.name,
        receiptDate: new Date().toISOString().split('T')[0],
        amount: Number(amount),
        paymentMethod,
        referenceNumber: referenceNumber || `REF-${Date.now().toString().slice(-4)}`,
        notes,
        unallocatedAmount: Number(amount),
        allocations: [],
        recordedBy: currentUser.name,
        createdAt: new Date().toISOString(),
      };

      await saveReceipt(newReceipt);
      setIsRecordModalOpen(false);
      setFeedback(`Recorded receipt #${newReceipt.receiptNumber} for LKR ${newReceipt.amount.toLocaleString()}`);
      setTimeout(() => setFeedback(''), 4000);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const openAllocateModal = (rct: FactoryReceipt) => {
    setSelectedReceipt(rct);
    setErrorMsg('');
    const factoryUnpaidInvoices = invoices.filter(
      (inv) => inv.factoryId === rct.factoryId && inv.outstandingBalance > 0
    );

    if (factoryUnpaidInvoices.length > 0) {
      setSelectedInvoiceId(factoryUnpaidInvoices[0].id);
      setAllocationAmount(Math.min(rct.unallocatedAmount, factoryUnpaidInvoices[0].outstandingBalance));
    } else {
      setSelectedInvoiceId('');
      setAllocationAmount(0);
    }
    setIsAllocateModalOpen(true);
  };

  const handlePerformAllocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReceipt || !selectedInvoiceId) return;
    setErrorMsg('');

    const targetInvoice = invoices.find((inv) => inv.id === selectedInvoiceId);
    if (!targetInvoice) return;

    try {
      const { updatedReceipt, updatedInvoice } = InvoicingService.allocateReceipt(
        selectedReceipt,
        targetInvoice,
        Number(allocationAmount),
        currentUser.name
      );

      await saveReceipt(updatedReceipt);
      await saveInvoice(updatedInvoice);

      setIsAllocateModalOpen(false);
      setSelectedReceipt(null);
      setFeedback(
        `Allocated LKR ${allocationAmount.toLocaleString()} to Invoice #${targetInvoice.invoiceNumber}!`
      );
      setTimeout(() => setFeedback(''), 4000);
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
            <Receipt className="w-5 h-5 text-emerald-600" />
            <span>Factory Receipts &amp; Invoice Allocation</span>
          </h2>
          <p className="text-xs text-slate-500">
            Record bank and cash payments received from factories and safely allocate against unpaid invoices
          </p>
        </div>

        {currentUser.role !== 'supervisor' && (
          <button
            onClick={() => {
              setReceiptNumber(`RCT-2026-00${receipts.length + 1}`);
              setIsRecordModalOpen(true);
            }}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-xs flex items-center space-x-1.5 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Record Payment Receipt</span>
          </button>
        )}
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs rounded-lg flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">{feedback}</span>
        </div>
      )}

      {/* Receipts Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th className="p-3">Receipt #</th>
                <th className="p-3">Factory</th>
                <th className="p-3">Receipt Date</th>
                <th className="p-3">Method &amp; Ref</th>
                <th className="p-3 font-bold text-slate-900">Total Received</th>
                <th className="p-3 font-bold text-emerald-700">Allocated</th>
                <th className="p-3 font-bold text-amber-700">Unallocated</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {receipts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    No factory receipts recorded yet. Click "Record Payment Receipt" to add one.
                  </td>
                </tr>
              ) : (
                receipts.map((rct) => {
                  const totalAllocated = rct.amount - rct.unallocatedAmount;
                  return (
                    <tr key={rct.id} className="hover:bg-slate-50/70 transition">
                      <td className="p-3 font-bold text-slate-900">{rct.receiptNumber}</td>
                      <td className="p-3 font-semibold text-slate-800">{rct.factoryName}</td>
                      <td className="p-3 text-slate-500">{rct.receiptDate}</td>
                      <td className="p-3">
                        <span className="capitalize">{rct.paymentMethod.replace('_', ' ')}</span>
                        <span className="text-[10px] text-slate-400 block">{rct.referenceNumber}</span>
                      </td>
                      <td className="p-3 font-bold text-slate-900">
                        LKR {rct.amount.toLocaleString()}
                      </td>
                      <td className="p-3 font-semibold text-emerald-700">
                        LKR {totalAllocated.toLocaleString()}
                      </td>
                      <td className="p-3 font-bold text-amber-700">
                        LKR {rct.unallocatedAmount.toLocaleString()}
                      </td>
                      <td className="p-3 text-right">
                        {rct.unallocatedAmount > 0 ? (
                          <button
                            onClick={() => openAllocateModal(rct)}
                            className="px-2.5 py-1 text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded transition cursor-pointer"
                          >
                            Allocate to Invoice
                          </button>
                        ) : (
                          <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                            Fully Allocated
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Receipt Modal */}
      {isRecordModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base text-slate-900">Record Factory Receipt</h3>
              <button
                onClick={() => setIsRecordModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRecordReceipt} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Receipt Number *</label>
                <input
                  type="text"
                  required
                  value={receiptNumber}
                  onChange={(e) => setReceiptNumber(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-bold uppercase"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Paying Factory *</label>
                <select
                  value={factoryId}
                  onChange={(e) => setFactoryId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-semibold"
                >
                  {factories.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Amount Received in LKR *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  placeholder="e.g. 50000"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-bold text-base text-emerald-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                  >
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="cheque">Cheque</option>
                    <option value="cash">Cash</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Reference / Cheque #</label>
                  <input
                    type="text"
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    placeholder="e.g. TXN-8877"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notes</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsRecordModalOpen(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold shadow-xs cursor-pointer"
                >
                  Save Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Allocate Receipt Modal */}
      {isAllocateModalOpen && selectedReceipt && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base text-slate-900">
                Allocate Receipt #{selectedReceipt.receiptNumber}
              </h3>
              <button
                onClick={() => setIsAllocateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-emerald-50 rounded-lg text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-emerald-800">Factory:</span>
                <strong className="text-emerald-950">{selectedReceipt.factoryName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-emerald-800">Total Receipt Amount:</span>
                <span className="font-semibold text-emerald-950">
                  LKR {selectedReceipt.amount.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between font-bold text-emerald-950 pt-1 border-t border-emerald-200">
                <span>Available Unallocated Balance:</span>
                <span>LKR {selectedReceipt.unallocatedAmount.toLocaleString()}</span>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-300 text-rose-800 text-xs rounded-lg flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handlePerformAllocation} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Select Unpaid Invoice *
                </label>
                {invoices.filter((inv) => inv.factoryId === selectedReceipt.factoryId && inv.outstandingBalance > 0).length === 0 ? (
                  <p className="text-rose-600 font-semibold p-2 bg-rose-50 rounded">
                    No outstanding invoices found for this factory.
                  </p>
                ) : (
                  <select
                    value={selectedInvoiceId}
                    onChange={(e) => {
                      setSelectedInvoiceId(e.target.value);
                      const inv = invoices.find((i) => i.id === e.target.value);
                      if (inv) {
                        setAllocationAmount(Math.min(selectedReceipt.unallocatedAmount, inv.outstandingBalance));
                      }
                    }}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-semibold"
                  >
                    {invoices
                      .filter((inv) => inv.factoryId === selectedReceipt.factoryId && inv.outstandingBalance > 0)
                      .map((inv) => (
                        <option key={inv.id} value={inv.id}>
                          {inv.invoiceNumber} — Outstanding: LKR {inv.outstandingBalance.toLocaleString()}
                        </option>
                      ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Allocation Amount in LKR *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max={selectedReceipt.unallocatedAmount}
                  value={allocationAmount}
                  onChange={(e) => setAllocationAmount(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-bold text-base text-emerald-700"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsAllocateModalOpen(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedInvoiceId || allocationAmount <= 0}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold shadow-xs cursor-pointer disabled:opacity-50"
                >
                  Confirm Allocation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
