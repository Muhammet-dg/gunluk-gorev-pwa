import { useState, useRef, useEffect } from 'react';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import type { UseAuthReturn } from '../hooks/useAuth';
import { BackgroundAnimation } from './BackgroundAnimation';

type Mode = 'signin' | 'signup';

interface AuthScreenProps {
  onSignIn: UseAuthReturn['signIn'];
  onSignUp: UseAuthReturn['signUp'];
  authLoading: boolean;
  authError: string | null;
  clearError: () => void;
}

export function AuthScreen({
  onSignIn,
  onSignUp,
  authLoading,
  authError,
  clearError,
}: AuthScreenProps) {
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    clearError();
    setSuccessMsg(null);
    setTimeout(() => emailRef.current?.focus(), 150);
  }, [mode]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (authLoading) return;
    clearError();
    setSuccessMsg(null);

    if (mode === 'signin') {
      await onSignIn(email.trim(), password);
    } else {
      const result = await onSignUp(email.trim(), password);
      if (!result.error) {
        setSuccessMsg(
          'Kayıt başarılı! E-posta adresinize gönderilen bağlantıya tıklayarak giriş yapabilirsiniz.'
        );
        setPassword('');
      }
    }
  };

  const isValid = email.trim().length > 0 && password.length >= 6;

  return (
    <div
      className="relative min-h-dvh h-dvh w-full flex flex-col items-center justify-center px-5 select-none transition-colors duration-300 overflow-hidden"
      style={{
        background: 'var(--bg)',
        paddingTop: 'max(1.5rem, env(safe-area-inset-top))',
        paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))',
      }}
    >
      <BackgroundAnimation />
      {/* Arka Plan Editorial Işık Efekti */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute -top-32 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full opacity-25"
          style={{
            background: 'radial-gradient(circle, rgba(99, 102, 241, 0.45) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }}
        />
      </div>

      <div className="relative w-full max-w-sm animate-fade-in">
        {/* Logo / Başlık */}
        <div className="text-center mb-8">
          <div
            className="inline-flex w-16 h-16 rounded-2xl items-center justify-center mb-4 shadow-xl"
            style={{
              background: 'var(--primary)',
              boxShadow: '0 12px 32px var(--primary-glow)',
            }}
          >
            <CheckCircle2 size={28} className="text-white" strokeWidth={2.2} />
          </div>
          <p className="text-app-muted text-[11px] font-bold uppercase tracking-[0.18em]">
            Günlük Planlayıcı
          </p>
          <h1 className="text-app-primary text-3xl font-extrabold tracking-tight mt-1">
            FlowDay
          </h1>
          <p className="text-app-secondary text-sm mt-1.5 font-medium">
            {mode === 'signin'
              ? 'Gününe kaldığın yerden devam et'
              : 'Sade ve odaklı bir başlangıç yap'}
          </p>
        </div>

        {/* Form Kartı */}
        <div
          className="rounded-3xl p-6 border shadow-2xl"
          style={{
            background: 'var(--surface)',
            borderColor: 'var(--border-strong)',
          }}
        >
          {/* Mod Seçici */}
          <div
            className="flex rounded-xl p-1 mb-5"
            style={{ background: 'var(--bg-2)', border: '1px solid var(--border)' }}
          >
            {(['signin', 'signup'] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`
                  flex-1 py-2 rounded-lg text-xs font-semibold transition-all duration-200
                  ${
                    mode === m
                      ? 'text-white shadow-sm'
                      : 'text-app-secondary hover:text-app-primary'
                  }
                `}
                style={mode === m ? { background: 'var(--primary)' } : {}}
              >
                {m === 'signin' ? 'Giriş Yap' : 'Kayıt Ol'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="relative">
              <Mail
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-app-muted pointer-events-none"
              />
              <input
                ref={emailRef}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="E-posta adresi"
                autoComplete="email"
                required
                className="select-text input-base pl-10 pr-4"
              />
            </div>

            <div className="relative">
              <Lock
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-app-muted pointer-events-none"
              />
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'signup' ? 'Şifre (en az 6 karakter)' : 'Şifre'}
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                required
                minLength={6}
                className="select-text input-base pl-10 pr-11"
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-app-muted hover:text-app-secondary transition-colors p-1"
                tabIndex={-1}
              >
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>

            {authError && (
              <div
                className="flex items-start gap-2.5 rounded-xl px-3.5 py-2.5 animate-fade-in"
                style={{
                  background: 'rgba(239, 68, 68, 0.10)',
                  border: '1px solid rgba(239, 68, 68, 0.20)',
                }}
              >
                <AlertCircle size={14} className="text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-red-300 text-xs leading-snug">{authError}</p>
              </div>
            )}

            {successMsg && (
              <div
                className="flex items-start gap-2.5 rounded-xl px-3.5 py-2.5 animate-fade-in"
                style={{
                  background: 'rgba(16, 185, 129, 0.10)',
                  border: '1px solid rgba(16, 185, 129, 0.20)',
                }}
              >
                <CheckCircle2 size={14} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                <p className="text-emerald-300 text-xs leading-snug">{successMsg}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={!isValid || authLoading}
              className="btn-primary w-full py-3.5 mt-1"
            >
              {authLoading ? (
                <Loader2 size={17} className="animate-spin" />
              ) : mode === 'signin' ? (
                <LogIn size={17} />
              ) : (
                <Sparkles size={17} />
              )}
              <span>
                {authLoading
                  ? mode === 'signin'
                    ? 'Giriş yapılıyor...'
                    : 'Kayıt olunuyor...'
                  : mode === 'signin'
                    ? 'Giriş Yap'
                    : 'Hesap Oluştur'}
              </span>
            </button>
          </form>

          <p className="text-center text-app-muted text-xs mt-5">
            {mode === 'signin' ? 'Hesabın yok mu? ' : 'Zaten hesabın var mı? '}
            <button
              type="button"
              onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
              className="text-indigo-400 font-semibold hover:text-indigo-300 transition-colors underline underline-offset-2"
            >
              {mode === 'signin' ? 'Kayıt Ol' : 'Giriş Yap'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
