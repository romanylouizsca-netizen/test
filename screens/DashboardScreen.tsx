import React from 'react';
import useAppContext from '../hooks/useAppContext.ts';
import Card from '../components/ui/Card.tsx';
import { UserCircleIcon, CalendarIcon, ClipboardCheckIcon, UserGroupIcon, UsersIcon, ListIcon } from '../components/ui/Icons.tsx';
import { Link } from 'react-router-dom';
import { UserRole } from '../types.ts';

const DashboardScreen: React.FC = () => {
    const { currentUser, period } = useAppContext();
    const isUserAdmin = currentUser?.role === UserRole.ADMIN;

    return (
        <div>
            <div className="flex items-center mb-6">
                <h1 className="text-3xl font-bold">لوحة التحكم</h1>
            </div>
            
            <Card className="mb-8">
                <div className="flex items-center">
                    <UserCircleIcon className="w-16 h-16 text-sky-400 ml-6"/>
                    <div>
                        <p className="text-2xl font-bold text-white">مرحباً بعودتك، {currentUser?.fullName}</p>
                        <p className="text-md text-gray-400 mt-1">مرحباً بك في نظام التقييم الروحي.</p>
                    </div>
                </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                     <div className="flex items-start">
                        <CalendarIcon className="w-8 h-8 text-sky-400 ml-4 flex-shrink-0"/>
                        <div>
                            <h2 className="text-xl font-bold text-white mb-2">مدة التقييم الحالية</h2>
                            {period && period.from && period.to ? (
                                <p className="text-lg text-gray-300">من <span className="font-semibold text-green-400">{period.from}</span> إلى <span className="font-semibold text-red-400">{period.to}</span></p>
                            ) : (
                                <p className="text-md text-gray-400">لم يتم تحديد مدة التقييم بعد من قبل المشرف.</p>
                            )}
                        </div>
                    </div>
                </Card>
                 <Card className="bg-sky-800/50 border border-sky-700 hover:bg-sky-800/80 transition-colors">
                    <Link to="/evaluation" className="flex items-start h-full">
                        <ClipboardCheckIcon className="w-8 h-8 text-sky-300 ml-4 flex-shrink-0"/>
                        <div>
                            <h2 className="text-xl font-bold text-white mb-2">التقييم اليومي</h2>
                            <p className="text-md text-gray-300">
                                انتقل إلى شاشة التقييم لبدء إدخال تقييماتك اليومية.
                            </p>
                        </div>
                    </Link>
                </Card>
            </div>

            {isUserAdmin && (
                <div className="mt-8">
                    <Card>
                        <h2 className="text-xl font-bold mb-4">أدوات الإدارة</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                            <Link to="/families" className="p-4 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors">
                                <UserGroupIcon className="w-10 h-10 mx-auto text-sky-400 mb-2" />
                                <span className="font-semibold">العائلات</span>
                            </Link>
                            <Link to="/users" className="p-4 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors">
                                <UsersIcon className="w-10 h-10 mx-auto text-sky-400 mb-2" />
                                <span className="font-semibold">المستخدمين</span>
                            </Link>
                            <Link to="/items" className="p-4 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors">
                                <ListIcon className="w-10 h-10 mx-auto text-sky-400 mb-2" />
                                <span className="font-semibold">بنود التقييم</span>
                            </Link>
                            <Link to="/period" className="p-4 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors">
                                <CalendarIcon className="w-10 h-10 mx-auto text-sky-400 mb-2" />
                                <span className="font-semibold">تحديد المدة</span>
                            </Link>
                        </div>
                    </Card>
                </div>
            )}

            <div className="mt-8">
                <Card>
                    <h2 className="text-xl font-bold mb-4">إرشادات</h2>
                    <p className="text-gray-300 leading-relaxed">
                        استخدم القائمة الجانبية للتنقل بين شاشات النظام المختلفة. شاشة "التقييم اليومي" هي المكان الذي ستقوم فيه بإدخال تقييماتك بشكل منتظم. تأكد من إدخال التقييمات في مواعيدها المحددة. يمكنك عرض التقارير لمعرفة أدائك وأداء عائلتك.
                    </p>
                </Card>
            </div>
        </div>
    );
};

export default DashboardScreen;