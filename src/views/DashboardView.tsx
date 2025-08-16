import React, { useState, useEffect } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import { deviceService, type DeviceInfoState } from '../services/deviceService';

// Simple UserInfo type for legacy compatibility
interface UserInfo {
  id: string;
  email: string;
  username: string;
  level: number;
  expireTime: string;
  dailyUsage: number;
}

const DashboardView: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfoState>({
    machineId: '',
    currentAccount: '',
    cursorToken: '',
    hookStatus: null,
    cursorRunning: false,
  });

  const [userInfo, setUserInfo] = useState<UserInfo>({
    id: '1',
    email: 'user@example.com',
    username: 'Developer',
    level: 3,
    expireTime: '2024-12-31',
    dailyUsage: 150,
  });



  // Load device info on component mount
  useEffect(() => {
    const loadDeviceInfo = async () => {
      try {
        setLoading(true);
        const info = await deviceService.getDeviceInfo();
        setDeviceInfo(info);
      } catch (error) {
        console.error('Failed to load device info:', error);
        // Keep default values on error
      } finally {
        setLoading(false);
      }
    };

    loadDeviceInfo();
  }, []);

  // Refresh device info
  const handleRefreshDeviceInfo = async () => {
    try {
      setLoading(true);
      const info = await deviceService.refreshDeviceInfo();
      setDeviceInfo(info);
    } catch (error) {
      console.error('Failed to refresh device info:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChangeAccount = () => {
    console.log('Change account clicked');
  };

  const handleChangeMachineId = async () => {
    try {
      setLoading(true);
      console.log('Starting machine ID reset...');

      // Ask user if they want to force kill Cursor if it's running
      const forceKill = window.confirm(
        'Do you want to automatically close Cursor if it\'s running?\n\n' +
        'Click OK to force close Cursor, or Cancel to check manually.'
      );

      // Call the reset machine IDs function
      const result = await window.electronAPI.resetMachineIds(forceKill);
      console.log('Machine ID reset result:', result);

      if (result.includes('❌')) {
        throw new Error(result.replace('❌ Failed to reset machine IDs: ', ''));
      }

      // Refresh device info to show new machine ID
      const updatedInfo = await deviceService.refreshDeviceInfo();
      setDeviceInfo(updatedInfo);

      // Show success message
      alert('✅ Machine ID reset successfully!\n\nNew Machine ID: ' + updatedInfo.machineId.substring(0, 8) + '...');
    } catch (error) {
      console.error('Failed to reset machine ID:', error);
      alert('❌ Failed to reset machine ID: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickChange = () => {
    console.log('Quick change clicked');
  };

  const getMemberLevelName = (level: number) => {
    const levels = {
      1: 'Coder',
      2: 'Programmer', 
      3: 'Engineer',
      4: 'Architect',
      5: 'Tech Director',
    };
    return levels[level as keyof typeof levels] || 'Unknown';
  };

  const formatTimeRemaining = (expireTime: string) => {
    const expire = new Date(expireTime);
    const now = new Date();
    const diff = expire.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    return `${days} days`;
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400">Overview of your Recursor status</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Device Information */}
        <Card title="Device Information">
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Machine ID</label>
              <p className="text-sm font-mono text-gray-900 dark:text-white">
                {deviceInfo.machineId || 'Not available'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Current Account</label>
              <p className="text-sm text-gray-900 dark:text-white">
                {deviceInfo.currentAccount || 'Not logged in'}
              </p>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Hook Status</label>
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    deviceInfo.hookStatus === true
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : deviceInfo.hookStatus === false
                      ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                  }`}>
                    {deviceInfo.hookStatus === true ? '✅ Active' :
                     deviceInfo.hookStatus === false ? '❌ Inactive' : '❓ Unknown'}
                  </span>
                </div>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Cursor Status</label>
              <div className="flex items-center space-x-2">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  deviceInfo.cursorRunning
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                }`}>
                  {deviceInfo.cursorRunning ? '🟢 Running' : '🔴 Not Running'}
                </span>
              </div>
            </div>
            <div className="pt-2">
              <Button
                onClick={handleRefreshDeviceInfo}
                variant="secondary"
                disabled={loading}
                className="w-full text-xs"
              >
                {loading ? '🔄 Refreshing...' : '🔄 Refresh Info'}
              </Button>
            </div>
          </div>
        </Card>

        {/* User Information */}
        <Card title="User Information">
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</label>
              <p className="text-sm text-gray-900 dark:text-white">{userInfo.email}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Member Level</label>
              <p className="text-sm text-gray-900 dark:text-white">{getMemberLevelName(userInfo.level)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Expires In</label>
              <p className="text-sm text-gray-900 dark:text-white">{formatTimeRemaining(userInfo.expireTime)}</p>
            </div>
          </div>
        </Card>

      </div>

      {/* Quick Actions */}
      <Card title="Quick Actions">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button onClick={handleChangeAccount} variant="primary">
            🔄 Change Account
          </Button>
          <Button onClick={handleChangeMachineId} variant="secondary">
            🔧 Change Machine ID
          </Button>
          <Button onClick={handleQuickChange} variant="warning">
            ⚡ Quick Change
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default DashboardView;
