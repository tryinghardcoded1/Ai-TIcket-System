/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import LiveMap from './components/LiveMap';
import AddCustomer from './components/AddCustomer';
import CustomerManagement from './components/CustomerManagement';
import FleetInventory from './components/FleetInventory';
import RentalAgreement from './components/RentalAgreement';
import QuoteManagement from './components/QuoteManagement';
import CalendarView from './components/CalendarView';
import UserManagement from './components/UserManagement';
import Finance from './components/Finance';
import RenterTracker from './components/RenterTracker';
import ReservationManagement from './components/ReservationManagement';
import SystemSettings from './components/SystemSettings';
import Login from './components/Login';
import { AlertCircle } from 'lucide-react';
import { NotificationProvider } from './context/NotificationContext';
import { auth, db } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export default function App() {
  const [user, setUser] = React.useState<User | null>(null);
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [activeView, setActiveView] = React.useState('dashboard');

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        // Check if user is admin
        const adminRef = doc(db, 'admins', user.uid);
        const adminSnap = await getDoc(adminRef);
        
        if (adminSnap.exists()) {
          setIsAdmin(adminSnap.data().role === 'super_admin' || adminSnap.data().role === 'admin');
        } else {
          // Check for explicit promotion for the user who requested it
          if (user.email === 'license4booking@gmail.com') {
            await setDoc(adminRef, { 
              email: user.email, 
              role: 'super_admin',
              createdAt: new Date().toISOString()
            });
            setIsAdmin(true);
            setLoading(false);
            return;
          }

          // Check if any admins exist. If not, make this first user an admin.
          // This is a bootstrap helper for the very first log-in.
          const anyAdminRef = doc(db, 'admins', 'bootstrap_check');
          const anyAdminSnap = await getDoc(anyAdminRef);
          
          if (!anyAdminSnap.exists()) {
            await setDoc(adminRef, { 
              email: user.email, 
              role: 'super_admin',
              createdAt: new Date().toISOString()
            });
            await setDoc(anyAdminRef, { initialized: true });
            setIsAdmin(true);
          }
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={() => {}} />;
  }

  const renderView = () => {
    if (!isAdmin && ['finance', 'users'].includes(activeView)) {
      return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
          <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-rose-500">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Access Denied</h2>
            <p className="text-slate-500 text-sm">You do not have the required clearance to view this sector.</p>
            <button 
              onClick={() => setActiveView('dashboard')} 
              className="mt-4 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors text-xs font-bold uppercase tracking-widest"
            >
              Return to Command Center
            </button>
          </div>
        </div>
      );
    }

    switch (activeView) {
      case 'dashboard':
        return <Dashboard />;
      case 'finance':
        return <Finance />;
      case 'users':
        return <UserManagement />;
      case 'ops-quotes':
        return <QuoteManagement />;
      case 'ops-calendar':
        return <CalendarView />;
      case 'renter-tracker':
        return <RenterTracker />;
      case 'fleet-map':
        return <LiveMap />;
      case 'contacts-customers':
        return <CustomerManagement />;
      case 'fleet-inventory':
        return <FleetInventory setView={setActiveView} />;
      case 'vehicle-history':
        return (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
            <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-slate-500">
              <span className="text-2xl font-bold italic">History</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Vehicle History</h2>
              <p className="text-slate-500 text-sm">This view is currently a placeholder for past rentals and incidents.</p>
              <button 
                onClick={() => setActiveView('fleet-inventory')} 
                className="mt-4 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors text-xs font-bold uppercase tracking-widest"
              >
                Back to Fleet Inventory
              </button>
            </div>
          </div>
        );
      case 'ops-reservations':
        return <ReservationManagement setView={setActiveView} />;
      case 'agreement':
        return <RentalAgreement onBack={() => setActiveView('ops-reservations')} />;
      case 'settings':
        return <SystemSettings user={user} />;
      default:
        return (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
            <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-slate-500">
              <span className="text-2xl font-bold italic">?</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">View Under Construction</h2>
              <p className="text-slate-500 text-sm">We are currently building this section of Philly Rental Sys HQ.</p>
            </div>
          </div>
        );
    }
  };

  return (
    <NotificationProvider>
      <div className="min-h-screen bg-[#09090b] text-[#fafafa] font-sans selection:bg-blue-600 selection:text-white">
        <Sidebar activeView={activeView} setView={setActiveView} />
        
        <main className="ml-16 lg:ml-64 min-h-screen transition-all duration-300 flex flex-col h-screen">
          <Header activeView={activeView} />
          
          <div className="flex-1 overflow-auto bg-[#09090b]">
            <div className="p-6 lg:p-8 max-w-[1600px] mx-auto">
              {renderView()}
            </div>
          </div>
        </main>

        <div className="fixed inset-0 pointer-events-none opacity-[0.03] contrast-150 brightness-150 z-[100] grain" />
      </div>
    </NotificationProvider>
  );
}

