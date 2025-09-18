import React, { useState, useEffect, useCallback } from 'react';
import useAppContext from '../hooks/useAppContext.ts';
import { Family } from '../types.ts';
import Button from '../components/ui/Button.tsx';
import Input from '../components/ui/Input.tsx';
import Card from '../components/ui/Card.tsx';
import Alert from '../components/ui/Alert.tsx';
import { PlusIcon, EditIcon, TrashIcon, UsersIcon } from '../components/ui/Icons.tsx';

const FamiliesScreen: React.FC = () => {
    const { families, addFamily, updateFamily, deleteFamily } = useAppContext();
    const [isEditing, setIsEditing] = useState(false);
    const [isCreatingNew, setIsCreatingNew] = useState(false); // State to manage form mode
    const [currentFamily, setCurrentFamily] = useState<Omit<Family, 'id'>>({ familyName: '', saint: '' });
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [error, setError] = useState('');

    const handleNew = useCallback(() => {
        setIsCreatingNew(true); // Enter "new" mode
        setIsEditing(false);
        setCurrentFamily({ familyName: '', saint: '' });
        setSelectedId(null);
        setError('');
    }, []);

    const handleSelectFamily = useCallback((family: Family) => {
        setIsCreatingNew(false); // Exit "new" mode
        setIsEditing(true);
        setSelectedId(family.id);
        setCurrentFamily({ familyName: family.familyName, saint: family.saint });
        setError('');
    }, []);

    useEffect(() => {
        // Auto-select first family on load, but not if the user just clicked "New"
        if (!isCreatingNew && families.length > 0 && !selectedId) {
            handleSelectFamily(families[0]);
        } else if (families.length === 0) {
            handleNew();
        }
    }, [families, selectedId, handleSelectFamily, handleNew, isCreatingNew]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!currentFamily.familyName || !currentFamily.saint) {
            setError('لا يقبل خلايا فارغة');
            return;
        }

        try {
            if (isEditing && selectedId) {
                if (families.some(f => f.familyName === currentFamily.familyName && f.id !== selectedId)) {
                     setError('لا يقبل تكرار اسم العائلة');
                     return;
                }
                await updateFamily({ id: selectedId, ...currentFamily });
            } else {
                const success = await addFamily(currentFamily);
                if (!success) {
                    setError('لا يقبل تكرار اسم العائلة');
                    return;
                }
            }
            handleNew();
        } catch (err) {
            console.error(err);
            setError("حدث خطأ ما. يرجى المحاولة مرة أخرى.");
        }
    };
    
    const handleDelete = async () => {
        if (selectedId) {
            if (window.confirm("هل أنت متأكد من رغبتك في حذف هذه العائلة؟")) {
                await deleteFamily(selectedId);
                handleNew();
            }
        }
    };


    return (
        <div>
            <div className="flex items-center mb-6">
                <UsersIcon className="w-8 h-8 text-sky-400 ml-4"/>
                <h1 className="text-3xl font-bold">شاشة تسجيل العائلات</h1>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                    <Card>
                        <h2 className="text-xl font-bold mb-4">قائمة العائلات</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full text-right">
                                <thead className="border-b border-gray-700">
                                    <tr>
                                        <th className="p-3">اسم العائلة</th>
                                        <th className="p-3">شفيع العائلة</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {families.map(family => (
                                        <tr key={family.id} onClick={() => handleSelectFamily(family)} 
                                            className={`cursor-pointer hover:bg-gray-700 ${selectedId === family.id ? 'bg-sky-900' : ''}`}>
                                            <td className="p-3">{family.familyName}</td>
                                            <td className="p-3">{family.saint}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
                <div>
                    <Card>
                        <h2 className="text-xl font-bold mb-4">{isEditing ? 'تعديل عائلة' : 'إضافة عائلة جديدة'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <Input label="اسم العائلة" value={currentFamily.familyName} onChange={e => setCurrentFamily({ ...currentFamily, familyName: e.target.value })} required/>
                            <Input label="شفيع العائلة" value={currentFamily.saint} onChange={e => setCurrentFamily({ ...currentFamily, saint: e.target.value })} required/>
                            {error && <Alert message={error} />}
                            <div className="flex space-x-2 space-x-reverse pt-2">
                                <Button type="button" onClick={handleNew} variant="secondary"><PlusIcon className="w-4 h-4 ml-1"/>جديد</Button>
                                <Button type="submit">{isEditing ? <><EditIcon className="w-4 h-4 ml-1"/>تعديل</> : <><PlusIcon className="w-4 h-4 ml-1"/>إضافة</>}</Button>
                                {isEditing && <Button type="button" onClick={handleDelete} variant="danger"><TrashIcon className="w-4 h-4 ml-1"/>حذف</Button>}
                            </div>
                        </form>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default FamiliesScreen;