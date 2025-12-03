import React from 'react';
import { useAuth } from '@/shared/hooks/useAuth.js'; 

export const Dashboard = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Загрузка...</div>;
  }

  if (!isAuthenticated) {
    return null; 
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FFD1C1]">
      <h1 className="text-7xl text-[#60392f] font-serif mb-6">Dashboard</h1>
      <p className="text-[#60392f] font-serif">TeamTrack</p>
    </div>
  );
};
