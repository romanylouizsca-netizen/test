import React, { useState, useEffect, useCallback, useMemo } from 'react';
import useAppContext from '../hooks/useAppContext.ts';
import { EvaluationItem, ItemTypeId } from '../types.ts';
import Button from '../components/ui/Button.tsx';
import Input from '../components/ui/Input.tsx';
import Select from '../components/ui/Select.tsx';
import Card from '../components/ui/Card.tsx';
import Alert from '../components/ui/Alert.tsx';
import { PlusIcon, EditIcon, TrashIcon, ListIcon } from '../components/ui/Icons.tsx';

const ItemsScreen: React.FC = () => {
    const { items, addItem, updateItem, deleteItem } = useAppContext();
    const [isEditing, setIsEditing] = useState(false);
    const [isCreatingNew, setIsCreatingNew] = useState(false); // State to manage form mode
    const [currentItem, setCurrentItem] = useState<Omit<EvaluationItem, 'id'>>({ itemName: '', itemTypeId: ItemTypeId.BOOL, price: 0 });
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [error, setError] = useState('');

    const sortedItems = useMemo(() => {
        return [...items].sort((a, b) => a.itemName.localeCompare(b.itemName, 'ar'));
    }, [items]);

    const handleNew = useCallback(() => {
        setIsCreatingNew(true); // Enter "new" mode
        setIsEditing(false);
        setCurrentItem({ itemName: '', itemTypeId: ItemTypeId.BOOL, price: 0 });
        setSelectedId(null);
        setError('');
    }, []);

    const handleSelectItem = useCallback((item: EvaluationItem) => {
        setIsCreatingNew(false); // Exit "new" mode
        setIsEditing(true);
        setSelectedId(item.id);
        setCurrentItem({ itemName: item.itemName, itemTypeId: item.itemTypeId, price: item.price });
        setError('');
    }, []);

    useEffect(() => {
        // Auto-select first item on load, but not if the user just clicked "New"
        if (!isCreatingNew && sortedItems.length > 0 && !selectedId) {
            handleSelectItem(sortedItems[0]);
        } else if (sortedItems.length === 0) {
            handleNew();
        }
    }, [sortedItems, selectedId, handleSelectItem, handleNew, isCreatingNew]);
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!currentItem.itemName.trim() || currentItem.price < 0) {
            setError('لا يقبل خلايا فارغة أو قيمة تقصير سالبة');
            return;
        }

        const trimmedItem = { ...currentItem, itemName: currentItem.itemName.trim() };

        try {
            if (isEditing && selectedId) {
                if (items.some(i => i.itemName === trimmedItem.itemName && i.id !== selectedId)) {
                    setError('لا يقبل تكرار اسم البند');
                    return;
                }
                await updateItem({ id: selectedId, ...trimmedItem });
            } else {
                if (!await addItem(trimmedItem)) {
                    setError('لا يقبل تكرار اسم البند');
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
             if (window.confirm("هل أنت متأكد من رغبتك في حذف هذا البند؟")) {
                await deleteItem(selectedId);
                handleNew();
            }
        }
    };

    return (
        <div>
            <div className="flex items-center mb-6">
                <ListIcon className="w-8 h-8 text-sky-400 ml-4"/>
                <h1 className="text-3xl font-bold">شاشة بنود التقييم</h1>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                    <Card>
                        <h2 className="text-xl font-bold mb-4">قائمة البنود</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full text-right">
                                <thead className="border-b border-gray-700">
                                    <tr>
                                        <th className="p-3">اسم البند</th>
                                        <th className="p-3 text-center">غرامة التقصير</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedItems.map(item => (
                                        <tr key={item.id} onClick={() => handleSelectItem(item)} className={`cursor-pointer hover:bg-gray-700 ${selectedId === item.id ? 'bg-sky-900' : ''}`}>
                                            <td className="p-3">{item.itemName}</td>
                                            <td className="p-3 text-center">{item.price}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
                <div>
                    <Card>
                        <h2 className="text-xl font-bold mb-4">{isEditing ? 'تعديل بند' : 'إضافة بند جديد'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <Input label="اسم البند" value={currentItem.itemName} onChange={e => setCurrentItem({ ...currentItem, itemName: e.target.value })} required />
                            <Select label="النوع" value={currentItem.itemTypeId} onChange={e => setCurrentItem({ ...currentItem, itemTypeId: Number(e.target.value) as ItemTypeId })} required>
                                <option value={ItemTypeId.BOOL}>صح/خطأ (تم/لم يتم)</option>
                                <option value={ItemTypeId.INT}>رقمي (0-10)</option>
                                <option value={ItemTypeId.ONCE}>مرة واحدة (نعم/لا)</option>
                            </Select>
                            <Input type="number" label="غرامة التقصير" value={currentItem.price} onChange={e => setCurrentItem({ ...currentItem, price: Number(e.target.value) })} required min="0"/>
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

export default ItemsScreen;