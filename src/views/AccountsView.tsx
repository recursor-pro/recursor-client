import React, { useState, useEffect } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import type { Account } from '../types';

const AccountsView: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<Account[]>([]);

  useEffect(() => {
    // Simulate loading account data
    setTimeout(() => {
      setAccounts([
        {
          id: '1',
          email: 'user1@example.com',
          lastUsed: '2024-01-15 14:30:25',
          status: 'active',
        },
        {
          id: '2',
          email: 'user2@example.com',
          lastUsed: '2024-01-14 09:15:10',
          status: 'inactive',
        },
        {
          id: '3',
          email: 'user3@example.com',
          lastUsed: '2024-01-13 16:45:33',
          status: 'active',
        },
        {
          id: '4',
          email: 'expired@example.com',
          lastUsed: '2023-12-20 11:20:15',
          status: 'expired',
        },
      ]);
      setLoading(false);
    }, 800);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      case 'expired':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return '🟢';
      case 'inactive':
        return '⚪';
      case 'expired':
        return '🔴';
      default:
        return '❓';
    }
  };

  const handleSwitchAccount = (accountId: string) => {
    console.log('Switch to account:', accountId);
  };

  const handleDeleteAccount = (accountId: string) => {
    console.log('Delete account:', accountId);
  };

  const handleAddAccount = () => {
    console.log('Add new account');
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Account History</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your Cursor accounts</p>
        </div>
        <Button onClick={handleAddAccount} variant="primary">
          ➕ Add Account
        </Button>
      </div>

      {/* Accounts List */}
      <Card>
        <div className="space-y-4">
          {accounts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">No accounts found</p>
            </div>
          ) : (
            accounts.map((account) => (
              <div
                key={account.id}
                className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="text-2xl">
                    {getStatusIcon(account.status)}
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                      {account.email}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      Last used: {account.lastUsed}
                    </p>
                  </div>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(account.status)}`}>
                    {account.status}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={() => handleSwitchAccount(account.id)}
                    variant="primary"
                    size="sm"
                    disabled={account.status === 'expired'}
                  >
                    Switch
                  </Button>
                  <Button
                    onClick={() => handleDeleteAccount(account.id)}
                    variant="danger"
                    size="sm"
                  >
                    Delete
                  </Button>
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
              {accounts.filter(a => a.status === 'active').length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Active Accounts</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
              {accounts.filter(a => a.status === 'inactive').length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Inactive Accounts</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {accounts.filter(a => a.status === 'expired').length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Expired Accounts</div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AccountsView;
