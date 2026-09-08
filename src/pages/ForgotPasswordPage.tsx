import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { Button } from '../components/ui/Button.tsx';
import { Input } from '../components/ui/Input.tsx';
import { Card, CardContent } from '../components/ui/Card.tsx';
import { Flame, ArrowLeft, CheckCircle2 } from 'lucide-react';

interface ForgotPasswordPageProps {
  onNavigate: (view: string) => void;
}

export const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({ onNavigate }) => {
  const { sendPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      await sendPasswordReset(email);
      setSubmitted(true);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to send password reset email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <button
          onClick={() => onNavigate('landing')}
          className="inline-flex items-center gap-2.5 focus:outline-none mb-4"
        >
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-sm shadow-emerald-600/30">
            <Flame className="w-6 h-6 fill-current" />
          </div>
          <span className="font-extrabold text-2xl text-slate-900 tracking-tight">FitTrack</span>
        </button>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Reset your password</h2>
        <p className="mt-1 text-sm text-slate-500">We’ll send you a link to reset your account password</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <Card className="shadow-lg border-slate-200/90">
          <CardContent className="pt-6">
            {submitted ? (
              <div className="text-center py-4 space-y-4">
                <div className="mx-auto w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Check your inbox</h3>
                <p className="text-xs text-slate-600">
                  We sent a password reset link to <span className="font-semibold text-slate-900">{email}</span>. Please check your spam folder if you don’t see it in a few minutes.
                </p>
                <Button
                  variant="primary"
                  className="w-full mt-4"
                  onClick={() => onNavigate('login')}
                >
                  Return to Sign In
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
                    {error}
                  </div>
                )}

                <Input
                  label="Account email"
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full h-11 text-base font-semibold"
                  isLoading={loading}
                >
                  Send Reset Link
                </Button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => onNavigate('login')}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back to Sign In
                  </button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
