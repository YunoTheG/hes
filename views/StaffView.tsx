import React from 'react';
import { STAFF_DIRECTORY } from '../constants';
import { Card } from '../components/ui/Card';
import { Mail, Phone } from 'lucide-react';

export const StaffView: React.FC = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-[#0D2137]">Staff Directory</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {STAFF_DIRECTORY.map((staff) => (
          <Card key={staff.id} className="flex items-center gap-4 hover:border-[#3EC7FF] transition-colors">
            <img 
              src={staff.photoURL} 
              alt={staff.name} 
              className="w-16 h-16 rounded-full object-cover border-2 border-gray-100"
            />
            <div>
              <h3 className="font-bold text-[#0D2137]">{staff.name}</h3>
              <p className="text-sm text-[#3EC7FF] font-medium mb-1">{staff.designation}</p>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Mail size={12} />
                {staff.email}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};