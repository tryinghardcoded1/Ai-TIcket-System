import React, { useState, useEffect } from 'react';
import { Plus, Search, Calendar, MapPin, Hash, User } from 'lucide-react';
import { db } from '../firebase';
import { collection, getDocs, addDoc, query, orderBy } from 'firebase/firestore';
import CSVImporter from './CSVImporter';

export default function ReservationManagement({ setView }: { setView: (v: string) => void }) {
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingNew, setIsAddingNew] = useState(false);

  // New Reservation State
  const [customers, setCustomers] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [resSnap, custSnap, vehSnap] = await Promise.all([
        getDocs(query(collection(db, 'reservations'))),
        getDocs(query(collection(db, 'customers'))),
        getDocs(query(collection(db, 'vehicles')))
      ]);
      setReservations(resSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setCustomers(custSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setVehicles(vehSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReservation = async () => {
    if (!selectedCustomerId || !selectedVehicleId || !startDate || !endDate) {
      alert("Missing required fields");
      return;
    }
    try {
      setLoading(true);
      await addDoc(collection(db, 'reservations'), {
        customerId: selectedCustomerId,
        vehicleId: selectedVehicleId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        status: 'quote', // default quote
        totalAmount: 100, // placeholder
        depositStatus: 'pending'
      });
      setIsAddingNew(false);
      fetchData();
    } catch (e) {
      console.error(e);
      alert('Failed to spawn reservation');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async (data: any[]) => {
    if (!db) return;
    let importedCount = 0;
    for (const row of data) {
      if (row.customerId && row.vehicleId && row.startDate && row.endDate) {
        try {
          await addDoc(collection(db, 'reservations'), {
            customerId: row.customerId,
            vehicleId: row.vehicleId,
            startDate: new Date(row.startDate),
            endDate: new Date(row.endDate),
            status: row.status || 'quote',
            totalAmount: parseFloat(row.totalAmount) || 0,
            depositStatus: row.depositStatus || 'pending'
          });
          importedCount++;
        } catch (e) {
          console.error("Error importing reservation", e);
        }
      }
    }
    alert(`Successfully imported ${importedCount} reservations from CSV.`);
    fetchData();
  };

  if (isAddingNew) {
    return (
      <div className="max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">New Reservation</h1>
            <p className="text-zinc-500 text-sm mt-1">Initiate a new vehicle lease record.</p>
          </div>
          <button 
            onClick={() => setIsAddingNew(false)}
            className="text-[10px] uppercase font-black tracking-widest text-zinc-500 hover:text-white transition-colors"
          >
            Cancel
          </button>
        </div>

        <div className="bg-[#09090b] border border-[#27272a] p-8 rounded-2xl space-y-6">
          <div className="space-y-4 border-b border-[#27272a] pb-6">
            <h3 className="text-[10px] font-black text-white uppercase tracking-widest">Client Assignment</h3>
            <div className="flex gap-4 items-end">
              <div className="flex-1 space-y-1.5">
                <label className="text-[10px] font-black text-zinc-600 uppercase tracking-tighter px-1">Select Existing Contact</label>
                <select 
                  value={selectedCustomerId}
                  onChange={e => setSelectedCustomerId(e.target.value)}
                  className="w-full bg-[#18181b] border border-[#27272a] rounded-xl py-3 px-4 text-xs text-white outline-none focus:border-blue-500/50"
                >
                  <option value="">-- Choose Client --</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.firstName} {c.lastName} ({c.email})</option>
                  ))}
                </select>
              </div>
              <p className="text-[10px] text-zinc-500 uppercase font-black px-2 pb-3">OR</p>
              <button 
                onClick={() => setView('contacts-customers')}
                className="px-6 py-3 bg-zinc-900 border border-[#27272a] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-blue-500/50 hover:bg-[#111113] transition-all flex items-center gap-2"
              >
                <Plus size={14} /> Add New Contact
              </button>
            </div>
          </div>

          <div className="space-y-4 pb-6 border-b border-[#27272a]">
            <h3 className="text-[10px] font-black text-white uppercase tracking-widest">Asset Selection</h3>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-zinc-600 uppercase tracking-tighter px-1">Select Vehicle</label>
              <select 
                value={selectedVehicleId}
                onChange={e => setSelectedVehicleId(e.target.value)}
                className="w-full bg-[#18181b] border border-[#27272a] rounded-xl py-3 px-4 text-xs text-white outline-none focus:border-blue-500/50"
              >
                <option value="">-- Choose Vehicle --</option>
                {vehicles.map(v => (
                  <option key={v.id} value={v.id}>{v.make} {v.model} ({v.plate})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-4">
             <h3 className="text-[10px] font-black text-white uppercase tracking-widest">Lease Duration</h3>
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-zinc-600 uppercase tracking-tighter px-1">Start Date</label>
                  <input type="datetime-local" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-[#18181b] border border-[#27272a] rounded-xl py-3 px-4 text-xs text-white outline-none focus:border-blue-500/50" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-zinc-600 uppercase tracking-tighter px-1">End Date</label>
                  <input type="datetime-local" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full bg-[#18181b] border border-[#27272a] rounded-xl py-3 px-4 text-xs text-white outline-none focus:border-blue-500/50" />
                </div>
             </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button 
              onClick={handleCreateReservation} 
              disabled={loading}
              className="px-6 py-3 bg-white text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-200 transition-colors shadow-[0_0_30px_rgba(255,255,255,0.05)] disabled:opacity-50"
            >
              {loading ? "Processing..." : "Create Reservation"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Active Reservations</h1>
          <p className="text-zinc-500 text-sm mt-1">Manage ongoing and upcoming bookings.</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => setIsAddingNew(true)}
            className="px-4 py-2 bg-white text-black rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-zinc-200 transition-colors flex items-center gap-2"
          >
            <Plus size={14} /> New Record
          </button>
          <CSVImporter onImport={handleImport} label="Import" />
        </div>
      </div>

      <div className="bg-[#09090b] border border-[#27272a] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#27272a] bg-[#111113]">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-zinc-500">RES ID</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-zinc-500">Client / Contact</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-zinc-500">Asset</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-zinc-500">Duration</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-zinc-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#27272a]">
              {reservations.map(res => (
                <tr key={res.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4 text-xs font-mono font-bold text-white uppercase">
                    #{res.id.slice(0, 6)}
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs font-bold text-white">{customers.find(c => c.id === res.customerId)?.firstName || 'Unknown'}</p>
                    <p className="text-[10px] text-zinc-500">{customers.find(c => c.id === res.customerId)?.email || 'Unknown'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs font-bold text-white">
                      {vehicles.find(v => v.id === res.vehicleId)?.make} {vehicles.find(v => v.id === res.vehicleId)?.model}
                    </p>
                    <p className="text-[10px] text-blue-400 font-black">{vehicles.find(v => v.id === res.vehicleId)?.plate}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs text-zinc-300">
                      {res.startDate?.toDate ? new Date(res.startDate.toDate()).toLocaleDateString() : 'N/A'} - 
                      {res.endDate?.toDate ? new Date(res.endDate.toDate()).toLocaleDateString() : 'N/A'}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-zinc-800 text-zinc-400 text-[9px] font-black uppercase tracking-widest rounded">
                      {res.status}
                    </span>
                  </td>
                </tr>
              ))}
              {reservations.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-zinc-500 text-sm">
                    No active reservations found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
