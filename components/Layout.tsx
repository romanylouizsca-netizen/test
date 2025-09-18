import React from 'react';
import Sidebar from './Sidebar.tsx';
import useAppContext from '../hooks/useAppContext.ts';
import { UserCircleIcon } from './ui/Icons.tsx';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAppContext();
  
  return (
    <div className="flex h-screen bg-gray-900 text-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <header className="flex items-center justify-end p-4 lg:px-10 border-b border-gray-700/60 bg-gray-800/40">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-lg text-sky-300">{currentUser?.fullName}</span>
            <UserCircleIcon className="w-8 h-8 text-sky-400" />
          </div>
        </header>
        <main className="flex-1 p-6 lg:p-10 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
