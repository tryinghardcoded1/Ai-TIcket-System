import React from 'react';
import { Plus, Search, FileText, UserCircle, Upload, CheckCircle2 } from 'lucide-react';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy, getDoc, doc, addDoc } from 'firebase/firestore';
import AddCustomer from './AddCustomer';
import CSVImporter from './CSVImporter';

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  status?: string;
}

export default function CustomerManagement() {
  const [customers, setCustomers] = React.useState<Customer[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isAddingNew, setIsAddingNew] = React.useState(false);
  const [search, setSearch] = React.useState('');

  React.useEffect(() => {
    fetchCustomers();
  }, [isAddingNew]);

  const fetchCustomers = async () => {
    try {
      const q = query(collection(db, 'customers'));
      const snap = await getDocs(q);
      const fetched = snap.docs.map(d => ({ id: d.id, ...d.data() })) as Customer[];
      setCustomers(fetched);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async (data: any[]) => {
    if (!db) return;
    let importedCount = 0;
    for (const row of data) {
      if (row.firstName && row.lastName && row.email) {
        try {
          await addDoc(collection(db, 'customers'), {
            firstName: row.firstName,
            lastName: row.lastName,
            email: row.email,
            phone: row.phone || '',
            status: row.status || 'Verified',
            address: row.address || '',
            createdAt: new Date().toISOString()
          });
          importedCount++;
        } catch (e) {
          console.error("Error importing customer", e);
        }
      }
    }
    alert(`Successfully imported ${importedCount} customers from CSV.`);
    fetchCustomers();
  };

  if (isAddingNew) {
    return (
      <div className="space-y-4">
        <button 
          onClick={() => setIsAddingNew(false)}
          className="text-[10px] uppercase font-black tracking-widest text-zinc-500 hover:text-white transition-colors"
        >
          ← Return to Directory
        </button>
        <AddCustomer onComplete={() => setIsAddingNew(false)} />
      </div>
    );
  }

  const filtered = customers.filter(c => 
    (c.firstName + ' ' + c.lastName).toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Customer Directory</h1>
          <p className="text-zinc-500 text-sm mt-1">Manage client records, identities, and agreements.</p>
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
        <div className="p-4 border-b border-[#27272a] flex items-center justify-between">
          <div className="relative w-64 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-white transition-colors" />
            <input 
              type="text" 
              placeholder="Search records..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-[#18181b] border border-[#27272a] rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder:text-zinc-600 focus:border-blue-500/50 outline-none transition-all"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#27272a] bg-[#111113]">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-zinc-500">Client</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-zinc-500">Contact</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-zinc-500">Status</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-zinc-500">Vault Assets</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-zinc-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#27272a]">
              {filtered.map(customer => (
                <tr key={customer.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-zinc-900 border border-[#27272a] flex items-center justify-center text-zinc-400">
                        <UserCircle size={16} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">{customer.firstName} {customer.lastName}</p>
                        <p className="text-[10px] text-zinc-500">ID: {customer.id.slice(0, 8).toUpperCase()}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 space-y-1">
                    <p className="text-xs text-white">{customer.email}</p>
                    <p className="text-[10px] text-zinc-500">{customer.phone || 'No phone recorded'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-wider">
                      <CheckCircle2 size={10} /> Verified
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                       <button className="px-2 py-1 bg-zinc-900 border border-[#27272a] rounded flex items-center gap-1.5 hover:border-blue-500/50 transition-colors group/btn">
                         <FileText size={12} className="text-zinc-500 group-hover/btn:text-blue-400" />
                         <span className="text-[9px] font-bold text-zinc-400 uppercase">Agreement.pdf</span>
                       </button>
                       <button className="px-2 py-1 bg-zinc-900 border border-[#27272a] rounded flex items-center gap-1.5 hover:border-purple-500/50 transition-colors group/btn">
                         <UserCircle size={12} className="text-zinc-500 group-hover/btn:text-purple-400" />
                         <span className="text-[9px] font-bold text-zinc-400 uppercase">Gov ID.jpg</span>
                       </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-colors">
                      View Profile
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-zinc-500 text-sm">
                    No customers found in database.
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
