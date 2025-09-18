import React, { useState, useEffect } from 'react';
import useAppContext from '../hooks/useAppContext.ts';
import Button from '../components/ui/Button.tsx';
import Card from '../components/ui/Card.tsx';
import { CogIcon } from '../components/ui/Icons.tsx';
import ToggleSwitch from '../components/ui/ToggleSwitch.tsx';

const SettingsScreen: React.FC = () => {
    const { evaluationControls, updateEvaluationControls, showToast } = useAppContext();
    const [saveEnabled, setSaveEnabled] = useState(true);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (evaluationControls) {
            setSaveEnabled(evaluationControls.saveEnabled);
        }
    }, [evaluationControls]);

    const handleSave = async () => {
        setIsLoading(true);
        try {
            await updateEvaluationControls({ saveEnabled });
            showToast('تم حفظ الإعدادات بنجاح.', 'success');
        } catch (error) {
            console.error(error);
            showToast('فشل حفظ الإعدادات.', 'error');
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div>
            <div className="flex items-center mb-6">
                <CogIcon className="w-8 h-8 text-sky-400 ml-4"/>
                <h1 className="text-3xl font-bold">ضبط النظام</h1>
            </div>
            <Card className="max-w-2xl mx-auto">
                <h2 className="text-xl font-bold mb-4 border-b border-gray-700 pb-3">إعدادات عامة</h2>
                <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg">
                       <div>
                         <label className="font-bold text-lg text-white">التحكم في التقييم</label>
                         <p className="text-sm text-gray-400">
                           عند الإيقاف، لن يتمكن المستخدمون من حفظ أو تعديل تقييماتهم.
                         </p>
                       </div>
                        <ToggleSwitch
                            checked={saveEnabled}
                            onChange={setSaveEnabled}
                        />
                    </div>

                     <div className="pt-4 flex justify-end">
                        <Button onClick={handleSave} disabled={isLoading}>
                            {isLoading ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default SettingsScreen;
