import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { Student, Attendance } from '../types';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Button from '../components/Button';
import { useAuth } from '../hooks/useAuth';

interface AttendanceRecord extends Attendance {
  // Ensure students can be potentially null if the join fails or student is deleted
  students: Student | null;
}

interface GroupedAttendance {
  [date: string]: AttendanceRecord[];
}

interface StudentSummary {
  student: Student;
  present: number;
  absent: number;
}

interface StudentSummaryMap {
  [studentId: string]: StudentSummary;
}

const ViewAttendance = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchAttendance();
    } else {
      setLoading(false);
      setRecords([]);
    }
  }, [user]);

  const fetchAttendance = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Fetch all attendance records for the teacher, joining with student data
      const { data, error } = await supabase
        .from('attendance')
        .select(`
          *,
          students (*)
        `)
        .eq('teacher_id', user.id)
        .order('date', { ascending: false }) // Sort by date descending (most recent first)
        .order('created_at', { ascending: false }); // Secondary sort

      if (error) throw error;

      // Filter out records where student data might be missing after the join
      const validRecords = data?.filter(record => record.students) || [];
      setRecords(validRecords);

      console.log("Fetched attendance records:", validRecords); // DEBUG: Log fetched records

    } catch (error) {
      console.error("Error fetching attendance:", error);
      toast.error('Failed to fetch attendance records');
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  // Group records by date using useMemo for optimization
  const groupedRecords = useMemo(() => {
    const grouped: GroupedAttendance = records.reduce((acc, record) => {
      // Only process records with valid student data
      if (!record.students) return acc;

      const date = record.date;
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(record);
      // Sort students alphabetically within each date group
      acc[date].sort((a, b) => a.students!.name.localeCompare(b.students!.name));
      return acc;
    }, {} as GroupedAttendance);

    console.log("Grouped attendance records:", grouped); // DEBUG: Log grouped records
    return grouped;
  }, [records]);

  // Calculate the summary statistics for each student across all dates
  const studentSummaryData = useMemo(() => {
    const summary: StudentSummaryMap = {};
    records.forEach(record => {
      // Ensure we have student data before processing
      if (record.students) {
        const studentId = record.students.id;
        if (!summary[studentId]) {
          summary[studentId] = {
            student: record.students,
            present: 0,
            absent: 0,
          };
        }
        if (record.status === 'present') {
          summary[studentId].present += 1;
        } else if (record.status === 'absent') {
          summary[studentId].absent += 1;
        }
      }
    });
    // Convert map to array and sort alphabetically by student name
    return Object.values(summary).sort((a, b) =>
      a.student.name.localeCompare(b.student.name)
    );
  }, [records]);

  const capitalizeFirstLetter = (name: string) => {
    return name.charAt(0).toUpperCase() + name.slice(1);
  };

  // Get sorted dates (most recent first)
  const sortedDates = useMemo(() => {
    const dates = Object.keys(groupedRecords).sort((a, b) => b.localeCompare(a));
    console.log("Sorted dates:", dates); // DEBUG: Log sorted dates
    return dates;
  }, [groupedRecords]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          {/* Header */}
          <div className="flex items-center mb-8 w-full sticky top-0 bg-gray-50 py-4 z-10 border-b border-gray-200">
            <Button onClick={() => navigate(-1)} className="flex items-center gap-2 mr-4" variant="primary">
              <ArrowLeft className="w-5 h-5" />
              Back
            </Button>
            <div className="flex-grow text-center">
              <h1 className="text-3xl font-bold text-gray-900">View All Attendance</h1>
            </div>
            <div className="w-24"></div> {/* Placeholder for balance */}
          </div>

          {/* Attendance Summary Section */}
          {studentSummaryData.length > 0 && (
            <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
              <h2 className="text-xl font-semibold text-gray-800 px-6 py-4 bg-gray-100 border-b border-gray-200">
                Attendance Summary
              </h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student ID
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Present
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Absent
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {studentSummaryData.map(({ student, present, absent }) => (
                      <tr key={student.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{capitalizeFirstLetter(student.name)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{student.student_id}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className="px-2 inline-flex text-sm leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            {present}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className="px-2 inline-flex text-sm leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                            {absent}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Attendance Records By Date Section */}
          <div className="space-y-8">
            {sortedDates.length === 0 && !loading ? (
              <div className="bg-white rounded-lg shadow-sm p-6 text-center mt-8">
                <p className="text-gray-500">No attendance records found.</p>
              </div>
            ) : (
              sortedDates.map((date) => (
                <div key={date} className="bg-white shadow-sm rounded-lg overflow-hidden">
                  <h2 className="text-xl font-semibold text-gray-800 px-6 py-4 bg-gray-100 border-b border-gray-200">
                    Date: {new Date(date + 'T00:00:00').toLocaleDateString()} {/* Format date nicely */}
                  </h2>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Student ID
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Department
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Course Type
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Semester
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {groupedRecords[date].map((record) => (
                          <tr key={record.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{record.students?.name ? capitalizeFirstLetter(record.students.name) : 'N/A'}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">{record.students?.student_id || 'N/A'}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">{record.students?.department || 'N/A'}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500 capitalize">{record.students?.course_type || 'N/A'}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">{record.students?.semester || 'N/A'}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${record.status === 'present'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                                }`}>
                                {record.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ViewAttendance;
