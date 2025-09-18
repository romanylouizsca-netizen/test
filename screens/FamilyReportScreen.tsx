import React, { useState, useMemo, useCallback, useEffect } from 'react';
import useAppContext from '../hooks/useAppContext.ts';
import { Family, User, ItemTypeId } from '../types.ts';
import Card from '../components/ui/Card.tsx';
import Button from '../components/ui/Button.tsx';
import Input from '../components/ui/Input.tsx';
import Select from '../components/ui/Select.tsx';
import { PrintIcon, UsersIcon, SearchIcon } from '../components/ui/Icons.tsx';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import Alert from '../components/ui/Alert.tsx';

const FamilyReportScreen: React.FC = () => {
    const { families, users, items, period, evaluations, showToast } = useAppContext();
    const [selectedFamilyId, setSelectedFamilyId] = useState<string>('');
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const [reportStartDate, setReportStartDate] = useState<string>('');
    const [reportEndDate, setReportEndDate] = useState<string>('');
    const [reportData, setReportData] = useState<{ userName: string; totalPenalty: number }[]>([]);
    const [searched, setSearched] = useState(false);
    const [error, setError] = useState('');


    useEffect(() => {
        if (period) {
            setReportStartDate(period.from || '');
            setReportEndDate(period.to || '');
        }
    }, [period]);

    const getDatesInRange = useCallback((start: string, end: string): string[] => {
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
            console.error("Invalid date for report range", e);
        }
        return dates;
    }, []);

    const handleSearch = () => {
        setError('');
        if (!selectedFamilyId || !reportStartDate || !reportEndDate) {
            setError('الرجاء اختيار عائلة وتحديد مدة زمنية.');
            return;
        }
        setSearched(true);

        const familyUsers = users.filter(u => u.familyId === selectedFamilyId);
        const datesInRange = getDatesInRange(reportStartDate, reportEndDate);
        
        const calculatedData = familyUsers.map(user => {
            const userEvaluations = evaluations.filter(e => e.userId === user.uid);
            let totalUserPenalty = 0;

            items.forEach(item => {
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
                    // This item is only checked once, on the period's start date
                    if(period?.from && datesInRange.includes(period.from)) {
                        const entry = userEvaluations.find(e => e.itemId === item.id && e.date === period.from);
                        if (!entry || entry.value !== 'Y') totalShortfall = 1;
                    }
                }
                totalUserPenalty += totalShortfall * item.price;
            });

            return { userName: user.fullName, totalPenalty: totalUserPenalty };
        });
        setReportData(calculatedData);
    };

    const totalFamilyPenalty = useMemo(() => {
        return reportData.reduce((acc, member) => acc + member.totalPenalty, 0);
    }, [reportData]);

    const selectedFamily = families.find(f => f.id === selectedFamilyId);

    const handleGeneratePdf = () => {
        const input = document.getElementById('report-content');
        if (!input) return;
        setIsGeneratingPdf(true);
        html2canvas(input, { scale: 2, useCORS: true, backgroundColor: '#1f2937' })
            .then(canvas => {
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
                const pdfWidth = 210;
                const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
                pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
                pdf.save(`تقرير-${selectedFamily?.familyName || 'العائلة'}.pdf`);
            }).catch(err => {
                showToast("حدث خطأ أثناء إنشاء ملف PDF.", 'error');
            }).finally(() => {
                setIsGeneratingPdf(false);
            });
    };

    return (
        <div className="flex flex-col md:flex-row h-full gap-6">
            <div className="md:w-1/3 no-print">
                <Card className="h-full">
                    <h2 className="text-xl font-bold mb-4 border-b border-gray-700 pb-2">خيارات التقرير</h2>
                    <div className="space-y-4">
                         <Select label="اختر عائلة" value={selectedFamilyId} onChange={e => setSelectedFamilyId(e.target.value)}>
                            <option value="" disabled>-- قائمة العائلات --</option>
                            {families.map(family => (
                                <option key={family.id} value={family.id}>
                                    {family.familyName}
                                </option>
                            ))}
                        </Select>
                        <div>
                            <h3 className="text-md font-bold mb-2 text-gray-300">تحديد مدة التقرير</h3>
                            <div className="space-y-3">
                                <Input label="من" type="date" value={reportStartDate} onChange={e => setReportStartDate(e.target.value)} />
                                <Input label="إلى" type="date" value={reportEndDate} onChange={e => setReportEndDate(e.target.value)} />
                            </div>
                        </div>
                        {error && <Alert message={error}/>}
                        <div className="pt-2">
                             <Button onClick={handleSearch} className="w-full">
                                <SearchIcon className="w-5 h-5 ml-2" />
                                بحث
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>

            <div className="flex-1">
                <Card className="h-full overflow-y-auto">
                    {searched && selectedFamily ? (
                        <div>
                            <div id="report-content" className="bg-gray-800 p-4">
                                <div className="text-center p-6 border-b-2 border-dashed border-gray-600 mb-6">
                                    <UsersIcon className="w-16 h-16 mx-auto text-sky-400 mb-4" />
                                    <h1 className="text-4xl font-extrabold text-white">{selectedFamily.familyName}</h1>
                                    <h2 className="text-xl text-gray-300 mt-2">شفيع العائلة: {selectedFamily.saint}</h2>
                                    {reportStartDate && reportEndDate && <p className="text-sm text-gray-400 mt-2">تقرير عن المدة من {reportStartDate} إلى {reportEndDate}</p>}
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-right">
                                        <thead className="border-b border-gray-600">
                                            <tr>
                                                <th className="p-4 text-lg text-center">الاسم</th>
                                                <th className="p-4 text-lg text-center">إجمالي غرامات التقصير</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {reportData.map(data => (
                                                <tr key={data.userName} className="border-b border-gray-700 last:border-b-0 hover:bg-gray-700/50">
                                                    <td className="p-4 text-lg text-center">{data.userName}</td>
                                                    <td className="p-4 text-lg font-bold text-red-400 text-center">{Math.round(data.totalPenalty)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot className="bg-gray-900">
                                            <tr className="border-t-2 border-sky-500">
                                                <td className="p-4 text-xl font-bold text-center text-white">الإجمالي النهائي</td>
                                                <td className="p-4 text-xl font-extrabold text-red-400 text-center">{Math.round(totalFamilyPenalty)}</td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>
                            <div className="mt-8 flex justify-end no-print">
                                <Button onClick={handleGeneratePdf} disabled={isGeneratingPdf}>
                                    <PrintIcon className="w-5 h-5 ml-2" />
                                    {isGeneratingPdf ? 'جاري الإنشاء...' : 'طباعة PDF'}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                            <UsersIcon className="w-24 h-24 text-gray-600 mb-4" />
                            <h2 className="text-2xl font-bold text-gray-400">تقرير العائلات</h2>
                            <p className="text-gray-500 mt-2">الرجاء اختيار عائلة وتحديد فترة زمنية ثم الضغط على "بحث" لعرض التقرير.</p>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
};

export default FamilyReportScreen;