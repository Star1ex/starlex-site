import React, { ChangeEvent } from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export const SignUpPage = () => {
  const navigate = useNavigate();
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState('');
  const [formFirstName, setFirstName] = useState("");
  const [formLastName, setLastName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  function handleToSignIn() {
    navigate("/sign-in");
  }
  
  function handleSetEmail(e: ChangeEvent<HTMLInputElement>) {
    setFormEmail(e.target.value);
  }
  
  function handleSetPassword(e: ChangeEvent<HTMLInputElement>) {
    setFormPassword(e.target.value);
  }
  
  function handleSetFirstName(e: ChangeEvent<HTMLInputElement>) {
    setFirstName(e.target.value);
  }
  
  function handleSetLastName(e: ChangeEvent<HTMLInputElement>) {
    setLastName(e.target.value);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    setErrorMessage('');  
    e.preventDefault();

    if (!formEmail || !formPassword || !formFirstName || !formLastName) {
      setErrorMessage('All fields must be filled in');
      return; 
    }
    
    if (!formEmail.includes('@') || !formEmail.includes('.')) {
      setErrorMessage('Please enter a valid email address.');
      return; 
    }

    if (formPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    const data = {
      email: formEmail,
      password: formPassword,
      first_name: formFirstName,
      last_name: formLastName
    };

    setIsLoading(true);

    try {
      const response = await fetch(`/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        // Navigate to verification page with user ID and email
        navigate('/verify-email', {
          state: {
            userId: result.user_id,
            email: formEmail
          }
        });
      } else {
        if (response.status === 400) {
          setErrorMessage(result.error || "Registration failed");
        } else if (response.status === 500) {
          setErrorMessage(result.error || "Server error. Please try again.");
        } else {
          setErrorMessage("Unknown registration error");
        }
      }
    } catch (error) {
      setErrorMessage('Unable to connect to the server. Check your connection.');
      console.error('Network or server error:', error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-white transition-colors duration-300">
      <div className="flex flex-col md:flex-row w-full max-w-5xl overflow-hidden bg-white">

        {/* Left panel */}
        <div className="w-full md:w-1/2 p-8 md:p-16 flex flex-col justify-center items-start">
          <h1 className="text-4xl sm:text-5xl md:text-7xl text-black font-serif mb-4 md:mb-6 transition-colors duration-300">Begin</h1>
          <div className="w-16 sm:w-24 md:w-1/3 h-0.5 bg-black mb-4 md:mb-6 transition-colors duration-300"></div>
          <p className="text-base sm:text-lg text-black transition-colors duration-300">Start something new</p>
        </div>

        {/* Right panel */}
        <div className="w-full md:w-1/2 p-8 md:p-16 flex flex-col justify-center">
          <form className="space-y-4 sm:space-y-6" onSubmit={handleSubmit}>

            <div>
              <label className="block text-sm sm:text-base font-medium text-black uppercase tracking-wider mb-1">First Name</label>
              <input
                value={formFirstName}
                onChange={handleSetFirstName}
                type="text"
                placeholder="John"
                disabled={isLoading}
                className="mt-1 w-full border-b bg-white border-black focus:border-black focus:outline-none py-2 text-black placeholder-gray-500 transition-colors duration-300 disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-sm sm:text-base font-medium text-black uppercase tracking-wider mb-1">Last Name</label>
              <input
                value={formLastName}
                onChange={handleSetLastName}
                type="text"
                placeholder="Doe"
                disabled={isLoading}
                className="mt-1 w-full border-b bg-white border-black focus:border-black focus:outline-none py-2 text-black placeholder-gray-500 transition-colors duration-300 disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-sm sm:text-base font-medium text-black uppercase tracking-wider mb-1">Email</label>
              <input
                value={formEmail}
                onChange={handleSetEmail}
                type="email"
                placeholder="your@email.com"
                disabled={isLoading}
                className="mt-1 w-full border-b bg-white border-black focus:border-black focus:outline-none py-2 text-black placeholder-gray-500 transition-colors duration-300 disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-sm sm:text-base font-medium text-black uppercase tracking-wider mb-1">Password</label>
              <input
                value={formPassword}
                onChange={handleSetPassword}
                type="password"
                placeholder="Min 6 characters"
                disabled={isLoading}
                className="mt-1 w-full border-b bg-white border-black focus:border-black focus:outline-none py-2 text-black placeholder-gray-500 transition-colors duration-300 disabled:opacity-50"
              />
            </div>

            {errorMessage && (
              <p className="text-center text-sm text-red-600 font-medium transition-colors duration-300">
                {errorMessage}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 mt-4 sm:mt-6 bg-black text-white font-semibold rounded-md shadow-md hover:bg-gray-800 transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isLoading ? "Creating Account..." : "Sign Up"}
            </button>

            <p className="text-center text-sm text-black pt-3 sm:pt-4 transition-colors duration-300">
              Have an account?{" "}
              <button
                type="button"
                className="text-black font-medium hover:text-gray-700 transition-colors duration-200"
                onClick={handleToSignIn}
                disabled={isLoading}
              >
                Sign-In
              </button>
            </p>

          </form>
        </div>
      </div>
    </div>
  );
};