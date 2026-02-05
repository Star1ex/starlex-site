import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '@/services/api/index.js';

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setErrorMessage('');

    if (!email || !email.includes('@') || !email.includes('.')) {
      setErrorMessage('Enter a valid email address');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await authService.requestPasswordReset({ email });
      setMessage(response?.message || 'If an account exists, a reset code was sent.');
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 429) {
        setMessage('If an account exists, a reset code was sent. Please try again later.');
      } else {
        setErrorMessage(err?.response?.data?.error || 'Something went wrong. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-white transition-colors duration-300">
      <div className="flex flex-col md:flex-row w-full max-w-5xl overflow-hidden bg-white">
        <div className="w-full md:w-1/2 p-8 md:p-16 flex flex-col justify-center items-start">
          <h1 className="text-4xl sm:text-5xl md:text-7xl text-black font-serif mb-4 md:mb-6 transition-colors duration-300">
            Reset
          </h1>
          <div className="w-16 sm:w-24 md:w-1/3 h-0.5 bg-black mb-4 md:mb-6 transition-colors duration-300"></div>
          <p className="text-base sm:text-lg text-black transition-colors duration-300">
            We will send a secure reset code.
          </p>
        </div>

        <div className="w-full md:w-1/2 p-8 md:p-16 flex flex-col justify-center">
          <form className="space-y-6 sm:space-y-7" onSubmit={handleSubmit}>
            {message && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-center text-sm text-green-700 font-medium">
                  {message}
                </p>
              </div>
            )}

            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-center text-sm text-red-700 font-medium">
                  {errorMessage}
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-black uppercase tracking-wider mb-1">
                Email
              </label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                placeholder="your@email.com"
                disabled={isSubmitting}
                className="mt-1 w-full border-b bg-white border-black focus:border-black focus:outline-none py-2 text-black placeholder-gray-500 transition-colors duration-300 disabled:opacity-50"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 mt-6 sm:mt-8 bg-black text-white font-semibold rounded-md shadow-md hover:bg-gray-800 transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Sending...' : 'Send Reset Code'}
            </button>

            <p className="text-center text-sm text-black pt-4 transition-colors duration-300">
              Remembered your password?{' '}
              <button
                type="button"
                onClick={() => navigate('/sign-in')}
                disabled={isSubmitting}
                className="text-black font-medium hover:text-gray-700 transition-colors duration-200"
              >
                Sign in
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};
