


import { Role, type User, type Course, type AttendanceRecord, type Notification } from '../types';

/**
 * NOTE: In a real-world application, this service would use an API key 
 * and a Spreadsheet ID to fetch data directly from the Google Sheets API.
 * 
 * To avoid exposing API keys on the client-side, this file simulates that
 * network request by returning mock data asynchronously. The application code
 * is structured to handle this asynchronous nature, displaying a loading state.
 */

const USERS: User[] = [
  // Students with new password field
  { id: 's1', name: 'Alice Johnson', role: Role.Student, rollNumber: 'GMC-24-001', password: 'password' },
  { id: 's2', name: 'Bob Williams', role: Role.Student, rollNumber: 'GMC-24-002', password: 'password' },
  { id: 's3', name: 'Charlie Brown', role: Role.Student, rollNumber: 'GMC-24-003', password: 'password' },
  { id: 's4', name: 'Diana Miller', role: Role.Student, rollNumber: 'GMC-24-004', password: 'password' },
  
  // Single, hardcoded teacher account
  { 
    id: 't1', 
    name: 'Dr.Jibran Ali', 
    role: Role.Teacher, 
    username: 'jibu369', 
    password: 'mmmm',
    title: 'Head of Surgery Department',
    photoUrl: 'https://i.pravatar.cc/150?u=jibran',
    email: 'jibran.ali@gims.edu.pk',
    phone: '+92 300 9876543'
  },
];

const COURSES: Course[] = [
  { id: 'c1', name: 'Anatomy & Physiology', teacherId: 't1', studentIds: ['s1', 's2', 's3'] },
  { id: 'c2', name: 'Biochemistry', teacherId: 't1', studentIds: ['s1', 's4'] },
  { id: 'c3', name: 'Pharmacology', teacherId: 't1', studentIds: ['s2', 's3', 's4'] },
  { id: 'c4', name: 'Medical Ethics', teacherId: 't1', studentIds: ['s1', 's2', 's3', 's4'] },
];

const INITIAL_ATTENDANCE: AttendanceRecord[] = [
  // Course c1
  { id: 'att1', studentId: 's1', courseId: 'c1', date: '2024-05-01', present: true },
  { id: 'att2', studentId: 's1', courseId: 'c1', date: '2024-05-03', present: true },
  { id: 'att3', studentId: 's1', courseId: 'c1', date: '2024-05-06', present: false },
  { id: 'att4', studentId: 's1', courseId: 'c1', date: '2024-06-08', present: true },
  { id: 'att5', studentId: 's2', courseId: 'c1', date: '2024-05-01', present: true },
  { id: 'att6', studentId: 's2', courseId: 'c1', date: '2024-07-03', present: true },
  { id: 'att7', studentId: 's2', courseId: 'c1', date: '2024-07-06', present: true },
  { id: 'att8', studentId: 's2', courseId: 'c1', date: '2024-07-08', present: true },
  { id: 'att9', studentId: 's3', courseId: 'c1', date: '2024-06-01', present: true },
  { id: 'att10', studentId: 's3', courseId: 'c1', date: '2024-06-03', present: false },
  { id: 'att11', studentId: 's3', courseId: 'c1', date: '2024-07-06', present: false },
  { id: 'att12', studentId: 's3', courseId: 'c1', date: '2024-07-08', present: true },

  // Course c2
  { id: 'att13', studentId: 's1', courseId: 'c2', date: '2024-05-02', present: true },
  { id: 'att14', studentId: 's1', courseId: 'c2', date: '2024-06-07', present: true },
  { id: 'att15', studentId: 's4', courseId: 'c2', date: '2024-05-02', present: true },
  { id: 'att16', studentId: 's4', courseId: 'c2', date: '2024-06-07', present: false },

  // Course c3
  { id: 'att17', studentId: 's2', courseId: 'c3', date: '2024-07-02', present: true },
  { id: 'att18', studentId: 's3', courseId: 'c3', date: '2024-07-02', present: true },
  { id: 'att19', studentId: 's4', courseId: 'c3', date: '2024-07-02', present: true },
];

