import React, { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { Student, Course, AttendanceRecord, Teacher } from '../types';
import Card from './common/Card';
import Button from './common/Button';
import { getAttendanceAdvice } from '../services/geminiService';
import MonthlySummaryChart from './common/MonthlySummaryChart';

interface StudentDashboardProps {
  student: Student;
  courses: Course[];
  attendanceRecords: AttendanceRecord[];
  teachers: Teacher[];
}

const COLORS = ['#10b981', '#ef4444']; // Green for Present, Red for Absent

const getAttendanceStats = (records: AttendanceRecord[]) => {
  if (records.length === 0) return { percentage: 100, present: 0, total: 0 };
  const presentCount = records.filter(r => r.present).length;
  const totalCount = records.length;
  const percentage = Math.round((presentCount / totalCount) * 100);
  return { percentage, present: presentCount, total: totalCount };
};

const CourseAttendanceCard: React.FC<{ course: Course; records: AttendanceRecord[] }> = ({ course, records }) => {
  const { percentage, present, total } = getAttendanceStats(records);
  const [isLoading, setIsLoading] = useState(false);
  const [advice, setAdvice] = useState('');

  const handleGetAdvice = async () => {
    setIsLoading(true);
    setAdvice('');
    const generatedAdvice = await getAttendanceAdvice(course.name, percentage);
    setAdvice(generatedAdvice);
    setIsLoading(false);
  };

  const getStatusColor = () => {
    if (percentage >= 85) return 'text-green-500';
    if (percentage >= 75) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <Card className="p-4 flex flex-col justify-between">
      <div>
        <h3 className="font-bold text-lg text-brand-dark dark:text-gray-100">{course.name}</h3>
        <p className={`text-3xl font-bold mt-2 ${getStatusColor()}`}>{percentage}%</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">{present} / {total} classes attended</p>
      </div>
      <div className="mt-4">
        {percentage < 85 && (
            <Button onClick={handleGetAdvice} isLoading={isLoading} variant="secondary" className="w-full text-sm">
                Get AI Insights
            </Button>
        )}
        {advice && (
          <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg text-sm text-emerald-800 dark:text-emerald-200 whitespace-pre-wrap font-mono">
            <h4 className="font-bold mb-2">Your AI-Powered Advice:</h4>
            {advice}
          </div>
        )}
      </div>
    </Card>
  );
};

const StudentDashboard: React.FC<StudentDashboardProps> = ({ student, courses, attendanceRecords, teachers }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'log' | 'faculty'>('dashboard');
  const [filterDate, setFilterDate] = useState('');

  const overallAttendanceData = useMemo(() => {
    const present = attendanceRecords.filter(r => r.present).length;
    const absent = attendanceRecords.length - present;
    return [{ name: 'Present', value: present }, { name: 'Absent', value: absent }];
  }, [attendanceRecords]);
  
  const { percentage: overallPercentage, present: totalPresent, total: totalClasses } = getAttendanceStats(attendanceRecords);

  const sortedAndFilteredRecords = useMemo(() => {
    return attendanceRecords
      .filter(record => !filterDate || record.date === filterDate)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [attendanceRecords, filterDate]);
  
  const studentTeachers = useMemo(() => {
    const teacherIds = new Set(courses.map(c => c.teacherId));
    return teachers.filter(t => teacherIds.has(t.id));
  }, [courses, teachers]);

  const tabClasses = (tabName: typeof activeTab) => 
    `px-4 py-2 text-sm font-medium rounded-t-lg transition-colors focus:outline-none ${activeTab === tabName ? 'bg-light-surface dark:bg-dark-surface text-brand-primary border-b-2 border-brand-primary' : 'bg-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h2 className="text-2xl font-bold text-brand-dark dark:text-gray-100 mb-6">Your Dashboard</h2>
      
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="-mb-px flex space-x-4" aria-label="Tabs">
          <button onClick={() => setActiveTab('dashboard')} className={tabClasses('dashboard')}>Dashboard</button>
          <button onClick={() => setActiveTab('log')} className={tabClasses('log')}>Detailed Log</button>
          <button onClick={() => setActiveTab('faculty')} className={tabClasses('faculty')}>Faculty</button>
        </nav>
      </div>
      
      <div className="mt-6">
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-1 p-4 flex flex-col items-center justify-center">
                  <h3 className="font-bold text-xl text-brand-dark dark:text-gray-100 mb-2">Overall Attendance</h3>
                  <div className="w-full h-40">
                      <ResponsiveContainer>
                          <PieChart>
                              <Pie
                                  data={overallAttendanceData}
                                  cx="50%"
                                  cy="50%"
                                  labelLine={false}
                                  outerRadius={60}
                                  fill="#8884d8"
                                  dataKey="value"
                              >
                                  {overallAttendanceData.map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                  ))}
                              </Pie>
                              <Tooltip contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.8)', border: 'none', borderRadius: '0.5rem' }} itemStyle={{ color: '#e5e7eb' }} />
                              <Legend wrapperStyle={{fontSize: '12px'}}/>
                          </PieChart>
                      </ResponsiveContainer>
                  </div>
                  <p className="text-4xl font-bold text-brand-dark dark:text-gray-100">{overallPercentage}%</p>
                  <p className="text-md text-gray-500 dark:text-gray-400 mt-1">Attended {totalPresent} out of {totalClasses} classes</p>
              </Card>
              <Card className="lg:col-span-2 p-6">
                  <h3 className="font-bold text-xl text-brand-dark dark:text-gray-100 mb-4">Course Breakdown</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {courses.map(course => {
                          const courseRecords = attendanceRecords.filter(r => r.courseId === course.id);
                          if (courseRecords.length === 0) return null;
                          return <CourseAttendanceCard key={course.id} course={course} records={courseRecords} />;
                      })}
                  </div>
              </Card>
            </div>
            <Card className="p-6">
              <MonthlySummaryChart records={attendanceRecords} title="Monthly Summary" color="#10b981" />
            </Card>
          </div>
        )}
        {activeTab === 'log' && (
          <Card className="p-6">
            <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
              <h3 className="font-bold text-xl text-brand-dark dark:text-gray-100">Detailed Attendance Log</h3>
              <div className="flex items-center gap-2">
                 <label htmlFor="date-filter" className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter by Date:</label>
                 <input
                   type="date"
                   id="date-filter"
                   value={filterDate}
                   onChange={e => setFilterDate(e.target.value)}
                   className="border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md shadow-sm text-sm focus:border-emerald-500 focus:ring-emerald-500"
                 />
                 <button
                   onClick={() => setFilterDate('')}
                   className="px-3 py-1.5 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 transition-colors"
                   aria-label="Clear date filter"
                 >
                   Clear
                 </button>
              </div>
            </div>
            <div className="overflow-x-auto max-h-96">
              <table className="min-w-full bg-light-surface dark:bg-dark-surface">
                <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                  <tr>
                    <th scope="col" className="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Course</th>
                    <th scope="col" className="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                    <th scope="col" className="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {sortedAndFilteredRecords.length > 0 ? (
                    sortedAndFilteredRecords.map(record => {
                      const course = courses.find(c => c.id === record.courseId);
                      return (
                        <tr key={`${record.id}-${record.date}`}>
                          <td className="py-4 px-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{course?.name || 'Unknown Course'}</td>
                          <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{new Date(record.date + 'T00:00:00').toLocaleDateString()}</td>
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
                      <td colSpan={3} className="text-center py-6 text-gray-500 dark:text-gray-400">
                        No records found{filterDate && ` for ${new Date(filterDate + 'T00:00:00').toLocaleDateString()}`}.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}
        {activeTab === 'faculty' && (
          <div>
            <h3 className="text-xl font-bold text-brand-dark dark:text-gray-100 mb-4">Meet Your Instructors</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {studentTeachers.length > 0 ? studentTeachers.map(teacher => (
                    <Card key={teacher.id} className="p-6 flex flex-col items-center">
                       <img 
                          src={teacher.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(teacher.name)}&background=10b981&color=fff`} 
                          alt={`Photo of ${teacher.name}`}
                          className="w-24 h-24 rounded-full mx-auto mb-4 object-cover shadow-lg"
                        />
                        <h4 className="font-bold text-lg text-brand-primary">{teacher.name}</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{teacher.title || 'Instructor'}</p>
                        
                        <div className="space-y-3 text-sm mt-auto w-full">
                          {teacher.email && (
                              <a href={`mailto:${teacher.email}`} className="flex items-center justify-center gap-2 text-gray-700 dark:text-gray-300 hover:text-brand-primary transition-colors py-2 bg-gray-100 dark:bg-gray-700/50 rounded-lg">
                                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                                </svg> 
                                 <span>Email</span>
                              </a>
                          )}
                          {teacher.phone && (
                              <a href={`tel:${teacher.phone}`} className="flex items-center justify-center gap-2 text-gray-700 dark:text-gray-300 hover:text-brand-primary transition-colors py-2 bg-gray-100 dark:bg-gray-700/50 rounded-lg">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                                </svg>
                                 <span>Call</span>
                              </a>
                          )}
                        </div>
                    </Card>
                )) : (
                  <p className="text-gray-500 dark:text-gray-400 col-span-full text-center py-8">No faculty information available for your courses.</p>
                )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;