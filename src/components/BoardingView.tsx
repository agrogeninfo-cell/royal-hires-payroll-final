import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { BoardingLocation } from '../types';
import { Home, Plus, Users, MapPin, Phone } from 'lucide-react';

export const BoardingView: React.FC = () => {
  const { boardingLocations, employees, currentUser, saveBoardingLocation } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [contactPhone, setContactPhone] = useState('+94 11 ');
  const [dailyRate, setDailyRate] = useState<number>(350);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      const newLoc: BoardingLocation = {
        id: `board-${Date.now()}`,
        name: name.trim(),
        address: address.trim(),
        contactPhone: contactPhone.trim(),
        dailyRate: Number(dailyRate),
        active: true,
      };

      await saveBoardingLocation(newLoc);
      setIsModalOpen(false);
      setName('');
      setAddress('');
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6 w-full max-w-full overflow-hidden">
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center space-x-2">
            <Home className="w-5 h-5 text-blue-600" />
            <span>Boarding Locations &amp; Quarters</span>
          </h2>
          <p className="text-xs text-slate-500">
            Agency staff hostels with independent daily lodging rates and eligible helper residents
          </p>
        </div>

        {currentUser.role === 'admin' && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow-xs flex items-center space-x-1.5 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Boarding Location</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {boardingLocations.map((loc: BoardingLocation) => {
          const residents = employees.filter(
            (e: any) => e.eligibleForBoarding && e.boardingLocationId === loc.id
          );

          return (
            <div
              key={loc.id}
              className="bg-white rounded-xl border border-slate-200 hover:border-blue-300 p-5 shadow-xs space-y-4 transition"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
                  <Home className="w-4 h-4 text-blue-500" />
                  <span>{loc.name}</span>
                </h3>
                <span className="text-xs font-bold px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-200">
                  LKR {loc.dailyRate} / day
                </span>
              </div>

              <div className="text-xs text-slate-500 space-y-1">
                <p className="flex items-center space-x-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{loc.address}</span>
                </p>
                <p className="flex items-center space-x-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{loc.contactPhone || 'N/A'}</span>
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-700 flex items-center space-x-1.5 mb-2">
                  <Users className="w-3.5 h-3.5 text-slate-500" />
                  <span>Resident Helpers ({residents.length})</span>
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {residents.length === 0 ? (
                    <span className="text-[11px] text-slate-400">No helpers currently assigned.</span>
                  ) : (
                    residents.map((r: any) => (
                      <span
                        key={r.id}
                        className="text-[11px] bg-slate-100 text-slate-800 px-2 py-0.5 rounded font-medium border border-slate-200"
                      >
                        {r.fullName} ({r.id})
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base text-slate-900">Add Boarding Location</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Hostel / Location Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Katunayake Hostel #2"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Near Zone Gate 3"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Daily Lodging Rate (LKR)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={dailyRate}
                    onChange={(e) => setDailyRate(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-bold text-blue-700"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold shadow-xs cursor-pointer"
                >
                  Save Location
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
