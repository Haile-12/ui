import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Student } from '../types';
import Button from '../components/Button';
import { toast } from 'react-hot-toast';
import { Check, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const TakeAttendance = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [attendance, setAttendance] = useState<Record<string, 'present' | 'absent'>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('name');

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      toast.error('Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  const handleAttendance = (studentId: string, status: 'present' | 'absent') => {
    setAttendance(prev => {
      const newAttendance = { ...prev };
      if (newAttendance[studentId] === status) {
        delete newAttendance[studentId]; // Toggle off if already selected
      } else {
        newAttendance[studentId] = status; // Set status if not selected
      }
      return newAttendance;
    });
  };

  const handleSubmit = async () => {
    if (Object.keys(attendance).length === 0) {
      toast.error('Please mark attendance for at least one student');
      return;
    }

    if (!user) {
      toast.error('You must be logged in to take attendance');
      return;
    }

    setSubmitting(true);
    try {
      const attendanceRecords = Object.entries(attendance).map(([student_id, status]) => ({
        student_id,
        status,
        date: new Date().toISOString().split('T')[0],
        teacher_id: user.id
      }));

      const { data, error } = await supabase
        .from('attendance')
        .insert(attendanceRecords);

      if (error) {
        if (error.message.includes('duplicate key value violates unique constraint')) {
          toast.error('Attendance has already been recorded for today.');
        } else {
          throw error;
        }
        return;
      }

      toast.success('Attendance recorded successfully');
      setAttendance({});
    } catch (error: any) {
      toast.error(error.message || 'Failed to record attendance');
    } finally {
      setSubmitting(false);
    }
  };

  const capitalizeFirstLetter = (name: string) => {
    return name.charAt(0).toUpperCase() + name.slice(1);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 flex flex-col items-center">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex items-center mb-8 w-full"> {/* Changed from justify-between to items-center and added w-full */}
          <Button onClick={() => navigate(-1)} className="flex items-center gap-2" variant="primary">
            <ArrowLeft className="w-5 h-5" />
            Back
          </Button>
          <div className="flex-grow text-center"> {/* Added flex-grow and text-center to the title */}
            <h1 className="text-3xl font-bold text-gray-900">Take Attendance</h1>
          </div>
          <Button
            onClick={handleSubmit}
            isLoading={submitting}
            disabled={Object.keys(attendance).length === 0}
          >
            Submit Attendance
          </Button>
        </div>

        {students.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <p className="text-gray-500">No students found. Add students first!</p>
          </div>
        ) : (
          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
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
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Attendance
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {students.map((student) => (
                  <tr key={student.id} className={attendance[student.id] ? `bg-${attendance[student.id] === 'present' ? 'green' : 'red'}-50` : ''}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{capitalizeFirstLetter(student.name)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{student.student_id}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{student.department}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant={attendance[student.id] === 'present' ? 'primary' : 'secondary'}
                          onClick={() => handleAttendance(student.id, 'present')}
                          className="inline-flex items-center"
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          variant={attendance[student.id] === 'absent' ? 'danger' : 'secondary'}
                          onClick={() => handleAttendance(student.id, 'absent')}
                          className="inline-flex items-center"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default TakeAttendance;
