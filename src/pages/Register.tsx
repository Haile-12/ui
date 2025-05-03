import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import Input from '../components/Input';
import Button from '../components/Button';
import { UserPlus, Eye, EyeOff } from 'lucide-react';

// Define constants for dropdowns
const DEPARTMENTS = ['IT', 'CSE', 'MSE', 'EEE', 'ECE', 'BCEN'] as const;
const SEMESTERS = ['First', 'Second'] as const;
const EDUCATION_LEVELS = [
  'Associate Degree',
  'Bachelor\'s Degree',
  'Master\'s Degree',
  'Doctorate (PhD)',
  'Postdoctoral Fellowship',
  'Professional Degree (MD, JD, etc.)',
  'Diploma',
  'Certificate',
  'High School Diploma/GED',
  'Other',
] as const;

const Register = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    department: DEPARTMENTS[0], // Default to first option
    course_name: '',
    semester: SEMESTERS[0], // Default to first option
    gender: '',
    education_level: '', // Changed from degree_level
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    }
    if (!formData.email.includes('@') || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters long';
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    if (!formData.department) {
      newErrors.department = 'Department is required';
    }
    if (!formData.course_name.trim()) {
      newErrors.course_name = 'Course Name is required';
    }
    if (!formData.semester) {
      newErrors.semester = 'Semester is required';
    }
    if (!formData.gender) {
      newErrors.gender = 'Gender is required';
    }
    if (!formData.education_level) {
      newErrors.education_level = 'Education Level is required';
    }


    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        // options: { data: { username: formData.username } } // Add username to user_metadata if needed
      });

      if (authError) {
        if (authError.message.includes('already registered')) {
           setErrors({ email: 'This email is already registered.' });
        } else if (authError.message.includes('Password should be at least 6 characters')) {
           setErrors({ password: authError.message });
        } else {
          toast.error(authError.message || 'An unexpected authentication error occurred.');
        }
        return;
      }


      if (!authData.user) {
        throw new Error('Registration failed - no user data returned');
      }

      // Check if username already exists before inserting into teachers
      const { data: existingUser, error: usernameCheckError } = await supabase
        .from('teachers')
        .select('username')
        .eq('username', formData.username)
        .maybeSingle(); // Use maybeSingle to not error if no user found

      if (usernameCheckError) {
        console.error('Error checking username:', usernameCheckError);
        // Decide how to handle this - maybe proceed but warn, or rollback auth user?
        // For now, let's try to delete the auth user if the profile insert might fail
        await supabase.auth.admin.deleteUser(authData.user.id); // Requires service_role key setup
        toast.error('Error checking username uniqueness. Registration cancelled.');
        return;
      }

      if (existingUser) {
        setErrors({ username: 'This username is already taken.' });
        // Clean up the created auth user since profile insert will fail or be incorrect
        await supabase.auth.admin.deleteUser(authData.user.id); // Requires service_role key setup
        toast.error('Username already taken. Registration cancelled.');
        return;
      }


      const { error: profileError } = await supabase
        .from('teachers')
        .insert([
          {
            id: authData.user.id, // Link to the auth user
            username: formData.username,
            department: formData.department,
            course_name: formData.course_name,
            semester: formData.semester,
            gender: formData.gender,
            degree_level: formData.education_level, // Use the correct field name for the DB
          },
        ]);

      if (profileError) {
        console.error('Profile creation error:', profileError);
        // Attempt to clean up the auth user if profile insertion fails
        try {
           // Note: Deleting the user might require admin privileges depending on your Supabase setup
           // Consider using a server-side function for robust cleanup
           await supabase.auth.admin.deleteUser(authData.user.id);
           toast.error('Failed to create profile. Registration cancelled.');
        } catch (cleanupError) {
           console.error('Failed to cleanup auth user:', cleanupError);
           toast.error('Failed to create profile and cleanup user. Please contact support.');
        }
        // Provide more specific error feedback if possible
        if (profileError.message.includes('duplicate key value violates unique constraint "teachers_username_key"')) {
          setErrors({ username: 'This username is already taken.' });
        } else {
          toast.error(profileError.message || 'Failed to save profile details.');
        }
        return; // Stop execution
      }


      toast.success('Registration successful! Please sign in.');
      navigate('/login');
    } catch (error: any) {
      console.error('Registration error:', error);
      // Avoid showing generic "failed to register" if specific errors were set
      if (Object.keys(errors).length === 0) {
         toast.error(error.message || 'Failed to register. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <UserPlus className="w-12 h-12 text-green-500" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Create your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-green-600 hover:text-green-500">
            Sign in
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <Input
              label="Username"
              required
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              error={errors.username}
            />

            <Input
              label="Email address"
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              error={errors.email}
            />

            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                error={errors.password}
              />
              <button
                type="button"
                className="absolute right-3 top-[38px] transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <div className="relative">
              <Input
                label="Confirm Password"
                type={showConfirmPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                error={errors.confirmPassword}
              />
              <button
                type="button"
                className="absolute right-3 top-[38px] transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Department <span className="text-red-500">*</span>
              </label>
              <select
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 ${errors.department ? 'border-red-500' : 'border-gray-300'}`}
                required
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              >
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
              {errors.department && <p className="mt-1 text-sm text-red-500">{errors.department}</p>}
            </div>

            <Input
              label="Course Name"
              required
              value={formData.course_name}
              onChange={(e) => setFormData({ ...formData, course_name: e.target.value })}
              error={errors.course_name}
            />

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Semester <span className="text-red-500">*</span>
              </label>
              <select
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 ${errors.semester ? 'border-red-500' : 'border-gray-300'}`}
                required
                value={formData.semester}
                onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
              >
                {SEMESTERS.map((sem) => (
                  <option key={sem} value={sem}>
                    {sem} Semester
                  </option>
                ))}
              </select>
              {errors.semester && <p className="mt-1 text-sm text-red-500">{errors.semester}</p>}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gender <span className="text-red-500">*</span>
              </label>
              <select
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 ${errors.gender ? 'border-red-500' : 'border-gray-300'}`}
                required
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
              {errors.gender && <p className="mt-1 text-sm text-red-500">{errors.gender}</p>}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Education Level <span className="text-red-500">*</span>
              </label>
              <select
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 ${errors.education_level ? 'border-red-500' : 'border-gray-300'}`}
                required
                value={formData.education_level}
                onChange={(e) => setFormData({ ...formData, education_level: e.target.value })}
              >
                <option value="">Select education level</option>
                {EDUCATION_LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
              {errors.education_level && <p className="mt-1 text-sm text-red-500">{errors.education_level}</p>}
            </div>

            <Button
              type="submit"
              className="w-full"
              isLoading={loading}
            >
              Register
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
