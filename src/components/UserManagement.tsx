import React from 'react';
import { 
  UserPlus, 
  Search, 
  MoreVertical,
  Mail,
  Shield,
  Trash2,
  Key,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

import { db } from '../firebase';
import { collection, getDocs, query, orderBy, setDoc, doc } from 'firebase/firestore';
import CSVImporter from './CSVImporter';

interface User {
  id: string;
  name?: string;
  email: string;
  role: 'super_admin' | 'admin' | 'staff' | 'viewer';
  status: 'active' | 'invited';
  lastActive?: string;
  createdAt?: any;
}

export default function UserManagement() {
  const [users, setUsers] = React.useState<User[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchUsers = async () => {
      try {
        const q = query(collection(db, 'admins'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        const fetched = snap.docs
          .filter(doc => doc.id !== 'bootstrap_check')
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as User[];
        setUsers(fetched);
      } catch (err) {
        console.error("Failed to fetch users:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleImport = async (data: any[]) => {
    if (!db) return;
    let importedCount = 0;
    for (const row of data) {
      if (row.email && row.role) {
        try {
          // Using email as an ID for simplicity in importing users before they auth
          await setDoc(doc(db, 'admins', row.email), {
            name: row.name || '',
            email: row.email,
            role: row.role || 'viewer',
            status: row.status || 'invited',
            createdAt: new Date().toISOString()
          });
          importedCount++;
        } catch (e) {
          console.error("Error importing user", e);
        }
      }
    }
    alert(`Successfully imported ${importedCount} users from CSV.`);
    // Refetching logic can be placed here or rely on onSnapshot if we change it.
    // For now we will just use page reload as a quick fix or manually push to state:
    window.location.reload();
  };

  const roleColors = {
    super_admin: 'text-white bg-rose-600',
    admin: 'text-white bg-blue-600',
    staff: 'text-emerald-400 bg-emerald-400/10 border border-emerald-400/20',
    viewer: 'text-zinc-500 bg-zinc-500/10 border border-zinc-500/20',
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white uppercase italic">User Access Control</h1>
          <p className="text-zinc-500 text-sm mt-1">Manage personnel clearance and system permissions.</p>
        </div>
        <div className="flex gap-4">
          <button className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg text-xs font-black uppercase tracking-widest hover:bg-zinc-200 transition-colors shadow-2xl">
            <UserPlus size={14} /> Add New User
          </button>
          <CSVImporter onImport={handleImport} label="Import" />
        </div>
      </div>

      <div className="bg-[#111113] border border-[#27272a] rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#27272a] bg-zinc-900/50">
                <th className="px-6 py-4 text-[10px] font-black text-zinc-600 uppercase tracking-widest">Operator</th>
                <th className="px-6 py-4 text-[10px] font-black text-zinc-600 uppercase tracking-widest">Role</th>
                <th className="px-6 py-4 text-[10px] font-black text-zinc-600 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-zinc-600 uppercase tracking-widest">Last Auth</th>
                <th className="px-6 py-4 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#27272a]">
              {users.map((user) => (
                <tr key={user.id} className="group hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-zinc-900 border border-[#27272a] flex items-center justify-center font-bold text-xs text-white group-hover:border-blue-500/50 transition-colors">
                        {(user.name || user.email).split(' ')[0][0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white tracking-tight">{user.name || 'System Operator'}</p>
                        <p className="text-[10px] text-zinc-500 font-medium">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className={cn("px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest", roleColors[user.role])}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                       <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                       <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{user.status}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-xs text-zinc-500 font-mono">
                    {user.lastActive}
                  </td>
                  <td className="px-6 py-5 text-right">
                    <button className="p-2 text-zinc-600 hover:text-white transition-colors">
                      <MoreVertical size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-zinc-900/30 border border-[#27272a] rounded-2xl space-y-4">
          <div className="w-10 h-10 bg-blue-600/10 rounded-xl flex items-center justify-center text-blue-500">
            <Shield size={20} />
          </div>
          <div>
            <h3 className="font-bold text-white uppercase tracking-tight text-sm">Security Protocols</h3>
            <p className="text-[10px] text-zinc-500 mt-1 leading-relaxed">RBAC (Role Based Access Control) is strictly enforced across all fleet operations.</p>
          </div>
        </div>
        
        <div className="p-6 bg-zinc-900/30 border border-[#27272a] rounded-2xl space-y-4">
          <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500">
            <Key size={20} />
          </div>
          <div>
            <h3 className="font-bold text-white uppercase tracking-tight text-sm">Auth Logs</h3>
            <p className="text-[10px] text-zinc-500 mt-1 leading-relaxed">Every terminal session is cryptographically signed and logged for compliance.</p>
          </div>
        </div>

        <div className="p-6 bg-zinc-900/30 border border-[#27272a] rounded-2xl space-y-4">
          <div className="w-10 h-10 bg-rose-500/10 rounded-xl flex items-center justify-center text-rose-500">
            <AlertCircle size={20} />
          </div>
          <div>
            <h3 className="font-bold text-white uppercase tracking-tight text-sm">Threat Detection</h3>
            <p className="text-[10px] text-zinc-500 mt-1 leading-relaxed">Automated suspension of credentials triggered by anomalous geolocation shifts.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
