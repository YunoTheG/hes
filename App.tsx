
import React, { useEffect, useState } from 'react';
import { Layout } from './components/Layout';
import { LoginView } from './views/LoginView';
import { DashboardView } from './views/DashboardView';
import { StudentsView } from './views/StudentsView';
import { FinanceView } from './views/FinanceView';
import { ActivityLogView } from './views/ActivityLogView';
import { SettingsView } from './views/SettingsView';
import { MockBackend } from './services/mockBackend';
import { AuthState, UserRole } from './types';
import { ShieldAlert } from 'lucide-react';

const App: React.FC = () => {
  const [auth, setAuth] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    loading: true,
    error: null
  });
  const [currentView, setCurrentView] = useState('dashboard');
  const [loginLoading, setLoginLoading] = useState(false);

  // Initialization check
  useEffect(() => {
    const init = async () => {
      const storedUid = localStorage.getItem('hes_uid');
      const storedDeviceId = localStorage.getItem('hes_device_id');
      
      if (storedUid && storedDeviceId) {
        // Validate session against backend
        const isValid = await MockBackend.validateSession(storedUid, storedDeviceId);
        if (isValid) {
            // Restore user
            const user = await MockBackend.getUserById(storedUid);
            if (user) {
                setAuth({ user, isAuthenticated: true, loading: false, error: null });
            } else {
                handleLogout();
            }
        } else {
          // Session Invalid (Device Lock)
          handleLogout();
          setAuth(prev => ({ ...prev, loading: false, error: "Session expired. You logged in on another device." }));
        }
      } else {
        setAuth(prev => ({ ...prev, loading: false }));
      }
    };
    init();
  }, []);

  const handleLogin = async (email: string, pass: string) => {
    setLoginLoading(true);
    setAuth(prev => ({ ...prev, error: null }));
    try {
      const { user, deviceId } = await MockBackend.login(email, pass);
      
      // Store local session
      localStorage.setItem('hes_uid', user.uid);
      localStorage.setItem('hes_device_id', deviceId);

      setAuth({ user, isAuthenticated: true, loading: false, error: null });
      setCurrentView('dashboard');
    } catch (error: any) {
      setAuth(prev => ({ ...prev, error: error.message || "Login failed" }));
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('hes_uid');
    localStorage.removeItem('hes_device_id');
    setAuth({ user: null, isAuthenticated: false, loading: false, error: null });
  };

  // Loading Splash
  if (auth.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFF9E8]">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-[#3EC7FF] rounded-full opacity-20"></div>
          <p className="text-[#0D2137] font-medium">Initializing Admin Portal...</p>
        </div>
      </div>
    );
  }

  // Unauthenticated State
  if (!auth.isAuthenticated) {
    return (
      <>
        {auth.error && (
           <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-red-500 text-white px-6 py-3 rounded-full shadow-lg text-sm font-medium animate-bounce">
             {auth.error}
           </div>
        )}
        <LoginView onLogin={handleLogin} isLoading={loginLoading} />
      </>
    );
  }

  // Authenticated App
  const renderView = () => {
    if (!auth.user) return null;

    // Access Control Check
    const isSuperAdmin = auth.user.role === UserRole.SUPER_ADMIN;

    switch (currentView) {
      case 'dashboard': return <DashboardView />;
      case 'students': return <StudentsView />;
      case 'finance': return <FinanceView />;
      case 'logs': 
        if (!isSuperAdmin) return <UnauthorizedView />;
        return <ActivityLogView />;
      case 'settings': 
        if (!isSuperAdmin) return <UnauthorizedView />;
        return <SettingsView />;
      case 'reports': 
        return (
            <div className="flex flex-col items-center justify-center h-[500px] text-gray-400">
                <h3 className="text-xl font-semibold text-[#0D2137]">Reports Module</h3>
                <p>Advanced PDF/Excel export features coming soon.</p>
            </div>
        );
      default: return <DashboardView />;
    }
  };

  return (
    <Layout 
      user={auth.user!} 
      onLogout={handleLogout}
      currentView={currentView}
      onNavigate={setCurrentView}
    >
      {renderView()}
    </Layout>
  );
};

const UnauthorizedView = () => (
  <div className="flex flex-col items-center justify-center h-96 text-center">
    <div className="bg-red-50 p-6 rounded-full mb-4">
      <ShieldAlert size={48} className="text-red-500" />
    </div>
    <h2 className="text-2xl font-bold text-[#0D2137]">Access Denied</h2>
    <p className="text-gray-500 mt-2 max-w-md">
      You do not have permission to view this module. This area is restricted to School Administrators only.
    </p>
  </div>
);

export default App;
