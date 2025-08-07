import React, { useState, useEffect, useMemo } from 'react';
import type { Teacher, Student, AttendanceRecord, User, Course, Notification } from './types';
import { Role } from './types';
import { fetchData } from './services/googleSheetsService';
import Header from './components/Header';
import StudentDashboard from './components/StudentDashboard';
import TeacherDashboard from './components/TeacherDashboard';
import Login from './components/Login';
import Card from './components/common/Card';
import Button from './components/common/Button';
import { useTheme } from './contexts/ThemeContext';
import { useNotification } from './contexts/NotificationContext';
import ToastContainer from './components/common/Toast';

const App: React.FC = () => {
  const [hasSeenWelcome, setHasSeenWelcome] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  const [users, setUsers] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [logoUrl, setLogoUrl] = useState<string>('');
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { theme } = useTheme();
  const { addNotification } = useNotification();

   useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const { users, courses, attendance, notifications, logoUrl } = await fetchData();
        setUsers(users);
        setCourses(courses);
        setAttendanceRecords(attendance);
        setNotifications(notifications);
        setLogoUrl(logoUrl);
        setError(null);
      } catch (e) {
        setError('Failed to load application data. Please try again later.');
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
  };
  
  const handleLogout = () => {
    addNotification({ message: 'You have been logged out.', type: 'info'});
    setCurrentUser(null);
    setHasSeenWelcome(true); // Go back to login, not welcome
  };
  
  const handleUpdateAttendance = (updatedRecords: AttendanceRecord[], updatedCount: number, newCount: number) => {
    setAttendanceRecords(prevRecords => {
      const updatedIds = new Set(updatedRecords.map(r => r.id));
      const otherRecords = prevRecords.filter(r => !updatedIds.has(r.id));
      return [...otherRecords, ...updatedRecords];
    });
     let message = 'Attendance saved! ';
    if (newCount > 0) message += `${newCount} new record(s) created. `;
    if (updatedCount > 0) message += `${updatedCount} existing record(s) updated.`;
    addNotification({ message: message.trim(), type: 'success' });
  };

  const handleAddNotification = (content: string, pinned: boolean, attachment?: { name: string; url: string }) => {
    if (!currentUser || currentUser.role !== Role.Teacher) return;
    const newNotification: Notification = {
      id: `notif-${Date.now()}`,
      teacherId: currentUser.id,
      content,
      date: new Date().toISOString(),
      pinned,
      ...(attachment && { attachmentName: attachment.name, attachmentUrl: attachment.url })
    };
    setNotifications(prev => [newNotification, ...prev]);
    addNotification({ message: 'Notification posted!', type: 'success' });
  };

  const handleEditNotification = (updatedNotification: Notification) => {
    setNotifications(prev => prev.map(n => n.id === updatedNotification.id ? updatedNotification : n));
    addNotification({ message: 'Notification updated.', type: 'success' });
  };

  const handleDeleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    addNotification({ message: 'Notification deleted.', type: 'success' });
  };
  
  const handleUpdateStaff = (updatedUsers: User[]) => {
      const updatedStaff = updatedUsers.filter(u => u.role === Role.Teacher);
      const currentStudents = users.filter(u => u.role === Role.Student);
      setUsers([...currentStudents, ...updatedStaff]);
      
      const self = updatedUsers.find(u => u.id === currentUser?.id);
      if(self) {
          setCurrentUser(self);
      }
      addNotification({ message: 'Staff list updated.', type: 'success' });
  };
  
  const handleAddStudent = (newStudent: Student): boolean => {
    if (users.some(u => u.role === Role.Student && u.rollNumber.toLowerCase() === newStudent.rollNumber.toLowerCase())) {
        addNotification({ message: 'A student with this roll number already exists.', type: 'error' });
        return false;
    }
    setUsers(prev => [...prev, newStudent]);
    addNotification({ message: `Student "${newStudent.name}" successfully registered.`, type: 'success' });
    return true;
  };
  
  const handleEditStudent = (updatedStudent: Student): boolean => {
    if (users.some(u => u.id !== updatedStudent.id && u.role === Role.Student && u.rollNumber.toLowerCase() === updatedStudent.rollNumber.toLowerCase())) {
        addNotification({ message: 'Another student with this roll number already exists.', type: 'error' });
        return false;
    }
    setUsers(prev => prev.map(u => u.id === updatedStudent.id ? updatedStudent : u));
    addNotification({ message: `Student profile for ${updatedStudent.name} updated.`, type: 'success' });
    return true;
  };
  
  const handleDeleteStudent = (studentId: string) => {
    const studentToDelete = users.find(u => u.id === studentId && u.role === Role.Student) as Student | undefined;
    if (!studentToDelete) return;

    setUsers(prev => prev.filter(u => u.id !== studentId));
    setCourses(prev => prev.map(course => ({
      ...course,
      studentIds: course.studentIds.filter(id => id !== studentId)
    })));
    setAttendanceRecords(prev => prev.filter(record => record.studentId !== studentId));
    
    addNotification({ message: `Student ${studentToDelete.name} and all associated data have been deleted.`, type: 'success' });
  };
  
  const handleUpdateSelf = (updatedUser: User) => {
      setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
      setCurrentUser(updatedUser);
      addNotification({ message: 'Your profile has been updated.', type: 'success' });
  };

  const handleUpdateCourses = (updatedCourses: Course[]) => {
      setCourses(updatedCourses);
  };

  const handleDeleteCourse = (courseId: string) => {
    setCourses(prev => prev.filter(c => c.id !== courseId));
    setAttendanceRecords(prev => prev.filter(r => r.courseId !== courseId));
    addNotification({ message: 'Course and all associated records deleted.', type: 'success' });
  };
  
  const teachers = useMemo(() => users.filter(u => u.role === Role.Teacher) as Teacher[], [users]);
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-light-bg dark:bg-dark-bg">
        <div className="flex flex-col items-center">
          <svg className="animate-spin h-10 w-10 text-brand-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="mt-4 text-lg font-semibold text-gray-800 dark:text-gray-200">Loading College Data...</p>
        </div>
      </div>
    );
  }

  if (error) {
     return (
      <div className="min-h-screen flex items-center justify-center bg-red-50 dark:bg-red-900/10 p-4">
        <p className="text-center text-red-600 dark:text-red-400 font-medium">{error}</p>
      </div>
    );
  }

  if (!hasSeenWelcome) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-light-bg dark:bg-dark-bg p-4">
            <Card className="w-full max-w-md text-center p-8 shadow-2xl animate-fade-in">
                <img src={logoUrl} alt="Gambat Medical College Logo" className="w-24 h-24 mx-auto mb-4"/>
                <h1 className="text-2xl font-bold text-brand-primary">Gambat Medical College</h1>
                <p className="text-md text-gray-600 dark:text-gray-300 mt-1">General Surgery Department</p>
                <div className="my-6 border-t border-gray-200 dark:border-gray-700"></div>
                <p className="text-sm text-gray-500 dark:text-gray-400">App Designed by Dr. Jibran Ali</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">Secure | Reliable | Smart</p>
                <Button onClick={() => setHasSeenWelcome(true)} className="mt-8 w-full">Continue to Portal</Button>
            </Card>
        </div>
    );
  }

  if (!currentUser) {
    return <Login users={users} notifications={notifications} teachers={teachers} onLogin={handleLogin} logoUrl={logoUrl} />;
  }

  return (
    <div className="min-h-screen bg-light-bg dark:bg-dark-bg">
      <ToastContainer />
      <Header 
        user={currentUser}
        logoUrl={logoUrl}
        onLogout={handleLogout}
      />
      <main>
        {currentUser.role === Role.Student && (
          <StudentDashboard
            student={currentUser}
            courses={courses.filter(c => c.studentIds.includes(currentUser.id))}
            attendanceRecords={attendanceRecords.filter(r => r.studentId === currentUser.id)}
            teachers={teachers}
          />
        )}
        {currentUser.role === Role.Teacher && (
           <TeacherDashboard
              teacher={currentUser}
              allUsers={users}
              allCourses={courses}
              allNotifications={notifications}
              attendanceRecords={attendanceRecords}
              onUpdateAttendance={handleUpdateAttendance}
              onAddNotification={handleAddNotification}
              onEditNotification={handleEditNotification}
              onDeleteNotification={handleDeleteNotification}
              onUpdateStaff={handleUpdateStaff}
              onAddStudent={handleAddStudent}
              onEditStudent={handleEditStudent}
              onDeleteStudent={handleDeleteStudent}
              onUpdateSelf={handleUpdateSelf}
              onUpdateCourses={handleUpdateCourses}
              onDeleteCourse={handleDeleteCourse}
            />
        )}
      </main>
    </div>
  );
};

export default App;