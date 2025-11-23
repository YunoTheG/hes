import React, { useEffect, useState } from 'react';
import { User, UserRole, Assignment } from '../types';
import { MockBackend } from '../services/mockBackend';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Clock, FileText, Plus, Trash2, User as UserIcon, CheckCircle, Check } from 'lucide-react';

interface AssignmentsViewProps {
  user: User;
}

export const AssignmentsView: React.FC<AssignmentsViewProps> = ({ user }) => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newSubject, setNewSubject] = useState('Mathematics');

  const canEdit = user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN;

  const fetchAssignments = async () => {
    setIsLoading(true);
    const data = await MockBackend.getAssignments();
    setAssignments(data);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newDesc) return;

    const newAssignment: Assignment = {
      id: Date.now().toString(),
      title: newTitle,
      description: newDesc,
      subject: newSubject,
      classTarget: '10',
      dueDate: new Date(Date.now() + 86400000 * 7).toISOString(),
      createdBy: user.name,
      completedBy: []
    };

    await MockBackend.addAssignment(newAssignment);
    setAssignments([newAssignment, ...assignments]);
    setIsModalOpen(false);
    setNewTitle('');
    setNewDesc('');
  };

  const handleDelete = async (id: string) => {
    if(confirm('Are you sure you want to delete this assignment?')) {
        await MockBackend.deleteAssignment(id);
        setAssignments(assignments.filter(a => a.id !== id));
    }
  };

  const handleToggleComplete = async (id: string) => {
    // Optimistic update
    setAssignments(prev => prev.map(a => {
        if (a.id === id) {
            const isCompleted = a.completedBy.includes(user.uid);
            const newCompletedBy = isCompleted 
                ? a.completedBy.filter(uid => uid !== user.uid)
                : [...a.completedBy, user.uid];
            return { ...a, completedBy: newCompletedBy };
        }
        return a;
    }));

    await MockBackend.toggleAssignmentCompletion(id, user.uid);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#0D2137]">Assignments</h2>
          <p className="text-gray-500">Class 10 • Section A</p>
        </div>
        {canEdit && (
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus size={18} />
            Create New
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {assignments.map((item) => {
            const isCompleted = item.completedBy?.includes(user.uid);
            
            return (
              <Card 
                key={item.id} 
                className={`flex flex-col h-full relative group transition-all ${isCompleted ? 'bg-[#f0fdf4] border-green-200' : ''}`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${isCompleted ? 'bg-green-100 text-green-700' : 'bg-[#3EC7FF]/10 text-[#0D2137]'}`}>
                        {item.subject}
                      </span>
                      {isCompleted && (
                        <span className="flex items-center gap-1 text-xs font-bold text-green-600">
                            <CheckCircle size={14} /> Done
                        </span>
                      )}
                  </div>
                  
                  {canEdit && (
                      <button 
                          onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                          className="text-gray-400 hover:text-red-500 p-1"
                      >
                          <Trash2 size={16} />
                      </button>
                  )}
                </div>
                
                <h3 className="text-lg font-bold text-[#0D2137] mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm mb-6 flex-grow">{item.description}</p>
                
                <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1">
                        <UserIcon size={14} />
                        {item.createdBy}
                    </div>
                    {canEdit && (
                        <div className="text-[#3EC7FF] font-semibold">
                            Completed by: {item.completedBy?.length || 0} students
                        </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-1 text-orange-600 bg-orange-50 px-2 py-1 rounded">
                        <Clock size={14} />
                        Due: {new Date(item.dueDate).toLocaleDateString()}
                    </div>
                    
                    {!canEdit && (
                        <button
                            onClick={() => handleToggleComplete(item.id)}
                            className={`
                                flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all
                                ${isCompleted 
                                    ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}
                            `}
                        >
                            {isCompleted ? (
                                <>
                                    <CheckCircle size={14} />
                                    Completed
                                </>
                            ) : (
                                <>
                                    <div className="w-3.5 h-3.5 rounded-full border-2 border-current"></div>
                                    Mark as Done
                                </>
                            )}
                        </button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Simple Modal for Creation */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-6">
            <h3 className="text-xl font-bold text-[#0D2137] mb-4">Create Assignment</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <select 
                  className="w-full p-2 border border-gray-300 rounded-lg focus:border-[#3EC7FF] outline-none"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                >
                  <option>Mathematics</option>
                  <option>Science</option>
                  <option>English</option>
                  <option>Social Studies</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input 
                  className="w-full p-2 border border-gray-300 rounded-lg focus:border-[#3EC7FF] outline-none"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g., Algebra Chapter 5"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea 
                  className="w-full p-2 border border-gray-300 rounded-lg focus:border-[#3EC7FF] outline-none h-32"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Details about the task..."
                  required
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button type="submit">Post Assignment</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};