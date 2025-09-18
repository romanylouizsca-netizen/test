import React, { useState } from 'react';
// FIX: Switched from useHistory (v5) to useNavigate (v6).
import { useNavigate, Link } from 'react-router-dom';
import useAppContext from '../hooks/useAppContext.ts';
import Button from '../components/ui/Button.tsx';
import Input from '../components/ui/Input.tsx';
import Card from '../components/ui/Card.tsx';
import Alert from '../components/ui/Alert.tsx';
import { ChurchIcon } from '../components/ui/Icons.tsx';
import { auth } from '../firebase/config.ts';
// FIX: Removed v9 auth function import as it's no longer needed with v8 compat syntax.

const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  // FIX: Switched from useHistory (v5) to useNavigate (v6).
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setError('');
    try {
      // FIX: Switched to Firebase v8 compat `signInWithEmailAndPassword` syntax.
      await auth.signInWithEmailAndPassword(email, password);
      // onAuthStateChanged in AppContext will handle navigation
      // FIX: Switched to useNavigate hook.
      navigate('/');
    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        setError('البريد الإلكتروني أو كلمة المرور غير صحيحة.');
      } else {
        setError('حدث خطأ أثناء تسجيل الدخول. يرجى المحاولة مرة أخرى.');
      }
    } finally {
        setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
      <Card className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
            <ChurchIcon className="w-20 h-20 text-sky-400 mb-4"/>
            <h1 className="text-2xl font-bold text-center text-white">نظام التقييم الروحي</h1>
            <p className="mt-2 text-center text-lg text-gray-300">"تَوِّبْنِي فَأَتُوبَ لأَنَّكَ أَنْتَ الرَّبُّ إِلهِي"</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <Input
            id="email"
            label="البريد الإلكتروني"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            id="password"
            label="كلمة المرور"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <Alert message={error} />}
          <Button type="submit" className="w-full" disabled={isLoggingIn}>
            {isLoggingIn ? 'جاري الدخول...' : 'دخول'}
          </Button>
        </form>

        <div className="text-center mt-6">
            <p className="text-gray-400">
                ليس لديك حساب؟{' '}
                <Link to="/signup" className="font-medium text-sky-400 hover:text-sky-300">
                    سجل الآن
                </Link>
            </p>
        </div>
      </Card>
    </div>
  );
};

export default LoginScreen;