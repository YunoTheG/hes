import React, { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { MockBackend } from '../services/mockBackend';
import { FeeRecord } from '../types';
import { DollarSign, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend
} from 'recharts';

export const DashboardView: React.FC = () => {
  const [fees, setFees] = useState<FeeRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    MockBackend.getFees().then(data => {
        setFees(data);
        setIsLoading(false);
    });
  }, []);

  const totalRevenue = fees.reduce((acc, curr) => acc + curr.paidAmount, 0);
  const totalExpected = fees.reduce((acc, curr) => acc + curr.totalAmount, 0);
  const totalDue = totalExpected - totalRevenue;
  const collectionRate = totalExpected > 0 ? Math.round((totalRevenue / totalExpected) * 100) : 0;

  const pieData = [
    { name: 'Collected', value: totalRevenue, color: '#10B981' },
    { name: 'Pending', value: totalDue, color: '#EF4444' },
  ];

  // Mock monthly data
  const barData = [
    { name: 'Jan', revenue: 450000 },
    { name: 'Feb', revenue: 320000 },
    { name: 'Mar', revenue: 550000 },
    { name: 'Apr', revenue: totalRevenue }, // Current month simulation
  ];

  const StatCard = ({ title, value, subtitle, icon: Icon, color }: any) => (
    <Card className="flex items-center gap-4" noPadding>
      <div className={`p-6 flex-1`}>
        <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">{title}</p>
        <h3 className="text-2xl font-bold text-[#0D2137] mt-1">{value}</h3>
        {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
      </div>
      <div className={`h-full w-24 flex items-center justify-center ${color} bg-opacity-10`}>
        <Icon size={28} className={color.replace('bg-', 'text-')} />
      </div>
    </Card>
  );

  if (isLoading) return <div className="p-8 text-center">Loading Financial Data...</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#0D2137]">Financial Overview</h2>
          <p className="text-gray-500">Real-time tracking of tuition and package fees</p>
        </div>
        <div className="text-sm text-white bg-[#0D2137] px-4 py-2 rounded-full shadow-md">
          FY 2080/81
        </div>
      </div>

      {/* Financial Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
            title="Total Revenue" 
            value={`Rs. ${totalRevenue.toLocaleString()}`} 
            subtitle="Year to Date"
            icon={DollarSign} 
            color="text-green-600 bg-green-600" 
        />
        <StatCard 
            title="Total Due" 
            value={`Rs. ${totalDue.toLocaleString()}`} 
            subtitle="Outstanding payments"
            icon={AlertCircle} 
            color="text-red-500 bg-red-500" 
        />
        <StatCard 
            title="Total Expected" 
            value={`Rs. ${totalExpected.toLocaleString()}`} 
            subtitle="Based on active students"
            icon={TrendingUp} 
            color="text-blue-500 bg-blue-500" 
        />
        <StatCard 
            title="Collection Rate" 
            value={`${collectionRate}%`} 
            subtitle="Target: 95%"
            icon={CheckCircle} 
            color="text-purple-500 bg-purple-500" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <Card className="lg:col-span-2 min-h-[400px]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-[#0D2137]">Revenue Collection Trend</h3>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9CA3AF'}} />
                <Tooltip 
                    cursor={{fill: '#F3F4F6'}} 
                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}} 
                    formatter={(value: number) => [`Rs. ${value.toLocaleString()}`, 'Revenue']}
                />
                <Bar dataKey="revenue" fill="#3EC7FF" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Pie Chart */}
        <Card className="min-h-[400px]">
          <h3 className="font-bold text-[#0D2137] mb-6">Payment Status Distribution</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `Rs. ${value.toLocaleString()}`} />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="text-center mt-4">
             <p className="text-sm text-gray-500">Total Invoiced: Rs. {totalExpected.toLocaleString()}</p>
          </div>
        </Card>
      </div>
    </div>
  );
};
