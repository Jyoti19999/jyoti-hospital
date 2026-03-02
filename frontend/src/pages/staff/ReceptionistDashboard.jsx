import React from 'react';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';

const ReceptionistDashboard = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Receptionist Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Welcome back, {user?.firstName} {user?.lastName}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Appointments Today</h3>
            <p className="text-3xl font-bold text-blue-600">45</p>
            <p className="text-sm text-gray-500">Scheduled appointments</p>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Walk-ins</h3>
            <p className="text-3xl font-bold text-orange-600">8</p>
            <p className="text-sm text-gray-500">Waiting for service</p>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Payments</h3>
            <p className="text-3xl font-bold text-green-600">32</p>
            <p className="text-sm text-gray-500">Processed today</p>
          </Card>
        </div>

        <div className="mt-8">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button className="p-4 text-center border rounded-lg hover:bg-gray-50">
                <div className="text-2xl mb-2">📅</div>
                <div className="text-sm">Appointments</div>
              </button>
              <button className="p-4 text-center border rounded-lg hover:bg-gray-50">
                <div className="text-2xl mb-2">👤</div>
                <div className="text-sm">Patient Check-in</div>
              </button>
              <button className="p-4 text-center border rounded-lg hover:bg-gray-50">
                <div className="text-2xl mb-2">💳</div>
                <div className="text-sm">Billing</div>
              </button>
              <button className="p-4 text-center border rounded-lg hover:bg-gray-50">
                <div className="text-2xl mb-2">📞</div>
                <div className="text-sm">Phone Directory</div>
              </button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ReceptionistDashboard;