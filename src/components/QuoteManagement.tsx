import React from 'react';
import { 
  FileText, 
  Search, 
  Plus, 
  MoreHorizontal,
  Mail,
  Download,
  Calendar,
  Clock
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

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
  pending: 'text-amber-500 bg-amber-500/10',
  accepted: 'text-emerald-500 bg-emerald-500/10',
  expired: 'text-rose-500 bg-rose-500/10',
};

export default function QuoteManagement() {
  const [quotes] = React.useState<Quote[]>([
    {
      id: 'QT-2024-001',
      customerName: 'Marcus Wright',
      vehicleType: 'Executive Sedan',
      startDate: '2024-06-15',
      endDate: '2024-06-18',
      totalAmount: 450.00,
      status: 'pending',
      createdAt: '2024-05-18',
    }
  ]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white uppercase italic">Reservation Quotes</h1>
          <p className="text-zinc-500 text-sm mt-1">Manage and track preliminary rental inquiries.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-500 transition-colors shadow-[0_0_15px_rgba(37,99,235,0.3)]">
          <Plus size={14} /> Create Quote
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {quotes.map((quote) => (
          <motion.div
            key={quote.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="group bg-[#09090b] border border-[#27272a] rounded-xl p-5 hover:border-zinc-700 transition-all flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-zinc-900 rounded-lg flex items-center justify-center border border-[#27272a] group-hover:scale-110 transition-transform">
                <FileText className="text-zinc-500" size={20} />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="font-bold text-white uppercase tracking-tight">{quote.customerName}</h3>
                  <span className={cn("px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest", statusColors[quote.status])}>
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
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Total Estimate</p>
                <p className="text-lg font-black text-white">${quote.totalAmount.toFixed(2)}</p>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-white/5 rounded-lg text-zinc-500 hover:text-white transition-colors">
                  <Mail size={16} />
                </button>
                <button className="p-2 hover:bg-white/5 rounded-lg text-zinc-500 hover:text-white transition-colors">
                  <Download size={16} />
                </button>
                <button className="p-2 hover:bg-white/5 rounded-lg text-zinc-500 hover:text-white transition-colors">
                  <MoreHorizontal size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
