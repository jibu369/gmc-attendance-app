import React, { useState, useMemo } from 'react';
import { Role, type Teacher, type Student, type User, type Notification } from '../types';
import Card from './common/Card';
import Button from './common/Button';
import { useNotification } from '../contexts/NotificationContext';

interface LoginProps {
  users: User[];
  notifications: Notification[];
  teachers: Teacher[];
  onLogin: (user: User) => void;
  logoUrl: string;
}

const Login: React.FC<LoginProps> = ({ users, notifications, teachers, onLogin, logoUrl }) => {
  const [activeTab, setActiveTab] = useState<'notifications' | 'portal'>('notifications');
  const [mode, setMode] = useState<Role>(Role.Student);
  const [rollNumber, setRollNumber] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { addNotification } = useNotification();

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    let foundUser: User | undefined;
    if(mode === Role.Student) {
        foundUser = users.find(u => 
            u.role === Role.Student && 
            u.rollNumber.toLowerCase() === rollNumber.toLowerCase() &&
            u.password === password
        );
    } else {
        foundUser = users.find(u => u.role === Role.Teacher && u.username === username && u.password === password);
    }

    if (foundUser) {
      addNotification({ message: `Welcome, ${foundUser.name}!`, type: 'success' });
      onLogin(foundUser);
    } else {
      setError(mode === Role.Student ? 'Invalid roll number or password.' : 'Invalid username or password.');
    }
  };
  
  const sortedNotifications = useMemo(() => {
    return [...notifications].sort((a,b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return new Date(b.date).getTime() - new Date(a.date).getTime()
    });
  }, [notifications]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <div className="p-8">
          <div className="text-center mb-6">
            {logoUrl && <img src={logoUrl} alt="Portal Logo" className="w-20 h-20 mx-auto mb-4 object-contain" />}
            <h1 className="text-3xl font-bold text-brand-primary">Gambat Medical College</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2">Surgery Ward Students Portal</p>
          </div>
          
           <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
            <button 
              onClick={() => setActiveTab('notifications')}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${activeTab === 'notifications' ? 'border-b-2 border-brand-primary text-brand-primary' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
            >
              Notifications
            </button>
            <button 
              onClick={() => setActiveTab('portal')}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${activeTab === 'portal' ? 'border-b-2 border-brand-primary text-brand-primary' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
            >
              Access Portal
            </button>
          </div>
          
          {error && <p className="mb-4 text-center text-sm text-red-600 bg-red-100 dark:text-red-300 dark:bg-red-900/30 p-3 rounded-md">{error}</p>}
          
          {activeTab === 'portal' && (
            <div>
              <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
                <button 
                  onClick={() => { setMode(Role.Student); setError(''); }}
                  className={`flex-1 py-2 text-sm font-medium transition-colors ${mode === Role.Student ? 'border-b-2 border-brand-primary text-brand-primary' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
                >
                  Student
                </button>
                <button 
                  onClick={() => { setMode(Role.Teacher); setError(''); }}
                  className={`flex-1 py-2 text-sm font-medium transition-colors ${mode === Role.Teacher ? 'border-b-2 border-brand-primary text-brand-primary' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
                >
                  Administration
                </button>
              </div>
              
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                {mode === Role.Student ? (
                  <>
                    <div>
                      <label htmlFor="rollNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Roll Number</label>
                      <input
                        id="rollNumber"
                        type="text"
                        value={rollNumber}
                        onChange={e => setRollNumber(e.target.value)}
                        placeholder="e.g., GMC-24-001"
                        className="mt-1 block w-full px-3 py-2 bg-light-surface dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 dark:text-gray-100"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="student-password"className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                      <input id="student-password" type="password" value={password} onChange={e => setPassword(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-light-surface dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm" required />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Username</label>
                      <input id="username" type="text" value={username} autoComplete="username" onChange={e => setUsername(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-light-surface dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm" required />
                    </div>
                    <div>
                      <label htmlFor="password"className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                      <input id="password" type="password" value={password} autoComplete="current-password" onChange={e => setPassword(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-light-surface dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm" required />
                    </div>
                  </>
                )}
                <Button type="submit" className="w-full">Login</Button>
              </form>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                {sortedNotifications.length > 0 ? sortedNotifications.map(notif => {
                    const teacher = teachers.find(t => t.id === notif.teacherId);
                    return (
                        <div key={notif.id} className={`p-4 rounded-lg ${notif.pinned ? 'bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-400' : 'bg-emerald-50 dark:bg-dark-surface border border-emerald-200 dark:border-gray-700'}`}>
                            <div className="flex items-start">
                                {notif.pinned && <span className="text-lg mr-2" title="Pinned">📌</span>}
                                <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap flex-grow">{notif.content}</p>
                            </div>
                            {notif.attachmentUrl && (
                                <a href={notif.attachmentUrl} target="_blank" rel="noopener noreferrer" download={notif.attachmentName} className="mt-2 inline-block text-sm font-medium text-brand-primary hover:underline">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline-block -mt-1 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                      <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a3 3 0 006 0V7a1 1 0 112 0v4a5 5 0 01-10 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clipRule="evenodd" />
                                    </svg>
                                    View Attachment: {notif.attachmentName || 'File'}
                                </a>
                            )}
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 flex justify-between">
                                <span>- {teacher?.name || 'Admin'}</span>
                                <span>{new Date(notif.date).toLocaleString()}</span>
                            </div>
                        </div>
                    )
                }) : (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-8">No notifications at the moment.</p>
                )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default Login;