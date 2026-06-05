import React, { useState, useRef, KeyboardEvent, ClipboardEvent } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { authService } from '@/services/api/index.js';

export const VerifyEmailPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || "";

  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) {
      value = value[0];
    }

    if (!/^\d*$/.test(value)) {
      return;
    }

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);
    
    if (!/^\d+$/.test(pastedData)) {
      return;
    }

    const newCode = [...code];
    for (let i = 0; i < pastedData.length && i < 6; i++) {
      newCode[i] = pastedData[i];
    }
    setCode(newCode);

    const nextIndex = Math.min(pastedData.length, 5);
    inputRefs.current[nextIndex]?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    const verificationCode = code.join("");
    if (verificationCode.length !== 6) {
      setErrorMessage("Please enter all 6 digits");
      return;
    }

    if (!email) {
      setErrorMessage("Email is missing. Please try registering again.");
      return;
    }

    setIsLoading(true);

    try {
      await authService.verifyEmail({ email, code: verificationCode });
      navigate('/sign-in', { state: { message: 'Email verified successfully! You can now sign in.' } });
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.error || 'Invalid verification code');
      console.error('Network error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setErrorMessage("");
    setIsResending(true);

    try {
      await authService.resendCode({ email });
      alert('Verification code resent! Please check your email.');
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.error || 'Failed to resend code');
      console.error('Network error:', err);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-white">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl text-black font-serif mb-4">
            Verify Email
          </h1>
          <div className="w-24 h-0.5 bg-black mx-auto mb-6"></div>
          <p className="text-black mb-2">
            We sent a verification code to
          </p>
          <p className="text-black font-medium">{email || "your email"}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="flex justify-center gap-2 md:gap-3">
            {code.map((digit, index) => (
              <input
                key={index}
                ref={(el) => { inputRefs.current[index] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                className="w-12 h-14 md:w-14 md:h-16 text-center text-2xl font-bold border-2 border-black rounded-md focus:border-black focus:outline-none focus:ring-2 focus:ring-black transition-all"
                disabled={isLoading}
              />
            ))}
          </div>

          {errorMessage && (
            <p className="text-center text-sm text-red-600 font-medium">
              {errorMessage}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading || code.join("").length !== 6}
            className="w-full py-3 bg-black text-white font-semibold rounded-md shadow-md hover:bg-gray-800 transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isLoading ? "Verifying..." : "Verify Email"}
          </button>

          <div className="text-center space-y-2">
            <p className="text-sm text-black">
              Didn't receive the code?
            </p>
            <button
              type="button"
              onClick={handleResendCode}
              disabled={isResending}
              className="text-black font-medium hover:text-gray-700 transition-colors duration-200 disabled:text-gray-400"
            >
              {isResending ? "Resending..." : "Resend Code"}
            </button>
          </div>

          <div className="text-center pt-4">
            <button
              type="button"
              onClick={() => navigate("/sign-in")}
              className="text-sm text-black hover:text-gray-700 transition-colors duration-200"
            >
              ← Back to Sign In
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};