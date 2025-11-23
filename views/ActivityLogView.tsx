
import React, { useEffect, useState } from 'react';
import { MockBackend } from '../services/mockBackend';
import { LogEntry, User } from '../types';
import { Card } from '../components/ui/Card';
import { Clock, User as UserIcon, Activity, RefreshCw, Filter } from 'lucide-react';

export const ActivityLogView: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');

  const loadData = async () => {
    setIsLoading(true);
    const [logsData, studentsData] = await Promise.all([
        MockBackend.getLogs(),
        MockBackend.getStudents()
    ]);
    setLogs(logsData);
    setStudents(studentsData);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const getActionColor = (action: string) => {
    if (action.includes('FEE') || action.includes('PAYMENT')) return 'text-green-600 bg-green-50';
    if (action.includes('DELETE')) return 'text-red-600 bg-red-50';
    if (action.includes('UPDATE')) return 'text-blue-600 bg-blue-50';
    if (action.includes('LOGIN')) return 'text-purple-600 bg-purple-50';
    return 'text-gray-600 bg-gray-50';
  };

  const filteredLogs = selectedStudentId 
    ? logs.filter(log => log.studentId === selectedStudentId) 
    : logs;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#0D2137]">Activity Logs</h2>
          <p className="text-gray-500">Audit trail of all administrative actions</p>
        </div>
        
        <div className="flex items-center gap-2">
           <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Filter size={16} />
              </div>
              <select 
                  className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-[#3EC7FF] min-w-[200px]"
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
              >
                  <option value="">All Activity</option>
                  {students.map(s => (
                      <option key={s.uid} value={s.uid}>{s.name} ({s.studentID})</option>
                  ))}
              </select>
           </div>
           
           <button 
            onClick={loadData} 
            className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors bg-white border border-gray-200"
            title="Refresh Logs"
          >
            <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <Card noPadding className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="p-4 font-semibold text-gray-500">Action Type</th>
                <th className="p-4 font-semibold text-gray-500">Description</th>
                <th className="p-4 font-semibold text-gray-500">Admin</th>
                <th className="p-4 font-semibold text-gray-500 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-blue-50/30 transition-colors">
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${getActionColor(log.action)}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="font-medium text-[#0D2137]">{log.description}</div>
                    {log.details && (
                        <div className="text-xs text-gray-400 mt-1">{log.details}</div>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                        <div className="p-1 rounded-full bg-gray-100 text-gray-500">
                            <UserIcon size={12} />
                        </div>
                        <span className="text-gray-700">{log.adminName}</span>
                    </div>
                  </td>
                  <td className="p-4 text-right text-gray-500 tabular-nums">
                    <div className="flex items-center justify-end gap-2">
                        <Clock size={14} className="text-gray-300" />
                        {new Date(log.timestamp).toLocaleString()}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredLogs.length === 0 && !isLoading && (
                  <tr>
                      <td colSpan={4} className="p-8 text-center text-gray-400">
                          <Activity size={40} className="mx-auto mb-2 opacity-20" />
                          {selectedStudentId ? 'No activity found for this student.' : 'No activity recorded yet.'}
                      </td>
                  </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
