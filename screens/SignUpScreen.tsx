import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAppContext from '../hooks/useAppContext.ts';
import Button from '../components/ui/Button.tsx';
import Input from '../components/ui/Input.tsx';
import Select from '../components/ui/Select.tsx';
import Card from '../components/ui/Card.tsx';
import Alert from '../components/ui/Alert.tsx';
import { UserCircleIcon } from '../components/ui/Icons.tsx';

const SignUpScreen: React.FC = () => {
  const { families, signUpUser, showToast } = useAppContext();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [familyId, setFamilyId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Disable registration if no families are available.
  const isRegistrationDisabled = families.length === 0;

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isRegistrationDisabled) {
      setError('لا يمكن إنشاء حساب لعدم وجود عائلات.');
      return;
    }

    if (!fullName || !familyId || !email || !password) {
        setError('يرجى ملء جميع الحقول.');
        return;
    }
    if (password !== confirmPassword) {
      setError('كلمتا المرور غير متطابقتين.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await signUpUser({ fullName, email, password, familyId });
      if (result.success) {
        showToast('تم إنشاء الحساب بنجاح! سيتم توجيهك لتسجيل الدخول.', 'success');
        setTimeout(() => navigate('/login'), 1500);
      } else {
        setError(result.error || 'حدث خطأ غير متوقع.');
      }
    } catch (err) {
      setError('فشل في إنشاء الحساب. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
      <Card className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <UserCircleIcon className="w-20 h-20 text-sky-400 mb-4" />
          <h1 className="text-2xl font-bold text-center text-white">إنشاء حساب جديد</h1>
        </div>

        {isRegistrationDisabled && (
          <div className="mb-4">
            <Alert 
              type="info"
              message="التسجيل غير متاح حاليًا لعدم وجود عائلات. يرجى مراجعة مدير النظام."
            />
          </div>
        )}

        <form onSubmit={handleSignUp} className="space-y-4">
          <Input
            id="fullName"
            label="الاسم بالكامل"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            disabled={isLoading || isRegistrationDisabled}
          />
          <Select
            id="family"
            label="اختر عائلتك"
            value={familyId}
            onChange={(e) => setFamilyId(e.target.value)}
            required
            disabled={isLoading || isRegistrationDisabled}
          >
            <option value="" disabled>-- اختر عائلة --</option>
            {families.map((family) => (
              <option key={family.id} value={family.id}>
                {family.familyName}
              </option>
            ))}
          </Select>
          <Input
            id="email"
            label="البريد الإلكتروني"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading || isRegistrationDisabled}
          />
          <Input
            id="password"
            label="كلمة المرور"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading || isRegistrationDisabled}
          />
          <Input
            id="confirmPassword"
            label="تأكيد كلمة المرور"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            disabled={isLoading || isRegistrationDisabled}
          />

          {error && <Alert message={error} />}

          <div className="pt-2">
            <Button type="submit" className="w-full" disabled={isLoading || isRegistrationDisabled}>
              {isLoading ? 'جاري الإنشاء...' : 'إنشاء الحساب'}
            </Button>
          </div>
        </form>

        <div className="text-center mt-6">
          <p className="text-gray-400">
            لديك حساب بالفعل؟{' '}
            <Link to="/login" className="font-medium text-sky-400 hover:text-sky-300">
              تسجيل الدخول
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
};

export default SignUpScreen;