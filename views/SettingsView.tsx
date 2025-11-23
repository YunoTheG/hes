
import React, { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { SystemSettings, User, UserRole } from '../types';
import { MockBackend } from '../services/mockBackend';
import { Building, Calendar, Lock, Save, AlertTriangle, User as UserIcon, Users, Settings as SettingsIcon, Trash2, Plus, X } from 'lucide-react';

export const SettingsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'system' | 'users' | 'profile'>('system');
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [adminUsers, setAdminUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null); // For Profile
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // New Admin Form
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
      name: '',
      email: '',
      role: UserRole.ADMIN,
      designation: ''
  });

  // Profile Form
  const [profileForm, setProfileForm] = useState({
      name: '',
      password: '', // Mock
      currentPassword: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const [settingsData, adminsData] = await Promise.all([
        MockBackend.getSystemSettings(),
        MockBackend.getAdmins()
    ]);
    setSettings(settingsData);
    setAdminUsers(adminsData);
    
    // Simulate getting current user (usually from Auth Context)
    const storedUid = localStorage.getItem('hes_uid');
    if (storedUid) {
        const me = adminsData.find(u => u.uid === storedUid);
        if (me) {
            setCurrentUser(me);
            setProfileForm(prev => ({ ...prev, name: me.name }));
        }
    }
    
    setIsLoading(false);
  };

  const handleSettingChange = (field: keyof SystemSettings, value: any) => {
    if (settings) {
        setSettings({ ...settings, [field]: value });
    }
  };

  const handleSaveSettings = async () => {
    if (settings) {
        setIsSaving(true);
        await MockBackend.updateSystemSettings(settings);
        setIsSaving(false);
        alert('System configuration saved.');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
      e.preventDefault();
      await MockBackend.addAdmin(newUserForm);
      const updatedAdmins = await MockBackend.getAdmins();
      setAdminUsers(updatedAdmins);
      setIsAddUserModalOpen(false);
      setNewUserForm({ name: '', email: '', role: UserRole.ADMIN, designation: '' });
  };

  const handleDeleteUser = async (uid: string) => {
      if(confirm('Are you sure you want to revoke access for this user?')) {
          await MockBackend.deleteUser(uid);
          setAdminUsers(prev => prev.filter(u => u.uid !== uid));
      }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!currentUser) return;
      
      // In a real app, handle password change logic here
      if (profileForm.password && profileForm.password.length < 6) {
          alert('Password must be at least 6 characters.');
          return;
      }

      const updatedUser = await MockBackend.updateProfile(currentUser.uid, { name: profileForm.name });
      setCurrentUser(updatedUser);
      // Update local storage name if needed or global state
      alert('Profile updated successfully.');
      setProfileForm(prev => ({ ...prev, password: '', currentPassword: '' }));
  };

  if (isLoading || !settings) return <div>Loading settings...</div>;

  const TabButton = ({ id, label, icon: Icon }: any) => (
      <button
          onClick={() => setActiveTab(id)}
          className={`flex items-center gap-2 px-6 py-3 font-medium text-sm transition-colors border-b-2 ${
              activeTab === id 
              ? 'border-[#3EC7FF] text-[#0D2137]' 
              : 'border-transparent text-gray-500 hover:text-[#0D2137]'
          }`}
      >
          <Icon size={16} />
          {label}
      </button>
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <div>
          <h2 className="text-2xl font-bold text-[#0D2137]">Settings & Administration</h2>
          <p className="text-gray-500">Manage system configuration, users, and personal preferences.</p>
      </div>

      <div className="flex border-b border-gray-200 bg-white rounded-t-xl overflow-x-auto">
          <TabButton id="system" label="System Configuration" icon={SettingsIcon} />
          <TabButton id="users" label="User Management" icon={Users} />
          <TabButton id="profile" label="My Profile" icon={UserIcon} />
      </div>

      {/* --- TAB 1: SYSTEM CONFIGURATION --- */}
      {activeTab === 'system' && (
          <div className="space-y-6 animate-fade-in">
              {/* School Profile Section */}
              <Card>
                  <h3 className="text-lg font-bold text-[#0D2137] mb-6 flex items-center gap-2 border-b pb-4 border-gray-100">
                      <Building className="text-[#3EC7FF]" /> School Profile
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">School Name</label>
                          <input 
                              type="text" 
                              value={settings.schoolName} 
                              onChange={(e) => handleSettingChange('schoolName', e.target.value)}
                              className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:border-[#3EC7FF]"
                          />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                          <input 
                              type="text" 
                              value={settings.address} 
                              onChange={(e) => handleSettingChange('address', e.target.value)}
                              className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:border-[#3EC7FF]"
                          />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
                          <input 
                              type="text" 
                              value={settings.phone} 
                              onChange={(e) => handleSettingChange('phone', e.target.value)}
                              className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:border-[#3EC7FF]"
                          />
                      </div>
                  </div>
              </Card>

              {/* Academic Session */}
              <Card>
                  <h3 className="text-lg font-bold text-[#0D2137] mb-6 flex items-center gap-2 border-b pb-4 border-gray-100">
                      <Calendar className="text-[#3EC7FF]" /> Academic Configuration
                  </h3>
                  <div className="flex items-center gap-6">
                      <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Current Academic Session (BS)</label>
                          <select 
                              value={settings.currentSession} 
                              onChange={(e) => handleSettingChange('currentSession', e.target.value)}
                              className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:border-[#3EC7FF] bg-white"
                          >
                              <option value="2080">2080</option>
                              <option value="2081">2081 (Current)</option>
                              <option value="2082">2082</option>
                          </select>
                      </div>
                      <div className="flex-1 p-4 bg-blue-50 rounded-xl border border-blue-100 text-sm text-blue-800">
                          <p className="font-bold mb-1">Note on Session Change</p>
                          Changing the session impacts fee generation and student promotion logic. Ensure all year-end processing is done before switching.
                      </div>
                  </div>
              </Card>

              {/* Security & Access */}
              <Card>
                  <h3 className="text-lg font-bold text-[#0D2137] mb-6 flex items-center gap-2 border-b pb-4 border-gray-100">
                      <Lock className="text-[#3EC7FF]" /> Security & Access Control
                  </h3>
                  
                  <div className="space-y-6">
                      <div className="flex items-center justify-between">
                          <div>
                              <div className="font-bold text-[#0D2137]">Enforce Device Lock</div>
                              <div className="text-sm text-gray-500">Prevents users from logging in on multiple devices simultaneously.</div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                              <input 
                                  type="checkbox" 
                                  checked={settings.isDeviceLockEnabled} 
                                  onChange={(e) => handleSettingChange('isDeviceLockEnabled', e.target.checked)}
                                  className="sr-only peer" 
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                          </label>
                      </div>

                      <div className="flex items-center justify-between">
                          <div>
                              <div className="font-bold text-[#0D2137]">Maintenance Mode</div>
                              <div className="text-sm text-gray-500">Restricts access to Super Admins only. Useful during updates.</div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                              <input 
                                  type="checkbox" 
                                  checked={settings.maintenanceMode} 
                                  onChange={(e) => handleSettingChange('maintenanceMode', e.target.checked)}
                                  className="sr-only peer" 
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
                          </label>
                      </div>
                  </div>
              </Card>

              <div className="flex justify-end sticky bottom-6 z-10">
                  <Button onClick={handleSaveSettings} isLoading={isSaving} className="shadow-xl">
                      <Save size={20} />
                      Save Configuration
                  </Button>
              </div>
          </div>
      )}

      {/* --- TAB 2: USER MANAGEMENT --- */}
      {activeTab === 'users' && (
          <div className="space-y-6 animate-fade-in">
              <div className="flex justify-between items-center">
                  <div>
                      <h3 className="text-lg font-bold text-[#0D2137]">Admin Accounts</h3>
                      <p className="text-gray-500 text-sm">Manage users who have access to this portal.</p>
                  </div>
                  <Button onClick={() => setIsAddUserModalOpen(true)}>
                      <Plus size={18} /> Add User
                  </Button>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <table className="w-full text-left text-sm">
                      <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 font-medium">
                          <tr>
                              <th className="p-4">User</th>
                              <th className="p-4">Role</th>
                              <th className="p-4">Designation</th>
                              <th className="p-4 text-right">Action</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                          {adminUsers.map(user => (
                              <tr key={user.uid} className="hover:bg-gray-50">
                                  <td className="p-4">
                                      <div className="flex items-center gap-3">
                                          <img src={user.photoURL} className="w-8 h-8 rounded-full bg-gray-200" alt="" />
                                          <div>
                                              <div className="font-bold text-[#0D2137]">{user.name}</div>
                                              <div className="text-xs text-gray-400">{user.email || 'No Email'}</div>
                                          </div>
                                      </div>
                                  </td>
                                  <td className="p-4">
                                      <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${
                                          user.role === UserRole.SUPER_ADMIN ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                                      }`}>
                                          {user.role}
                                      </span>
                                  </td>
                                  <td className="p-4 text-gray-600">{user.designation}</td>
                                  <td className="p-4 text-right">
                                      {user.uid !== currentUser?.uid ? (
                                          <button 
                                              onClick={() => handleDeleteUser(user.uid)}
                                              className="text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors"
                                              title="Remove User"
                                          >
                                              <Trash2 size={16} />
                                          </button>
                                      ) : (
                                          <span className="text-xs text-gray-400 italic">Current User</span>
                                      )}
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          </div>
      )}

      {/* --- TAB 3: MY PROFILE --- */}
      {activeTab === 'profile' && currentUser && (
          <div className="max-w-xl mx-auto animate-fade-in">
              <Card>
                  <div className="text-center mb-8">
                      <div className="w-24 h-24 mx-auto rounded-full bg-gray-100 mb-4 p-1 border-2 border-[#3EC7FF]">
                          <img src={currentUser.photoURL} alt="Profile" className="w-full h-full rounded-full object-cover" />
                      </div>
                      <h3 className="text-xl font-bold text-[#0D2137]">{currentUser.name}</h3>
                      <p className="text-gray-500">{currentUser.role === UserRole.SUPER_ADMIN ? 'Super Administrator' : 'Finance Officer'}</p>
                  </div>

                  <form onSubmit={handleUpdateProfile} className="space-y-4">
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                          <input 
                              type="text"
                              value={profileForm.name}
                              onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                              className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:border-[#3EC7FF]"
                          />
                      </div>
                      
                      <div className="pt-4 border-t border-gray-100 mt-4">
                          <h4 className="font-bold text-[#0D2137] mb-4 flex items-center gap-2">
                              <Lock size={16} /> Change Password
                          </h4>
                          <div className="space-y-4">
                              <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                                  <input 
                                      type="password"
                                      placeholder="••••••••"
                                      value={profileForm.currentPassword}
                                      onChange={(e) => setProfileForm({ ...profileForm, currentPassword: e.target.value })}
                                      className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:border-[#3EC7FF]"
                                  />
                              </div>
                              <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                                  <input 
                                      type="password"
                                      placeholder="••••••••"
                                      value={profileForm.password}
                                      onChange={(e) => setProfileForm({ ...profileForm, password: e.target.value })}
                                      className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:border-[#3EC7FF]"
                                  />
                              </div>
                          </div>
                      </div>

                      <div className="flex justify-end pt-6">
                          <Button type="submit">Update Profile</Button>
                      </div>
                  </form>
              </Card>
          </div>
      )}

      {/* Add User Modal */}
      {isAddUserModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
              <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-bold text-[#0D2137]">Add New Admin</h3>
                      <button onClick={() => setIsAddUserModalOpen(false)} className="text-gray-400 hover:text-red-500">
                          <X size={20} />
                      </button>
                  </div>
                  <form onSubmit={handleCreateUser} className="space-y-4">
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                          <input 
                              type="text" 
                              required 
                              className="w-full p-2 border border-gray-300 rounded-lg outline-none"
                              value={newUserForm.name}
                              onChange={(e) => setNewUserForm({...newUserForm, name: e.target.value})}
                          />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                          <input 
                              type="email" 
                              required 
                              className="w-full p-2 border border-gray-300 rounded-lg outline-none"
                              value={newUserForm.email}
                              onChange={(e) => setNewUserForm({...newUserForm, email: e.target.value})}
                          />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                          <select 
                              className="w-full p-2 border border-gray-300 rounded-lg outline-none"
                              value={newUserForm.role}
                              onChange={(e) => setNewUserForm({...newUserForm, role: e.target.value as UserRole})}
                          >
                              <option value={UserRole.ADMIN}>Finance Officer (Admin)</option>
                              <option value={UserRole.SUPER_ADMIN}>Super Admin</option>
                          </select>
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                          <input 
                              type="text" 
                              className="w-full p-2 border border-gray-300 rounded-lg outline-none"
                              placeholder="e.g. Accountant"
                              value={newUserForm.designation}
                              onChange={(e) => setNewUserForm({...newUserForm, designation: e.target.value})}
                          />
                      </div>
                      <div className="bg-blue-50 p-3 rounded-lg text-xs text-blue-700">
                          Default password will be set to "password123". The user can change it upon first login.
                      </div>
                      <div className="flex justify-end gap-3 pt-2">
                          <Button type="button" variant="secondary" onClick={() => setIsAddUserModalOpen(false)}>Cancel</Button>
                          <Button type="submit">Create User</Button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};