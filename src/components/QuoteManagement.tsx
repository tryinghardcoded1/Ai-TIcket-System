import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Search, 
  Plus, 
  MoreHorizontal,
  Mail,
  Download,
  Calendar,
  Clock,
  Trash2,
  X
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { db } from '../firebase';
import { collection, onSnapshot, query, doc, addDoc, deleteDoc, updateDoc } from 'firebase/firestore';

interface Quote {
  id: string;
  customerName: string;
  vehicleType: string;
  startDate: string;
  endDate: string;
  totalAmount: number;
  status: 'pending' | 'accepted' | 'expired';
  createdAt: string;
}

const statusColors = {
  pending: 'text-amber-500 bg-amber-500/10 border border-amber-500/20',
  accepted: 'text-emerald-500 bg-emerald-500/10 border border-emerald-500/20',
  expired: 'text-rose-500 bg-rose-500/10 border border-rose-500/20',
};

export default function QuoteManagement() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Create state
  const [isAdding, setIsAdding] = useState(false);
  const [formName, setFormName] = useState('');
  const [formVehicle, setFormVehicle] = useState('Executive Sedan');
  const [formStart, setFormStart] = useState('');
  const [formEnd, setFormEnd] = useState('');
  const [formAmount, setFormAmount] = useState(450);

  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, 'quotes'));
    const unsub = onSnapshot(q, (snap) => {
      setQuotes(snap.docs.map(d => ({ id: d.id, ...d.data() } as Quote)));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleCreateQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;
    try {
      await addDoc(collection(db, 'quotes'), {
        customerName: formName,
        vehicleType: formVehicle,
        startDate: formStart,
        endDate: formEnd,
        totalAmount: formAmount,
        status: 'pending',
        createdAt: new Date().toISOString().split('T')[0]
      });
      setIsAdding(false);
      setFormName('');
      setFormStart('');
      setFormEnd('');
      setFormAmount(450);
    } catch (err) {
      console.error(err);
      alert('Error creating quote');
    }
  };

  const handleDelete = async (id: string) => {
    if (!db) return;
    if (!confirm('Are you sure you want to permanently delete this quote?')) return;
    try {
      await deleteDoc(doc(db, 'quotes', id));
    } catch (err) {
      console.error(err);
      alert('Failed to delete quote');
    }
  };

  if (isAdding) {
    return (
      <div className="max-w-xl animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex justify-between items-end mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Draft New Quote</h1>
            <p className="text-zinc-500 text-sm mt-1">Generate a pricing estimate for a client.</p>
          </div>
          <button 
            onClick={() => setIsAdding(false)}
            className="text-[10px] uppercase font-black tracking-widest text-zinc-500 hover:text-white transition-colors"
          >
            Cancel
          </button>
        </div>

        <form onSubmit={handleCreateQuote} className="bg-[#09090b] border border-[#27272a] p-6 rounded-2xl space-y-4">
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase tracking-wider text-zinc-500 block">Prospect Name</label>
            <input type="text" value={formName} onChange={e => setFormName(e.target.value)} className="w-full bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-blue-500/50" required />
          </div>
          <div className="space-y-1">
             <label className="text-[9px] font-black uppercase tracking-wider text-zinc-500 block">Requested Vehicle Class</label>
             <select value={formVehicle} onChange={e => setFormVehicle(e.target.value)} className="w-full bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-blue-500/50">
               <option value="Executive Sedan">Executive Sedan</option>
               <option value="Premium SUV">Premium SUV</option>
               <option value="Luxury Sports">Luxury Sports</option>
               <option value="Utility Van">Utility Van</option>
             </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
             <div className="space-y-1">
               <label className="text-[9px] font-black uppercase tracking-wider text-zinc-500 block">Proposed Start Date</label>
               <input type="date" value={formStart} onChange={e => setFormStart(e.target.value)} className="w-full bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-blue-500/50" required />
             </div>
             <div className="space-y-1">
               <label className="text-[9px] font-black uppercase tracking-wider text-zinc-500 block">Proposed End Date</label>
               <input type="date" value={formEnd} onChange={e => setFormEnd(e.target.value)} className="w-full bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-blue-500/50" required />
             </div>
          </div>
          <div className="space-y-1">
             <label className="text-[9px] font-black uppercase tracking-wider text-zinc-500 block">Total Est. Amount ($)</label>
             <input type="number" value={formAmount} onChange={e => setFormAmount(parseFloat(e.target.value))} className="w-full bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-blue-500/50" required />
          </div>
          <div className="pt-4 flex justify-end">
             <button type="submit" className="px-6 py-3 bg-white text-black rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-zinc-200 transition-colors">Generate Quote</button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white uppercase italic">Reservation Quotes</h1>
          <p className="text-zinc-500 text-sm mt-1">Manage and track preliminary rental inquiries.</p>
        </div>
        <button onClick={() => setIsAdding(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-500 transition-colors shadow-[0_0_15px_rgba(37,99,235,0.3)]">
          <Plus size={14} /> Create Quote
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="text-center py-12 text-zinc-500 text-sm animate-pulse">Scanning records...</div>
        ) : quotes.length === 0 ? (
           <div className="text-center py-12 text-zinc-500 text-sm">No active quote files found.</div>
        ) : quotes.map((quote) => (
          <motion.div
            key={quote.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="group bg-[#09090b] border border-[#27272a] rounded-xl p-5 hover:border-zinc-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-zinc-900 rounded-lg flex items-center justify-center border border-[#27272a] group-hover:scale-110 transition-transform flex-shrink-0">
                <FileText className="text-zinc-500" size={20} />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="font-bold text-white uppercase tracking-tight">{quote.customerName}</h3>
                  <span className={cn("px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest", statusColors[quote.status] || statusColors.pending)}>
                    {quote.status}
                  </span>
                </div>
                <div className="flex items-center gap-4 mt-1">
                  <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-medium">
                    <Calendar size={12} /> {quote.startDate} to {quote.endDate}
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-medium">
                    <Clock size={12} /> Issued {quote.createdAt}
                  </div>
                  <div className="text-[10px] text-blue-400 font-black uppercase">
                    {quote.vehicleType}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto mt-4 md:mt-0 pt-4 md:pt-0 border-t border-[#27272a] md:border-0">
              <div className="text-right">
                <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Total Estimate</p>
                <p className="text-lg font-black text-white">${(quote.totalAmount || 0).toFixed(2)}</p>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-white/5 rounded-lg text-zinc-500 hover:text-white transition-colors" title="Send via Email">
                  <Mail size={16} />
                </button>
                <button className="p-2 hover:bg-white/5 rounded-lg text-zinc-500 hover:text-white transition-colors" title="Download PDF">
                  <Download size={16} />
                </button>
                <button 
                  onClick={() => handleDelete(quote.id)}
                  className="p-2 hover:bg-rose-500/10 rounded-lg text-zinc-500 hover:text-rose-500 transition-colors" 
                  title="Delete Quote"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
