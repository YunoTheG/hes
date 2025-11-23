
export enum UserRole {
  STUDENT = 'student', // Kept for data structure, but app is for Admins
  ADMIN = 'admin', // School Officer
  SUPER_ADMIN = 'superadmin'
}

export interface User {
  uid: string;
  name: string;
  email?: string; // Added for User Management
  role: UserRole;
  class?: string; // For students
  section?: string;
  studentID?: string;
  photoURL?: string;
  designation?: string; // For staff
  
  // Extended Student Details
  parentName?: string;
  parentPhone?: string;
  emergencyContact?: string;
  dob?: string; // Date of Birth
  address?: string;
  
  // Academic & Admin Details
  registrationNumber?: string; // Unique Govt Reg No
  admissionDate?: string;
  joinedYear?: string;
  
  // Services
  isBusStudent?: boolean;
  busRoute?: string;
  tiffinType?: 'SCHOOL' | 'HOME';
}

export interface SystemSettings {
  schoolName: string;
  address: string;
  phone: string;
  currentSession: string; // e.g., "2081"
  isDeviceLockEnabled: boolean;
  allowTeacherLogin: boolean;
  maintenanceMode: boolean;
}

export enum FeeType {
  TUITION = 'Tuition',
  BUS = 'Bus Fee', // Specific type for manual bus entries
  PACKAGE = 'School Package', // Lunch, etc.
  EXAM = 'Exam Fee',
  ADMISSION = 'Admission',
  OTHER = 'Other'
}

export interface FeeStructure {
  id: string;
  title: string; // e.g., "Secondary Level Tuition", "Bus Route 1"
  amount: number;
  type: FeeType;
  frequency: 'Monthly' | 'Yearly' | 'OneTime';
  
  // Eligibility Criteria
  targetClass?: string | 'All'; // Specific class or all
  targetService?: 'None' | 'Bus' | 'SchoolTiffin'; // Only applies if student has this service
}

export interface FeeRecord {
  id: string;
  studentId: string;
  title: string; // e.g. "Grade 10 Tuition - Term 1"
  type: FeeType;
  totalAmount: number;
  paidAmount: number;
  dueDate: string;
  status: 'Paid' | 'Partial' | 'Overdue' | 'Pending';
  issuedDate: string;
}

export type PaymentMethod = 'Cash' | 'Bank Transfer' | 'Cheque' | 'Online';

export interface PaymentTransaction {
  id: string;
  feeId: string;
  studentId: string;
  amount: number;
  date: string;
  method: PaymentMethod;
  recordedBy: string;
}

export interface Assignment {
  id: string;
  title: string;
  description: string;
  subject: string;
  classTarget: string;
  dueDate: string;
  createdBy: string;
  completedBy: string[]; // Array of student UIDs
}

export interface NewsItem {
  id: string;
  title: string;
  body: string;
  imageURL: string;
  type: 'event' | 'notice' | 'achievement';
  postedAt: string;
  postedBy: string;
}

export interface LogEntry {
  id: string;
  action: string; // e.g., 'FEE_ASSIGN', 'PAYMENT_RECORD', 'STUDENT_UPDATE'
  description: string;
  adminName: string;
  timestamp: string;
  details?: string;
  studentId?: string; // Added for filtering logs by student
}

// Helper for aggregating data
export interface StudentFinancialSummary {
  student: User;
  totalFees: number;
  totalPaid: number;
  totalDue: number;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}