import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import useAppContext from '../hooks/useAppContext.ts';
import { UserRole } from '../types.ts';
import { auth } from '../firebase/config.ts';
import {
    HomeIcon,
    UsersIcon,
    UserGroupIcon,
    ListIcon,
    CalendarIcon,
    ClipboardCheckIcon,
    ChartBarIcon,
    CogIcon,
    LogoutIcon,
    ChurchIcon
} from './ui/Icons.tsx';

const Sidebar: React.FC = () => {
    const { currentUser } = useAppContext();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await auth.signOut();
        navigate('/login');
    };

    const commonLinkClasses = "flex items-center px-4 py-3 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors duration-200";
    const activeLinkClasses = "bg-sky-800 text-white font-bold";

    const getNavLinkClass = ({ isActive }: { isActive: boolean }) =>
        `${commonLinkClasses} ${isActive ? activeLinkClasses : ''}`;
    
    const isUserAdmin = currentUser?.role === UserRole.ADMIN;

    return (
        <aside className="w-64 bg-gray-800 text-gray-200 flex flex-col p-4">
            <div className="flex items-center mb-8 px-2">
                <ChurchIcon className="w-10 h-10 text-sky-400" />
                <span className="text-xl font-bold text-white mr-3">التقييم الروحي</span>
            </div>
            <nav className="flex-1 space-y-2">
                {isUserAdmin && (
                    <NavLink to="/" className={getNavLinkClass}>
                        <HomeIcon className="w-6 h-6 ml-3" />
                        <span>لوحة التحكم</span>
                    </NavLink>
                )}
                <NavLink to="/evaluation" className={getNavLinkClass}>
                    <ClipboardCheckIcon className="w-6 h-6 ml-3" />
                    <span>التقييم اليومي</span>
                </NavLink>
                {isUserAdmin && (
                    <div className="pt-4 mt-4 border-t border-gray-700 space-y-2">
                        <p className="px-4 text-xs text-gray-500 font-bold uppercase">الإدارة</p>
                        <NavLink to="/families" className={getNavLinkClass}>
                            <UserGroupIcon className="w-6 h-6 ml-3" />
                            <span>العائلات</span>
                        </NavLink>
                        <NavLink to="/users" className={getNavLinkClass}>
                            <UsersIcon className="w-6 h-6 ml-3" />
                            <span>المستخدمين</span>
                        </NavLink>
                        <NavLink to="/items" className={getNavLinkClass}>
                            <ListIcon className="w-6 h-6 ml-3" />
                            <span>بنود التقييم</span>
                        </NavLink>
                        <NavLink to="/period" className={getNavLinkClass}>
                            <CalendarIcon className="w-6 h-6 ml-3" />
                            <span>تحديد المدة</span>
                        </NavLink>
                        <NavLink to="/reports/family" className={getNavLinkClass}>
                            <ChartBarIcon className="w-6 h-6 ml-3" />
                            <span>تقرير العائلات</span>
                        </NavLink>
                         <NavLink to="/settings" className={getNavLinkClass}>
                            <CogIcon className="w-6 h-6 ml-3" />
                            <span>ضبط النظام</span>
                        </NavLink>
                    </div>
                )}
            </nav>
            <div className="mt-auto">
                <div className="pt-4 mt-4 border-t border-gray-700 space-y-2">
                    <button onClick={handleLogout} className={`${commonLinkClasses} w-full`}>
                        <LogoutIcon className="w-6 h-6 ml-3" />
                        <span>تسجيل الخروج</span>
                    </button>
                </div>
                 <div className="text-center p-2 mt-4">
                    <p className="text-xs text-gray-500 leading-relaxed">
                        تم التطوير بواسطة<br />م / روماني لويز Son Of King
                    </p>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;