import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle, AlertCircle, Loader2, ClipboardCheck } from 'lucide-react';

const SelfCheckIn = () => {
  const [token, setToken] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [result, setResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const inputRefs = useRef([]);

  const [digits, setDigits] = useState(['', '', '', '']);

  const handleDigitChange = (index, value) => {
    // Only allow single digit
    if (value && !/^\d$/.test(value)) return;

    const newDigits = [...digits];
    newDigits[index] = value;
    setDigits(newDigits);
    setToken(newDigits.join(''));

    // Auto-focus next input
    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    if (pasted.length === 4) {
      const newDigits = pasted.split('');
      setDigits(newDigits);
      setToken(pasted);
      inputRefs.current[3]?.focus();
    }
  };

  const handleCheckIn = async () => {
    const fullToken = digits.join('');
    if (fullToken.length !== 4) return;

    setStatus('loading');
    setErrorMessage('');
    setResult(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/self-checkin`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tokenNumber: fullToken }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Check-in failed');
      }

      setResult(data.data);
      setStatus('success');
    } catch (error) {
      setErrorMessage(error.message || 'Something went wrong. Please try again.');
      setStatus('error');
    }
  };

  const handleReset = () => {
    setDigits(['', '', '', '']);
    setToken('');
    setStatus('idle');
    setResult(null);
    setErrorMessage('');
    inputRefs.current[0]?.focus();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
            <ClipboardCheck className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Patient Self Check-In</h1>
          <p className="text-gray-500 mt-1 text-sm">Enter your 4-digit appointment token to check in</p>
        </div>

        <Card className="shadow-lg border-0">
          <CardContent className="p-6">
            {/* Idle / Error state - show input */}
            {(status === 'idle' || status === 'error' || status === 'loading') && (
              <div className="space-y-6">
                {/* Token input boxes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
                    Token Number
                  </label>
                  <div className="flex justify-center gap-3" onPaste={handlePaste}>
                    {digits.map((digit, i) => (
                      <input
                        key={i}
                        ref={(el) => (inputRefs.current[i] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleDigitChange(i, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(i, e)}
                        className="w-14 h-16 text-center text-2xl font-bold border-2 border-gray-300 rounded-xl 
                          focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all
                          sm:w-16 sm:h-18 sm:text-3xl"
                        disabled={status === 'loading'}
                      />
                    ))}
                  </div>
                </div>

                {/* Error message */}
                {status === 'error' && (
                  <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700">{errorMessage}</p>
                  </div>
                )}

                {/* Check-in button */}
                <Button
                  onClick={handleCheckIn}
                  disabled={digits.join('').length !== 4 || status === 'loading'}
                  className="w-full h-12 text-base font-semibold bg-blue-600 hover:bg-blue-700"
                >
                  {status === 'loading' ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Checking In...
                    </>
                  ) : (
                    'Check In'
                  )}
                </Button>
              </div>
            )}

            {/* Success state */}
            {status === 'success' && result && (
              <div className="space-y-5">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-3">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <h2 className="text-xl font-bold text-green-700">
                    {result.alreadyCheckedIn ? 'Already Checked In' : 'Check-In Successful!'}
                  </h2>
                </div>

                {/* Patient info */}
                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Patient</span>
                    <span className="font-semibold text-gray-900">
                      {result.appointment?.patient?.firstName} {result.appointment?.patient?.lastName}
                    </span>
                  </div>
                  <div className="border-t border-gray-200" />
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Token</span>
                    <span className="font-semibold text-gray-900">{result.appointment?.tokenNumber}</span>
                  </div>
                  <div className="border-t border-gray-200" />
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Queue Position</span>
                    <span className="text-2xl font-bold text-blue-600">{result.queueInfo?.queueNumber}</span>
                  </div>
                  {result.queueInfo?.estimatedWaitTime > 0 && (
                    <>
                      <div className="border-t border-gray-200" />
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Est. Wait Time</span>
                        <span className="font-semibold text-gray-900">~{result.queueInfo.estimatedWaitTime} min</span>
                      </div>
                    </>
                  )}
                </div>

                <Button
                  onClick={handleReset}
                  className="w-full h-12 text-base font-semibold"
                  variant="outline"
                >
                  Okay
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-gray-400 mt-4">
          Please have your appointment token ready before checking in.
        </p>
      </div>
    </div>
  );
};

export default SelfCheckIn;
