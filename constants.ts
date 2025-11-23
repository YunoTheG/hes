
import { FeeRecord, FeeType, User, UserRole, Assignment, NewsItem, LogEntry, PaymentTransaction, FeeStructure } from './types';

export const COLORS = {
  cream: '#FFF9E8',
  skyBlue: '#3EC7FF',
  darkText: '#0D2137',
  primaryHover: '#2aaee0',
  white: '#FFFFFF',
  error: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B'
};

export const MOCK_USERS: User[] = [
  {
    uid: 'admin1',
    name: 'Accounts Officer',
    email: 'accounts@hes.edu.np',
    role: UserRole.ADMIN, // Accountant
    designation: 'Finance Dept',
    photoURL: 'https://ui-avatars.com/api/?name=Accounts+Officer&background=3EC7FF&color=fff'
  },
  {
    uid: 'superadmin1',
    name: 'School Administrator',
    email: 'admin@hes.edu.np',
    role: UserRole.SUPER_ADMIN, // Full Access
    designation: 'Principal Office',
    photoURL: 'https://ui-avatars.com/api/?name=School+Admin&background=0D2137&color=fff'
  },
  {
    uid: 'u1',
    name: 'Aarav Sharma',
    role: UserRole.STUDENT,
    class: '10',
    section: 'A',
    studentID: 'HES-2023-001',
    registrationNumber: 'REG-88291',
    joinedYear: '2075',
    dob: '2008-05-12',
    address: 'Lakeside, Pokhara-6',
    parentName: 'Hari Sharma',
    parentPhone: '9841000001',
    emergencyContact: '9800000001',
    isBusStudent: true,
    busRoute: 'Route 5 (Lakeside)',
    tiffinType: 'SCHOOL',
    photoURL: 'https://picsum.photos/200/200?random=1',
    admissionDate: '2075-01-15'
  },
  {
    uid: 'u2',
    name: 'Bina Tamang',
    role: UserRole.STUDENT,
    class: '10',
    section: 'B',
    studentID: 'HES-2023-002',
    registrationNumber: 'REG-88292',
    joinedYear: '2076',
    dob: '2008-08-22',
    address: 'Matepani, Pokhara-12',
    parentName: 'Ram Tamang',
    parentPhone: '9841000002',
    emergencyContact: '9800000002',
    isBusStudent: false,
    tiffinType: 'HOME',
    photoURL: 'https://picsum.photos/200/200?random=2',
    admissionDate: '2076-02-10'
  },
  {
    uid: 'u3',
    name: 'Charlie Gurung',
    role: UserRole.STUDENT,
    class: '9',
    section: 'A',
    studentID: 'HES-2023-003',
    registrationNumber: 'REG-99100',
    joinedYear: '2078',
    dob: '2009-01-10',
    address: 'Chipledhunga, Pokhara-4',
    parentName: 'Sita Gurung',
    parentPhone: '9841000003',
    emergencyContact: '9800000003',
    isBusStudent: true,
    busRoute: 'Route 2 (Chipledhunga)',
    tiffinType: 'SCHOOL',
    photoURL: 'https://picsum.photos/200/200?random=3',
    admissionDate: '2078-01-20'
  },
  {
    uid: 'u4',
    name: 'Deepa Magar',
    role: UserRole.STUDENT,
    class: 'Unassigned',
    section: '',
    studentID: 'HES-2023-004',
    registrationNumber: 'REG-NEW-001',
    joinedYear: '2081',
    dob: '2009-11-05',
    address: 'Parsyang, Pokhara-5',
    parentName: 'Bishnu Magar',
    parentPhone: '9841000004',
    emergencyContact: '9800000004',
    isBusStudent: false,
    tiffinType: 'HOME',
    photoURL: 'https://picsum.photos/200/200?random=4',
    admissionDate: '2081-01-05'
  }
];

export const MOCK_FEE_STRUCTURES: FeeStructure[] = [
  {
    id: 'fs1',
    title: 'Secondary Tuition (Grade 10)',
    amount: 5000,
    type: FeeType.TUITION,
    frequency: 'Monthly',
    targetClass: '10',
    targetService: 'None'
  },
  {
    id: 'fs2',
    title: 'Secondary Tuition (Grade 9)',
    amount: 4500,
    type: FeeType.TUITION,
    frequency: 'Monthly',
    targetClass: '9',
    targetService: 'None'
  },
  {
    id: 'fs3',
    title: 'Bus Service Fee',
    amount: 1500,
    type: FeeType.BUS,
    frequency: 'Monthly',
    targetClass: 'All',
    targetService: 'Bus'
  },
  {
    id: 'fs4',
    title: 'School Lunch Package',
    amount: 2000,
    type: FeeType.PACKAGE,
    frequency: 'Monthly',
    targetClass: 'All',
    targetService: 'SchoolTiffin'
  }
];

export const MOCK_FEES: FeeRecord[] = [
  {
    id: 'f1',
    studentId: 'u1',
    title: 'Term 1 Tuition',
    type: FeeType.TUITION,
    totalAmount: 15000,
    paidAmount: 15000,
    dueDate: '2024-04-15',
    status: 'Paid',
    issuedDate: '2024-03-15'
  },
  {
    id: 'f2',
    studentId: 'u1',
    title: 'Bus Service (Month 1)',
    type: FeeType.BUS,
    totalAmount: 3000,
    paidAmount: 0,
    dueDate: '2024-05-01',
    status: 'Overdue',
    issuedDate: '2024-04-01'
  },
  {
    id: 'f3',
    studentId: 'u2',
    title: 'Term 1 Tuition',
    type: FeeType.TUITION,
    totalAmount: 15000,
    paidAmount: 10000,
    dueDate: '2024-04-15',
    status: 'Partial',
    issuedDate: '2024-03-15'
  },
  {
    id: 'f4',
    studentId: 'u3',
    title: 'Admission Fee',
    type: FeeType.ADMISSION,
    totalAmount: 25000,
    paidAmount: 25000,
    dueDate: '2024-01-15',
    status: 'Paid',
    issuedDate: '2024-01-01'
  }
];

