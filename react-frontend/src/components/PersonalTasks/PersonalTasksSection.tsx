import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function PersonalTasksSection() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/dashboard');
  }, [navigate]);

  return (
    <div className="flex items-center justify-center h-screen">
      <p className="text-gray-500">Redirecting…</p>
    </div>
  );
} 