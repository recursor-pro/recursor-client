import React, { useState, useEffect } from 'react';
import Card from '../components/Card';
import type { HistoryRecord } from '../types';

const HistoryView: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [historyRecords, setHistoryRecords] = useState<HistoryRecord[]>([]);

  useEffect(() => {
    // Simulate loading history data
    setTimeout(() => {
      setHistoryRecords([
        {
          id: '1',
          action: 'Account Changed',
          timestamp: '2024-01-15 14:30:25',
          details: 'Changed from user1@example.com to user2@example.com',
          status: 'success',
        },
        {
          id: '2',
          action: 'Machine Code Reset',
          timestamp: '2024-01-15 13:15:10',
          details: 'Machine code reset successfully',
          status: 'success',
        },
        {
          id: '3',
          action: 'Quick Change',
          timestamp: '2024-01-15 12:45:33',
          details: 'Account and machine code changed simultaneously',
          status: 'success',
        },
        {
          id: '4',
          action: 'Account Change Failed',
          timestamp: '2024-01-15 11:20:15',
          details: 'Failed to change account: Invalid credentials',
          status: 'error',
        },
        {
          id: '5',
          action: 'Hook Status Check',
          timestamp: '2024-01-15 10:30:45',
          details: 'Hook status verified and updated',
          status: 'success',
        },
      ]);
      setLoading(false);
    }, 800);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'error':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'pending':
        return '⏳';
      default:
        return '❓';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Operation History</h1>
        <p className="text-gray-600 dark:text-gray-400">Track all your Recursor operations</p>
      </div>

      {/* History List */}
      <Card>
        <div className="space-y-4">
          {historyRecords.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">No history records found</p>
            </div>
          ) : (
            historyRecords.map((record) => (
              <div
                key={record.id}
                className="flex items-start space-x-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex-shrink-0 text-2xl">
                  {getStatusIcon(record.status)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                      {record.action}
                    </h3>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                      {record.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {record.details}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                    {record.timestamp}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {historyRecords.filter(r => r.status === 'success').length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Successful Operations</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {historyRecords.filter(r => r.status === 'error').length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Failed Operations</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {historyRecords.length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Operations</div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default HistoryView;
