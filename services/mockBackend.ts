
import { User, UserRole, FeeRecord, FeeType, Assignment, NewsItem, LogEntry, PaymentTransaction, PaymentMethod, FeeStructure, SystemSettings } from '../types';
import { MOCK_USERS, MOCK_FEES, MOCK_ASSIGNMENTS, MOCK_NEWS, MOCK_LOGS, MOCK_PAYMENTS, MOCK_FEE_STRUCTURES } from '../constants';

let users = [...MOCK_USERS];
let fees = [...MOCK_FEES];
let payments = [...MOCK_PAYMENTS];
let feeStructures = [...MOCK_FEE_STRUCTURES];
let assignments = [...(MOCK_ASSIGNMENTS as Assignment[])];
let news = [...(MOCK_NEWS as NewsItem[])];
let logs = [...MOCK_LOGS];

let settings: SystemSettings = {
  schoolName: 'Himalayan English School',
  address: 'Pokhara-5, Nepal',
  phone: '061-520000',
  currentSession: '2081',
  isDeviceLockEnabled: true,
  allowTeacherLogin: true,
  maintenanceMode: false
};

// Simple variable to track current logged-in user for logging purposes
let currentAdminName = 'System'; 

const activeSessions: Record<string, string> = {};

const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Helper to add log
const addLog = (action: string, description: string, details: string = '', studentId?: string) => {
  const newLog: LogEntry = {
    id: generateUUID(),
    action,
    description,
    details,
    timestamp: new Date().toISOString(),
    adminName: currentAdminName,
    studentId
  };
  logs = [newLog, ...logs];
};

// Helper to determine status based on date and amount
const calculateStatus = (total: number, paid: number, dueDate: string): FeeRecord['status'] => {
    if (paid >= total) return 'Paid';
    
    const today = new Date().toISOString().split('T')[0];
    if (today > dueDate) return 'Overdue';
    
    if (paid > 0) return 'Partial';
    return 'Pending';
};

