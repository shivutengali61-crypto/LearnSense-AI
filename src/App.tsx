import React from 'react';
import { WorkspaceProvider, useWorkspace } from './context/WorkspaceContext';
import { AuthScreen } from './components/AuthScreen';
import { TeacherPortal } from './components/TeacherPortal';
import { StudentPortal } from './components/StudentPortal';
import { AdminPortal } from './components/AdminPortal';

const PortalRouter: React.FC = () => {
  const { user, authLoading } = useWorkspace();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F4F7FB] dark:bg-[#071224] flex items-center justify-center p-6">
        <div className="rounded-xl border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#0F1E36] px-6 py-5 text-sm font-medium text-[#0B1F3A] dark:text-[#F1F6FD]">
          Loading LearnSense AI workspace...
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  if (user.role === 'admin') {
    return <AdminPortal />;
  }

  return user.role === 'teacher' ? <TeacherPortal /> : <StudentPortal />;
};

export default function App() {
  return (
    <WorkspaceProvider>
      <PortalRouter />
    </WorkspaceProvider>
  );
}
