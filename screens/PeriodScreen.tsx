import React, { useState, useEffect } from 'react';
import useAppContext from '../hooks/useAppContext.ts';
import Button from '../components/ui/Button.tsx';
import Input from '../components/ui/Input.tsx';
import Card from '../components/ui/Card.tsx';
import { CalendarIcon } from '../components/ui/Icons.tsx';

const PeriodScreen: React.FC = () => {
    const { period, setPeriod, showToast } = useAppContext();
    const [currentPeriod, setCurrentPeriod] = useState({ from: '', to: '' });

    useEffect(() => {
        if (period) {
            setCurrentPeriod({ from: period.from, to: period.to });
        }
    }, [period]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (currentPeriod.from && currentPeriod.to && currentPeriod.from <= currentPeriod.to) {
            await setPeriod(currentPeriod);
            showToast('تم حفظ مدة التقييم بنجاح', 'success');
        } else {
            showToast('تاريخ البداية يجب أن يكون قبل تاريخ النهاية', 'error');
        }
    };
    
    return (
        <div>
            <div className="flex items-center mb-6">
                <CalendarIcon className="w-8 h-8 text-sky-400 ml-4"/>
                <h1 className="text-3xl font-bold">شاشة تحديد مدة التقييم</h1>
            </div>
             <Card className="max-w-lg mx-auto">
                 <p className="text-gray-400 mb-6 text-center">
                    هنا يتم تحديد فترة التقييم الرسمية. ستكون هذه المدة هي النطاق الزمني المتاح للمستخدمين لإدخال تقييماتهم اليومية.
                </p>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <Input 
                        label="من (تاريخ بداية المدة)" 
                        type="date" 
                        value={currentPeriod.from} 
                        onChange={e => setCurrentPeriod({ ...currentPeriod, from: e.target.value })} 
                        required 
                    />
                    <Input 
                        label="إلى (تاريخ نهاية المدة)" 
                        type="date" 
                        value={currentPeriod.to} 
                        onChange={e => setCurrentPeriod({ ...currentPeriod, to: e.target.value })} 
                        required 
                    />
                    <div className="pt-2">
                        <Button type="submit" className="w-full">
                            حفظ المدة
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

export default PeriodScreen;
