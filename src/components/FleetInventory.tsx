import React from 'react';
import { 
  X,
  Car as CarIcon, 
  Map as MapIcon, 
  Filter, 
  Plus, 
  MoreVertical,
  Activity,
  Fuel,
  Info,
  Search,
  History,
  MapPin,
  QrCode,
  Wrench,
  Upload
} from 'lucide-react';
import { motion } from 'motion/react';
import { collection, onSnapshot, query, doc, updateDoc, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { cn, handleFirestoreError, OperationType } from '../lib/utils';
import { VehicleStatus, Vehicle } from '../types';
import QRScanner from './QRScanner';
import CSVImporter from './CSVImporter';

const statusColors = {
  [VehicleStatus.AVAILABLE]: "bg-emerald-500",
  [VehicleStatus.RENTED]: "bg-indigo-500",
  [VehicleStatus.MAINTENANCE]: "bg-amber-500",
  [VehicleStatus.ARCHIVED]: "bg-slate-500",
};

export default function FleetInventory({ setView }: { setView?: (view: string) => void }) {
  const [vehicles, setVehicles] = React.useState<Vehicle[]>([]);
  const [loading, setLoading] = React.useState(true);

  const [filterStatus, setFilterStatus] = React.useState<VehicleStatus | 'all'>('all');

  React.useEffect(() => {
    if (!db) return;

    const q = query(collection(db, 'vehicles'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const vehicleData: Vehicle[] = [];
      snapshot.forEach((doc) => {
        vehicleData.push({ id: doc.id, ...doc.data() } as Vehicle);
      });
      setVehicles(vehicleData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'vehicles');
    });

    return () => unsubscribe();
  }, [db]);

  const [selectedVehicle, setSelectedVehicle] = React.useState<Vehicle | null>(null);
  const [maintenanceMode, setMaintenanceMode] = React.useState(false);
  const [isScanning, setIsScanning] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');

  const handleScan = (decodedText: string) => {
    setIsScanning(false);
    const match = vehicles.find(v => v.id === decodedText || v.plateNumber === decodedText || v.vin === decodedText);
    if (match) {
      setSelectedVehicle(match);
      setMaintenanceMode(true);
    } else {
      alert(`No vehicle found matching QR data: ${decodedText}`);
    }
  };

  const filteredVehicles = vehicles.filter(v => {
    if (filterStatus !== 'all' && v.status !== filterStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        v.make?.toLowerCase().includes(q) ||
        v.model?.toLowerCase().includes(q) ||
        v.plateNumber?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleImport = async (data: any[]) => {
    if (!db) return;
    let importedCount = 0;
    for (const row of data) {
      if (row.make && row.model && row.plateNumber) {
        try {
          await addDoc(collection(db, 'vehicles'), {
            make: row.make,
            model: row.model,
            plateNumber: row.plateNumber.toUpperCase(),
            vin: row.vin || '',
            year: parseInt(row.year) || new Date().getFullYear(),
            status: row.status || VehicleStatus.AVAILABLE,
            mileage: parseInt(row.mileage) || 0,
            dailyRate: parseFloat(row.dailyRate) || 0,
            fuelLevel: parseInt(row.fuelLevel) || 100
          });
          importedCount++;
        } catch (e) {
          console.error("Error importing vehicle", e);
        }
      }
    }
    alert(`Successfully imported ${importedCount} vehicles from CSV.`);
  };

  const counts = {
    available: vehicles.filter(v => v.status === VehicleStatus.AVAILABLE).length,
    rented: vehicles.filter(v => v.status === VehicleStatus.RENTED).length,
    maintenance: vehicles.filter(v => v.status === VehicleStatus.MAINTENANCE).length,
    archived: vehicles.filter(v => v.status === VehicleStatus.ARCHIVED).length,
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Active Fleet</h1>
          <p className="text-zinc-500 text-sm mt-1">Real-time status of all digital assets.</p>
        </div>
        <div className="flex gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={14} />
            <input 
              type="text" 
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#111113] border border-[#27272a] rounded-lg py-2 pl-9 pr-4 text-[10px] font-bold uppercase tracking-widest text-white outline-none w-64 placeholder:text-zinc-600 focus:border-zinc-500 transition-colors"
            />
          </div>
          <div className="flex bg-[#111113] border border-[#27272a] rounded-lg items-center px-3">
             <Filter size={14} className="text-zinc-500 mr-2" />
             <select 
               value={filterStatus}
               onChange={(e) => setFilterStatus(e.target.value as VehicleStatus | 'all')}
               className="bg-transparent text-[10px] font-bold uppercase tracking-widest text-white outline-none border-none py-2 cursor-pointer appearance-none"
             >
               <option value="all">All Vehicles</option>
               <option value={VehicleStatus.AVAILABLE}>Available</option>
               <option value={VehicleStatus.RENTED}>Rented</option>
               <option value={VehicleStatus.MAINTENANCE}>Maintenance</option>
               <option value={VehicleStatus.ARCHIVED}>Archived</option>
             </select>
          </div>
          <button 
            onClick={() => setIsScanning(true)}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-[#27272a] text-white rounded-lg text-xs font-bold hover:bg-zinc-800 transition-colors"
          >
            <QrCode size={14} /> Scan ID
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-500 transition-colors shadow-[0_0_15px_rgba(37,99,235,0.3)]">
            <Plus size={14} /> Add Asset
          </button>
          <CSVImporter onImport={handleImport} label="Import" />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="p-4 bg-[#111113] rounded-xl border border-[#27272a] flex flex-col">
          <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest">Available</span>
          <span className="text-2xl font-black text-white">{counts.available}</span>
        </div>
        <div className="p-4 bg-[#111113] rounded-xl border border-[#27272a] flex flex-col">
          <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest">Rented</span>
          <span className="text-2xl font-black text-white">{counts.rented}</span>
        </div>
        <div className="p-4 bg-[#111113] rounded-xl border border-[#27272a] flex flex-col">
          <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest">Maintenance</span>
          <span className="text-2xl font-black text-white">{counts.maintenance}</span>
        </div>
        <div className="p-4 bg-[#111113] rounded-xl border border-[#27272a] flex flex-col">
          <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest">Archived</span>
          <span className="text-2xl font-black text-white">{counts.archived}</span>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="h-96 bg-[#111113] animate-pulse rounded-xl border border-[#27272a]" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredVehicles.map((v) => (
            <motion.div 
              key={v.id}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ y: -4 }}
              onClick={() => setSelectedVehicle(v)}
              className="group bg-[#09090b] border border-[#27272a] rounded-xl overflow-hidden hover:border-zinc-700 transition-all cursor-pointer"
            >
              <div className="aspect-[16/10] bg-zinc-900 relative overflow-hidden flex items-center justify-center p-8">
                <div className="absolute top-4 left-4 z-10 flex gap-2">
                  <span className={cn(
                    "px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-tighter text-white/90 flex items-center gap-1.5 backdrop-blur-md border border-white/5",
                    statusColors[v.status] + "/40"
                  )}>
                    <div className={cn("w-1 h-1 rounded-full bg-white", v.status === VehicleStatus.AVAILABLE && "animate-pulse")} />
                    {v.status}
                  </span>
                  <span className="px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-tighter text-zinc-500 bg-black/20 border border-white/5">
                    {v.year}
                  </span>
                </div>
                
                <CarIcon size={120} strokeWidth={0.5} className="text-zinc-800 scale-125 rotate-[-12deg] group-hover:scale-135 group-hover:text-zinc-700 transition-all duration-700 opacity-40" />

                <div className="absolute bottom-4 right-4 z-10">
                  <button className="p-2 bg-[#111113] border border-[#27272a] rounded-lg text-zinc-600 hover:text-white transition-colors">
                    <MoreVertical size={14} />
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-[#fafafa] tracking-tight tabular-nums">{v.make} {v.model}</h3>
                    <div className="flex items-center gap-2 mt-1">
                       <p className="text-[10px] font-black font-mono text-zinc-600 uppercase tracking-widest">{v.plateNumber}</p>
                       <span className="text-zinc-800 tracking-tighter text-[10px] font-black">/</span>
                       <p className="text-[10px] font-black text-zinc-600 uppercase tracking-tighter underline underline-offset-4 decoration-zinc-800">Fleet Control</p>
                    </div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); setSelectedVehicle(v); setMaintenanceMode(true); }} className="text-zinc-700 hover:text-white transition-colors" title="Maintenance Log">
                    <Wrench size={16} />
                  </button>
                </div>

                <div className="space-y-5">
                  <div className="space-y-2">
                    <div className="flex justify-between items-end">
                      <div className="flex items-center gap-2">
                        <Fuel size={12} className="text-zinc-500" />
                        <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-tighter">Energy Level</span>
                      </div>
                      <span className="text-[10px] font-black text-white tabular-nums">{v.fuelLevel ?? 0}%</span>
                    </div>
                    <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 transition-all duration-1000 ease-out" 
                        style={{ width: `${v.fuelLevel ?? 0}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-2 border-t border-[#27272a]">
                    <div className="flex items-center gap-2">
                      <Activity size={12} className="text-zinc-500" />
                      <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-tighter">Odometer</span>
                    </div>
                    <span className="text-xs font-black text-zinc-400 tabular-nums">{(v.mileage ?? 0).toLocaleString()} <span className="text-[10px] text-zinc-700 uppercase">MI</span></span>
                  </div>
                </div>

                <div className="mt-8 flex gap-2">
                  <button className="flex-1 py-2.5 bg-zinc-900 border border-[#27272a] text-zinc-400 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-zinc-800 hover:text-white transition-all flex items-center justify-center gap-2">
                    <MapIcon size={12} /> Locate
                  </button>
                  <button className="flex-[1.5] py-2.5 bg-white text-black rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-zinc-200 transition-all shadow-xl">
                    Manage Asset
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {isScanning && <QRScanner onScan={handleScan} onClose={() => setIsScanning(false)} />}

      {selectedVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-[#09090b] border border-[#27272a] p-8 rounded-2xl w-full max-w-lg shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-start mb-6">
              <div>
                 <h2 className="text-2xl font-bold text-white tracking-tight">{selectedVehicle.make} {selectedVehicle.model}</h2>
                 <div className="flex items-center gap-2 mt-1">
                   <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest">{selectedVehicle.plateNumber}</p>
                   {maintenanceMode && <span className="bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest">Maintenance Control</span>}
                 </div>
              </div>
              <button onClick={() => { setSelectedVehicle(null); setMaintenanceMode(false); }} className="text-zinc-500 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            {maintenanceMode ? (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                   <div className="p-4 bg-[#111113] border border-[#27272a] rounded-xl flex flex-col gap-1">
                     <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Next Service</span>
                     <span className="text-sm font-black text-white">5,000 MI</span>
                   </div>
                   <div className="p-4 bg-[#111113] border border-[#27272a] rounded-xl flex flex-col gap-1">
                     <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Tire Health</span>
                     <span className="text-sm font-black text-emerald-500">OPTIMAL</span>
                   </div>
                </div>

                <div className="bg-[#111113] border border-[#27272a] rounded-xl overflow-hidden">
                  <div className="p-4 border-b border-[#27272a] bg-zinc-900/50">
                    <h3 className="text-[10px] font-black text-white uppercase tracking-widest">Diagnosed Issues</h3>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="flex justify-between items-center bg-zinc-900 p-3 rounded-lg border border-[#27272a]">
                      <div>
                        <p className="text-xs font-bold text-white uppercase tracking-widest">Change Oil & Filter</p>
                        <p className="text-[10px] font-medium text-zinc-500 mt-1">Routine standard maintenance</p>
                      </div>
                      <span className="px-2 py-1 bg-rose-500/10 text-rose-500 rounded text-[9px] font-black uppercase tracking-widest">Pending</span>
                    </div>
                    <div className="flex justify-between items-center bg-zinc-900 p-3 rounded-lg border border-[#27272a]">
                      <div>
                        <p className="text-xs font-bold text-white uppercase tracking-widest">Brake Pad Inspection</p>
                        <p className="text-[10px] font-medium text-zinc-500 mt-1">Front left sensor logic</p>
                      </div>
                      <span className="px-2 py-1 bg-emerald-500/10 text-emerald-500 rounded text-[9px] font-black uppercase tracking-widest">Cleared</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <button 
                    onClick={async () => {
                      if (!db) return;
                      await updateDoc(doc(db, 'vehicles', selectedVehicle.id), { status: VehicleStatus.MAINTENANCE });
                      setSelectedVehicle({ ...selectedVehicle, status: VehicleStatus.MAINTENANCE });
                    }}
                    disabled={selectedVehicle.status === VehicleStatus.MAINTENANCE}
                    className="w-full py-4 bg-amber-500 text-black rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-amber-400 transition-all disabled:opacity-50 disabled:bg-amber-500/10 disabled:text-amber-500"
                  >
                    Flag for Maintenance
                  </button>
                  {selectedVehicle.status === VehicleStatus.MAINTENANCE && (
                    <button 
                      onClick={async () => {
                        if (!db) return;
                        await updateDoc(doc(db, 'vehicles', selectedVehicle.id), { status: VehicleStatus.AVAILABLE });
                        setSelectedVehicle({ ...selectedVehicle, status: VehicleStatus.AVAILABLE });
                        setMaintenanceMode(false);
                      }}
                      className="w-full py-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500/20 transition-all"
                    >
                      Clear & Release to Fleet
                    </button>
                  )}
                </div>
              </div>
            ) : (
              // Original Asset Details
              <div>
                <div className="space-y-4">
                  <div className="flex justify-between py-3 border-b border-[#27272a]">
                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Status</span>
                    <span className={cn("text-xs font-black uppercase tracking-tighter text-white", statusColors[selectedVehicle.status].replace('bg-', 'text-'))}>
                      {selectedVehicle.status}
                    </span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-[#27272a]">
                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">VIN</span>
                    <span className="text-sm font-mono text-white">{selectedVehicle.vin || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-[#27272a]">
                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Daily Rate</span>
                    <span className="text-sm font-mono text-white">${selectedVehicle.dailyRate || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-[#27272a]">
                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Coordinates</span>
                    <span className="text-sm font-mono text-white">
                      {selectedVehicle.location ? `${selectedVehicle.location.lat.toFixed(4)}, ${selectedVehicle.location.lng.toFixed(4)}` : 'Unknown'}
                    </span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-[#27272a]">
                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Year</span>
                    <span className="text-sm font-mono text-white">{selectedVehicle.year}</span>
                  </div>
                </div>

                <div className="flex gap-3 mt-8">
                  {selectedVehicle.location && (
                    <button 
                      onClick={() => {
                        if (setView) {
                          sessionStorage.setItem('targetMapLocation', JSON.stringify(selectedVehicle.location));
                          setView('fleet-map');
                        }
                      }} 
                      className="flex-1 py-3 bg-zinc-900 border border-[#27272a] text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2"
                    >
                      <MapPin size={14} /> Center on Map
                    </button>
                  )}
                  <button 
                    onClick={() => {
                      if (setView) setView('vehicle-history');
                    }}
                    className="flex-1 py-3 bg-zinc-900 border border-[#27272a] text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2"
                  >
                    <History size={14} /> History
                  </button>
                </div>

                {selectedVehicle.plateNumber === 'TX-9011' && (
                  <button 
                    onClick={async () => {
                      try {
                        await fetch('/api/admin/toggle-tracking', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ vehicleId: 'TX-9011', enabled: true })
                        });
                        alert("Admin Override: Forced Tracking Enabled for TX-9011");
                      } catch (e) {
                        console.error("Failed to toggle tracking", e);
                      }
                    }}
                    className="w-full mt-3 py-3 bg-indigo-600/10 border border-indigo-500/30 text-indigo-400 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600/20 transition-colors hover:border-indigo-500/50 flex items-center justify-center gap-2"
                  >
                    <Activity size={14} /> Force Tracking Enabled (Demo)
                  </button>
                )}
                {selectedVehicle.plateNumber === 'TX-9011' && (
                  <button 
                    onClick={async () => {
                      try {
                        await fetch('/api/admin/toggle-tracking', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ vehicleId: 'TX-9011', enabled: false })
                        });
                        alert("Admin Override: Forced Tracking Disabled for TX-9011");
                      } catch (e) {
                        console.error("Failed to toggle tracking", e);
                      }
                    }}
                    className="w-full mt-3 py-3 bg-rose-600/10 border border-rose-500/30 text-rose-400 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-rose-600/20 transition-colors hover:border-rose-500/50 flex items-center justify-center gap-2"
                  >
                    <X size={14} /> Force Tracking Disabled (Demo)
                  </button>
                )}

                <button 
                  onClick={() => setMaintenanceMode(true)}
                  className="w-full mt-3 py-3 bg-amber-600/10 border border-amber-500/30 text-amber-500 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-amber-600/20 transition-colors hover:border-amber-500/50 flex items-center justify-center gap-2"
                >
                  <Wrench size={14} /> Open Maintenance Panel
                </button>
              </div>
            )}
            
            <button onClick={() => { setSelectedVehicle(null); setMaintenanceMode(false); }} className="w-full mt-4 py-3 bg-[#111113] border border-[#27272a] text-zinc-400 rounded-lg text-[10px] font-black hover:bg-zinc-900 transition-colors uppercase tracking-widest">
              Close Details
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
