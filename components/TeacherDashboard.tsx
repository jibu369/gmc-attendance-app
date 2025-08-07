import React, { useState, useMemo, useEffect, ChangeEvent } from 'react';
import type { Teacher, Course, AttendanceRecord, Student, User, Notification } from '../types';
import { Role } from '../types';
import Card from './common/Card';
import Button from './common/Button';
import { generateClassReminder } from '../services/geminiService';
import { useNotification } from '../contexts/NotificationContext';

// #region Helper Component: Modal
const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode; }> = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center" onClick={onClose}>
            <div className="bg-light-surface dark:bg-dark-surface rounded-lg shadow-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-brand-dark dark:text-gray-100">{title}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">&times;</button>
                </div>
                {children}
            </div>
        </div>
    );
};
// #endregion

// #region Helper Components for TeacherDashboard

const MarkAttendance: React.FC<{
    teacherCourses: Course[];
    allStudents: Student[];
    attendanceRecords: AttendanceRecord[];
    onSave: (records: AttendanceRecord[], updatedCount: number, newCount: number) => void;
}> = ({ teacherCourses, allStudents, attendanceRecords, onSave }) => {
    const [selectedCourseId, setSelectedCourseId] = useState<string>('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [studentsInCourse, setStudentsInCourse] = useState<Student[]>([]);
    const [attendanceStatus, setAttendanceStatus] = useState<Record<string, boolean>>({});
    const { addNotification } = useNotification();

    const isToday = useMemo(() => new Date().toISOString().split('T')[0] === date, [date]);

    useEffect(() => {
        if (selectedCourseId) {
            const course = teacherCourses.find(c => c.id === selectedCourseId);
            if (!course) return;
            const students = allStudents.filter(s => course.studentIds.includes(s.id));
            setStudentsInCourse(students);
            
            const initialStatus: Record<string, boolean> = {};
            students.forEach(student => {
                const existingRecord = attendanceRecords.find(r => r.studentId === student.id && r.courseId === selectedCourseId && r.date === date);
                initialStatus[student.id] = existingRecord ? existingRecord.present : true;
            });
            setAttendanceStatus(initialStatus);
        } else {
            setStudentsInCourse([]);
            setAttendanceStatus({});
        }
    }, [selectedCourseId, date, allStudents, teacherCourses, attendanceRecords]);

    const handleToggle = (studentId: string) => {
        setAttendanceStatus(prev => ({...prev, [studentId]: !prev[studentId]}));
    };
    
    const handleSave = () => {
        if (!selectedCourseId) {
            addNotification({ message: 'Please select a course.', type: 'error' });
            return;
        }
        let updatedCount = 0;
        let newCount = 0;
        
        const recordsToSave = studentsInCourse.map(student => {
            const existingRecord = attendanceRecords.find(r => r.studentId === student.id && r.courseId === selectedCourseId && r.date === date);
            if (existingRecord) {
                updatedCount++;
            } else {
                newCount++;
            }
            return {
                id: existingRecord?.id || `${Date.now()}-${student.id}`,
                studentId: student.id,
                courseId: selectedCourseId,
                date,
                present: attendanceStatus[student.id],
            };
        });
        onSave(recordsToSave, updatedCount, newCount);
    };

    const inputClasses = "w-full border-gray-300 dark:border-gray-600 bg-light-surface dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-md shadow-sm focus:border-emerald-500 focus:ring-emerald-500";
    const labelClasses = "text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";

    return (
        <Card className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                 <div>
                    <label htmlFor="mark-course" className={labelClasses}>Course</label>
                    <select id="mark-course" value={selectedCourseId} onChange={e => setSelectedCourseId(e.target.value)} className={inputClasses}>
                        <option value="">Select Course...</option>
                        {teacherCourses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
                 <div>
                     <label htmlFor="mark-date" className={`${labelClasses} flex items-center justify-between`}>
                        <span>Date</span>
                        {isToday && <span className="text-xs font-normal text-brand-primary">Today</span>}
                     </label>
                     <input id="mark-date" type="date" value={date} onChange={e => setDate(e.target.value)} className={inputClasses} />
                </div>
                 <div className="self-end">
                    <Button onClick={handleSave} disabled={!selectedCourseId || studentsInCourse.length === 0} className="w-full">Save Attendance</Button>
                 </div>
            </div>
            
            <div className="overflow-x-auto max-h-96">
                <table className="min-w-full bg-light-surface dark:bg-dark-surface">
                    <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                        <tr>
                            <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Student Name</th>
                            <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Roll #</th>
                            <th className="py-3 px-4 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {studentsInCourse.length > 0 ? studentsInCourse.map(student => (
                            <tr key={student.id}>
                                <td className="py-4 px-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{student.name}</td>
                                <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{student.rollNumber}</td>
                                <td className="py-4 px-4 whitespace-nowrap text-sm text-center">
                                    <button type="button" onClick={() => handleToggle(student.id)} className={`relative inline-flex flex-shrink-0 h-6 w-24 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-dark-surface focus:ring-emerald-500 ${attendanceStatus[student.id] ? 'bg-brand-primary' : 'bg-red-500'}`}>
                                        <span className={`absolute inset-0 flex items-center justify-center text-xs font-bold text-white transition-opacity duration-200 ${attendanceStatus[student.id] ? 'opacity-100' : 'opacity-0'}`}>Present</span>
                                        <span className={`absolute inset-0 flex items-center justify-center text-xs font-bold text-white transition-opacity duration-200 ${!attendanceStatus[student.id] ? 'opacity-100' : 'opacity-0'}`}>Absent</span>
                                        <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${attendanceStatus[student.id] ? 'translate-x-[74px]' : 'translate-x-0'}`}/>
                                    </button>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={3} className="text-center py-8 text-gray-500 dark:text-gray-400">Please select a course and date.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </Card>
    );
};


const ViewRecords: React.FC<{
    records: AttendanceRecord[];
    students: Student[];
    courses: Course[];
}> = ({ records, students, courses }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [filterStatus, setFilterStatus] = useState<'all' | 'present' | 'absent'>('all');
    const { addNotification } = useNotification();


    const filteredRecords = useMemo(() => {
        return records.filter(record => {
            const student = students.find(s => s.id === record.studentId);
            if (!student) return false;

            const searchMatch = searchTerm === '' ||
                student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                student.rollNumber.toLowerCase().includes(searchTerm.toLowerCase());
            
            const recordDate = new Date(record.date + 'T00:00:00');
            const startDate = dateRange.start ? new Date(dateRange.start + 'T00:00:00') : null;
            const endDate = dateRange.end ? new Date(dateRange.end + 'T00:00:00') : null;

            const dateMatch = (!startDate || recordDate >= startDate) && (!endDate || recordDate <= endDate);

            const statusMatch = filterStatus === 'all' ||
                (filterStatus === 'present' && record.present) ||
                (filterStatus === 'absent' && !record.present);

            return searchMatch && dateMatch && statusMatch;
        }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [records, students, searchTerm, dateRange, filterStatus]);
    
    const exportToCsv = (data: any[], filename = 'attendance-export.csv') => {
        if (data.length === 0) {
             addNotification({ message: 'No data to export based on current filters.', type: 'info' });
            return;
        }
        const header = Object.keys(data[0]).join(',');
        const rows = data.map(row => Object.values(row).map(val => `"${String(val).replace(/"/g, '""')}"`).join(',')).join('\n');
        const csvContent = `data:text/csv;charset=utf-8,${header}\n${rows}`;
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        addNotification({ message: 'CSV export started.', type: 'success' });
    };

    const handleExport = () => {
         const dataToExport = filteredRecords.map(record => {
            const student = students.find(s => s.id === record.studentId);
            const course = courses.find(c => c.id === record.courseId);
            return {
                id: record.id,
                studentName: student?.name || 'N/A',
                rollNumber: student?.rollNumber || 'N/A',
                courseName: course?.name || 'N/A',
                date: record.date,
                status: record.present ? 'Present' : 'Absent'
            };
        });
        exportToCsv(dataToExport);
    };
    
    const inputClasses = "border-gray-300 dark:border-gray-600 bg-light-surface dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-md shadow-sm focus:border-emerald-500 focus:ring-emerald-500";
    const labelClasses = "text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";


    return (
         <Card className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4 items-end">
                <div className="lg:col-span-3">
                    <label htmlFor="search-term" className={labelClasses}>Filter by Name/Roll #</label>
                    <input id="search-term" type="text" placeholder="Start typing..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className={inputClasses}/>
                </div>
                 <div>
                    <label htmlFor="start-date" className={labelClasses}>Start Date</label>
                    <input id="start-date" type="date" value={dateRange.start} onChange={e => setDateRange(prev => ({...prev, start: e.target.value}))} className={inputClasses}/>
                </div>
                <div>
                    <label htmlFor="end-date" className={labelClasses}>End Date</label>
                    <input id="end-date" type="date" value={dateRange.end} onChange={e => setDateRange(prev => ({...prev, end: e.target.value}))} className={inputClasses}/>
                </div>
                 <div>
                    <label htmlFor="status-filter" className={labelClasses}>Status</label>
                    <select id="status-filter" value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)} className={inputClasses}>
                        <option value="all">All Statuses</option>
                        <option value="present">Present</option>
                        <option value="absent">Absent</option>
                    </select>
                </div>
            </div>
             <div className="flex justify-end mb-4">
                <Button onClick={handleExport} variant="secondary">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    Download CSV
                </Button>
            </div>
             <div className="overflow-x-auto max-h-96">
                <table className="min-w-full bg-light-surface dark:bg-dark-surface">
                    <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                      <tr>
                        <th scope="col" className="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Student</th>
                        <th scope="col" className="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                        <th scope="col" className="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Course</th>
                        <th scope="col" className="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {filteredRecords.length > 0 ? (
                        filteredRecords.map(record => {
                            const student = students.find(s => s.id === record.studentId);
                            const course = courses.find(c => c.id === record.courseId);
                            return (
                                <tr key={record.id}>
                                  <td className="py-4 px-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{student?.name} ({student?.rollNumber})</td>
                                  <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{new Date(record.date + 'T00:00:00').toLocaleDateString()}</td>
                                  <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{course?.name}</td>
                                  <td className="py-4 px-4 whitespace-nowrap text-sm">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${record.present ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'}`}>
                                      {record.present ? 'Present' : 'Absent'}
                                    </span>
                                  </td>
                                </tr>
                            );
                        })
                      ) : (
                         <tr>
                            <td colSpan={4} className="text-center py-6 text-gray-500 dark:text-gray-400">No records match your filters.</td>
                        </tr>
                      )}
                    </tbody>
                </table>
             </div>
         </Card>
    );
};

