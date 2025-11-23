
import React, { useState } from 'react';
import { 
  Menu, Home, Users, CreditCard, LogOut, PieChart, Settings, ScrollText, Lock
} from 'lucide-react';
import { User, UserRole } from '../types';

interface LayoutProps {
  user: User;
  onLogout: () => void;
  currentView: string;
  onNavigate: (view: string) => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ user, onLogout, currentView, onNavigate, children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Overview', icon: Home, roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN] },
    { id: 'students', label: 'Student Management', icon: Users, roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN] },
    { id: 'finance', label: 'Fee Management', icon: CreditCard, roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN] },
    { id: 'reports', label: 'Financial Reports', icon: PieChart, roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN] },
    { id: 'logs', label: 'Activity Logs', icon: ScrollText, roles: [UserRole.SUPER_ADMIN] },
    { id: 'settings', label: 'System Settings', icon: Settings, roles: [UserRole.SUPER_ADMIN] },
  ];

  const filteredNavItems = navItems.filter(item => item.roles.includes(user.role));

  return (
    <div className="min-h-screen flex bg-[#FFF9E8]">
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-72 bg-[#0D2137] text-white shadow-xl transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-white/10 bg-[#0D2137]">
            <h1 className="text-2xl font-bold text-white leading-none">HES<span className="text-[#3EC7FF]">.</span> Admin</h1>
            <p className="text-xs text-gray-400 mt-1">
                {user.role === UserRole.SUPER_ADMIN ? 'Master Control Panel' : 'Finance & Records'}
            </p>
          </div>

          {/* User Profile Mini */}
          <div className="p-4 mx-4 mt-4 bg-white/5 rounded-xl flex items-center gap-3 border border-white/10">
            <div className="w-10 h-10 rounded-full bg-[#3EC7FF] flex items-center justify-center font-bold text-[#0D2137]">
                {user.name.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-white truncate">{user.name}</p>
              <span className="px-2 py-0.5 text-[10px] bg-[#3EC7FF]/20 text-[#3EC7FF] rounded-full border border-[#3EC7FF]/20 uppercase">
                {user.role === UserRole.SUPER_ADMIN ? 'Administrator' : 'Accountant'}
              </span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {filteredNavItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all
                  ${currentView === item.id 
                    ? 'bg-[#3EC7FF] text-[#0D2137] shadow-lg shadow-[#3EC7FF]/10' 
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'}
                `}
              >
                <item.icon size={18} />
                {item.label}
              </button>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-white/10">
            <button 
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 text-red-400 hover:bg-red-500/10 px-4 py-3 rounded-xl text-sm font-medium transition-colors"
            >
              <LogOut size={18} />
              Secure Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between p-4 bg-white shadow-sm z-30">
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg text-[#0D2137]">
                 {user.role === UserRole.SUPER_ADMIN ? 'Administrator' : 'Finance Portal'}
            </span>
          </div>
          <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 text-gray-600">
            <Menu size={24} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};
