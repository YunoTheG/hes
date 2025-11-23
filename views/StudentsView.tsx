
import React, { useEffect, useState, useRef } from 'react';
import { User, FeeRecord, FeeType, PaymentTransaction, PaymentMethod } from '../types';
import { MockBackend } from '../services/mockBackend';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { 
  Search, Edit2, X, Bus, Utensils, Calendar, 
  MapPin, FileText, User as UserIcon, Wallet, AlertCircle, Camera, Plus,
  History, Receipt, DollarSign, CheckCircle, Clock, CreditCard, Building2, Globe, Banknote, Download,
  ChevronDown, Filter, ChevronUp
} from 'lucide-react';

export const StudentsView: React.FC = () => {
  const [students, setStudents] = useState<User[]>([]);
  const [allFees, setAllFees] = useState<FeeRecord[]>([]);
  const [payments, setPayments] = useState<PaymentTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('All');
  const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);
  
  // Detailed Editing Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isNewStudentMode, setIsNewStudentMode] = useState(false);
  const [currentStudent, setCurrentStudent] = useState<Partial<User>>({});
  const [editForm, setEditForm] = useState<Partial<User>>({});
  const [activeModalTab, setActiveModalTab] = useState<'details' | 'finance'>('details');

  // Fee Assignment Modal State
  const [isFeeModalOpen, setIsFeeModalOpen] = useState(false);
  const [targetStudentId, setTargetStudentId] = useState<string | null>(null);
  const [feeForm, setFeeForm] = useState({
      title: '',
      amount: '',
      type: FeeType.TUITION,
      dueDate: ''
  });

  // Payment Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedFee, setSelectedFee] = useState<FeeRecord | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [paymentType, setPaymentType] = useState<'Full' | 'Partial'>('Full');

  // File Input Ref for Image Upload
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const [studentsData, feesData, paymentsData] = await Promise.all([
      MockBackend.getStudents(),
      MockBackend.getFees(),
      MockBackend.getPayments()
    ]);
    setStudents(studentsData);
    setAllFees(feesData);
    setPayments(paymentsData);
    setIsLoading(false);
  };

  const handleEditClick = (student: User, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsNewStudentMode(false);
    setCurrentStudent(student);
    setEditForm({ ...student });
    setActiveModalTab('details');
    setIsEditModalOpen(true);
  };

  const handleAddClick = () => {
    setIsNewStudentMode(true);
    const blankStudent: Partial<User> = {
        name: '',
        class: '10',
        section: 'A',
        studentID: '',
        registrationNumber: '',
        photoURL: 'https://ui-avatars.com/api/?name=New+Student&background=random',
        isBusStudent: false,
        tiffinType: 'HOME',
        joinedYear: '2081'
    };
    setCurrentStudent(blankStudent);
    setEditForm(blankStudent);
    setActiveModalTab('details');
    setIsEditModalOpen(true);
  };

  const toggleRow = (uid: string) => {
    if (expandedStudentId === uid) setExpandedStudentId(null);
    else setExpandedStudentId(uid);
  };

  const openFeeModal = (uid: string, e?: React.MouseEvent) => {
      e?.stopPropagation();
      setTargetStudentId(uid);
      setFeeForm({ title: '', amount: '', type: FeeType.TUITION, dueDate: '' });
      setIsFeeModalOpen(true);
  };

  const calculateStatus = (total: number, paid: number, dueDate: string): FeeRecord['status'] => {
    if (paid >= total) return 'Paid';
    const today = new Date().toISOString().split('T')[0];
    if (today > dueDate) return 'Overdue';
    if (paid > 0) return 'Partial';
    return 'Pending';
  };

  const handleAddFee = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!targetStudentId) return;

      const finalDueDate = feeForm.dueDate || new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0];
      const initialStatus = calculateStatus(Number(feeForm.amount), 0, finalDueDate);

      const newFee: FeeRecord = {
          id: Date.now().toString(),
          studentId: targetStudentId,
          title: feeForm.title,
          type: feeForm.type,
          totalAmount: Number(feeForm.amount),
          paidAmount: 0,
          status: initialStatus,
          dueDate: finalDueDate,
          issuedDate: new Date().toISOString().split('T')[0]
      };

      await MockBackend.addFee(newFee);
      setAllFees(prev => [newFee, ...prev]); // Optimistic update
      setIsFeeModalOpen(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isNewStudentMode) {
        // Create
        const newStudent = await MockBackend.addStudent(editForm);
        setStudents([newStudent, ...students]);
    } else {
        // Update
        if (!currentStudent.uid) return;
        
        // Optimistic update for UI
        setStudents(prev => prev.map(s => 
            s.uid === currentStudent.uid ? { ...s, ...editForm } as User : s
        ));
        await MockBackend.updateStudent(currentStudent.uid, editForm);
    }
    
    setIsEditModalOpen(false);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
            handleFormChange('photoURL', reader.result as string);
        };
        reader.readAsDataURL(file);
    }
  };

  const calculateFinancials = (uid?: string) => {
    if (!uid) return { total: 0, due: 0, paid: 0 };
    const studentFees = allFees.filter(f => f.studentId === uid);
    const total = studentFees.reduce((sum, f) => sum + f.totalAmount, 0);
    const paid = studentFees.reduce((sum, f) => sum + f.paidAmount, 0);
    return { total, paid, due: total - paid };
  };

  const handleExportStatement = (uid?: string) => {
    const targetUid = uid || editForm.uid;
    if (!targetUid) return;
    
    const studentFees = allFees.filter(f => f.studentId === targetUid);
    const studentName = students.find(s => s.uid === targetUid)?.name || 'Student';

    if (studentFees.length === 0) {
        alert('No fee records to export.');
        return;
    }

    const headers = ['Invoice ID', 'Fee Title', 'Type', 'Due Date', 'Total Amount', 'Paid Amount', 'Balance', 'Status', 'Issued Date'];
    const rows = studentFees.map(f => [
        f.id,
        `"${f.title}"`,
        f.type,
        f.dueDate,
        f.totalAmount,
        f.paidAmount,
        f.totalAmount - f.paidAmount,
        f.status,
        f.issuedDate
    ].join(','));

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Statement_${studentName}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openPaymentModal = (fee: FeeRecord) => {
    setSelectedFee(fee);
    const remaining = fee.totalAmount - fee.paidAmount;
    setPaymentAmount(remaining.toString());
    setPaymentType('Full');
    setPaymentMethod('Cash');
    setIsPaymentModalOpen(true);
  };

  const handlePaymentTypeChange = (type: 'Full' | 'Partial') => {
    setPaymentType(type);
    if (selectedFee) {
        const remaining = selectedFee.totalAmount - selectedFee.paidAmount;
        if (type === 'Full') {
            setPaymentAmount(remaining.toString());
        } else {
            setPaymentAmount(''); // Clear for user input
        }
    }
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFee) return;

    const amount = Number(paymentAmount);
    if (amount <= 0 || isNaN(amount)) {
        alert('Please enter a valid amount.');
        return;
    }
    const remaining = selectedFee.totalAmount - selectedFee.paidAmount;
    if (amount > remaining) {
        alert('Amount exceeds due balance.');
        return;
    }

    await MockBackend.recordPayment(selectedFee.id, amount, paymentMethod);

    // Optimistic Updates
    setAllFees(prev => prev.map(f => {
        if (f.id === selectedFee.id) {
            const newPaid = f.paidAmount + amount;
            const newStatus = calculateStatus(f.totalAmount, newPaid, f.dueDate);
            return { ...f, paidAmount: newPaid, status: newStatus };
        }
        return f;
    }));

    const newPayment: PaymentTransaction = {
        id: Date.now().toString(),
        feeId: selectedFee.id,
        studentId: selectedFee.studentId,
        amount,
        date: new Date().toISOString().split('T')[0],
        method: paymentMethod,
        recordedBy: 'Admin'
    };
    setPayments(prev => [newPayment, ...prev]);

    setIsPaymentModalOpen(false);
  };

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.studentID?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.registrationNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesClass = selectedClass === 'All' || s.class === selectedClass;
    
    return matchesSearch && matchesClass;
  });

  const handleFormChange = (field: keyof User, value: any) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  const getPaymentMethodIcon = (method: PaymentMethod) => {
    switch(method) {
        case 'Cash': return <Banknote size={14} />;
        case 'Bank Transfer': return <Building2 size={14} />;
        case 'Cheque': return <CreditCard size={14} />; 
        case 'Online': return <Globe size={14} />;
        default: return <Banknote size={14} />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#0D2137]">Student Management</h2>
          <p className="text-gray-500">Full Profile, Academic & Service Records</p>
        </div>
        <div className="flex gap-3 items-center w-full md:w-auto flex-wrap md:flex-nowrap">
            {/* CLASS FILTER DROPDOWN */}
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Filter className="text-gray-400" size={16} />
                </div>
                <select 
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="pl-9 pr-8 py-2 bg-white border border-gray-200 rounded-xl outline-none focus:border-[#3EC7FF] appearance-none cursor-pointer h-full"
                >
                    <option value="All">All Classes</option>
                    {[...Array(12)].map((_, i) => <option key={i} value={String(i + 1)}>Class {i + 1}</option>)}
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <ChevronDown className="text-gray-400" size={14} />
                </div>
            </div>

            <div className="relative flex-1 md:w-64">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="text-gray-400" size={18} />
                </div>
                <input 
                    type="text" 
                    placeholder="Search name, ID, Reg No..." 
                    className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl outline-none focus:border-[#3EC7FF]"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <Button onClick={handleAddClick}>
                <UserIcon size={18} />
                <span className="hidden sm:inline">Add Student</span>
            </Button>
        </div>
      </div>

      <Card noPadding className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="p-4 font-semibold text-gray-500 text-sm">Student Profile</th>
                <th className="p-4 font-semibold text-gray-500 text-sm">Academic Info</th>
                <th className="p-4 font-semibold text-gray-500 text-sm">Services</th>
                <th className="p-4 font-semibold text-gray-500 text-sm text-right">Due Amount</th>
                <th className="p-4 font-semibold text-gray-500 text-sm text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredStudents.length === 0 ? (
                  <tr>
                      <td colSpan={5} className="p-8 text-center text-gray-400">
                          No students found matching your criteria.
                      </td>
                  </tr>
              ) : (
                filteredStudents.map((student) => {
                    const financials = calculateFinancials(student.uid);
                    const isExpanded = expandedStudentId === student.uid;
                    
                    return (
                    <React.Fragment key={student.uid}>
                    <tr 
                        onClick={() => toggleRow(student.uid)}
                        className={`transition-colors cursor-pointer ${isExpanded ? 'bg-blue-50/30' : 'hover:bg-blue-50/10'}`}
                    >
                        <td className="p-4">
                        <div className="flex items-center gap-3">
                            <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-180 text-[#3EC7FF]' : 'text-gray-400'}`}>
                                <ChevronDown size={16} />
                            </div>
                            <img src={student.photoURL} alt="" className="w-10 h-10 rounded-full object-cover bg-gray-200 border border-gray-100" />
                            <div>
                                <div className="font-bold text-[#0D2137]">{student.name}</div>
                                <div className="text-xs text-gray-400 flex items-center gap-1">
                                    <UserIcon size={10} />
                                    {student.studentID}
                                </div>
                            </div>
                        </div>
                        </td>
                        <td className="p-4">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs font-bold border border-blue-100">
                                Class {student.class}
                            </span>
                            <span className="text-gray-400 text-xs font-medium bg-gray-100 px-2 py-0.5 rounded">
                                Sec: {student.section || '-'}
                            </span>
                        </div>
                        <div className="text-xs text-gray-500">
                            Reg: {student.registrationNumber || 'N/A'}
                        </div>
                        </td>
                        <td className="p-4">
                            <div className="flex gap-2">
                                {student.isBusStudent && (
                                    <div className="w-8 h-8 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center" title="Bus Student">
                                        <Bus size={14} />
                                    </div>
                                )}
                                {student.tiffinType === 'SCHOOL' && (
                                    <div className="w-8 h-8 rounded-full bg-green-50 text-green-500 flex items-center justify-center" title="School Tiffin">
                                        <Utensils size={14} />
                                    </div>
                                )}
                                {(!student.isBusStudent && student.tiffinType !== 'SCHOOL') && (
                                    <span className="text-xs text-gray-400 italic py-2">No active services</span>
                                )}
                            </div>
                        </td>
                        <td className="p-4 text-right">
                            <div className={`font-bold text-sm ${financials.due > 0 ? 'text-red-500' : 'text-green-600'}`}>
                                Rs. {financials.due.toLocaleString()}
                            </div>
                        </td>
                        <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                                <button
                                    onClick={(e) => openFeeModal(student.uid, e)}
                                    className="text-green-600 hover:bg-green-50 p-2 rounded-full transition-colors font-medium text-sm flex items-center gap-1"
                                    title="Assign Fee"
                                >
                                    <Plus size={16} />
                                </button>
                                <button 
                                    onClick={(e) => handleEditClick(student, e)} 
                                    className="text-[#3EC7FF] hover:bg-[#3EC7FF]/10 p-2 rounded-full transition-colors font-medium text-sm flex items-center gap-1"
                                >
                                    <Edit2 size={16} />
                                </button>
                            </div>
                        </td>
                    </tr>
                    
                    {/* EXPANDED ROW FOR FINANCIAL DETAILS */}
                    {isExpanded && (
                        <tr className="bg-gray-50/50">
                            <td colSpan={5} className="p-0 border-b border-gray-100">
                                <div className="p-6 space-y-6 animate-fade-in">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-bold text-[#0D2137] flex items-center gap-2">
                                            <Wallet size={18} className="text-[#3EC7FF]" /> Financial Dashboard
                                        </h4>
                                        <Button 
                                            variant="secondary" 
                                            className="h-8 text-xs px-3"
                                            onClick={() => handleExportStatement(student.uid)}
                                        >
                                            <Download size={14} /> Export Statement
                                        </Button>
                                    </div>
                                    
                                    {/* Summary Cards */}
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                            <p className="text-blue-600 text-xs font-bold uppercase mb-1">Total Invoiced</p>
                                            <h3 className="text-xl font-bold text-[#0D2137]">Rs. {financials.total.toLocaleString()}</h3>
                                        </div>
                                        <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                                            <p className="text-green-600 text-xs font-bold uppercase mb-1">Paid Amount</p>
                                            <h3 className="text-xl font-bold text-green-700">Rs. {financials.paid.toLocaleString()}</h3>
                                        </div>
                                        <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                                            <p className="text-red-600 text-xs font-bold uppercase mb-1">Due Balance</p>
                                            <h3 className="text-xl font-bold text-red-600">Rs. {financials.due.toLocaleString()}</h3>
                                        </div>
                                    </div>
                                    
                                    {/* Fee Table */}
                                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 font-medium">
                                                <tr>
                                                    <th className="p-3 pl-4">Description</th>
                                                    <th className="p-3">Due Date</th>
                                                    <th className="p-3 text-right">Total</th>
                                                    <th className="p-3 text-right">Paid</th>
                                                    <th className="p-3 text-center">Status</th>
                                                    <th className="p-3 text-right pr-4">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {allFees.filter(f => f.studentId === student.uid).length === 0 ? (
                                                    <tr><td colSpan={6} className="p-6 text-center text-gray-400">No fees assigned.</td></tr>
                                                ) : (
                                                    allFees.filter(f => f.studentId === student.uid).map(fee => (
                                                        <tr key={fee.id} className="hover:bg-blue-50/20 transition-colors">
                                                            <td className="p-3 pl-4">
                                                                <div className="font-medium text-[#0D2137]">{fee.title}</div>
                                                                <div className="text-xs text-gray-400 uppercase">{fee.type}</div>
                                                            </td>
                                                            <td className="p-3 text-gray-500 text-xs">
                                                                <div className="flex items-center gap-1">
                                                                    <Calendar size={12} /> {fee.dueDate}
                                                                </div>
                                                            </td>
                                                            <td className="p-3 text-right font-medium">Rs. {fee.totalAmount.toLocaleString()}</td>
                                                            <td className="p-3 text-right text-green-600">Rs. {fee.paidAmount.toLocaleString()}</td>
                                                            <td className="p-3 text-center">
                                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide 
                                                                    ${fee.status === 'Paid' ? 'bg-green-100 text-green-700' : 
                                                                      fee.status === 'Overdue' ? 'bg-red-100 text-red-700' : 
                                                                      fee.status === 'Partial' ? 'bg-yellow-100 text-yellow-700' : 
                                                                      'bg-gray-100 text-gray-600'}`}>
                                                                    {fee.status}
                                                                </span>
                                                            </td>
                                                            <td className="p-3 text-right pr-4">
                                                                {fee.status !== 'Paid' && (
                                                                    <button 
                                                                        type="button"
                                                                        onClick={() => openPaymentModal(fee)}
                                                                        className="text-xs bg-[#3EC7FF]/10 text-[#3EC7FF] px-2 py-1 rounded hover:bg-[#3EC7FF] hover:text-white transition-colors font-medium flex items-center gap-1 ml-auto"
                                                                    >
                                                                        <DollarSign size={12} /> Pay
                                                                    </button>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                    
                                    {/* Payment History */}
                                    <details className="group bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                                        <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 select-none transition-colors">
                                            <h4 className="font-bold text-[#0D2137] flex items-center gap-2 text-sm uppercase tracking-wider">
                                                <History size={16} className="text-[#3EC7FF]" />
                                                Payment History
                                            </h4>
                                            <div className="flex items-center gap-2 text-xs text-gray-400">
                                                <span>{payments.filter(p => p.studentId === student.uid).length} Transactions</span>
                                                <ChevronDown className="transition-transform duration-300 group-open:rotate-180" size={16} />
                                            </div>
                                        </summary>
                                        <div className="border-t border-gray-100">
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-sm text-left">
                                                    <thead className="bg-gray-50/50 border-b border-gray-100 text-gray-500 font-medium">
                                                        <tr>
                                                            <th className="p-3 pl-4">Date</th>
                                                            <th className="p-3">Amount</th>
                                                            <th className="p-3">Method</th>
                                                            <th className="p-3">Fee Reference</th>
                                                            <th className="p-3 text-right pr-4">Admin</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-100">
                                                        {payments.filter(p => p.studentId === student.uid).length === 0 ? (
                                                            <tr><td colSpan={5} className="p-6 text-center text-gray-400">No payments recorded.</td></tr>
                                                        ) : (
                                                            payments.filter(p => p.studentId === student.uid)
                                                            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                                            .map(p => {
                                                                const feeRef = allFees.find(f => f.id === p.feeId);
                                                                return (
                                                                    <tr key={p.id} className="hover:bg-blue-50/20 transition-colors">
                                                                        <td className="p-3 pl-4 text-gray-600 text-xs">{p.date}</td>
                                                                        <td className="p-3 font-bold text-green-600">Rs. {p.amount.toLocaleString()}</td>
                                                                        <td className="p-3">
                                                                            <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-md text-xs border border-gray-200 flex items-center gap-2 w-fit">
                                                                                {getPaymentMethodIcon(p.method)}
                                                                                {p.method}
                                                                            </span>
                                                                        </td>
                                                                        <td className="p-3 text-xs text-gray-500">{feeRef?.title || 'Unknown Fee'}</td>
                                                                        <td className="p-3 text-right pr-4 text-xs text-gray-400">{p.recordedBy}</td>
                                                                    </tr>
                                                                )
                                                            })
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </details>
                                </div>
                            </td>
                        </tr>
                    )}
                    </React.Fragment>
                    );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Comprehensive Edit/Add Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="bg-[#0D2137] text-white p-6 flex justify-between items-start shrink-0">
                <div className="flex gap-4">
                    <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                        <img 
                            src={editForm.photoURL} 
                            className="w-20 h-20 rounded-xl border-4 border-white/20 bg-white object-cover"
                            alt="Profile"
                        />
                        <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Camera className="text-white" size={24} />
                        </div>
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            className="hidden" 
                            accept="image/*"
                            onChange={handlePhotoUpload}
                        />
                    </div>

                    <div>
                        <h3 className="text-2xl font-bold">
                            {isNewStudentMode ? 'Admit New Student' : editForm.name}
                        </h3>
                        <p className="text-[#3EC7FF] font-medium">
                             {isNewStudentMode ? 'Fill in student details' : editForm.studentID}
                        </p>
                        {!isNewStudentMode && (
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-300">
                                <span className="flex items-center gap-1"><Calendar size={14}/> Adm: {editForm.admissionDate || 'N/A'}</span>
                                <span className="flex items-center gap-1"><MapPin size={14}/> {editForm.address || 'N/A'}</span>
                            </div>
                        )}
                    </div>
                </div>
                <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-white">
                    <X size={24} />
                </button>
            </div>

            {/* Modal Tabs */}
            {!isNewStudentMode && (
                <div className="flex border-b border-gray-100 bg-gray-50 px-6 pt-2 shrink-0">
                    <button
                        onClick={() => setActiveModalTab('details')}
                        className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                            activeModalTab === 'details' 
                            ? 'border-[#3EC7FF] text-[#0D2137]' 
                            : 'border-transparent text-gray-500 hover:text-[#0D2137]'
                        }`}
                    >
                        Profile Details
                    </button>
                    {/* The financial tab is still here for deep edits, but list view is primary now */}
                    <button
                        onClick={() => setActiveModalTab('finance')}
                        className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                            activeModalTab === 'finance' 
                            ? 'border-[#3EC7FF] text-[#0D2137]' 
                            : 'border-transparent text-gray-500 hover:text-[#0D2137]'
                        }`}
                    >
                        Financial History
                    </button>
                </div>
            )}

            <div className="overflow-y-auto p-6 flex-1">
                {activeModalTab === 'details' ? (
                    <form id="profile-form" onSubmit={handleSave}>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Column 1: Academic Info */}
                            <div className="space-y-4">
                                <h4 className="font-bold text-[#0D2137] flex items-center gap-2 border-b pb-2">
                                    <FileText size={18} className="text-[#3EC7FF]" /> Academic Details
                                </h4>
                                
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">Class</label>
                                        <select 
                                            value={editForm.class || '1'} 
                                            onChange={(e) => handleFormChange('class', e.target.value)}
                                            className="w-full p-2 border rounded-lg bg-gray-50"
                                        >
                                            {[...Array(12)].map((_,i) => <option key={i} value={String(i+1)}>{i+1}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">Section</label>
                                        <input 
                                            type="text" 
                                            value={editForm.section || ''}
                                            onChange={(e) => handleFormChange('section', e.target.value)}
                                            className="w-full p-2 border rounded-lg bg-gray-50 uppercase" 
                                            maxLength={1}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Student Register Number</label>
                                    <input 
                                        type="text" 
                                        value={editForm.registrationNumber || ''}
                                        onChange={(e) => handleFormChange('registrationNumber', e.target.value)}
                                        placeholder="e.g. 1054"
                                        className="w-full p-2 border rounded-lg bg-gray-50" 
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Student ID {isNewStudentMode && '(Auto-generated)'}</label>
                                    <input 
                                        type="text" 
                                        value={editForm.studentID || ''}
                                        onChange={(e) => handleFormChange('studentID', e.target.value)}
                                        placeholder="e.g. HES-2024-001"
                                        className="w-full p-2 border rounded-lg bg-gray-50" 
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">Registration Year</label>
                                        <input 
                                            type="text" 
                                            value={editForm.joinedYear || ''}
                                            onChange={(e) => handleFormChange('joinedYear', e.target.value)}
                                            placeholder="e.g. 2081"
                                            className="w-full p-2 border rounded-lg bg-gray-50" 
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">Admission Date</label>
                                        <input 
                                            type="date" 
                                            value={editForm.admissionDate || ''}
                                            onChange={(e) => handleFormChange('admissionDate', e.target.value)}
                                            className="w-full p-2 border rounded-lg bg-gray-50" 
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Column 2: Personal Info */}
                            <div className="space-y-4">
                                <h4 className="font-bold text-[#0D2137] flex items-center gap-2 border-b pb-2">
                                    <UserIcon size={18} className="text-[#3EC7FF]" /> Personal Information
                                </h4>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Full Name</label>
                                    <input 
                                        type="text" 
                                        value={editForm.name || ''}
                                        onChange={(e) => handleFormChange('name', e.target.value)}
                                        className="w-full p-2 border rounded-lg bg-gray-50" 
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">DOB (Date of Birth)</label>
                                    <input 
                                        type="date" 
                                        value={editForm.dob || ''}
                                        onChange={(e) => handleFormChange('dob', e.target.value)}
                                        className="w-full p-2 border rounded-lg bg-gray-50" 
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Address</label>
                                    <input 
                                        value={editForm.address || ''}
                                        onChange={(e) => handleFormChange('address', e.target.value)}
                                        className="w-full p-2 border rounded-lg bg-gray-50" 
                                    />
                                </div>

                                <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                                    <label className="block text-xs font-bold text-blue-800 mb-2 uppercase tracking-wider">Guardian Details</label>
                                    <div className="grid grid-cols-1 gap-3">
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-500 mb-1">Parent Name</label>
                                            <input 
                                                value={editForm.parentName || ''}
                                                onChange={(e) => handleFormChange('parentName', e.target.value)}
                                                className="w-full p-2 border rounded-lg bg-white text-sm" 
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-500 mb-1">Phone Number</label>
                                            <input 
                                                value={editForm.parentPhone || ''}
                                                onChange={(e) => handleFormChange('parentPhone', e.target.value)}
                                                placeholder="Mobile Number"
                                                className="w-full p-2 border rounded-lg bg-white text-sm" 
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-500 mb-1">Emergency Contact</label>
                                            <input 
                                                value={editForm.emergencyContact || ''}
                                                onChange={(e) => handleFormChange('emergencyContact', e.target.value)}
                                                className="w-full p-2 border rounded-lg bg-white text-sm" 
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Column 3: Services & Finance */}
                            <div className="space-y-6">
                                <div className="space-y-4">
                                    <h4 className="font-bold text-[#0D2137] flex items-center gap-2 border-b pb-2">
                                        <Bus size={18} className="text-[#3EC7FF]" /> School Services
                                    </h4>
                                    
                                    <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-100">
                                        <span className="text-sm font-medium text-orange-800">Bus Student Status</span>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                checked={editForm.isBusStudent || false} 
                                                onChange={(e) => handleFormChange('isBusStudent', e.target.checked)}
                                                className="sr-only peer" 
                                            />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                                        </label>
                                    </div>
                                    
                                    {editForm.isBusStudent && (
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 mb-1">Bus Route / Stop</label>
                                            <input 
                                                value={editForm.busRoute || ''}
                                                onChange={(e) => handleFormChange('busRoute', e.target.value)}
                                                placeholder="e.g. Lakeside Stop 1"
                                                className="w-full p-2 border rounded-lg bg-white" 
                                            />
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100">
                                        <span className="text-sm font-medium text-green-800">Tiffin Type</span>
                                        <div className="flex gap-2">
                                            <button 
                                                type="button"
                                                onClick={() => handleFormChange('tiffinType', 'SCHOOL')}
                                                className={`text-xs px-3 py-1 rounded-full transition-colors ${editForm.tiffinType === 'SCHOOL' ? 'bg-green-600 text-white' : 'bg-white text-gray-500'}`}
                                            >
                                                School
                                            </button>
                                            <button 
                                                type="button"
                                                onClick={() => handleFormChange('tiffinType', 'HOME')}
                                                className={`text-xs px-3 py-1 rounded-full transition-colors ${editForm.tiffinType === 'HOME' ? 'bg-green-600 text-white' : 'bg-white text-gray-500'}`}
                                            >
                                                Home
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {!isNewStudentMode && (
                                    <div className="bg-gray-900 text-white p-4 rounded-xl">
                                        <div className="flex items-center justify-between mb-4">
                                            <h4 className="font-bold text-white flex items-center gap-2">
                                                <Wallet size={18} className="text-[#3EC7FF]" /> Financial Snapshot
                                            </h4>
                                        </div>
                                        <div className="space-y-2 text-sm">
                                            {(() => {
                                                const fin = calculateFinancials(editForm.uid);
                                                return (
                                                    <>
                                                        <div className="flex justify-between">
                                                            <span className="text-gray-400">Total Fees:</span>
                                                            <span>Rs. {fin.total.toLocaleString()}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-gray-400">Total Paid:</span>
                                                            <span className="text-green-400">Rs. {fin.paid.toLocaleString()}</span>
                                                        </div>
                                                        <div className="flex justify-between pt-2 border-t border-gray-700 mt-2">
                                                            <span className="text-red-400 font-bold">Due Amount:</span>
                                                            <span className="text-red-400 font-bold">Rs. {fin.due.toLocaleString()}</span>
                                                        </div>
                                                    </>
                                                )
                                            })()}
                                        </div>
                                        <button 
                                            type="button"
                                            onClick={() => setActiveModalTab('finance')}
                                            className="w-full mt-4 bg-[#3EC7FF]/20 text-[#3EC7FF] py-2 rounded text-xs font-bold hover:bg-[#3EC7FF]/30 transition-colors flex items-center justify-center gap-2"
                                        >
                                            View Details & Pay <Wallet size={12} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </form>
                ) : (
                    <div className="space-y-8 animate-fade-in">
                        {/* Financial Summary Cards */}
                        {(() => {
                             const fin = calculateFinancials(editForm.uid);
                             return (
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                        <p className="text-blue-600 text-xs font-bold uppercase mb-1">Total Invoiced</p>
                                        <h3 className="text-xl font-bold text-[#0D2137]">Rs. {fin.total.toLocaleString()}</h3>
                                    </div>
                                    <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                                        <p className="text-green-600 text-xs font-bold uppercase mb-1">Paid Amount</p>
                                        <h3 className="text-xl font-bold text-green-700">Rs. {fin.paid.toLocaleString()}</h3>
                                    </div>
                                    <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                                        <p className="text-red-600 text-xs font-bold uppercase mb-1">Due Balance</p>
                                        <h3 className="text-xl font-bold text-red-600">Rs. {fin.due.toLocaleString()}</h3>
                                    </div>
                                </div>
                             );
                        })()}

                        {/* Fees Table */}
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="font-bold text-[#0D2137] flex items-center gap-2">
                                    <Receipt size={18} className="text-[#3EC7FF]" /> Fee Records
                                </h4>
                                <div className="flex gap-2">
                                    <Button onClick={() => handleExportStatement(editForm.uid)} variant="secondary" className="h-9 text-xs px-3 border-gray-300 hover:border-[#3EC7FF]">
                                        <Download size={14} /> Statement
                                    </Button>
                                    <Button onClick={(e) => openFeeModal(editForm.uid!, e)} className="h-9 text-xs px-3">
                                        <Plus size={14} /> Add Fee
                                    </Button>
                                </div>
                            </div>
                            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 font-medium">
                                        <tr>
                                            <th className="p-3 pl-4">Description</th>
                                            <th className="p-3">Due Date</th>
                                            <th className="p-3 text-right">Total</th>
                                            <th className="p-3 text-right">Paid</th>
                                            <th className="p-3 text-center">Status</th>
                                            <th className="p-3 text-right pr-4">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {allFees.filter(f => f.studentId === editForm.uid).length === 0 ? (
                                            <tr><td colSpan={6} className="p-6 text-center text-gray-400">No fees assigned.</td></tr>
                                        ) : (
                                            allFees.filter(f => f.studentId === editForm.uid).map(fee => (
                                                <tr key={fee.id} className="hover:bg-blue-50/20 transition-colors">
                                                    <td className="p-3 pl-4">
                                                        <div className="font-medium text-[#0D2137]">{fee.title}</div>
                                                        <div className="text-xs text-gray-400 uppercase">{fee.type}</div>
                                                    </td>
                                                    <td className="p-3 text-gray-500 text-xs">
                                                        <div className="flex items-center gap-1">
                                                            <Calendar size={12} /> {fee.dueDate}
                                                        </div>
                                                    </td>
                                                    <td className="p-3 text-right font-medium">Rs. {fee.totalAmount.toLocaleString()}</td>
                                                    <td className="p-3 text-right text-green-600">Rs. {fee.paidAmount.toLocaleString()}</td>
                                                    <td className="p-3 text-center">
                                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide 
                                                            ${fee.status === 'Paid' ? 'bg-green-100 text-green-700' : 
                                                              fee.status === 'Overdue' ? 'bg-red-100 text-red-700' : 
                                                              fee.status === 'Partial' ? 'bg-yellow-100 text-yellow-700' : 
                                                              'bg-gray-100 text-gray-600'}`}>
                                                            {fee.status}
                                                        </span>
                                                    </td>
                                                    <td className="p-3 text-right pr-4">
                                                        {fee.status !== 'Paid' && (
                                                            <button 
                                                                type="button"
                                                                onClick={() => openPaymentModal(fee)}
                                                                className="text-xs bg-[#3EC7FF]/10 text-[#3EC7FF] px-2 py-1 rounded hover:bg-[#3EC7FF] hover:text-white transition-colors font-medium flex items-center gap-1 ml-auto"
                                                            >
                                                                <DollarSign size={12} /> Pay
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Payment History */}
                        <details className="group bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mt-6">
                            <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 select-none transition-colors">
                                <h4 className="font-bold text-[#0D2137] flex items-center gap-2 text-sm uppercase tracking-wider">
                                    <History size={16} className="text-[#3EC7FF]" />
                                    Payment History
                                </h4>
                                <div className="flex items-center gap-2 text-xs text-gray-400">
                                    <span>{payments.filter(p => p.studentId === editForm.uid).length} Transactions</span>
                                    <ChevronDown className="transition-transform duration-300 group-open:rotate-180" size={16} />
                                </div>
                            </summary>
                            <div className="border-t border-gray-100">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-gray-50/50 border-b border-gray-100 text-gray-500 font-medium">
                                            <tr>
                                                <th className="p-3 pl-4">Date</th>
                                                <th className="p-3">Amount</th>
                                                <th className="p-3">Method</th>
                                                <th className="p-3">Fee Reference</th>
                                                <th className="p-3 text-right pr-4">Admin</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {payments.filter(p => p.studentId === editForm.uid).length === 0 ? (
                                                <tr><td colSpan={5} className="p-6 text-center text-gray-400">No payments recorded.</td></tr>
                                            ) : (
                                                payments.filter(p => p.studentId === editForm.uid)
                                                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                                .map(p => {
                                                    const feeRef = allFees.find(f => f.id === p.feeId);
                                                    return (
                                                        <tr key={p.id} className="hover:bg-blue-50/20 transition-colors">
                                                            <td className="p-3 pl-4 text-gray-600 text-xs">{p.date}</td>
                                                            <td className="p-3 font-bold text-green-600">Rs. {p.amount.toLocaleString()}</td>
                                                            <td className="p-3">
                                                                <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-md text-xs border border-gray-200 flex items-center gap-2 w-fit">
                                                                    {getPaymentMethodIcon(p.method)}
                                                                    {p.method}
                                                                </span>
                                                            </td>
                                                            <td className="p-3 text-xs text-gray-500">{feeRef?.title || 'Unknown Fee'}</td>
                                                            <td className="p-3 text-right pr-4 text-xs text-gray-400">{p.recordedBy}</td>
                                                        </tr>
                                                    )
                                                })
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </details>
                    </div>
                )}
            </div>

            {/* Footer Actions */}
            {activeModalTab === 'details' && (
                <div className="flex justify-end gap-4 p-6 border-t border-gray-100 shrink-0">
                    <Button type="button" variant="secondary" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
                    <Button 
                        onClick={() => document.getElementById('profile-form')?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }))}
                    >
                        {isNewStudentMode ? 'Admit Student' : 'Save Changes'}
                    </Button>
                </div>
            )}
            {activeModalTab === 'finance' && (
                 <div className="flex justify-end gap-4 p-6 border-t border-gray-100 shrink-0">
                    <Button variant="secondary" onClick={() => setIsEditModalOpen(false)}>Close</Button>
                </div>
            )}
          </div>
        </div>
      )}

      {/* Add Fee Modal */}
      {isFeeModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
              <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-bold text-[#0D2137]">Assign New Fee</h3>
                      <button onClick={() => setIsFeeModalOpen(false)} className="text-gray-400 hover:text-red-500">
                          <X size={20} />
                      </button>
                  </div>
                  
                  <form onSubmit={handleAddFee} className="space-y-4">
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Fee Description</label>
                          <input 
                              className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:border-[#3EC7FF]"
                              placeholder="e.g. Term 2 Exam Fee"
                              value={feeForm.title}
                              onChange={(e) => setFeeForm({...feeForm, title: e.target.value})}
                              required
                          />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                              <select 
                                  className="w-full p-2 border border-gray-300 rounded-lg outline-none"
                                  value={feeForm.type}
                                  onChange={(e) => setFeeForm({...feeForm, type: e.target.value as FeeType})}
                              >
                                  {Object.values(FeeType).map(t => <option key={t} value={t}>{t}</option>)}
                              </select>
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Amount (Rs.)</label>
                              <input 
                                  type="number"
                                  className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:border-[#3EC7FF]"
                                  placeholder="0.00"
                                  value={feeForm.amount}
                                  onChange={(e) => setFeeForm({...feeForm, amount: e.target.value})}
                                  required
                              />
                          </div>
                      </div>
                      
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                          <input 
                              type="date"
                              className="w-full p-2 border border-gray-300 rounded-lg outline-none"
                              value={feeForm.dueDate}
                              onChange={(e) => setFeeForm({...feeForm, dueDate: e.target.value})}
                              required
                          />
                      </div>

                      <div className="flex justify-end gap-3 pt-2 mt-4">
                          <Button type="button" variant="secondary" onClick={() => setIsFeeModalOpen(false)}>Cancel</Button>
                          <Button type="submit">Assign Fee</Button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      {/* Payment Modal */}
      {isPaymentModalOpen && selectedFee && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6">
                <h3 className="text-xl font-bold text-[#0D2137] mb-1">Record Payment</h3>
                <p className="text-sm text-gray-500 mb-4">For: {selectedFee.title}</p>
                
                <div className="bg-blue-50 p-3 rounded-lg mb-4 text-sm">
                    <div className="flex justify-between mb-1">
                        <span>Total Amount:</span>
                        <span className="font-bold">Rs. {selectedFee.totalAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-green-700">
                        <span>Already Paid:</span>
                        <span>Rs. {selectedFee.paidAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-red-600 border-t border-blue-100 pt-1 mt-1 font-bold">
                        <span>Remaining Due:</span>
                        <span>Rs. {(selectedFee.totalAmount - selectedFee.paidAmount).toLocaleString()}</span>
                    </div>
                </div>

                <form onSubmit={handlePayment} className="space-y-4">
                    <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-lg">
                        <button
                            type="button"
                            onClick={() => handlePaymentTypeChange('Full')}
                            className={`py-2 text-sm font-medium rounded-md transition-all ${
                                paymentType === 'Full' ? 'bg-white text-[#0D2137] shadow-sm' : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            Full Settlement
                        </button>
                        <button
                            type="button"
                            onClick={() => handlePaymentTypeChange('Partial')}
                            className={`py-2 text-sm font-medium rounded-md transition-all ${
                                paymentType === 'Partial' ? 'bg-white text-[#0D2137] shadow-sm' : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            Partial Payment
                        </button>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Payment Amount (Rs.)
                        </label>
                        <input 
                            type="number"
                            className={`w-full p-3 text-lg font-bold border rounded-lg outline-none focus:border-green-500 transition-colors ${
                                paymentType === 'Full' 
                                    ? 'bg-gray-50 text-gray-500 border-gray-200 cursor-not-allowed' 
                                    : 'border-gray-300 text-green-700'
                            }`}
                            placeholder="0.00"
                            value={paymentAmount}
                            onChange={(e) => setPaymentAmount(e.target.value)}
                            readOnly={paymentType === 'Full'}
                            required
                            max={selectedFee.totalAmount - selectedFee.paidAmount}
                            min={1}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                        <select 
                            className="w-full p-2 border border-gray-300 rounded-lg outline-none"
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                        >
                            <option value="Cash">Cash</option>
                            <option value="Bank Transfer">Bank Transfer</option>
                            <option value="Cheque">Cheque</option>
                            <option value="Online">Online / Digital Wallet</option>
                        </select>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <Button type="button" variant="secondary" onClick={() => setIsPaymentModalOpen(false)}>Cancel</Button>
                        <Button type="submit" className="bg-green-600 hover:bg-green-700">Confirm Payment</Button>
                    </div>
                </form>
            </div>
          </div>
      )}
    </div>
  );
};
    