const ManageNotifications: React.FC<{
    teacherId: string;
    notifications: Notification[];
    onAdd: (content: string, pinned: boolean, attachment?: {name: string, url: string}) => void;
    onEdit: (notification: Notification) => void;
    onDelete: (id: string) => void;
}> = ({ teacherId, notifications, onAdd, onEdit, onDelete }) => {
    const [newContent, setNewContent] = useState('');
    const [isPinned, setIsPinned] = useState(false);
    const [attachment, setAttachment] = useState<File | null>(null);
    const [editingNotification, setEditingNotification] = useState<Notification | null>(null);
    const [editFormState, setEditFormState] = useState<{content: string; pinned: boolean}>({content: '', pinned: false});
    const { addNotification } = useNotification();
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newContent.trim()) return;

        const handleSuccess = (attach?: {name: string, url: string}) => {
            onAdd(newContent.trim(), isPinned, attach);
            setNewContent('');
            setAttachment(null);
            setIsPinned(false);
        }

        if (attachment) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const url = event.target?.result as string;
                handleSuccess({ name: attachment.name, url });
            };
            reader.onerror = () => {
                addNotification({ message: 'Failed to read file.', type: 'error'});
            };
            reader.readAsDataURL(attachment);
        } else {
            handleSuccess();
        }
    };
    
     const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files ? e.target.files[0] : null;
        if (file && file.size > 5 * 1024 * 1024) { // 5MB limit
            addNotification({ message: 'File size cannot exceed 5MB.', type: 'error' });
            return;
        }
        setAttachment(file);
    };

    const sortedNotifications = useMemo(() => {
        return [...notifications].sort((a,b) => {
            if (a.pinned && !b.pinned) return -1;
            if (!a.pinned && b.pinned) return 1;
            return new Date(b.date).getTime() - new Date(a.date).getTime();
        });
    }, [notifications]);

    const handleOpenEditModal = (notification: Notification) => {
        setEditingNotification(notification);
        setEditFormState({ content: notification.content, pinned: notification.pinned || false });
    };

    const handleSaveEdit = () => {
        if (!editingNotification) return;
        onEdit({
            ...editingNotification,
            content: editFormState.content,
            pinned: editFormState.pinned,
        });
        setEditingNotification(null);
    };

    return (
        <Card className="p-6">
            <form onSubmit={handleSubmit} className="mb-6 space-y-3">
                <div>
                    <label htmlFor="notification-content" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">New Notification</label>
                    <textarea 
                        id="notification-content"
                        rows={3}
                        value={newContent}
                        onChange={e => setNewContent(e.target.value)}
                        placeholder="e.g., Reminder: Midterm exams are next week."
                        className="w-full border-gray-300 dark:border-gray-600 bg-light-surface dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-md shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                    />
                </div>
                 <div className="flex items-center">
                    <input 
                        type="checkbox" 
                        id="pin-notification" 
                        checked={isPinned} 
                        onChange={e => setIsPinned(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-brand-primary focus:ring-brand-secondary"
                    />
                    <label htmlFor="pin-notification" className="ml-2 text-sm text-gray-700 dark:text-gray-300">Pin to top</label>
                </div>
                <div className="flex items-center justify-between">
                    <div>
                        <label htmlFor="attachment" className="text-sm font-medium text-gray-700 dark:text-gray-300 py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                           <span>{attachment ? 'Change File' : 'Add Attachment'}</span>
                           <input id="attachment" name="attachment" type="file" className="sr-only" onChange={handleFileChange} />
                        </label>
                        {attachment && <span className="ml-3 text-sm text-gray-500 dark:text-gray-400">{attachment.name}</span>}
                    </div>
                    <Button type="submit" disabled={!newContent.trim()}>Post Notification</Button>
                </div>
            </form>
            <h4 className="font-bold text-lg text-brand-dark dark:text-gray-100 mb-2">Posted Notifications</h4>
            <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                {sortedNotifications.length > 0 ? sortedNotifications.map(notif => (
                    <div key={notif.id} className={`p-3 rounded-md flex justify-between items-start ${notif.pinned ? 'bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-400' : 'bg-gray-50 dark:bg-dark-surface border-transparent border-l-4'}`}>
                        <div className="flex-grow">
                             <div className="flex items-center">
                                {notif.pinned && <span className="text-lg" title="Pinned">📌</span>}
                                <p className={`text-sm text-gray-800 dark:text-gray-200 ${notif.pinned ? 'ml-2' : ''}`}>{notif.content}</p>
                            </div>
                            {notif.attachmentUrl && (
                                <a href={notif.attachmentUrl} target="_blank" rel="noopener noreferrer" download={notif.attachmentName} className="mt-1 inline-block text-xs font-medium text-brand-primary hover:underline">
                                    View Attachment: {notif.attachmentName || 'File'}
                                </a>
                            )}
                            <span className="block text-xs text-gray-500 dark:text-gray-400 mt-1">{new Date(notif.date).toLocaleString()}</span>
                        </div>
                        {notif.teacherId === teacherId && (
                            <div className="flex gap-2 flex-shrink-0 ml-4">
                               <Button onClick={() => handleOpenEditModal(notif)} variant="secondary" className="px-2 py-1 text-xs">Edit</Button>
                               <Button onClick={() => onDelete(notif.id)} variant="danger" className="px-2 py-1 text-xs">Delete</Button>
                            </div>
                        )}
                    </div>
                )) : <p className="text-sm text-gray-500 dark:text-gray-400">No notifications found.</p>}
            </div>
            <Modal isOpen={!!editingNotification} onClose={() => setEditingNotification(null)} title="Edit Notification">
                <div className="space-y-4">
                     <div>
                        <label htmlFor="edit-notification-content" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Content</label>
                        <textarea 
                            id="edit-notification-content"
                            rows={4}
                            value={editFormState.content}
                            onChange={e => setEditFormState(s => ({...s, content: e.target.value}))}
                            className="w-full border-gray-300 dark:border-gray-600 bg-light-surface dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-md shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                        />
                    </div>
                    <div className="flex items-center">
                        <input 
                            type="checkbox" 
                            id="edit-pin-notification" 
                            checked={editFormState.pinned} 
                            onChange={e => setEditFormState(s => ({...s, pinned: e.target.checked}))}
                            className="h-4 w-4 rounded border-gray-300 text-brand-primary focus:ring-brand-secondary"
                        />
                        <label htmlFor="edit-pin-notification" className="ml-2 text-sm text-gray-700 dark:text-gray-300">Pin to top</label>
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                        <Button variant="secondary" onClick={() => setEditingNotification(null)}>Cancel</Button>
                        <Button onClick={handleSaveEdit}>Save Changes</Button>
                    </div>
                </div>
            </Modal>
        </Card>
    )
};

const ManageStudents: React.FC<{
    allStudents: Student[];
    onAddStudent: (student: Student) => boolean;
    onEditStudent: (student: Student) => boolean;
    onDeleteStudent: (studentId: string) => void;
    onPostReminder: (content: string, pinned: boolean) => void;
}> = ({ allStudents, onAddStudent, onEditStudent, onDeleteStudent, onPostReminder }) => {
    const [name, setName] = useState('');
    const [rollNumber, setRollNumber] = useState('');
    const [password, setPassword] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [editingStudent, setEditingStudent] = useState<Student | null>(null);
    const [editFormState, setEditFormState] = useState<Partial<Student>>({});
    
    useEffect(() => {
        if(editingStudent) {
            setEditFormState({
                id: editingStudent.id,
                name: editingStudent.name,
                rollNumber: editingStudent.rollNumber,
                password: '', // Clear password for security
            })
        }
    }, [editingStudent]);

    const handleRegister = (e: React.FormEvent) => {
        e.preventDefault();
        const success = onAddStudent({
            id: `s-${Date.now()}`,
            name, rollNumber, password,
            role: Role.Student,
        });
        if (success) {
            setName('');
            setRollNumber('');
            setPassword('');
        }
    };

    const handleSaveEdit = () => {
        if (!editingStudent || !editFormState.name || !editFormState.rollNumber) return;
        const studentToSave: Student = {
            id: editingStudent.id,
            name: editFormState.name,
            rollNumber: editFormState.rollNumber,
            password: editFormState.password || editingStudent.password, // Keep old pass if new is blank
            role: Role.Student,
        };
        const success = onEditStudent(studentToSave);
        if (success) {
            setEditingStudent(null);
        }
    };

    const handleDelete = (studentId: string) => {
        if (confirm('Are you sure you want to delete this student and all their records? This action cannot be undone.')) {
            onDeleteStudent(studentId);
        }
    };
    
    const handleGenerateReminder = async () => {
        setIsGenerating(true);
        const reminderText = await generateClassReminder();
        onPostReminder(reminderText, false);
        setIsGenerating(false);
    }

    const labelClasses = "text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block";
    const inputClasses = "w-full border-gray-300 dark:border-gray-600 bg-light-surface dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-md shadow-sm focus:border-emerald-500 focus:ring-emerald-500";

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="p-6 lg:col-span-1">
                <h4 className="font-bold text-lg text-brand-dark dark:text-gray-100 mb-4">Register New Student</h4>
                <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                        <label htmlFor="new-student-name" className={labelClasses}>Full Name</label>
                        <input id="new-student-name" type="text" value={name} onChange={e => setName(e.target.value)} required className={inputClasses} />
                    </div>
                    <div>
                        <label htmlFor="new-student-roll" className={labelClasses}>Roll Number</label>
                        <input id="new-student-roll" type="text" value={rollNumber} onChange={e => setRollNumber(e.target.value)} required className={inputClasses} />
                    </div>
                     <div>
                        <label htmlFor="new-student-pass" className={labelClasses}>Temporary Password</label>
                        <input id="new-student-pass" type="password" value={password} onChange={e => setPassword(e.target.value)} required className={inputClasses} />
                    </div>
                    <Button type="submit" className="w-full">Register Student</Button>
                </form>
                 <div className="mt-6 border-t pt-6 border-gray-200 dark:border-gray-700">
                    <h4 className="font-bold text-lg text-brand-dark dark:text-gray-100 mb-4">Class Reminder</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Generate an AI-powered reminder and post it to the main notification board for all students.</p>
                    <Button onClick={handleGenerateReminder} variant="secondary" className="w-full" isLoading={isGenerating}>
                        Generate & Post Reminder
                    </Button>
                 </div>
            </Card>
            <Card className="p-6 lg:col-span-2">
                 <h4 className="font-bold text-lg text-brand-dark dark:text-gray-100 mb-4">Registered Students ({allStudents.length})</h4>
                 <div className="overflow-x-auto max-h-[26rem]">
                    <table className="min-w-full">
                        <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                            <tr>
                                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Roll Number</th>
                                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {allStudents.map(s => (
                                <tr key={s.id}>
                                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-gray-100">{s.name}</td>
                                    <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400">{s.rollNumber}</td>
                                    <td className="py-3 px-4 text-sm whitespace-nowrap">
                                        <button onClick={() => setEditingStudent(s)} className="font-medium text-brand-primary hover:text-brand-secondary">Edit</button>
                                        <button onClick={() => handleDelete(s.id)} className="ml-4 font-medium text-red-600 hover:text-red-700">Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                 </div>
            </Card>
            <Modal isOpen={!!editingStudent} onClose={() => setEditingStudent(null)} title={`Edit ${editingStudent?.name}`}>
                {editFormState && (
                    <div className="space-y-4">
                        <div>
                           <label htmlFor="edit-student-name" className={labelClasses}>Full Name</label>
                           <input id="edit-student-name" type="text" value={editFormState.name || ''} onChange={e => setEditFormState({...editFormState, name: e.target.value})} required className={inputClasses} />
                        </div>
                        <div>
                           <label htmlFor="edit-student-roll" className={labelClasses}>Roll Number</label>
                           <input id="edit-student-roll" type="text" value={editFormState.rollNumber || ''} onChange={e => setEditFormState({...editFormState, rollNumber: e.target.value})} required className={inputClasses} />
                        </div>
                        <div>
                           <label htmlFor="edit-student-pass" className={labelClasses}>New Password</label>
                           <input id="edit-student-pass" type="password" value={editFormState.password || ''} onChange={e => setEditFormState({...editFormState, password: e.target.value})} placeholder="Leave blank to keep current" className={inputClasses} />
                        </div>
                        <div className="flex justify-end gap-2 mt-4">
                           <Button variant="secondary" onClick={() => setEditingStudent(null)}>Cancel</Button>
                           <Button onClick={handleSaveEdit}>Save Changes</Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    )
}

const ManageCourses: React.FC<{
    teacherId: string;
    allCourses: Course[];
    allStudents: Student[];
    onUpdateCourses: (courses: Course[]) => void;
    onDeleteCourse: (courseId: string) => void;
}> = ({ teacherId, allCourses, allStudents, onUpdateCourses, onDeleteCourse }) => {
    const [editingCourse, setEditingCourse] = useState<Course | null>(null);
    const [newCourseName, setNewCourseName] = useState('');
    const [enrolledStudents, setEnrolledStudents] = useState<Set<string>>(new Set());
    const { addNotification } = useNotification();
    
    const openEditor = (course: Course | null) => {
        if(course) {
            setEditingCourse(course);
            setNewCourseName(course.name);
            setEnrolledStudents(new Set(course.studentIds));
        } else {
             setEditingCourse({id: `c-${Date.now()}`, name: '', teacherId, studentIds: []});
             setNewCourseName('');
             setEnrolledStudents(new Set());
        }
    };
    
    const handleSaveCourse = () => {
        if (!editingCourse || !newCourseName.trim()) {
            addNotification({ message: 'Course name cannot be empty.', type: 'error' });
            return;
        }
        const updatedCourse: Course = {
            ...editingCourse,
            name: newCourseName.trim(),
            studentIds: Array.from(enrolledStudents),
        };
        const isNew = !allCourses.some(c => c.id === updatedCourse.id);
        const newCourses = isNew ? [...allCourses, updatedCourse] : allCourses.map(c => c.id === updatedCourse.id ? updatedCourse : c);
        onUpdateCourses(newCourses);
        addNotification({ message: `Course "${updatedCourse.name}" saved.`, type: 'success' });
        setEditingCourse(null);
    };

    return (
        <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-xl text-brand-dark dark:text-gray-100">Manage Courses</h3>
                <Button onClick={() => openEditor(null)}>Add New Course</Button>
            </div>
            <div className="space-y-3">
                {allCourses.map(course => (
                    <div key={course.id} className="p-3 bg-gray-50 dark:bg-dark-surface rounded-md flex justify-between items-center">
                        <div>
                            <p className="font-semibold text-gray-900 dark:text-gray-100">{course.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{course.studentIds.length} students enrolled</p>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="secondary" onClick={() => openEditor(course)} className="text-xs px-2 py-1">Edit</Button>
                            <Button variant="danger" onClick={() => { if(confirm(`Are you sure you want to delete ${course.name}? This cannot be undone.`)) onDeleteCourse(course.id) }} className="text-xs px-2 py-1">Delete</Button>
                        </div>
                    </div>
                ))}
            </div>
            <Modal isOpen={!!editingCourse} onClose={() => setEditingCourse(null)} title={editingCourse?.name ? 'Edit Course' : 'Add Course'}>
                <div className="space-y-4">
                     <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Course Name</label>
                        <input type="text" value={newCourseName} onChange={e => setNewCourseName(e.target.value)} className="w-full border-gray-300 dark:border-gray-600 bg-light-surface dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-md"/>
                    </div>
                    <div>
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Enrolled Students</h4>
                        <div className="max-h-60 overflow-y-auto space-y-2 p-2 border rounded-md dark:border-gray-600">
                            {allStudents.map(student => (
                                <div key={student.id} className="flex items-center">
                                    <input type="checkbox" id={`student-${student.id}`} checked={enrolledStudents.has(student.id)} 
                                        onChange={() => {
                                            const newSet = new Set(enrolledStudents);
                                            if (newSet.has(student.id)) newSet.delete(student.id);
                                            else newSet.add(student.id);
                                            setEnrolledStudents(newSet);
                                        }}
                                        className="h-4 w-4 rounded border-gray-300 text-brand-primary focus:ring-brand-secondary"/>
                                    <label htmlFor={`student-${student.id}`} className="ml-3 text-sm text-gray-700 dark:text-gray-300">{student.name} ({student.rollNumber})</label>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                        <Button variant="secondary" onClick={() => setEditingCourse(null)}>Cancel</Button>
                        <Button onClick={handleSaveCourse}>Save Course</Button>
                    </div>
                </div>
            </Modal>
        </Card>
    );
};

const ManageStaff: React.FC<{
    allTeachers: Teacher[],
    allUsers: User[],
    onUpdateStaff: (users: User[]) => void;
}> = ({ allTeachers, allUsers, onUpdateStaff }) => {
    const [editingTeacher, setEditingTeacher] = useState<Partial<Teacher> & { id: string; role: Role.Teacher } | null>(null);
    const { addNotification } = useNotification();

    const openEditor = (teacher: Teacher | null) => {
        if(teacher) {
            setEditingTeacher(teacher);
        } else {
            setEditingTeacher({ id: `t-${Date.now()}`, name: '', username: '', password: '', role: Role.Teacher, title: '', photoUrl: '', email: '', phone: ''});
        }
    };
    
    const handleSave = () => {
        if(!editingTeacher || !editingTeacher.name || !editingTeacher.username) {
            addNotification({message: 'Name and Username are required.', type: 'error'});
            return;
        }
        
        const isNew = !allUsers.some(u => u.id === editingTeacher.id);

        if(isNew && !editingTeacher.password) {
            addNotification({message: 'Password is required for new staff members.', type: 'error'});
            return;
        }
        
        const teacherToSave: Teacher = {
           id: editingTeacher.id,
           role: Role.Teacher,
           name: editingTeacher.name,
           username: editingTeacher.username,
           // Use existing password if a new one isn't provided during edit
           password: editingTeacher.password || (allUsers.find(u => u.id === editingTeacher.id) as Teacher)?.password || '',
           title: editingTeacher.title,
           photoUrl: editingTeacher.photoUrl,
           email: editingTeacher.email,
           phone: editingTeacher.phone,
        };
        
        const newUsers = isNew ? [...allUsers, teacherToSave] : allUsers.map(u => u.id === editingTeacher.id ? teacherToSave : u);
        onUpdateStaff(newUsers);
        setEditingTeacher(null);
    }
    
    const handleDelete = (teacherId: string) => {
        if(allTeachers.length <= 1) {
            addNotification({message: "Cannot delete the last administrator.", type: 'error'});
            return;
        }
        if(confirm('Are you sure you want to delete this staff member?')) {
            onUpdateStaff(allUsers.filter(u => u.id !== teacherId));
        }
    }
    
    const inputClasses = "w-full border-gray-300 dark:border-gray-600 bg-light-surface dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-md";
    const labelClasses = "text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block";
    
    return(
        <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-xl text-brand-dark dark:text-gray-100">Manage Staff</h3>
                <Button onClick={() => openEditor(null)}>Add New Staff</Button>
            </div>
            <div className="space-y-3">
                {allTeachers.map(teacher => (
                     <div key={teacher.id} className="p-3 bg-gray-50 dark:bg-dark-surface rounded-md flex justify-between items-center">
                        <div className="flex items-center gap-4">
                           <img src={teacher.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(teacher.name)}&background=10b981&color=fff`} alt={teacher.name} className="h-10 w-10 rounded-full object-cover"/>
                            <div>
                                <p className="font-semibold text-gray-900 dark:text-gray-100">{teacher.name}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{teacher.title || `Username: ${teacher.username}`}</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="secondary" onClick={() => openEditor(teacher)} className="text-xs px-2 py-1">Edit</Button>
                            <Button variant="danger" onClick={() => handleDelete(teacher.id)} className="text-xs px-2 py-1">Delete</Button>
                        </div>
                    </div>
                ))}
            </div>
             <Modal isOpen={!!editingTeacher} onClose={() => setEditingTeacher(null)} title={editingTeacher?.name ? 'Edit Staff' : 'Add Staff'}>
                {editingTeacher && (
                    <div className="space-y-4">
                        <div>
                           <label className={labelClasses}>Full Name</label>
                           <input type="text" value={editingTeacher.name || ''} onChange={e => setEditingTeacher({...editingTeacher, name: e.target.value})} className={inputClasses}/>
                        </div>
                        <div>
                           <label className={labelClasses}>Title / Specialty</label>
                           <input type="text" value={editingTeacher.title || ''} placeholder="e.g. Professor of Anatomy" onChange={e => setEditingTeacher({...editingTeacher, title: e.target.value})} className={inputClasses}/>
                        </div>
                        <div>
                           <label className={labelClasses}>Email</label>
                           <input type="email" value={editingTeacher.email || ''} onChange={e => setEditingTeacher({...editingTeacher, email: e.target.value})} className={inputClasses}/>
                        </div>
                         <div>
                           <label className={labelClasses}>Phone Number</label>
                           <input type="tel" value={editingTeacher.phone || ''} onChange={e => setEditingTeacher({...editingTeacher, phone: e.target.value})} className={inputClasses}/>
                        </div>
                        <div>
                           <label className={labelClasses}>Photo URL</label>
                           <input type="text" value={editingTeacher.photoUrl || ''} onChange={e => setEditingTeacher({...editingTeacher, photoUrl: e.target.value})} className={inputClasses}/>
                        </div>
                        <div className="border-t pt-4 mt-4 dark:border-gray-600" />
                        <div>
                           <label className={labelClasses}>Username</label>
                           <input type="text" value={editingTeacher.username || ''} onChange={e => setEditingTeacher({...editingTeacher, username: e.target.value})} className={inputClasses}/>
                        </div>
                        <div>
                           <label className={labelClasses}>Password</label>
                           <input type="password" placeholder="Enter new or leave blank to keep current" onChange={e => setEditingTeacher({...editingTeacher, password: e.target.value})} className={inputClasses}/>
                        </div>
                        <div className="flex justify-end gap-2 mt-4">
                           <Button variant="secondary" onClick={() => setEditingTeacher(null)}>Cancel</Button>
                           <Button onClick={handleSave}>Save</Button>
                        </div>
                    </div>
                )}
            </Modal>
        </Card>
    );
};

const ManageSettings: React.FC<{
    teacher: Teacher;
    onUpdateSelf: (user: User) => void;
}> = ({ teacher, onUpdateSelf }) => {
    const [formState, setFormState] = useState({
        name: teacher.name,
        username: teacher.username,
        title: teacher.title || '',
        email: teacher.email || '',
        phone: teacher.phone || '',
        photoUrl: teacher.photoUrl || '',
        newPassword: '',
        confirmPassword: '',
    });
    const { addNotification } = useNotification();
    
    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormState(prev => ({...prev, [e.target.name]: e.target.value}));
    };

    const handleProfileSave = () => {
        if(formState.newPassword && formState.newPassword !== formState.confirmPassword) {
            addNotification({message: 'Passwords do not match.', type: 'error'});
            return;
        }
        onUpdateSelf({
            ...teacher,
            name: formState.name,
            username: formState.username,
            title: formState.title,
            email: formState.email,
            phone: formState.phone,
            photoUrl: formState.photoUrl,
            password: formState.newPassword || teacher.password,
        });
    };
    
    const labelClasses = "text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block";
    const inputClasses = "w-full border-gray-300 dark:border-gray-600 bg-light-surface dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-md shadow-sm focus:border-emerald-500 focus:ring-emerald-500";
    
    return (
        <Card className="p-6 max-w-2xl mx-auto">
            <h4 className="font-bold text-lg text-brand-dark dark:text-gray-100 mb-4">Profile Settings</h4>
            <div className="space-y-4">
                 <div>
                    <label htmlFor="name" className={labelClasses}>Full Name</label>
                    <input id="name" name="name" type="text" value={formState.name} onChange={handleChange} className={inputClasses}/>
                </div>
                 <div>
                    <label htmlFor="title" className={labelClasses}>Title / Specialty</label>
                    <input id="title" name="title" type="text" value={formState.title} onChange={handleChange} className={inputClasses}/>
                </div>
                 <div>
                    <label htmlFor="email" className={labelClasses}>Email Address</label>
                    <input id="email" name="email" type="email" value={formState.email} onChange={handleChange} className={inputClasses}/>
                </div>
                 <div>
                    <label htmlFor="phone" className={labelClasses}>Phone Number</label>
                    <input id="phone" name="phone" type="tel" value={formState.phone} onChange={handleChange} className={inputClasses}/>
                </div>
                <div>
                    <label htmlFor="photoUrl" className={labelClasses}>Photo URL</label>
                    <input id="photoUrl" name="photoUrl" type="text" value={formState.photoUrl} onChange={handleChange} className={inputClasses}/>
                </div>
                <div className="border-t pt-4 mt-4 dark:border-gray-600" />
                <div>
                    <label htmlFor="username" className={labelClasses}>Username</label>
                    <input id="username" name="username" type="text" value={formState.username} onChange={handleChange} className={inputClasses}/>
                </div>
                <div>
                    <label htmlFor="newPassword" className={labelClasses}>New Password</label>
                    <input id="newPassword" name="newPassword" type="password" placeholder="Leave blank to keep current" value={formState.newPassword} onChange={handleChange} className={inputClasses}/>
                </div>
                 <div>
                    <label htmlFor="confirmPassword" className={labelClasses}>Confirm New Password</label>
                    <input id="confirmPassword" name="confirmPassword" type="password" placeholder="Confirm new password" value={formState.confirmPassword} onChange={handleChange} className={inputClasses}/>
                </div>
                <div className="flex justify-end">
                   <Button onClick={handleProfileSave}>Save Settings</Button>
                </div>
            </div>
        </Card>
    );
};

// #endregion


const TeacherDashboard: React.FC<{
    teacher: Teacher;
    allUsers: User[];
    allCourses: Course[];
    allNotifications: Notification[];
    attendanceRecords: AttendanceRecord[];
    onUpdateAttendance: (records: AttendanceRecord[], updatedCount: number, newCount: number) => void;
    onAddNotification: (content: string, pinned: boolean, attachment?: {name: string, url: string}) => void;
    onEditNotification: (notification: Notification) => void;
    onDeleteNotification: (id: string) => void;
    onUpdateStaff: (users: User[]) => void;
    onAddStudent: (student: Student) => boolean;
    onEditStudent: (student: Student) => boolean;
    onDeleteStudent: (studentId: string) => void;
    onUpdateSelf: (user: User) => void;
    onUpdateCourses: (courses: Course[]) => void;
    onDeleteCourse: (courseId: string) => void;
}> = ({ 
    teacher, allUsers, allCourses, attendanceRecords, allNotifications, 
    onUpdateAttendance, onAddNotification, onEditNotification, onDeleteNotification, onUpdateStaff, 
    onAddStudent, onEditStudent, onDeleteStudent,
    onUpdateSelf, onUpdateCourses, onDeleteCourse 
}) => {
    const [activeTab, setActiveTab] = useState<'mark' | 'view' | 'courses' | 'students' | 'staff' | 'notifications' | 'settings'>('mark');
    
    const teacherCourses = useMemo(() => {
        return allCourses.filter(course => course.teacherId === teacher.id);
    }, [teacher.id, allCourses]);
    
    const allStudents = useMemo(() => allUsers.filter(u => u.role === Role.Student) as Student[], [allUsers]);
    const allTeachers = useMemo(() => allUsers.filter(u => u.role === Role.Teacher) as Teacher[], [allUsers]);

    const teacherAttendanceRecords = useMemo(() => {
        const courseIds = allCourses.map(c => c.id);
        return attendanceRecords.filter(r => courseIds.includes(r.courseId));
    }, [attendanceRecords, allCourses]);
    
    const tabClasses = (tabName: typeof activeTab) => 
        `px-3 py-2 text-sm font-medium rounded-t-lg transition-colors focus:outline-none whitespace-nowrap ${activeTab === tabName ? 'bg-light-surface dark:bg-dark-surface text-brand-primary border-b-2 border-brand-primary' : 'bg-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`;


    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            <div className="flex justify-between items-center">
                 <h2 className="text-2xl font-bold text-brand-dark dark:text-gray-100">Administration Dashboard</h2>
            </div>
            
            <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="-mb-px flex space-x-2 overflow-x-auto" aria-label="Tabs">
                    <button onClick={() => setActiveTab('mark')} className={tabClasses('mark')}>Mark Attendance</button>
                    <button onClick={() => setActiveTab('view')} className={tabClasses('view')}>View Records</button>
                    <button onClick={() => setActiveTab('courses')} className={tabClasses('courses')}>Manage Courses</button>
                    <button onClick={() => setActiveTab('students')} className={tabClasses('students')}>Manage Students</button>
                    <button onClick={() => setActiveTab('staff')} className={tabClasses('staff')}>Manage Staff</button>
                    <button onClick={() => setActiveTab('notifications')} className={tabClasses('notifications')}>Manage Notifications</button>
                    <button onClick={() => setActiveTab('settings')} className={tabClasses('settings')}>Settings</button>
                </nav>
            </div>
            
            <div className="mt-6">
                {activeTab === 'mark' && <MarkAttendance teacherCourses={allCourses} allStudents={allStudents} attendanceRecords={teacherAttendanceRecords} onSave={onUpdateAttendance}/>}
                {activeTab === 'view' && <ViewRecords records={teacherAttendanceRecords} students={allStudents} courses={allCourses} />}
                {activeTab === 'courses' && <ManageCourses teacherId={teacher.id} allCourses={allCourses} allStudents={allStudents} onUpdateCourses={onUpdateCourses} onDeleteCourse={onDeleteCourse}/>}
                {activeTab === 'students' && <ManageStudents allStudents={allStudents} onAddStudent={onAddStudent} onEditStudent={onEditStudent} onDeleteStudent={onDeleteStudent} onPostReminder={onAddNotification} />}
                {activeTab === 'staff' && <ManageStaff allTeachers={allTeachers} allUsers={allUsers} onUpdateStaff={onUpdateStaff} />}
                {activeTab === 'notifications' && <ManageNotifications teacherId={teacher.id} notifications={allNotifications} onAdd={onAddNotification} onEdit={onEditNotification} onDelete={onDeleteNotification} />}
                {activeTab === 'settings' && <ManageSettings teacher={teacher} onUpdateSelf={onUpdateSelf} />}
            </div>

        </div>
    );
};

export default TeacherDashboard;