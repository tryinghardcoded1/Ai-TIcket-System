import React, { useState } from 'react';
import { 
  Wallet, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight,
  DollarSign,
  CreditCard,
  BarChart3,
  Download,
  FileText
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

export default function Finance() {
  const [activeTab, setActiveTab] = useState<'overview' | 'reports'>('overview');
  const [downloading, setDownloading] = useState(false);

  const reportData = [
    { month: 'Jan', maintenance: 4500, revenue: 15200 },
    { month: 'Feb', maintenance: 3200, revenue: 14800 },
    { month: 'Mar', maintenance: 5100, revenue: 18500 },
    { month: 'Apr', maintenance: 2800, revenue: 21000 },
    { month: 'May', maintenance: 4100, revenue: 24500 },
    { month: 'Jun', maintenance: 3800, revenue: 26800 },
  ];

  const handleDownloadReport = async () => {
    const input = document.getElementById('finance-report-container');
    if (!input) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(input, { scale: 2, backgroundColor: '#09090b', logging: false });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('l', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save('fleet-finance-report.pdf');
    } catch (e) {
      console.error(e);
      alert("Failed to generate PDF");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white uppercase italic">Financial Ledger</h1>
          <p className="text-zinc-500 text-sm mt-1">Cashflow, revenue targets, and transaction auditing.</p>
        </div>
        <div className="flex bg-[#111113] border border-[#27272a] rounded-lg p-1">
          <button 
            onClick={() => setActiveTab('overview')}
            className={cn("px-4 py-2 rounded-md text-[10px] font-black uppercase tracking-widest transition-all", activeTab === 'overview' ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-white")}
          >
            Overview
          </button>
          <button 
            onClick={() => setActiveTab('reports')}
            className={cn("px-4 py-2 rounded-md text-[10px] font-black uppercase tracking-widest transition-all", activeTab === 'reports' ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-white")}
          >
            Insights & Reports
          </button>
        </div>
      </div>

      {activeTab === 'overview' ? (
        <div className="space-y-8 animate-in fade-in">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { label: 'Net Revenue', value: '$84,200', change: '+12.5%', trending: 'up' },
              { label: 'Outstanding', value: '$12,400', change: '-2.4%', trending: 'down' },
              { label: 'Ops Costs', value: '$31,800', change: '+0.8%', trending: 'up' },
              { label: 'EBITDA', value: '$39,000', change: '+18.2%', trending: 'up' },
            ].map((stat, i) => (
              <div key={i} className="p-6 bg-[#111113] border border-[#27272a] rounded-2xl space-y-2">
                <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">{stat.label}</p>
                <div className="flex items-end justify-between">
                  <p className="text-2xl font-black text-white">{stat.value}</p>
                  <div className={cn("flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded", stat.trending === 'up' ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500")}>
                    {stat.trending === 'up' ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                    {stat.change}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-zinc-900/30 border border-[#27272a] rounded-2xl p-8">
               <h3 className="font-bold text-white uppercase tracking-widest text-xs mb-6">Recent Transactions</h3>
               <div className="space-y-4">
                 {[1, 2, 3].map(i => (
                   <div key={i} className="flex items-center justify-between py-3 border-b border-[#27272a] last:border-0">
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-zinc-800 rounded-lg flex items-center justify-center text-zinc-500">
                          <CreditCard size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white uppercase tracking-tight">Rental Pymt #992{i}</p>
                          <p className="text-[10px] text-zinc-600 font-medium">May 18, 2024 • VISA ending 4421</p>
                        </div>
                     </div>
                     <div className="text-right">
                       <p className="text-sm font-black text-white">+$450.00</p>
                       <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Cleared</p>
                     </div>
                   </div>
                 ))}
               </div>
            </div>

            <div className="bg-zinc-900/30 border border-[#27272a] rounded-2xl p-8 flex flex-col items-center justify-center text-center space-y-4">
               <div className="w-16 h-16 bg-blue-600/10 rounded-full flex items-center justify-center text-blue-500">
                 <BarChart3 size={32} />
               </div>
               <div>
                 <h3 className="font-black text-white uppercase tracking-widest text-sm">Automated Reconciliation</h3>
                 <p className="text-[10px] text-zinc-500 mt-2 max-w-[280px] mx-auto leading-relaxed italic">System is currently syncing with regional bank API. Please check back for real-time visualization.</p>
               </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-black text-zinc-400 uppercase tracking-widest">Fleet Performance Analytics</h2>
            <button 
              onClick={handleDownloadReport}
              disabled={downloading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 transition-colors flex items-center gap-2 shadow-[0_0_20px_rgba(37,99,235,0.2)] disabled:opacity-50"
            >
              {downloading ? (
                <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <Download size={14} />
              )}
              Export PDF Report
            </button>
          </div>

          <div id="finance-report-container" className="bg-[#09090b] border border-[#27272a] p-8 rounded-2xl space-y-8">
            <div className="flex justify-between items-end border-b border-[#27272a] pb-6">
               <div>
                 <h2 className="text-2xl font-black text-white tracking-tight uppercase">YTD Financial Efficiency</h2>
                 <p className="text-zinc-500 text-xs mt-1 uppercase tracking-widest font-black">Maintenance Cost vs Rental Revenue</p>
               </div>
               <div className="text-right">
                 <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Calculated Over</p>
                 <p className="text-white font-bold text-sm">Last 6 Months</p>
               </div>
            </div>

            <div className="h-[400px] w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={reportData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis dataKey="month" stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value/1000}k`} />
                  <Tooltip 
                    cursor={{ fill: '#27272a', opacity: 0.4 }}
                    contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold' }}
                    itemStyle={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, undefined]}
                  />
                  <Legend 
                    wrapperStyle={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em' }} 
                    iconType="circle"
                  />
                  <Bar dataKey="revenue" name="Rental Revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                  <Bar dataKey="maintenance" name="Maint. Cost" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-6 border-t border-[#27272a]">
               <div className="p-4 bg-zinc-900/50 rounded-xl">
                 <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Total Revenue (6M)</p>
                 <p className="text-xl font-black text-white mt-1">$119,800</p>
               </div>
               <div className="p-4 bg-zinc-900/50 rounded-xl">
                 <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Total Maint. (6M)</p>
                 <p className="text-xl font-black text-amber-500 mt-1">$23,500</p>
               </div>
               <div className="p-4 bg-zinc-900/50 rounded-xl">
                 <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Avg Margin</p>
                 <p className="text-xl font-black text-emerald-400 mt-1">80.3%</p>
               </div>
               <div className="p-4 bg-zinc-900/50 rounded-xl">
                 <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Efficiency Rating</p>
                 <p className="text-xl font-black text-blue-400 mt-1">OPTIMAL</p>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
