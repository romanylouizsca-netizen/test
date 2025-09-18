import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AppProvider } from './context/AppContext.tsx';
import useAppContext from './hooks/useAppContext.ts';
import Layout from './components/Layout.tsx';
import LoginScreen from './screens/LoginScreen.tsx';
import SignUpScreen from './screens/SignUpScreen.tsx';
import DashboardScreen from './screens/DashboardScreen.tsx';
import FamiliesScreen from './screens/FamiliesScreen.tsx';
import UsersScreen from './screens/UsersScreen.tsx';
import ItemsScreen from './screens/ItemsScreen.tsx';
import PeriodScreen from './screens/PeriodScreen.tsx';
import EvaluationScreen from './screens/EvaluationScreen.tsx';
import FamilyReportScreen from './screens/FamilyReportScreen.tsx';
import SettingsScreen from './screens/SettingsScreen.tsx';
import { UserRole, UserStatus } from './types.ts';
import Toast from './components/ui/Toast.tsx';
// FIX: Import 'auth' from firebase config to fix ReferenceError on signOut call.
import { auth } from './firebase/config.ts';

const PrivateRoute: React.FC = () => {
  const { currentUser, loading } = useAppContext();

  if (loading) {
    return <div className="flex justify-center items-center h-screen bg-gray-900 text-white">Loading...</div>;
  }
  
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (currentUser.status === UserStatus.INACTIVE) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4 text-center">
        <div>
          <h1 className="text-2xl font-bold text-white mb-4">الحساب غير مفعل</h1>
          <p className="text-gray-300 mb-6">حسابك قيد المراجعة حاليًا. يرجى الانتظار حتى يقوم مدير النظام بتفعيله.</p>
          <button 
            onClick={() => auth.signOut()} 
            className="px-4 py-2 bg-sky-600 text-white rounded-md hover:bg-sky-700"
          >
            تسجيل الخروج
          </button>
        </div>
      </div>
    );
  }

  return <Layout><Outlet /></Layout>;
};

const AdminRoute: React.FC = () => {
    const { currentUser, loading } = useAppContext();

    if (loading) {
        return <div className="flex justify-center items-center h-screen bg-gray-900 text-white">Loading...</div>;
    }
    
    // Redirect if user is not an admin
    if (!currentUser || currentUser.role !== UserRole.ADMIN) {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
};


const AppRoutes: React.FC = () => {
  const { currentUser, loading, toasts, removeToast } = useAppContext();
  
  if (loading) {
    return <div className="flex justify-center items-center h-screen bg-gray-900 text-white">Loading...</div>;
  }

  const isUserAdmin = currentUser?.role === UserRole.ADMIN;

  return (
    <>
      <div className="fixed top-0 left-1/2 -translate-x-1/2 z-50 w-full max-w-md">
        {toasts.map(toast => (
          <Toast key={toast.id} message={toast.message} type={toast.type} onClose={() => removeToast(toast.id)} />
        ))}
      </div>
      <Routes>
        <Route path="/login" element={!currentUser ? <LoginScreen /> : <Navigate to="/" />} />
        <Route path="/signup" element={!currentUser ? <SignUpScreen /> : <Navigate to="/" />} />
        
        <Route element={<PrivateRoute />}>
          {/* User can only access evaluation. Admin can access dashboard. */}
          <Route path="/" element={isUserAdmin ? <DashboardScreen /> : <Navigate to="/evaluation" />} />
          <Route path="/evaluation" element={<EvaluationScreen />} />
          
          {/* Admin specific routes */}
          <Route element={<AdminRoute />}>
            <Route path="/families" element={<FamiliesScreen />} />
            <Route path="/users" element={<UsersScreen />} />
            <Route path="/items" element={<ItemsScreen />} />
            <Route path="/period" element={<PeriodScreen />} />
            <Route path="/reports/family" element={<FamilyReportScreen />} />
            <Route path="/settings" element={<SettingsScreen />} />
          </Route>
        </Route>
        
        <Route path="*" element={<Navigate to={currentUser ? "/" : "/login"} />} />
      </Routes>
    </>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AppProvider>
  );
};

export default App;