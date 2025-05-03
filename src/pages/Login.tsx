import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import Input from '../components/Input';
import Button from '../components/Button';
import { LogIn, Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    identifier: '', // Can be username or email
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPasswordReset, setIsPasswordReset] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Check if the user is redirected from password reset
    const resetToken = searchParams.get('reset_token');
    if (resetToken) {
      setIsPasswordReset(true);
    }
  }, [searchParams]);

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { identifier, password } = formData;
    let emailToLogin = identifier;

    try {
      const isEmail = identifier.includes('@');

      if (!isEmail) {
        const { data: teacherData, error: fetchError } = await supabase
          .from('teachers')
          .select('email')
          .eq('username', identifier)
          .single();

        if (fetchError || !teacherData) {
          console.error('Error fetching user by username or user not found:', fetchError);
          throw new Error('Invalid username or password.');
        }
        emailToLogin = teacherData.email;
      } else {
        if (!isValidEmail(identifier)) {
          setError('Please enter a valid email address.');
          toast.error('Please enter a valid email address.');
          setLoading(false);
          return;
        }
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: emailToLogin,
        password: password,
      });

      if (signInError) {
        console.error('Sign in error:', signInError);
        throw new Error('Invalid username or password.');
      }

      toast.success('Welcome back!');
      navigate('/');

    } catch (error: any) {
      setError(error.message || 'Failed to sign in. Please check your credentials.');
      toast.error(error.message || 'Failed to sign in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const email = prompt('Please enter your email address:');
    if (email) {
      if (!isValidEmail(email)) {
        toast.error('Please enter a valid email address.');
        return;
      }
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/login`,
        });
        if (error) {
          toast.error(error.message || 'Failed to send reset password email.');
        } else {
          toast.success('Reset password email sent! Check your inbox.');
        }
      } catch (err) {
        toast.error('An unexpected error occurred.');
      }
    } else {
      toast.error('Email address is required.');
    }
  };

  const handleUpdatePassword = async () => {
    setPasswordError(null);

    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const resetToken = searchParams.get('reset_token');
      if (!resetToken) {
        throw new Error('Reset token is missing.');
      }

      const { error } = await supabase.auth.updateUser({ password: newPassword });

      if (error) {
        console.error('Password update error:', error);
        toast.error(error.message || 'Failed to update password.');
        setPasswordError(error.message || 'Failed to update password.');
      } else {
        toast.success('Password updated successfully! Please sign in with your new password.');
        setIsPasswordReset(false);
        navigate('/login');
      }
    } catch (error: any) {
      console.error('Password update error:', error);
      toast.error(error.message || 'Failed to update password.');
      setPasswordError(error.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-5xl mx-auto">
        {/* Title with Green Border Rounded Rectangle */}
        <div className="text-center mb-8">
          <h1 className="inline-block text-3xl font-extrabold text-gray-900 px-6 py-3 rounded-full border-4 border-green-500">
            STUDENT ATTENDANCE MANAGEMENT SYSTEM
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Introduction Column */}
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="flex justify-center">
              <LogIn className="w-12 h-12 text-green-500" />
            </div>
            <h2 className="mt-6 text-2xl font-extrabold text-gray-900 text-center">
              Welcome to the Student Attendance Managment System
            </h2>
            <p className="mt-4 text-lg text-gray-600 text-center">
              The system privides
            </p>
            <ul className="mt-6 list-disc pl-5 text-gray-700">
              <li>Automates attendance tracking.</li>
              <li>Reporting and Analytics.</li>
              <li>Facilitated easy access to student records for teachers and administrators..</li>
              <li>communication between students, lectures and stakeholders .</li>
            </ul>
            <p className="mt-4 text-lg text-gray-600 text-center">
              Please sign in or sign up to manage the attendance system.
            </p>
          </div>

          {/* Sign-in Column */}
          <div className="bg-white rounded-lg shadow-md p-8">
            {!isPasswordReset ? (
              <>
                <div className="sm:mx-auto sm:w-full sm:max-w-md">
                  <h2 className="mt-6 text-2xl font-extrabold text-gray-900 text-center">
                    Sign in to your account
                  </h2>
                  <p className="mt-2 text-sm text-gray-600 text-center">
                    Or{' '}
                    <Link to="/register" className="font-medium text-green-600 hover:text-green-500">
                      create a new account
                    </Link>
                  </p>
                </div>

                <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                  <form className="space-y-6" onSubmit={handleSubmit}>
                    <Input
                      label="Username or Email address"
                      type="text"
                      required
                      value={formData.identifier}
                      onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
                      error={error && error.includes('username') ? error : undefined}
                    />

                    <div className="relative">
                      <Input
                        label="Password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        error={error && error.includes('password') ? error : undefined}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-[38px] transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>

                    {error && !error.includes('username') && !error.includes('password') && (
                      <p className="text-sm text-red-500">{error}</p>
                    )}

                    <div className="text-sm">
                      <button
                        type="button"
                        onClick={handleForgotPassword}
                        className="font-medium text-green-600 hover:text-green-500"
                      >
                        Forgot password?
                      </button>
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      isLoading={loading}
                    >
                      Sign in
                    </Button>
                  </form>
                </div>
              </>
            ) : (
              <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="mt-6 text-2xl font-extrabold text-gray-900 text-center">
                  Update Your Password
                </h2>
                <p className="mt-2 text-sm text-gray-600 text-center">
                  Please create a new password for your account.
                </p>

                <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                  <form className="space-y-6">
                    <Input
                      label="New Password"
                      type="password"
                      required
                      minLength={6}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />

                    <Input
                      label="Confirm New Password"
                      type="password"
                      required
                      minLength={6}
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                    />

                    {passwordError && (
                      <p className="text-sm text-red-500">{passwordError}</p>
                    )}

                    <Button
                      type="button"
                      className="w-full"
                      isLoading={loading}
                      onClick={handleUpdatePassword}
                    >
                      Update Password
                    </Button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
