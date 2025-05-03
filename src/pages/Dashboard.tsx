import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, ClipboardList, Calendar, LogOut, BookOpen, GraduationCap, User, Edit } from 'lucide-react';
import { motion } from 'framer-motion';
import Button from '../components/Button';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import { Student } from '../types';
import { Link } from 'react-router-dom';
import Input from '../components/Input';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [username, setUsername] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [loadingUsername, setLoadingUsername] = useState(true);
  const [totalStudents, setTotalStudents] = useState<number>(0);
  const [totalPresent, setTotalPresent] = useState<number>(0);
  const [totalAbsent, setTotalAbsent] = useState<number>(0);
  const [activeDepartments, setActiveDepartments] = useState<string[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [profileUrl, setProfileUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        setLoadingUsername(true);
        try {
          const { data, error } = await supabase
            .from('teachers')
            .select('username, profile_url, email')
            .eq('id', user.id)
            .single();

          if (error) {
            console.error('Error fetching user data:', error);
            setUsername(user.email?.split('@')[0] || 'User');
            setEmail(user.email || null);
            setFormData({ username: '', email: user.email || '', password: '' });
          } else if (data) {
            setUsername(data.username);
            setEmail(data.email);
            setProfileUrl(data.profile_url || null);
            setFormData({ username: data.username, email: data.email || '', password: '' });
          } else {
            setUsername(user.email?.split('@')[0] || 'User');
            setEmail(user.email || null);
            setFormData({ username: '', email: user.email || '', password: '' });
          }
        } catch (err) {
          console.error('Unexpected error fetching user data:', err);
          setUsername(user.email?.split('@')[0] || 'User');
          setEmail(user.email || null);
          setFormData({ username: '', email: user.email || '', password: '' });
        } finally {
          setLoadingUsername(false);
        }
      } else {
        setUsername(null);
        setEmail(null);
        setLoadingUsername(false);
      }
    };

    fetchUserData();
  }, [user]);

  useEffect(() => {
    const fetchStats = async () => {
      if (user) {
        setLoadingStats(true);
        try {
          // Fetch total students
          const { data: studentsData, error: studentsError, count: totalStudentsCount } = await supabase
            .from('students')
            .select('*', { count: 'exact' })
            .eq('teacher_id', user.id);

          if (studentsError) {
            console.error('Error fetching total students:', studentsError);
          } else {
            setTotalStudents(totalStudentsCount || 0);
          }

          // Fetch today's attendance
          const today = new Date().toISOString().split('T')[0];
          const { data: attendanceData, error: attendanceError } = await supabase
            .from('attendance')
            .select('*')
            .eq('teacher_id', user.id)
            .eq('date', today);

          if (attendanceError) {
            console.error('Error fetching today\'s attendance:', attendanceError);
          } else {
            const presentCount = attendanceData?.filter(record => record.status === 'present').length || 0;
            const absentCount = attendanceData?.filter(record => record.status === 'absent').length || 0;

            setTotalPresent(presentCount);
            setTotalAbsent(absentCount);
          }

          // Fetch active departments (assuming you have a courses table)
          const departments = ['IT', 'CSE', 'MSE', 'EEE', 'ECE', 'BCEN'];
          setActiveDepartments(departments);

        } catch (err) {
          console.error('Unexpected error fetching stats:', err);
        } finally {
          setLoadingStats(false);
        }
      }
    };

    fetchStats();
  }, [user]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { data: uploadData, error: storageError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type
        });

      if (storageError) {
        throw storageError;
      }

      const { error: dbError } = await supabase
        .from('teachers')
        .update({ profile_url: `${supabase.supabaseUrl}/storage/v1/object/public/avatars/${filePath}` })
        .eq('id', user?.id)

      if (dbError) {
        throw dbError;
      }

      setProfileUrl(`${supabase.supabaseUrl}/storage/v1/object/public/avatars/${filePath}`);
      toast.success('Profile picture updated!');
    } catch (error: any) {
      console.error('Upload error: ', error.message);
      toast.error('Failed to upload profile picture.');
    } finally {
      setUploading(false);
    }
  };

  const toggleEdit = () => {
    setIsEditing(!isEditing);
    if (!isEditing) {
      setFormData({
        username: username || '',
        email: email || '',
        password: '',
      });
      setPasswordError(null);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleUpdatePassword = async () => {
    setPasswordError(null);

    if (formData.password.length < 6) {
      setPasswordError('Password must be at least 6 characters long.');
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({ password: formData.password });

      if (error) {
        console.error('Password update error:', error);
        toast.error(error.message || 'Failed to update password.');
        setPasswordError(error.message || 'Failed to update password.');
      } else {
        toast.success('Password updated successfully!');
        setFormData({ ...formData, password: '' });
      }
    } catch (error: any) {
      console.error('Password update error:', error);
      toast.error(error.message || 'Failed to update password.');
      setPasswordError(error.message || 'Failed to update password.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingUsername(true);
    try {
      const updateData: { username?: string; email?: string } = {};
      if (formData.username !== username) {
        updateData.username = formData.username;
      }
      if (formData.email !== email) {
        updateData.email = formData.email;
      }

      if (Object.keys(updateData).length === 0 && !formData.password) {
        toast.info('No changes to save.');
        setIsEditing(false);
        return;
      }

      const { error } = await supabase
        .from('teachers')
        .update(updateData)
        .eq('id', user?.id);

      if (error) {
        throw error;
      }

      if (formData.password) {
        await handleUpdatePassword();
      }

      setUsername(formData.username);
      setEmail(formData.email);
      toast.success('Profile updated successfully!');
      setIsEditing(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile.');
    } finally {
      setLoadingUsername(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <GraduationCap className="w-16 h-16 text-green-500 mx-auto mb-6" />
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Student Attendance System</h1>
          <p className="text-gray-600 mb-8 max-w-md">
            Efficiently manage student attendance and track academic progress with our comprehensive system.
          </p>
          <Button
            onClick={() => navigate('/login')}
            className="w-full max-w-xs mx-auto"
          >
            Teacher Login
          </Button>
        </motion.div>
      </div>
    );
  }

  const menuItems = [
    {
      title: 'Student List',
      description: 'View and manage your students',
      icon: Users,
      path: '/students',
      color: 'bg-blue-100 text-blue-600',
    },
    {
      title: 'Take Attendance',
      description: 'Mark attendance for today',
      icon: ClipboardList,
      path: '/attendance/take',
      color: 'bg-green-100 text-green-600',
    },
    {
      title: 'View Attendance',
      description: 'Check previous attendance records',
      icon: Calendar,
      path: '/attendance/view',
      color: 'bg-purple-100 text-purple-600',
    },
    {
      title: 'Course Management',
      description: 'Manage your courses and schedules',
      icon: BookOpen,
      path: '/courses',
      color: 'bg-orange-100 text-orange-600',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex justify-between items-center mb-8"
        >
          <div className="flex items-center">
            <label htmlFor="avatar">
              {profileUrl ? (
                <img
                  src={profileUrl}
                  alt="Profile"
                  className="rounded-full w-16 h-16 object-cover cursor-pointer mr-4"
                />
              ) : (
                <div className="rounded-full w-16 h-16 bg-gray-200 flex items-center justify-center cursor-pointer mr-4">
                  <User className="text-gray-500 w-8 h-8" />
                </div>
              )}
              <input
                type="file"
                id="avatar"
                accept="image/*"
                onChange={handleUpload}
                className="hidden"
                disabled={!isEditing}
              />
            </label>
            <div className="ml-4">
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome, {loadingUsername ? '...' : username}!
              </h1>
              {!isEditing ? (
                <Button
                  variant="secondary"
                  onClick={toggleEdit}
                  className="flex items-center gap-2 mt-2"
                >
                  <Edit className="w-4 h-4" />
                  Edit Profile
                </Button>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Input
                    label="Username"
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    required
                  />
                  <Input
                    label="Email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                  <Input
                    label="New Password"
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter new password"
                  />
                  {passwordError && (
                    <p className="text-sm text-red-500">{passwordError}</p>
                  )}
                  <div className="flex justify-end gap-2">
                    <Button variant="secondary" onClick={toggleEdit}>
                      Cancel
                    </Button>
                    <Button type="submit" isLoading={loadingUsername}>
                      Save
                    </Button>
                  </div>
                </form>
              )}
            </div>
           </div >
          <div className="flex items-center gap-4">
            <Button
              variant="primary"
              onClick={handleLogout}
              className="flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {menuItems.map((menuItem) => (
            <motion.button
              key={menuItem.path}
              variants={item}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(menuItem.path)}
              className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 text-left"
            >
              <div className={`flex items-center justify-center w-12 h-12 ${menuItem.color} rounded-lg mb-4`}>
                <menuItem.icon className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">{menuItem.title}</h2>
              <p className="text-gray-500">{menuItem.description}</p>
            </motion.button>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8 bg-white rounded-lg shadow-sm p-6"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Stats</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="text-green-600 font-medium">Total Students</h3>
              <p className="text-2xl font-bold text-green-700 mt-2">
                {loadingStats ? 'Loading...' : totalStudents}
              </p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-blue-600 font-medium">Today's Attendance</h3>
              <p className="text-lg font-bold text-blue-700 mt-2">
                {loadingStats ? 'Loading...' : (
                  <>
                    Present: {totalPresent}
                    <br />
                    Absent: {totalAbsent}
                    <br />
                    Total: {totalPresent + totalAbsent}
                  </>
                )}
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="text-purple-600 font-medium">Active Departments</h3>
              <div className="grid grid-cols-2 gap-2">
                {loadingStats ? (
                  'Loading...'
                ) : (
                  activeDepartments.map((department) => (
                    <Link
                      key={department}
                      to={`/students?department=${department}`}
                      className="text-xl font-bold text-purple-700 mt-2 hover:underline"
                    >
                      {department}
                    </Link>
                  ))
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
