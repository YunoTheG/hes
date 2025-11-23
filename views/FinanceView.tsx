
import React, { useEffect, useState } from 'react';
import { MockBackend } from '../services/mockBackend';
import { FeeRecord, FeeType, User, StudentFinancialSummary, PaymentTransaction, PaymentMethod, FeeStructure } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { 
    Plus, Wallet, ChevronDown, ChevronUp, DollarSign, Receipt, History, Settings, 
    Play, RefreshCw, Bus, Banknote, Building2, Globe, CreditCard, Download 
} from 'lucide-react';

export const FinanceView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'records' | 'config'>('records');
  
  // Data State
  const [fees, setFees] = useState<FeeRecord[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [payments, setPayments] = useState<PaymentTransaction[]>([]);
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Modals
  const [isAddFeeOpen, setIsAddFeeOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isStructureModalOpen, setIsStructureModalOpen] = useState(false);
  
  // Add Fee Form
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [feeType, setFeeType] = useState<FeeType>(FeeType.TUITION);
  const [feeTitle, setFeeTitle] = useState('');
  const [feeAmount, setFeeAmount] = useState('');
  const [feeDueDate, setFeeDueDate] = useState('');
  const [feeStatus, setFeeStatus] = useState<FeeRecord['status']>('Pending');
  
  // Payment Form
  const [selectedFee, setSelectedFee] = useState<FeeRecord | null>(null);
  const [paymentType, setPaymentType] = useState<'Full' | 'Partial'>('Full');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');

  // Fee Structure Form
  const [structTitle, setStructTitle] = useState('');
  const [structAmount, setStructAmount] = useState('');
  const [structType, setStructType] = useState<FeeType>(FeeType.TUITION);
  const [structClass, setStructClass] = useState('All');
  const [structService, setStructService] = useState<'None'|'Bus'|'SchoolTiffin'>('None');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [fetchedFees, fetchedStudents, fetchedPayments, fetchedStructures] = await Promise.all([
        MockBackend.getFees(),
        MockBackend.getStudents(),
        MockBackend.getPayments(),
        MockBackend.getFeeStructures()
    ]);
    setFees(fetchedFees);
    setStudents(fetchedStudents);
    setPayments(fetchedPayments);
    setFeeStructures(fetchedStructures);
  };

  // Aggregate data per student
  const studentSummaries: StudentFinancialSummary[] = students.map(student => {
    const studentFees = fees.filter(f => f.studentId === student.uid);
    const totalFees = studentFees.reduce((sum, f) => sum + f.totalAmount, 0);
    const totalPaid = studentFees.reduce((sum, f) => sum + f.paidAmount, 0);
    return {
        student,
        totalFees,
        totalPaid,
        totalDue: totalFees - totalPaid
    };
  });

  const handleExportCSV = (studentId?: string) => {
    const targetFees = studentId 
      ? fees.filter(f => f.studentId === studentId)
      : fees;
      
    if (targetFees.length === 0) {
        alert('No records found to export.');
        return;
    }

    const headers = [
        'Invoice ID',
        'Student Name', 
        'Student ID', 
        'Class', 
        'Fee Title', 
        'Type', 
        'Total Amount', 
        'Paid Amount', 
        'Balance Due', 
        'Status', 
        'Issued Date', 
        'Due Date'
    ];

    const rows = targetFees.map(fee => {
        const student = students.find(s => s.uid === fee.studentId);
        const name = student ? student.name : 'Unknown';
        const sId = student ? student.studentID : 'N/A';
        const sClass = student ? student.class : 'N/A';
        const balance = fee.totalAmount - fee.paidAmount;

        return [
            fee.id,
            `"${name}"`,
            sId,
            sClass,
            `"${fee.title}"`,
            fee.type,
            fee.totalAmount,
            fee.paidAmount,
            balance,
            fee.status,
            fee.issuedDate,
            fee.dueDate
        ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Finance_Report_${studentId ? 'Student' : 'All'}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
    const finalDueDate = feeDueDate || new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0];

    // If status is manually set to Paid, assume full payment is collected instantly
    let initialPaid = 0;
    let finalStatus = feeStatus;

    if (feeStatus === 'Paid') {
        initialPaid = Number(feeAmount);
    } else {
        // Calculate proper status based on dates if not explicitly Paid
        finalStatus = calculateStatus(Number(feeAmount), 0, finalDueDate);
    }

    const newFee: FeeRecord = {
        id: Date.now().toString(),
        studentId: selectedStudentId,
        type: feeType,
        title: feeTitle,
        totalAmount: Number(feeAmount),
        paidAmount: initialPaid,
        status: finalStatus,
        dueDate: finalDueDate,
        issuedDate: new Date().toISOString().split('T')[0]
    };

    await MockBackend.addFee(newFee);
    setFees(prev => [newFee, ...prev]);
    setIsAddFeeOpen(false);
    resetForms();
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!selectedFee) return;
    
    const amount = Number(paymentAmount);
    
    // Validation
    if (amount <= 0 || isNaN(amount)) {
        alert('Please enter a valid positive amount.');
        return;
    }
    
    const remaining = selectedFee.totalAmount - selectedFee.paidAmount;
    if (amount > remaining) {
        alert(`Payment amount (Rs. ${amount}) cannot exceed the remaining due (Rs. ${remaining}).`);
        return;
    }

    await MockBackend.recordPayment(selectedFee.id, amount, paymentMethod);
    
    // Local Update Fees
    setFees(prev => prev.map(f => {
        if(f.id === selectedFee.id) {
            const newPaid = Math.min(f.paidAmount + amount, f.totalAmount);
            // Calculate status
            const newStatus = calculateStatus(f.totalAmount, newPaid, f.dueDate);
            return { ...f, paidAmount: newPaid, status: newStatus };
        }
        return f;
    }));

    // Local Update Payments
    const newPayment: PaymentTransaction = {
        id: Date.now().toString(),
        feeId: selectedFee.id,
        studentId: selectedFee.studentId,
        amount,
        date: new Date().toISOString().split('T')[0],
        method: paymentMethod,
        recordedBy: 'Me' // In a real app this comes from auth context
    };
    setPayments(prev => [newPayment, ...prev]);
    
    setIsPaymentOpen(false);
    resetForms();
  };

  const handleAddStructure = async (e: React.FormEvent) => {
      e.preventDefault();
      const newStruct: FeeStructure = {
          id: Date.now().toString(),
          title: structTitle,
          amount: Number(structAmount),
          type: structType,
          frequency: 'Monthly',
          targetClass: structClass,
          targetService: structService
      };
      await MockBackend.addFeeStructure(newStruct);
      setFeeStructures(prev => [...prev, newStruct]);
      setIsStructureModalOpen(false);
      setStructTitle('');
      setStructAmount('');
  };

  const handleGenerateMonthlyFees = async () => {
      if(!confirm('Generate fees for the current month? This will apply all defined Monthly structures to eligible students.')) return;
      
      setIsGenerating(true);
      const today = new Date();
      const count = await MockBackend.generateMonthlyFees(today.getFullYear(), today.getMonth());
      
      if(count > 0) {
          const updatedFees = await MockBackend.getFees();
          setFees(updatedFees);
          alert(`Successfully generated ${count} invoice records.`);
      } else {
          alert('No new fees were generated. They might already exist for this month.');
      }
      setIsGenerating(false);
  };

  const resetForms = () => {
    setFeeTitle('');
    setFeeAmount('');
    setPaymentAmount('');
    setFeeDueDate('');
    setFeeStatus('Pending');
    setPaymentMethod('Cash');
    setSelectedFee(null);
    setPaymentType('Full');
    setFeeType(FeeType.TUITION); // Reset to default
  };

  const openAddFeeModal = (studentId?: string) => {
    resetForms();
    if (studentId) {
        setSelectedStudentId(studentId);
    } else {
        setSelectedStudentId('');
    }
    setIsAddFeeOpen(true);
  };

  const handleAssignBusFee = () => {
      resetForms();
      setFeeType(FeeType.BUS);
      setFeeTitle('Bus Fee - '); 
      setSelectedStudentId('');
      setIsAddFeeOpen(true);
  };

  const openPaymentModal = (fee: FeeRecord) => {
    setSelectedFee(fee);
    const remaining = fee.totalAmount - fee.paidAmount;
    setPaymentAmount(remaining.toString());
    setPaymentType('Full');
    setIsPaymentOpen(true);
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
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
            <h2 className="text-2xl font-bold text-[#0D2137]">Fee Management</h2>
            <p className="text-gray-500">Tuition, Packages, and Auto-Calculations</p>
        </div>
        
        <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-100">
            <button 
                onClick={() => setActiveTab('records')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'records' ? 'bg-[#0D2137] text-white' : 'text-gray-500 hover:bg-gray-50'}`}
            >
                Student Records
            </button>
            <button 
                onClick={() => setActiveTab('config')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'config' ? 'bg-[#0D2137] text-white' : 'text-gray-500 hover:bg-gray-50'}`}
            >
                <Settings size={14} />
                Configuration
            </button>
        </div>
      </div>

      {/* --- TAB 1: STUDENT RECORDS --- */}
      {activeTab === 'records' && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex gap-2 justify-end flex-wrap">
                 <Button 
                    onClick={handleGenerateMonthlyFees} 
                    isLoading={isGenerating}
                    variant="secondary"
                    className="bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100 hover:border-indigo-300"
                 >
                    <RefreshCw size={18} className={isGenerating ? 'animate-spin' : ''} />
                    Auto-Generate
                 </Button>
                 <Button onClick={() => handleExportCSV()} variant="secondary" className="border-gray-200 text-gray-600 hover:text-[#0D2137] hover:border-gray-300">
                    <Download size={18} />
                    Export CSV
                 </Button>
                 <Button onClick={handleAssignBusFee} variant="secondary" className="text-orange-600 border-orange-200 bg-orange-50 hover:bg-orange-100 hover:border-orange-300">
                    <Bus size={18} />
                    Assign Bus Fee
                </Button>
                 <Button onClick={() => openAddFeeModal()}>
                    <Plus size={18} />
                    Manual Fee Entry
                </Button>
            </div>

            {studentSummaries.map((summary) => (
                <Card key={summary.student.uid} noPadding className="overflow-hidden">
                    <div 
                        className="p-4 flex items-center justify-between bg-white cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => setExpandedStudent(expandedStudent === summary.student.uid ? null : summary.student.uid)}
                    >
                        <div className="flex items-center gap-4">
                            <div className={`p-2 rounded-full ${summary.totalDue > 0 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                <Wallet size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-[#0D2137]">{summary.student.name}</h3>
                                <p className="text-xs text-gray-500">Class {summary.student.class} • ID: {summary.student.studentID}</p>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-8">
                            <div className="text-right hidden md:block">
                                <p className="text-xs text-gray-400 uppercase font-semibold">Total Fees</p>
                                <p className="font-medium">Rs. {summary.totalFees.toLocaleString()}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-gray-400 uppercase font-semibold">Due Amount</p>
                                <p className={`font-bold ${summary.totalDue > 0 ? 'text-red-500' : 'text-green-600'}`}>
                                    Rs. {summary.totalDue.toLocaleString()}
                                </p>
                            </div>
                            {expandedStudent === summary.student.uid ? <ChevronUp size={20} className="text-gray-400"/> : <ChevronDown size={20} className="text-gray-400"/>}
                        </div>
                    </div>

                    {expandedStudent === summary.student.uid && (
                        <div className="bg-gray-50 p-4 border-t border-gray-100 animate-fade-in">
                            
                            {/* SECTION 1: FEES TABLE */}
                            <div className="mb-4">
                                <div className="flex justify-between items-center mb-3">
                                    <h4 className="font-bold text-[#0D2137] flex items-center gap-2 text-sm uppercase tracking-wider">
                                        <Receipt size={16} className="text-[#3EC7FF]" />
                                        Fee Records
                                    </h4>
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => openAddFeeModal(summary.student.uid)}
                                            className="text-xs flex items-center gap-1 text-[#3EC7FF] hover:underline font-medium"
                                        >
                                            <Plus size={14} /> Add Fee
                                        </button>
                                        <button 
                                            onClick={() => handleExportCSV(summary.student.uid)}
                                            className="text-xs flex items-center gap-1 text-[#3EC7FF] hover:underline font-medium"
                                        >
                                            <Download size={14} /> Export Record
                                        </button>
                                    </div>
                                </div>
                                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                                    <table className="w-full text-sm text-left">
                                        <thead className="text-gray-500 font-medium border-b border-gray-100 bg-gray-50/50">
                                            <tr>
                                                <th className="py-3 pl-4">Fee Description</th>
                                                <th className="py-3 hidden sm:table-cell">Due Date</th>
                                                <th className="py-3 text-right">Total</th>
                                                <th className="py-3 text-right">Paid</th>
                                                <th className="py-3 text-center">Status</th>
                                                <th className="py-3 pr-4 text-right">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {fees.filter(f => f.studentId === summary.student.uid).length === 0 ? (
                                                <tr><td colSpan={6} className="py-8 text-center text-gray-400">No fee records assigned.</td></tr>
                                            ) : (
                                                fees.filter(f => f.studentId === summary.student.uid).map(fee => (
                                                    <tr key={fee.id} className="hover:bg-blue-50/20">
                                                        <td className="py-3 pl-4">
                                                            <div className="font-medium text-[#0D2137]">{fee.title}</div>
                                                            <div className="text-xs text-gray-400 sm:hidden">{fee.dueDate}</div>
                                                            {fee.type === FeeType.BUS && (
                                                                <span className="text-[10px] text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-100 inline-block mt-1">Bus Service</span>
                                                            )}
                                                        </td>
                                                        <td className="py-3 text-gray-500 hidden sm:table-cell">{fee.dueDate}</td>
                                                        <td className="py-3 text-right font-medium">Rs. {fee.totalAmount.toLocaleString()}</td>
                                                        <td className="py-3 text-right text-green-600">Rs. {fee.paidAmount.toLocaleString()}</td>
                                                        <td className="py-3 text-center">
                                                            <span className={`
                                                                px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide
                                                                ${fee.status === 'Paid' ? 'bg-green-100 text-green-700' : ''}
                                                                ${fee.status === 'Partial' ? 'bg-yellow-100 text-yellow-700' : ''}
                                                                ${fee.status === 'Overdue' ? 'bg-red-100 text-red-700' : ''}
                                                                ${fee.status === 'Pending' ? 'bg-gray-100 text-gray-700' : ''}
                                                            `}>
                                                                {fee.status}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 pr-4 text-right">
                                                            {fee.status !== 'Paid' && (
                                                                <button 
                                                                    onClick={() => openPaymentModal(fee)}
                                                                    className="text-[#3EC7FF] hover:bg-[#3EC7FF]/10 px-3 py-1.5 rounded-lg transition-colors font-medium text-xs inline-flex items-center gap-1"
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

                            {/* SECTION 2: COLLAPSIBLE PAYMENT HISTORY */}
                            <details className="group bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                                <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 select-none transition-colors">
                                    <h4 className="font-bold text-[#0D2137] flex items-center gap-2 text-sm uppercase tracking-wider">
                                        <History size={16} className="text-[#3EC7FF]" />
                                        Payment History
                                    </h4>
                                    <div className="flex items-center gap-2 text-xs text-gray-400">
                                        <span>{payments.filter(p => p.studentId === summary.student.uid).length} Transactions</span>
                                        <ChevronDown className="transition-transform duration-300 group-open:rotate-180" size={16} />
                                    </div>
                                </summary>
                                
                                <div className="border-t border-gray-100">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm text-left">
                                            <thead className="text-gray-500 font-medium border-b border-gray-100 bg-gray-50/50">
                                                <tr>
                                                    <th className="py-3 pl-4">Date</th>
                                                    <th className="py-3">Amount</th>
                                                    <th className="py-3">Method</th>
                                                    <th className="py-3">Fee Reference</th>
                                                    <th className="py-3 pr-4 text-right">Recorded By</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {payments.filter(p => p.studentId === summary.student.uid).length === 0 ? (
                                                     <tr><td colSpan={5} className="py-6 text-center text-gray-400">No payments recorded.</td></tr>
                                                ) : (
                                                    payments
                                                        .filter(p => p.studentId === summary.student.uid)
                                                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                                        .map(payment => {
                                                            const relatedFee = fees.find(f => f.id === payment.feeId);
                                                            return (
                                                                <tr key={payment.id} className="hover:bg-blue-50/20">
                                                                    <td className="py-3 pl-4 text-gray-600">{payment.date}</td>
                                                                    <td className="py-3 font-bold text-green-600">Rs. {payment.amount.toLocaleString()}</td>
                                                                    <td className="py-3">
                                                                        <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-md text-xs border border-gray-200 flex items-center gap-2 w-fit">
                                                                            {getPaymentMethodIcon(payment.method)}
                                                                            {payment.method}
                                                                        </span>
                                                                    </td>
                                                                    <td className="py-3 text-gray-500 text-xs">
                                                                        {relatedFee ? relatedFee.title : 'Unknown Fee'}
                                                                    </td>
                                                                    <td className="py-3 pr-4 text-right text-gray-400 text-xs">
                                                                        {payment.recordedBy}
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </details>

                        </div>
                    )}
                </Card>
            ))}
          </div>
      )}

      {/* --- TAB 2: CONFIGURATION --- */}
      {activeTab === 'config' && (
          <div className="animate-fade-in grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* AUTO CALCULATOR PANEL */}
              <Card className="lg:col-span-1 bg-[#0D2137] text-white border-none">
                  <div className="flex flex-col items-center text-center p-4">
                      <div className="w-16 h-16 rounded-full bg-[#3EC7FF]/20 flex items-center justify-center mb-4 text-[#3EC7FF]">
                          <RefreshCw size={32} className={isGenerating ? 'animate-spin' : ''} />
                      </div>
                      <h3 className="text-xl font-bold mb-2">Monthly Invoice Generator</h3>
                      <p className="text-gray-300 text-sm mb-6">
                          Run this process to automatically generate fee invoices for all students based on the defined Fee Structures below.
                      </p>
                      
                      <div className="bg-white/10 p-4 rounded-xl w-full mb-6 text-left">
                          <div className="text-xs text-gray-400 uppercase font-bold mb-2">Current Cycle</div>
                          <div className="text-2xl font-bold text-[#3EC7FF]">
                              {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
                          </div>
                          <div className="text-xs text-gray-300 mt-1">Due Date: 5th of next month</div>
                      </div>

                      <Button 
                        className="w-full bg-[#3EC7FF] text-[#0D2137] hover:bg-[#2aaee0]" 
                        onClick={handleGenerateMonthlyFees}
                        isLoading={isGenerating}
                      >
                          <Play size={18} />
                          Run Batch Process
                      </Button>
                  </div>
              </Card>

              {/* FEE STRUCTURES LIST */}
              <div className="lg:col-span-2 space-y-6">
                  <div className="flex justify-between items-center">
                      <h3 className="text-lg font-bold text-[#0D2137]">Fee Structures</h3>
                      <Button onClick={() => setIsStructureModalOpen(true)} className="text-xs px-4 py-2 h-auto">
                          <Plus size={16} /> Add Rule
                      </Button>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                      {feeStructures.map((fs) => (
                          <div key={fs.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                              <div>
                                  <div className="flex items-center gap-2">
                                      <h4 className="font-bold text-[#0D2137]">{fs.title}</h4>
                                      <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded uppercase">{fs.type}</span>
                                  </div>
                                  <div className="text-sm text-gray-500 mt-1">
                                      Applies to: 
                                      <span className="font-medium text-gray-700 ml-1">
                                          {fs.targetClass === 'All' ? 'All Classes' : `Class ${fs.targetClass}`}
                                      </span>
                                      {fs.targetService !== 'None' && (
                                          <span className="ml-2 bg-blue-50 text-blue-600 px-2 py-0.5 rounded text-xs">
                                              +{fs.targetService} Users
                                          </span>
                                      )}
                                  </div>
                              </div>
                              <div className="text-right">
                                  <div className="text-lg font-bold text-[#0D2137]">Rs. {fs.amount.toLocaleString()}</div>
                                  <div className="text-xs text-gray-400 capitalize">{fs.frequency}</div>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      )}

      {/* Add Fee Modal (Manual) */}
      {isAddFeeOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-6">
                <h3 className="text-xl font-bold text-[#0D2137] mb-4">
                    {feeType === FeeType.BUS ? 'Assign Variable Bus Fee' : 'Assign Manual Fee'}
                </h3>
                <form onSubmit={handleAddFee} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Student</label>
                        <select 
                            className="w-full p-2 border border-gray-300 rounded-lg outline-none"
                            value={selectedStudentId}
                            onChange={(e) => setSelectedStudentId(e.target.value)}
                            required
                        >
                            <option value="">Select Student</option>
                            {students.map(s => <option key={s.uid} value={s.uid}>{s.name} ({s.class})</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Fee Type</label>
                            <select className="w-full p-2 border border-gray-300 rounded-lg outline-none" value={feeType} onChange={(e) => setFeeType(e.target.value as FeeType)}>
                                {Object.values(FeeType).map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Status</label>
                            <select 
                                className="w-full p-2 border border-gray-300 rounded-lg outline-none" 
                                value={feeStatus === 'Paid' ? 'Paid' : 'Pending'} 
                                onChange={(e) => setFeeStatus(e.target.value as FeeRecord['status'])}
                            >
                                <option value="Pending">Unpaid (Auto-calculate)</option>
                                <option value="Paid">Paid (Full Settlement)</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {feeType === FeeType.BUS ? 'Description / Stop Name' : 'Description'}
                        </label>
                        <input 
                            className="w-full p-2 border border-gray-300 rounded-lg outline-none" 
                            placeholder={feeType === FeeType.BUS ? "e.g. Bus Fee - Lakeside Stop" : "e.g. Late Fee"}
                            value={feeTitle} 
                            onChange={(e) => setFeeTitle(e.target.value)} 
                            required 
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {feeType === FeeType.BUS ? 'Amount (Based on Stop)' : 'Amount (Rs.)'}
                            </label>
                            <input type="number" className="w-full p-2 border border-gray-300 rounded-lg outline-none" placeholder="0.00" value={feeAmount} onChange={(e) => setFeeAmount(e.target.value)} required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                            <input type="date" className="w-full p-2 border border-gray-300 rounded-lg outline-none" value={feeDueDate} onChange={(e) => setFeeDueDate(e.target.value)} required />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <Button type="button" variant="secondary" onClick={() => setIsAddFeeOpen(false)}>Cancel</Button>
                        <Button type="submit">
                             {feeType === FeeType.BUS ? 'Assign Bus Fee' : 'Assign Fee'}
                        </Button>
                    </div>
                </form>
            </div>
          </div>
      )}

      {/* Add Fee Structure Modal */}
      {isStructureModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
              <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-6">
                  <h3 className="text-xl font-bold text-[#0D2137] mb-4">Create Recurring Fee Rule</h3>
                  <form onSubmit={handleAddStructure} className="space-y-4">
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Fee Title</label>
                          <input className="w-full p-2 border border-gray-300 rounded-lg outline-none" placeholder="e.g. Grade 8 Monthly Tuition" value={structTitle} onChange={(e) => setStructTitle(e.target.value)} required />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                              <select className="w-full p-2 border border-gray-300 rounded-lg outline-none" value={structType} onChange={(e) => setStructType(e.target.value as FeeType)}>
                                  {Object.values(FeeType).map(t => <option key={t} value={t}>{t}</option>)}
                              </select>
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Amount (Rs.)</label>
                              <input type="number" className="w-full p-2 border border-gray-300 rounded-lg outline-none" value={structAmount} onChange={(e) => setStructAmount(e.target.value)} required />
                          </div>
                      </div>
                      
                      <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                          <label className="block text-xs font-bold text-gray-400 uppercase mb-3">Eligibility Rules</label>
                          <div className="grid grid-cols-2 gap-4">
                              <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Target Class</label>
                                  <select className="w-full p-2 border border-gray-300 rounded-lg outline-none bg-white" value={structClass} onChange={(e) => setStructClass(e.target.value)}>
                                      <option value="All">All Classes</option>
                                      {[...Array(12)].map((_, i) => <option key={i} value={String(i + 1)}>Class {i + 1}</option>)}
                                  </select>
                              </div>
                              <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Service Required</label>
                                  <select className="w-full p-2 border border-gray-300 rounded-lg outline-none bg-white" value={structService} onChange={(e) => setStructService(e.target.value as any)}>
                                      <option value="None">None (All Students)</option>
                                      <option value="Bus">Bus Students Only</option>
                                      <option value="SchoolTiffin">School Tiffin Only</option>
                                  </select>
                              </div>
                          </div>
                      </div>

                      <div className="flex justify-end gap-3 pt-2">
                          <Button type="button" variant="secondary" onClick={() => setIsStructureModalOpen(false)}>Cancel</Button>
                          <Button type="submit">Save Rule</Button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      {/* Payment Modal */}
      {isPaymentOpen && selectedFee && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
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
                    {/* Payment Type Toggle */}
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
                        <Button type="button" variant="secondary" onClick={() => setIsPaymentOpen(false)}>Cancel</Button>
                        <Button type="submit" className="bg-green-600 hover:bg-green-700">Confirm Payment</Button>
                    </div>
                </form>
            </div>
          </div>
      )}
    </div>
  );
};
