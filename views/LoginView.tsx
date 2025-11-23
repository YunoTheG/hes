
import React, { useState } from 'react';
import { Lock, ShieldCheck, Mail, Key } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

interface LoginViewProps {
  onLogin: (email: string, pass: string) => Promise<void>;
  isLoading: boolean;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin, isLoading }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if(email && password) {
        onLogin(email, password);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#FFF9E8] relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#3EC7FF] rounded-full blur-3xl"></div>
        <div className="absolute top-40 -left-20 w-72 h-72 bg-yellow-400 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-md z-10 animate-fade-in">
        <Card className="text-center pt-12 pb-10 border-t-4 border-t-[#3EC7FF]">
          <div className="w-24 h-24 bg-[#3EC7FF]/10 rounded-full flex items-center justify-center mx-auto mb-6">
             <ShieldCheck className="text-[#3EC7FF]" size={40} />
          </div>
          
          <h1 className="text-2xl font-bold text-[#0D2137] mb-1">HES Administrative Portal</h1>
          <p className="text-gray-500 mb-8 font-medium">Secure Access Point</p>

          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 ml-1">Email ID</label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                        <Mail size={18} />
                    </div>
                    <input 
                        type="email"
                        required
                        className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-[#3EC7FF] transition-all"
                        placeholder="admin@hes.edu.np"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>
            </div>
            
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 ml-1">Password</label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                        <Key size={18} />
                    </div>
                    <input 
                        type="password"
                        required
                        className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-[#3EC7FF] transition-all"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>
            </div>

            <Button 
                type="submit" 
                className="w-full py-3 mt-4 text-lg" 
                isLoading={isLoading}
            >
                Sign In
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-100 space-y-4">
             <div className="p-3 bg-blue-50 text-blue-700 text-xs rounded-lg">
                <strong>Demo Credentials:</strong><br/>
                Admin: admin@hes.edu.np<br/>
                Finance: accounts@hes.edu.np<br/>
                Password: <strong>password123</strong>
             </div>

            <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
              <Lock size={12} />
              <span>Session ID & Device Lock Enforced</span>
            </div>
          </div>
        </Card>
        
        <p className="text-center text-xs text-gray-400 mt-8">
          &copy; 2024 HES Pokhara. Administrative Access Only.
        </p>
      </div>
    </div>
  );
};
