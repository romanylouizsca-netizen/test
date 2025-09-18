import React, { useState, useEffect, useMemo, useCallback } from 'react';
import useAppContext from '../hooks/useAppContext.ts';
import { ItemTypeId, UserRole, EvaluationEntry, User, Family } from '../types.ts';
import Card from '../components/ui/Card.tsx';
import Button from '../components/ui/Button.tsx';
import Select from '../components/ui/Select.tsx';
import { ClipboardCheckIcon, PrintIcon } from '../components/ui/Icons.tsx';
import Alert from '../components/ui/Alert.tsx';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// Helper to get all dates in a range
const getDatesInRange = (start: string, end: string): string[] => {
    const dates: string[] = [];
    if (!start || !end) return dates;
    try {
        // Parse dates as UTC to avoid timezone shifts
        const startDate = new Date(`${start}T00:00:00Z`);
        const endDate = new Date(`${end}T00:00:00Z`);

        let currentDate = startDate;
        while (currentDate <= endDate) {
            dates.push(currentDate.toISOString().split('T')[0]);
            // Advance the date in UTC
            currentDate.setUTCDate(currentDate.getUTCDate() + 1);
        }
    } catch (e) {
        console.error("Invalid date range", e);
    }
    return dates;
};


const EvaluationScreen: React.FC = () => {
    const { currentUser, users, items, families, evaluations, saveEvaluations, period, evaluationControls, showToast } = useAppContext();
    const [selectedUserId, setSelectedUserId] = useState<string>(currentUser?.uid || '');
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [currentEvaluations, setCurrentEvaluations] = useState<Map<string, EvaluationEntry['value']>>(new Map());
    const [isSaving, setIsSaving] = useState(false);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

    const isUserAdmin = currentUser?.role === UserRole.ADMIN;
    
    // Determine the user to display evaluations for
    const userToEvaluate = useMemo(() => {
        const targetId = isUserAdmin ? selectedUserId : currentUser?.uid;
        return users.find(u => u.uid === targetId) || (currentUser?.uid === targetId ? currentUser : null);
    }, [selectedUserId, currentUser, users, isUserAdmin]);

    const userFamily = useMemo(() => {
        return families.find(f => f.id === userToEvaluate?.familyId);
    }, [userToEvaluate, families]);

    // Populate form with existing evaluations for the selected user/date
    useEffect(() => {
        if (!userToEvaluate) return;
        
        const userEvaluationsForDate = evaluations.filter(e => e.userId === userToEvaluate.uid && (e.date === selectedDate || e.date === period?.from));
        const newEvaluationsMap = new Map<string, EvaluationEntry['value']>();
        
        items.forEach(item => {
            const dateToFind = item.itemTypeId === ItemTypeId.ONCE ? period?.from : selectedDate;
            const entry = userEvaluationsForDate.find(e => e.itemId === item.id && e.date === dateToFind);
            if (entry) {
                newEvaluationsMap.set(item.id, entry.value);
            }
        });
        setCurrentEvaluations(newEvaluationsMap);
    }, [userToEvaluate, selectedDate, evaluations, items, period]);
    
    const handleValueChange = (itemId: string, value: EvaluationEntry['value']) => {
        setCurrentEvaluations(prev => new Map(prev).set(itemId, value));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        if (!userToEvaluate) {
            showToast("لم يتم العثور على المستخدم المحدد.", 'error');
            setIsSaving(false);
            return;
        }
        
        const entriesToSave: Omit<EvaluationEntry, 'id'>[] = [];
        items.forEach(item => {
            const newValue = currentEvaluations.get(item.id);
            if (newValue !== undefined) {
                 entriesToSave.push({
                    userId: userToEvaluate.uid,
                    itemId: item.id,
                    date: item.itemTypeId === ItemTypeId.ONCE ? (period?.from || selectedDate) : selectedDate,
                    value: newValue,
                    familyId: userToEvaluate.familyId,
                });
            }
        });
        
        try {
            await saveEvaluations(entriesToSave, userToEvaluate.familyId);
        } catch (error) {
            console.error(error);
            showToast('حدث خطأ أثناء حفظ التقييم.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const datesForDropdown = useMemo(() => period ? getDatesInRange(period.from, period.to) : [], [period]);

    // Summary calculation logic
    const summaryData = useMemo(() => {
        if (!userToEvaluate || !period) return { items: [], total: 0 };
        const datesInRange = getDatesInRange(period.from, period.to);
        const userEvaluations = evaluations.filter(e => e.userId === userToEvaluate.uid);
        
        let totalUserPenalty = 0;
        const itemSummaries = items.map(item => {
            let totalShortfall = 0;
            if (item.itemTypeId === ItemTypeId.BOOL) {
                datesInRange.forEach(date => {
                    const entry = userEvaluations.find(e => e.itemId === item.id && e.date === date);
                    if (!entry || entry.value !== 'Y') totalShortfall += 1;
                });
            } else if (item.itemTypeId === ItemTypeId.INT) {
                datesInRange.forEach(date => {
                    const entry = userEvaluations.find(e => e.itemId === item.id && e.date === date);
                    const value = (entry && typeof entry.value === 'number') ? entry.value : 0;
                    if (value < 10) totalShortfall += (10 - value);
                });
            } else if (item.itemTypeId === ItemTypeId.ONCE) {
                const entry = userEvaluations.find(e => e.itemId === item.id && e.date === period.from);
                if (!entry || entry.value !== 'Y') totalShortfall = 1;
            }
            const penalty = totalShortfall * item.price;
            totalUserPenalty += penalty;
            return { itemName: item.itemName, totalShortfall, penalty };
        });

        return { items: itemSummaries, total: totalUserPenalty };
    }, [userToEvaluate, period, evaluations, items]);

     const handleGeneratePdf = () => {
        const input = document.getElementById('summary-content');
        if (!input || !userToEvaluate) return;
        setIsGeneratingPdf(true);
        html2canvas(input, { scale: 2, useCORS: true, backgroundColor: '#1f2937' })
            .then(canvas => {
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
                const pdfWidth = 210;
                const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
                pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
                pdf.save(`ملخص-تقييم-${userToEvaluate.fullName}.pdf`);
            }).catch(err => {
                showToast("حدث خطأ أثناء إنشاء PDF.", 'error');
            }).finally(() => {
                setIsGeneratingPdf(false);
            });
    };

    const onceItems = items.filter(item => item.itemTypeId === ItemTypeId.ONCE);
    const dailyItems = items.filter(item => item.itemTypeId !== ItemTypeId.ONCE);
    const canSave = evaluationControls?.saveEnabled ?? true;
    
    return (
        <div>
            <div className="flex items-center mb-6">
                <ClipboardCheckIcon className="w-8 h-8 text-sky-400 ml-4"/>
                <h1 className="text-3xl font-bold">شاشة إدخال التقييم</h1>
            </div>
            
             <Card className="mb-6">
                <h2 className="text-xl font-bold text-sky-300">سلام ونعمة / {userToEvaluate?.fullName}</h2>
                <p className="text-gray-400">عائلة: {userFamily?.familyName || 'غير محدد'}</p>
                {period && <p className="text-gray-400">مدة التقييم: من {period.from} إلى {period.to}</p>}
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <form onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 pb-6 border-b border-gray-700">
                            {isUserAdmin && (
                                 <Select label="اختر المستخدم" value={selectedUserId} onChange={e => setSelectedUserId(e.target.value)} className="bg-gray-900/50 border-gray-600 text-sky-300 font-semibold">
                                    {users.map(user => (
                                        <option key={user.uid} value={user.uid}>{user.fullName}</option>
                                    ))}
                                </Select>
                            )}
                            <Select label="اختر تاريخ اليوم" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} disabled={!period} className="bg-gray-900/50 border-gray-600 text-sky-300 font-semibold">
                                 {datesForDropdown.length === 0 && <option>لم تحدد مدة التقييم بعد</option>}
                                {datesForDropdown.map(date => <option key={date} value={date}>{date}</option>)}
                            </Select>
                        </div>

                         {!(evaluationControls?.saveEnabled ?? true) && (
                             <Alert type="info" message="حفظ التقييمات موقوف حاليًا من قبل مدير النظام." />
                        )}

                        {onceItems.length > 0 && (
                             <div className="my-6 p-4 bg-gray-900/50 rounded-lg">
                                <h3 className="font-bold text-lg text-white mb-2 block">بنود تقيم مرة واحدة</h3>
                                <p className="text-sm text-gray-400 mb-3">(هذه البنود تقيم مرة واحدة فقط خلال مدة التقييم)</p>
                                <div className="space-y-4">
                                    {onceItems.map(item => (
                                        <div key={item.id} className="flex items-center justify-between">
                                            <label className="font-semibold text-md text-white">{item.itemName}</label>
                                            <Select 
                                                value={currentEvaluations.get(item.id) === 'Y' ? 'نعم' : 'لا'} 
                                                onChange={e => handleValueChange(item.id, e.target.value === 'نعم' ? 'Y' : 'N')}
                                                disabled={!canSave}
                                                className="w-32"
                                            >
                                                <option>لا</option>
                                                <option>نعم</option>
                                            </Select>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        <div className="space-y-4 mt-6">
                            {dailyItems.map(item => (
                                <div key={item.id} className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
                                    <label className="font-semibold text-md text-white">{item.itemName}</label>
                                    {item.itemTypeId === ItemTypeId.BOOL ? (
                                        <Select 
                                            value={currentEvaluations.get(item.id) === 'Y' ? 'تم' : 'لم يتم'}
                                            onChange={e => handleValueChange(item.id, e.target.value === 'تم' ? 'Y' : 'N')}
                                            disabled={!canSave}
                                            className="w-32"
                                        >
                                            <option>لم يتم</option>
                                            <option>تم</option>
                                        </Select>
                                    ) : (
                                        <Select
                                            value={currentEvaluations.get(item.id) ?? 0}
                                            onChange={e => handleValueChange(item.id, Number(e.target.value))}
                                            className="w-24 text-center"
                                            disabled={!canSave}
                                        >
                                            {Array.from({length: 11}, (_, i) => <option key={i} value={i}>{i}</option>)}
                                        </Select>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="mt-8 flex justify-end">
                            <Button type="submit" disabled={!canSave || isSaving}>
                                {isSaving ? 'جاري الحفظ...' : 'حفظ التقييم'}
                            </Button>
                        </div>
                    </form>
                </Card>

                 <Card>
                    <div id="summary-content" className="bg-gray-800 p-4">
                        <h2 className="text-xl font-bold text-center border-b border-gray-700 pb-2 mb-4">ملخص تقييم المستخدم</h2>
                         {userToEvaluate && period && (
                            <div className="text-center mb-4">
                                <p className="text-lg font-bold text-white">{userToEvaluate.fullName}</p>
                                <p className="text-sm text-gray-400">المدة: من {period.from} إلى {period.to}</p>
                            </div>
                         )}
                         {period ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-right">
                                    <thead className="border-b border-gray-600">
                                        <tr>
                                            <th className="p-2">البند</th>
                                            <th className="p-2 text-center">التقصير</th>
                                            <th className="p-2 text-center">غرامة التقصير</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {summaryData.items.map((data, index) => (
                                            <tr key={index} className="border-b border-gray-700 last:border-b-0">
                                                <td className="p-2">{data.itemName}</td>
                                                <td className="p-2 text-center">{data.totalShortfall}</td>
                                                <td className="p-2 font-bold text-red-400 text-center">{Math.round(data.penalty)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="bg-gray-900/80">
                                        <tr className="border-t-2 border-sky-500">
                                            <td colSpan={2} className="p-3 text-lg font-bold text-center text-white">الإجمالي النهائي</td>
                                            <td className="p-3 text-lg font-extrabold text-red-400 text-center">{Math.round(summaryData.total)}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                         ) : <p className="text-center text-gray-400">يجب تحديد مدة التقييم أولاً لعرض الملخص.</p>}
                    </div>
                     {isUserAdmin && (
                        <div className="mt-6 flex justify-end no-print">
                            <Button onClick={handleGeneratePdf} disabled={isGeneratingPdf || !period}>
                                <PrintIcon className="w-5 h-5 ml-2" />
                                {isGeneratingPdf ? 'جاري الإنشاء...' : 'طباعة PDF'}
                            </Button>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
};

export default EvaluationScreen;