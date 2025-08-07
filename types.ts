

export enum Role {
  Student = 'student',
  Teacher = 'teacher',
}

export interface Course {
  id: string;
  name: string;
  teacherId: string;
  studentIds: string[];
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  courseId: string;
  date: string; // YYYY-MM-DD
  present: boolean;
}

export interface Student {
  id: string;
  name: string;
  role: Role.Student;
  rollNumber: string;
  password: string; // NOTE: In a real app, this should be a securely stored hash.
}

export interface Teacher {
  id:string;
  name: string;
  role: Role.Teacher;
  username: string;
  password: string; // NOTE: In a real app, this should be a securely stored hash.
  title?: string;
  photoUrl?: string;
  email?: string;
  phone?: string;
}

export type User = Student | Teacher;

export interface Notification {
  id: string;
  teacherId: string;
  content: string;
  date: string; // ISO 8601 format
  attachmentName?: string;
  attachmentUrl?: string;
  pinned?: boolean;
}