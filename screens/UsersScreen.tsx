import React, { useState, useEffect, useCallback } from 'react';
import useAppContext from '../hooks/useAppContext.ts';
import { User, UserRole, UserStatus } from '../types.ts';
import Button from '../components/ui/Button.tsx';
import Input from '../components/ui/Input.tsx';
import Select from '../components/ui/Select.tsx';
import Card from '../components/ui/Card.tsx';
import Alert from '../components/ui/Alert.tsx';
import { PlusIcon, EditIcon, TrashIcon, UserCircleIcon } from '../components/ui/Icons.tsx';

const UsersScreen: React.FC = () => {
    const { users, families, addUser, updateUser, deleteUser, resetPassword, showToast } = useAppContext();
    const [isEditing, setIsEditing] = useState(false);
    const [isCreatingNewUser, setIsCreatingNewUser] = useState(false); // State to manage form mode
    const [currentUser, setCurrentUser] = useState<Omit<User, 'id' | 'uid'>>({ 
        fullName: '', familyId: '', email: '', role: UserRole.USER, status: UserStatus.INACTIVE
    });
    const [password, setPassword] = useState('');
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [error, setError] = useState('');

    const handleNew = useCallback(() => {
        setIsCreatingNewUser(true); // Enter "new user" mode
        setIsEditing(false);
        setCurrentUser({ fullName: '', familyId: families[0]?.id || '', email: '', role: UserRole.USER, status: UserStatus.INACTIVE });
        setPassword('');
        setSelectedId(null);
        setError('');
    }, [families]);

    const handleSelectUser = useCallback((user: User) => {
        setIsCreatingNewUser(false); // Exit "new user" mode
        setIsEditing(true);
        setSelectedId(user.id);
        setCurrentUser({ ...user });
        setPassword('');
        setError('');
    }, []);

     useEffect(() => {
        // Auto-select first user on load, but not if the user just clicked "New"
        if (!isCreatingNewUser && users.length > 0 && !selectedId) {
            const userToSelect = users[0];
            handleSelectUser(userToSelect);
        } else if (users.length === 0) {
            handleNew();
        }
    }, [users, selectedId, handleNew, handleSelectUser, isCreatingNewUser]);
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        const { fullName, email, familyId } = currentUser;
        if (!fullName || !email || !familyId || (!isEditing && !password)) {
            setError('لا يقبل خلايا فارغة');
            return;
        }

        const userPayload: Omit<User, 'id' | 'uid'> = {
            fullName: currentUser.fullName,
            familyId: currentUser.familyId,
            email: currentUser.email,
            role: currentUser.role,
            status: currentUser.status,
        };
        
        try {
            if (isEditing && selectedId) {
                 if (users.some(u => u.email === email && u.id !== selectedId)) {
                    setError('لا يقبل تكرار البريد الإلكتروني');
                    return;
                }
                const originalUser = users.find(u => u.id === selectedId);
                if (!originalUser) return;
                
                await updateUser({ id: selectedId, uid: originalUser.uid, ...userPayload });
                 showToast('تم تعديل المستخدم بنجاح.', 'success');
            } else {
                const result = await addUser(userPayload, password);
                if (!result.success) {
                    setError(result.error || 'حدث خطأ غير متوقع.');
                    return;
                }
                 showToast('تمت إضافة المستخدم بنجاح.', 'success');
            }
            handleNew();
        } catch (err) {
            console.error(err);
            setError("حدث خطأ ما. يرجى المحاولة مرة أخرى.");
        }
    };

    const handleDelete = async () => {
        if (selectedId) {
            const userToDelete = users.find(u => u.id === selectedId);
            
            // Prevent deleting an admin user
            if (userToDelete && userToDelete.role === UserRole.ADMIN) {
                showToast('لا يمكن حذف مدير النظام.', 'error');
                return;
            }

             if (window.confirm("سيتم حذف المستخدم من قاعدة بيانات التطبيق فقط. لحذفه نهائياً، يجب حذفه يدوياً من قسم Authentication في Firebase. هل تريد المتابعة؟")) {
                await deleteUser(selectedId);
                showToast('تم حذف المستخدم من قاعدة البيانات.', 'success');
                handleNew();
            }
        }
    };

    const handlePasswordReset = async () => {
        if (!isEditing || !currentUser.email) return;

        if (window.confirm(`هل أنت متأكد أنك تريد إرسال بريد إعادة تعيين كلمة المرور إلى ${currentUser.email}؟`)) {
            const success = await resetPassword(currentUser.email);
            if (success) {
                showToast('تم إرسال بريد إعادة التعيين بنجاح.', 'success');
            } else {
                showToast('فشل إرسال بريد إعادة التعيين. يرجى التحقق من البريد الإلكتروني.', 'error');
            }
        }
    };

    return (
         <div>
            <div className="flex items-center mb-6">
                <UserCircleIcon className="w-8 h-8 text-sky-400 ml-4"/>
                <h1 className="text-3xl font-bold">شاشة المستخدمين</h1>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                    <Card>
                        <h2 className="text-xl font-bold mb-4">قائمة المستخدمين</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full text-right">
                                <thead className="border-b border-gray-700">
                                    <tr>
                                        <th className="p-3">الاسم بالكامل</th>
                                        <th className="p-3">العائلة</th>
                                        <th className="p-3">البريد الإلكتروني</th>
                                        <th className="p-3 text-center">الصلاحيات</th>
                                        <th className="p-3 text-center">الحالة</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map(user => {
                                        const familyName = families.find(f => f.id === user.familyId)?.familyName || 'N/A';
                                        return (
                                        <tr key={user.id} onClick={() => handleSelectUser(user)} className={`cursor-pointer hover:bg-gray-700 ${selectedId === user.id ? 'bg-sky-900' : ''}`}>
                                            <td className="p-3">{user.fullName}</td>
                                            <td className="p-3">{familyName}</td>
                                            <td className="p-3">{user.email}</td>
                                            <td className="p-3 text-center">{user.role}</td>
                                            <td className="p-3 text-center">{user.status}</td>
                                        </tr>
                                    )})}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
                <div>
                    <Card>
                        <h2 className="text-xl font-bold mb-4">{isEditing ? 'تعديل مستخدم' : 'إضافة مستخدم جديد'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <Input label="الاسم بالكامل" value={currentUser.fullName} onChange={e => setCurrentUser({ ...currentUser, fullName: e.target.value })} required />
                            <Select label="العائلة" value={currentUser.familyId} onChange={e => setCurrentUser({ ...currentUser, familyId: e.target.value })} required>
                                 <option value="" disabled>اختر عائلة...</option>
                                {families.map(f => <option key={f.id} value={f.id}>{f.familyName}</option>)}
                            </Select>
                            <Input type="email" label="البريد الإلكتروني" value={currentUser.email} onChange={e => setCurrentUser({ ...currentUser, email: e.target.value })} required />
                            {!isEditing && (
                                <Input type="password" label="كلمة المرور" value={password} onChange={e => setPassword(e.target.value)} required={!isEditing} autoComplete="new-password"/>
                            )}
                             <Select label="الصلاحيات" value={currentUser.role} onChange={e => setCurrentUser({ ...currentUser, role: e.target.value as UserRole })} required>
                                {Object.values(UserRole).map(role => <option key={role} value={role}>{role}</option>)}
                            </Select>
                            <Select label="حالة التفعيل" value={currentUser.status} onChange={e => setCurrentUser({ ...currentUser, status: e.target.value as UserStatus })} required>
                                {Object.values(UserStatus).map(status => <option key={status} value={status}>{status}</option>)}
                            </Select>
                            {error && <Alert message={error} />}

                            <div className="pt-2 space-y-3">
                                <div className="flex space-x-2 space-x-reverse">
                                    <Button type="button" onClick={handleNew} variant="secondary"><PlusIcon className="w-4 h-4 ml-1"/>جديد</Button>
                                    <Button type="submit" className="flex-grow">{isEditing ? <><EditIcon className="w-4 h-4 ml-1"/>حفظ التعديلات</> : <><PlusIcon className="w-4 h-4 ml-1"/>إضافة المستخدم</>}</Button>
                                </div>
                                {isEditing && (
                                    <div className="space-y-3 border-t border-gray-700 pt-4">
                                        <Button type="button" onClick={handlePasswordReset} variant="secondary" className="w-full">
                                            إرسال بريد لإعادة تعيين كلمة المرور
                                        </Button>
                                        <Button type="button" onClick={handleDelete} variant="danger" className="w-full">
                                            <TrashIcon className="w-4 h-4 ml-1"/>حذف المستخدم
                                        </Button>
                                        <p className="text-xs text-gray-400 text-center px-2">
                                            الحذف يزيل المستخدم من التطبيق فقط، ويجب حذفه يدوياً من نظام المصادقة.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </form>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default UsersScreen;