export const MOCK_PAYMENTS: PaymentTransaction[] = [
  {
    id: 'p1',
    feeId: 'f1',
    studentId: 'u1',
    amount: 15000,
    date: '2024-04-10',
    method: 'Bank Transfer',
    recordedBy: 'Accounts Officer'
  },
  {
    id: 'p2',
    feeId: 'f3',
    studentId: 'u2',
    amount: 5000,
    date: '2024-04-01',
    method: 'Cash',
    recordedBy: 'Accounts Officer'
  },
  {
    id: 'p3',
    feeId: 'f3',
    studentId: 'u2',
    amount: 5000,
    date: '2024-04-15',
    method: 'Online',
    recordedBy: 'Accounts Officer'
  },
  {
    id: 'p4',
    feeId: 'f4',
    studentId: 'u3',
    amount: 25000,
    date: '2024-01-10',
    method: 'Cheque',
    recordedBy: 'Accounts Officer'
  }
];

export const MOCK_ASSIGNMENTS: Assignment[] = [
  {
    id: 'a1',
    title: 'Algebra: Chapter 5 Exercises',
    description: 'Complete exercises 5.1 to 5.3 from the textbook.',
    subject: 'Mathematics',
    classTarget: '10',
    dueDate: '2024-05-20T00:00:00Z',
    createdBy: 'Teacher Math',
    completedBy: ['u1']
  },
  {
    id: 'a2',
    title: 'Physics Lab Report: Optics',
    description: 'Submit the lab report for the lens experiment.',
    subject: 'Science',
    classTarget: '10',
    dueDate: '2024-05-22T00:00:00Z',
    createdBy: 'Teacher Physics',
    completedBy: []
  }
];

export const MOCK_NEWS: NewsItem[] = [
  {
    id: 'n1',
    title: 'Annual Sports Day',
    body: 'The annual sports day will be held on Friday. All students must wear house uniforms.',
    imageURL: 'https://picsum.photos/800/400?random=10',
    type: 'event',
    postedAt: '2024-05-10T09:00:00Z',
    postedBy: 'Principal'
  },
  {
    id: 'n2',
    title: 'Exam Schedule Released',
    body: 'The final term examination schedule has been published on the notice board.',
    imageURL: 'https://picsum.photos/800/400?random=11',
    type: 'notice',
    postedAt: '2024-05-12T10:00:00Z',
    postedBy: 'Admin'
  }
];

export const INITIAL_GALLERY = [
  { id: 1, imageURL: 'https://picsum.photos/400/300?random=20', caption: 'Science Exhibition 2024', uploadedAt: '2 days ago' },
  { id: 2, imageURL: 'https://picsum.photos/400/300?random=21', caption: 'Inter-House Football', uploadedAt: '1 week ago' },
  { id: 3, imageURL: 'https://picsum.photos/400/300?random=22', caption: 'Cultural Dance Program', uploadedAt: '2 weeks ago' },
  { id: 4, imageURL: 'https://picsum.photos/400/300?random=23', caption: 'Class 10 Farewell', uploadedAt: '1 month ago' },
  { id: 5, imageURL: 'https://picsum.photos/400/300?random=24', caption: 'School Picnic', uploadedAt: '1 month ago' },
];

export const STAFF_DIRECTORY = [
  { id: 1, name: 'Ramesh Karki', designation: 'Principal', email: 'principal@hes.edu.np', photoURL: 'https://ui-avatars.com/api/?name=Ramesh+Karki&background=random' },
  { id: 2, name: 'Sita Sharma', designation: 'Vice Principal', email: 'viceprincipal@hes.edu.np', photoURL: 'https://ui-avatars.com/api/?name=Sita+Sharma&background=random' },
  { id: 3, name: 'Hari Prasad', designation: 'Senior Accountant', email: 'accounts@hes.edu.np', photoURL: 'https://ui-avatars.com/api/?name=Hari+Prasad&background=random' },
  { id: 4, name: 'Gita Rai', designation: 'Admin Officer', email: 'admin@hes.edu.np', photoURL: 'https://ui-avatars.com/api/?name=Gita+Rai&background=random' },
  { id: 5, name: 'Nabin Shrestha', designation: 'IT Coordinator', email: 'it@hes.edu.np', photoURL: 'https://ui-avatars.com/api/?name=Nabin+Shrestha&background=random' },
];

export const MOCK_LOGS: LogEntry[] = [
  {
    id: 'l1',
    action: 'SYSTEM_START',
    description: 'System initialized successfully',
    adminName: 'System',
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    details: 'v1.0.0 Deployment'
  },
  {
    id: 'l2',
    action: 'FEE_ASSIGN',
    description: 'Assigned Term 1 Tuition to Aarav Sharma',
    adminName: 'Accounts Officer',
    timestamp: new Date(Date.now() - 43200000).toISOString(),
    details: 'Amount: Rs. 15000',
    studentId: 'u1'
  }
];