export const MockBackend = {
  login: async (email: string, password: string): Promise<{ user: User; deviceId: string }> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Mock Validation
        const user = users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
        
        if (!user) {
            reject(new Error('User not found'));
            return;
        }

        // Check password (Hardcoded mock for all users)
        if (password !== 'password123') {
            reject(new Error('Invalid credentials'));
            return;
        }

        // Check if user is allowed to login (e.g., Student vs Admin)
        if (user.role === UserRole.STUDENT) {
             reject(new Error('Student portal is currently disabled.'));
             return;
        }
        
        currentAdminName = user.name;
        
        const newDeviceId = generateUUID();
        activeSessions[user.uid] = newDeviceId;
        
        addLog('LOGIN', `User ${user.name} logged in`, `Role: ${user.role}, Device: ${newDeviceId}`);
        
        resolve({ user, deviceId: newDeviceId });
      }, 1000);
    });
  },

  // Helper to re-fetch user by ID (for session restoration)
  getUserById: async (uid: string): Promise<User | null> => {
      return new Promise(resolve => {
          const user = users.find(u => u.uid === uid);
          if (user) currentAdminName = user.name;
          resolve(user || null);
      })
  },

  validateSession: async (uid: string, deviceId: string): Promise<boolean> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            const isValid = activeSessions[uid] === deviceId;
            resolve(isValid);
        }, 300);
    });
  },

  getSystemSettings: async (): Promise<SystemSettings> => {
    return new Promise(resolve => setTimeout(() => resolve({...settings}), 400));
  },

  updateSystemSettings: async (newSettings: SystemSettings): Promise<void> => {
    return new Promise(resolve => {
        settings = newSettings;
        addLog('SETTINGS_UPDATE', 'System configuration updated', `Session: ${settings.currentSession}, Lock: ${settings.isDeviceLockEnabled}`);
        setTimeout(resolve, 400);
    });
  },

  getStudents: async (): Promise<User[]> => {
    return new Promise(resolve => setTimeout(() => resolve(users.filter(u => u.role === UserRole.STUDENT)), 400));
  },

  getAdmins: async (): Promise<User[]> => {
    return new Promise(resolve => setTimeout(() => resolve(users.filter(u => u.role === UserRole.ADMIN || u.role === UserRole.SUPER_ADMIN)), 400));
  },

  addStudent: async (studentData: Partial<User>): Promise<User> => {
    return new Promise(resolve => {
        const newStudent: User = {
            uid: generateUUID(),
            role: UserRole.STUDENT,
            name: studentData.name || 'New Student',
            class: studentData.class || 'Unassigned',
            section: studentData.section || '',
            studentID: studentData.studentID || `HES-${new Date().getFullYear()}-${Math.floor(Math.random()*1000)}`,
            photoURL: `https://ui-avatars.com/api/?name=${encodeURIComponent(studentData.name || 'User')}&background=random`,
            admissionDate: new Date().toISOString().split('T')[0],
            ...studentData
        };
        users = [newStudent, ...users];
        addLog('STUDENT_CREATE', `Admitted new student: ${newStudent.name}`, `Class: ${newStudent.class}`, newStudent.uid);
        setTimeout(() => resolve(newStudent), 400);
    });
  },

  addAdmin: async (adminData: Partial<User>): Promise<User> => {
    return new Promise(resolve => {
        const newAdmin: User = {
            uid: generateUUID(),
            role: adminData.role || UserRole.ADMIN,
            name: adminData.name || 'New Admin',
            email: adminData.email || 'admin@hes.edu.np',
            designation: adminData.designation || 'Staff',
            photoURL: `https://ui-avatars.com/api/?name=${encodeURIComponent(adminData.name || 'Admin')}&background=random`,
            ...adminData
        };
        users = [newAdmin, ...users];
        addLog('USER_CREATE', `Created new admin user: ${newAdmin.name}`, `Role: ${newAdmin.role}`);
        setTimeout(() => resolve(newAdmin), 400);
    });
  },

  deleteUser: async (uid: string): Promise<void> => {
    return new Promise(resolve => {
        const user = users.find(u => u.uid === uid);
        users = users.filter(u => u.uid !== uid);
        if (user) {
            addLog('USER_DELETE', `Deleted user account: ${user.name}`, `Role: ${user.role}`);
        }
        setTimeout(resolve, 400);
    });
  },

  updateStudent: async (uid: string, updatedData: Partial<User>): Promise<void> => {
    return new Promise(resolve => {
      const studentIndex = users.findIndex(u => u.uid === uid);
      if (studentIndex > -1) {
          const oldData = users[studentIndex];
          users[studentIndex] = { ...oldData, ...updatedData };
          
          let changeDesc = '';
          if (updatedData.class && updatedData.class !== oldData.class) changeDesc += `Class: ${oldData.class} -> ${updatedData.class}. `;
          if (updatedData.isBusStudent !== undefined && updatedData.isBusStudent !== oldData.isBusStudent) changeDesc += `Bus: ${updatedData.isBusStudent ? 'Enabled' : 'Disabled'}. `;
          
          addLog('STUDENT_UPDATE', `Updated profile for ${users[studentIndex].name}`, changeDesc || 'General details update', uid);
      }
      
      // Re-map global users array
      users = users.map(u => u.uid === uid ? { ...u, ...updatedData } : u);
      setTimeout(resolve, 400);
    });
  },

  updateProfile: async (uid: string, updatedData: Partial<User>): Promise<User> => {
      return new Promise(resolve => {
          const idx = users.findIndex(u => u.uid === uid);
          if (idx > -1) {
              users[idx] = { ...users[idx], ...updatedData };
              addLog('PROFILE_UPDATE', `User updated own profile: ${users[idx].name}`, '');
              resolve(users[idx]);
          } else {
             // fallback
             resolve(updatedData as User);
          }
      });
  },

  getFees: async (): Promise<FeeRecord[]> => {
    return new Promise(resolve => {
        // Automatically update statuses based on current date when fetching
        fees = fees.map(f => {
            const correctStatus = calculateStatus(f.totalAmount, f.paidAmount, f.dueDate);
            if (f.status !== correctStatus) {
                return { ...f, status: correctStatus };
            }
            return f;
        });
        setTimeout(() => resolve([...fees]), 400);
    });
  },

  getFeeStructures: async (): Promise<FeeStructure[]> => {
    return new Promise(resolve => setTimeout(() => resolve([...feeStructures]), 400));
  },

  addFeeStructure: async (structure: FeeStructure): Promise<FeeStructure> => {
    return new Promise(resolve => {
        feeStructures = [...feeStructures, structure];
        addLog('CONFIG_UPDATE', `Added new Fee Structure: ${structure.title}`, `Amount: ${structure.amount}`);
        setTimeout(() => resolve(structure), 400);
    });
  },

  // Automated logic to calculate monthly fees
  generateMonthlyFees: async (year: number, monthIndex: number): Promise<number> => {
    return new Promise(resolve => {
        const students = users.filter(u => u.role === UserRole.STUDENT);
        const monthName = new Date(year, monthIndex).toLocaleString('default', { month: 'long' });
        let count = 0;
        
        // Due date is 5th of next month
        const dueDate = new Date(year, monthIndex + 1, 5).toISOString().split('T')[0];

        students.forEach(student => {
            feeStructures.forEach(struct => {
                // 1. Check Class Eligibility
                if (struct.targetClass !== 'All' && struct.targetClass !== student.class) return;

                // 2. Check Service Eligibility
                if (struct.targetService === 'Bus' && !student.isBusStudent) return;
                if (struct.targetService === 'SchoolTiffin' && student.tiffinType !== 'SCHOOL') return;

                // 3. Check Duplicates (Don't bill twice for same month)
                const existing = fees.find(f => 
                    f.studentId === student.uid && 
                    f.title.includes(`${monthName} ${year}`) && 
                    f.title.includes(struct.title)
                );
                if (existing) return;

                // 4. Generate Fee
                const initialStatus = calculateStatus(struct.amount, 0, dueDate);

                const newFee: FeeRecord = {
                    id: generateUUID(),
                    studentId: student.uid,
                    title: `${struct.title} - ${monthName} ${year}`,
                    type: struct.type,
                    totalAmount: struct.amount,
                    paidAmount: 0,
                    dueDate: dueDate,
                    status: initialStatus,
                    issuedDate: new Date().toISOString().split('T')[0]
                };
                fees = [newFee, ...fees];
                count++;
            });
        });

        if (count > 0) {
            addLog('BATCH_PROCESS', `Generated ${count} fees for ${monthName} ${year}`, 'Automatic Calculation');
        }
        setTimeout(() => resolve(count), 600);
    });
  },

  getPayments: async (): Promise<PaymentTransaction[]> => {
    return new Promise(resolve => setTimeout(() => resolve([...payments]), 400));
  },

  addFee: async (fee: FeeRecord): Promise<FeeRecord> => {
    return new Promise(resolve => {
      // Ensure status logic is applied on creation (e.g. backdated fees are Overdue)
      const correctStatus = calculateStatus(fee.totalAmount, fee.paidAmount, fee.dueDate);
      const newFee = { ...fee, status: correctStatus };
      
      fees = [newFee, ...fees];
      const student = users.find(u => u.uid === fee.studentId);
      const studentName = student ? student.name : 'Unknown Student';
      addLog('FEE_ASSIGN', `Assigned fee: ${fee.title}`, `Student: ${studentName}, Amount: Rs. ${fee.totalAmount}`, fee.studentId);
      setTimeout(() => resolve(newFee), 400);
    });
  },

  recordPayment: async (feeId: string, amount: number, method: PaymentMethod): Promise<void> => {
    return new Promise(resolve => {
      let feeTitle = '';
      let studentId = '';

      // Update Fee Record
      fees = fees.map(f => {
        if (f.id === feeId) {
          feeTitle = f.title;
          studentId = f.studentId;
          
          // Ensure paidAmount doesn't exceed totalAmount
          const newPaid = Math.min(f.paidAmount + amount, f.totalAmount);
          const newStatus = calculateStatus(f.totalAmount, newPaid, f.dueDate);
          
          return { ...f, paidAmount: newPaid, status: newStatus };
        }
        return f;
      });

      // Create Payment Transaction Record
      const newPayment: PaymentTransaction = {
        id: generateUUID(),
        feeId,
        studentId,
        amount,
        date: new Date().toISOString().split('T')[0],
        method: method,
        recordedBy: currentAdminName
      };
      payments = [newPayment, ...payments];

      const student = users.find(u => u.uid === studentId);
      addLog('PAYMENT_RECORD', `Recorded payment of Rs. ${amount} via ${method}`, `Fee: ${feeTitle}, Student: ${student?.name}`, studentId);

      setTimeout(resolve, 400);
    });
  },

  getAssignments: async (): Promise<Assignment[]> => {
    return new Promise(resolve => setTimeout(() => resolve([...assignments]), 400));
  },

  addAssignment: async (assignment: Assignment): Promise<Assignment> => {
    return new Promise(resolve => {
      assignments = [assignment, ...assignments];
      addLog('ASSIGNMENT_CREATE', `Created assignment: ${assignment.title}`, `Subject: ${assignment.subject}`);
      setTimeout(() => resolve(assignment), 400);
    });
  },

  deleteAssignment: async (id: string): Promise<void> => {
    return new Promise(resolve => {
      const assignment = assignments.find(a => a.id === id);
      assignments = assignments.filter(a => a.id !== id);
      if (assignment) {
         addLog('ASSIGNMENT_DELETE', `Deleted assignment: ${assignment.title}`, `ID: ${id}`);
      }
      setTimeout(resolve, 400);
    });
  },

  toggleAssignmentCompletion: async (id: string, uid: string): Promise<void> => {
    return new Promise(resolve => {
      assignments = assignments.map(a => {
        if (a.id === id) {
            const isCompleted = a.completedBy.includes(uid);
            const newCompletedBy = isCompleted 
                ? a.completedBy.filter(u => u !== uid)
                : [...a.completedBy, uid];
            return { ...a, completedBy: newCompletedBy };
        }
        return a;
      });
      setTimeout(resolve, 400);
    });
  },

  getNews: async (): Promise<NewsItem[]> => {
    return new Promise(resolve => setTimeout(() => resolve([...news]), 400));
  },

  getLogs: async (): Promise<LogEntry[]> => {
    return new Promise(resolve => setTimeout(() => resolve([...logs]), 400));
  }
};