const NOTIFICATIONS: Notification[] = [
    { id: 'n1', teacherId: 't1', content: 'Reminder: Anatomy midterm is next Monday. Study hard!', date: new Date(Date.now() - 86400000).toISOString(), pinned: false },
    { 
      id: 'n2', 
      teacherId: 't1', 
      content: 'The lecture on Medical Ethics has been moved to Room 301. See attached schedule update.', 
      date: new Date().toISOString(),
      attachmentName: 'Updated_Schedule.pdf',
      attachmentUrl: 'data:application/pdf;base64,JVBERi0xLjQKJdPr6eEKMSAwIG9iago8PAovQ3JlYXRvciAoZm9wZGYpCi9Qcm9kdWNlciAoZm9wZGYpCj4+CmVuZG9iagozIDAgb2JqCjw8Ci9UeXBlIC9QYWdlCi9QYXJlbnQgMiAwIFIKL1Jlc291cmNlcyA1IDAgUgovQ29udGVudHMgNCAwIFIKPj4KZW5kb2JqCjIgMCBvYmoKPDwKL1R5cGUgL1BhZ2VzCi9LaWRzIFszIDAgUiBdCi9Db3VudCAxCj4+CmVuZG9iago1IDAgb2JqCjw8Ci9Gb250IDw8Ci9GMSA2IDAgUgo+PgovUHJvY1NldCBbL1BERiAvVGV4dCAvSW1hZ2VCIC9JbWFnZUMgL0ltYWdlSV0KPj4KZW5kb2JqCjYgMCBvYmoKPDwKL1R5cGUgL0ZvbnQKL1N1YnR5cGUgL1R5cGUxCi9CYXNlRm9udCAvSGVsdmV0aWNhCj4+CmVuZG9iago0IDAgb2JqCjw8IC9MZW5ndGggNzA+PgpzdHJlYW0KQlQKCjEgMCAwIDEgNTUgNzgwIFRtCjAgMCAwIHJnagovRjEgMTIgVGYKKEhlbGxvLCBXb3JsZCkpIFRqCgpFVAplbmRzdHJlYW0KZW5kb2JqCjcgMCBvYmoKPDwKL0RDb21wcmVzc2lvbkZpbHRlciAvQXNjaWk4NURlY29kZSAKL0dlbmVyYXRpb25HZW5lcmF0aW9uIDAKL0dlbmVyYXRpb25Ob3cgc2V0Ci9MZW5ndGggMTIKL1R5cGUgL1hPYmplY3QKL1N1YnR5cGUgL1hSLUZvcm0KPj4Kc3RyZWFtCnJgTVgjPyNUREYsZW5kc3RyZWFtCmVuZG9iago4IDAgb2JqCjw8Ci9EZWNvZGVQYXJtcyA8PAovS2V5cyBbCnRlc3QKXQovU3RyaW5ncyBbCih0aGlzIGlzIGEgdGVzdC4pCl0KPj4KL0xlbmd0aCA1OSAvUm9vdCAxMCAwIFIKPj4KZW5kb2JqCjkgMCBvYmoKPDwKL0ZpbHRlciAvRmxhdGVEZWNvZGUKL0kgWzEwMV0KL0xlbmd0aCAyOAovTyBbMTAzXQo+PgpzdHJlYW0KeJwr5HIK4TIydfNw9fB0A/EdgLicFdIKch1pBgDNA/8KZW5kc3RyZWFtCmVuZG9iagoxMCAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2JqCnhyZWYKMCAxMQowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMTUgMDAwMDAgbiAKMDAwMDAwMDE2MyAwMDAwMCBuIAowMDAwMDAwMDY4IDAwMDAwIG4gCjAwMDAwMDMyOTggMDAwMDAgbiAKMDAwMDAwMDEzMSAwMDAwMCBuIAowMDAwMDAwMjMwIDAwMDAwIG4gCjAwMDAwMDM3NSAwMDAwMCBuIAowMDAwMDA0NzQgMDAwMDAgbiAKMDAwMDAwNTkwIDAwMDAwIG4gCjAwMDAwMDY1MSAwMDAwMCBuIAp0cmFpbGVyCjw8Ci9TaXplIDExCi9Sb290IDEwIDAgUgo+PgpzdGFydHhyZWYKNzQ4CiUlRU9GCg==', // Placeholder Data URL for a dummy PDF
      pinned: true,
    },
];

const LOGO_URL = 'https://imgs.search.brave.com/l-bTZCMhJZN8-r6wQtgHBcRBU0udJscr3sFiB3wovVU/rs:fit:860:0:0:0/g:ce/aHR0cDovL3d3dy5n/aW1zLmVkdS5way9p/bWFnZXMvbG9nbzEu/cG5n';

interface AppData {
  users: User[];
  courses: Course[];
  attendance: AttendanceRecord[];
  notifications: Notification[];
  logoUrl: string;
}

export const fetchData = (): Promise<AppData> => {
  console.log("Simulating fetch from Google Sheets...");
  // Simulate a network delay
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({
        users: USERS,
        courses: COURSES,
        attendance: INITIAL_ATTENDANCE,
        notifications: NOTIFICATIONS,
        logoUrl: LOGO_URL
      });
       console.log("...data loaded.");
    }, 1500);
  });
};