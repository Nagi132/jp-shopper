'use client';
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTheme } from '@/components/layouts/ThemeProvider';
import { useApp } from '@/contexts/AppContext';
import { useMessageBoxUtils } from './MessageBoxProvider';
import PersonalizationDialog from './PersonalizationDialog';
import { AlertTriangle, Sliders, Monitor, UserCircle, Bell, Shield, HelpCircle, Save } from 'lucide-react';

const SettingsPage = ({ isWindowView = true }) => {
  const { theme } = useTheme();
  const [showPersonalizationDialog, setShowPersonalizationDialog] = useState(false);
  const messageBox = useMessageBoxUtils();
  
  // Simulated settings
  const [settings, setSettings] = useState({
    notifications: {
      enableNotifications: true,
      soundEnabled: true,
      reminderNotifications: true,
      emailNotifications: false
    },
    privacy: {
      shareProfileData: true,
      allowDirectMessages: true,
      showOnlineStatus: true,
      saveSearchHistory: false
    },
    display: {
      defaultView: 'windows',
      enableAnimations: true,
      highContrastMode: false,
      fontSize: 'medium'
    },
    account: {
      username: 'user123',
      email: 'user@example.com',
      name: 'John Doe',
      language: 'English'
    }
  });

  // Update settings handlers
  const updateNotificationSettings = (key, value) => {
    setSettings(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: value
      }
    }));
  };

  const updatePrivacySettings = (key, value) => {
    setSettings(prev => ({
      ...prev,
      privacy: {
        ...prev.privacy,
        [key]: value
      }
    }));
  };

  const updateDisplaySettings = (key, value) => {
    setSettings(prev => ({
      ...prev,
      display: {
        ...prev.display,
        [key]: value
      }
    }));
  };

  const updateAccountSettings = (key, value) => {
    setSettings(prev => ({
      ...prev,
      account: {
        ...prev.account,
        [key]: value
      }
    }));
  };

  const handleSave = () => {
    messageBox.success('Your settings have been saved successfully.', 'Settings Saved');
  };

  const handleReset = () => {
    messageBox.confirm(
      'Are you sure you want to reset all settings to default? This cannot be undone.',
      'Reset Confirmation',
      (confirmed) => {
        if (confirmed) {
          // Reset logic would go here
          messageBox.info('All settings have been reset to default values.');
        }
      }
    );
  };

  return (
    <div 
      className={`${isWindowView ? 'p-4' : 'p-6 bg-white rounded-lg shadow'}`}
      style={isWindowView ? { backgroundColor: `#${theme.bgColor}` } : {}}
    >
      {showPersonalizationDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div 
            className="w-full max-w-2xl border-2 shadow-md"
            style={{
              backgroundColor: `#${theme.bgColor}`,
              borderColor: `#${theme.borderColor}`
            }}
          >
            <div 
              className="px-4 py-1 flex items-center justify-between text-white font-medium"
              style={{ backgroundColor: `#${theme.borderColor}` }}
            >
              <div className="text-sm">Personalization</div>
              <button 
                onClick={() => setShowPersonalizationDialog(false)}
                className="text-white hover:bg-white/20 rounded"
              >
                ✕
              </button>
            </div>
            <PersonalizationDialog onClose={() => setShowPersonalizationDialog(false)} />
          </div>
        </div>
      )}

      <h1 className="text-xl font-bold mb-6" style={{ color: `#${theme.textColor}` }}>
        System Settings
      </h1>

      <Tabs defaultValue="display" className="w-full">
        <TabsList 
          className="grid grid-cols-4 mb-4"
          style={{
            backgroundColor: `#${theme.buttonBgColor}`,
            borderColor: `#${theme.borderColor}`
          }}
        >
          <TabsTrigger 
            value="display"
            className="flex items-center gap-1"
            style={{
              color: `#${theme.textColor}`,
              borderColor: `#${theme.borderColor}`
            }}
          >
            <Monitor className="w-4 h-4" />
            <span>Display</span>
          </TabsTrigger>
          <TabsTrigger 
            value="notifications"
            className="flex items-center gap-1"
            style={{
              color: `#${theme.textColor}`,
              borderColor: `#${theme.borderColor}`
            }}
          >
            <Bell className="w-4 h-4" />
            <span>Notifications</span>
          </TabsTrigger>
          <TabsTrigger 
            value="privacy"
            className="flex items-center gap-1"
            style={{
              color: `#${theme.textColor}`,
              borderColor: `#${theme.borderColor}`
            }}
          >
            <Shield className="w-4 h-4" />
            <span>Privacy</span>
          </TabsTrigger>
          <TabsTrigger 
            value="account"
            className="flex items-center gap-1"
            style={{
              color: `#${theme.textColor}`,
              borderColor: `#${theme.borderColor}`
            }}
          >
            <UserCircle className="w-4 h-4" />
            <span>Account</span>
          </TabsTrigger>
        </TabsList>

        {/* Display Settings */}
        <TabsContent value="display" className="space-y-4 border p-4 rounded-sm" style={{ borderColor: `#${theme.borderColor}` }}>
          <div className="space-y-2">
            <h3 className="font-medium text-lg mb-4" style={{ color: `#${theme.textColor}` }}>Display Settings</h3>
            
            <div className="flex justify-between items-center py-2">
              <Label htmlFor="defaultView" className="flex items-center gap-2">
                Default View
              </Label>
              <select
                id="defaultView"
                value={settings.display.defaultView}
                onChange={(e) => updateDisplaySettings('defaultView', e.target.value)}
                className="p-1 border rounded"
                style={{
                  backgroundColor: `#${theme.bgColor}`,
                  color: `#${theme.textColor}`,
                  borderColor: `#${theme.borderColor}`
                }}
              >
                <option value="windows">Windows Mode</option>
                <option value="standard">Standard Mode</option>
              </select>
            </div>
            
            <div className="flex justify-between items-center py-2">
              <Label htmlFor="enableAnimations" className="flex items-center gap-2">
                Enable Animations
              </Label>
              <Switch
                id="enableAnimations"
                checked={settings.display.enableAnimations}
                onCheckedChange={(checked) => updateDisplaySettings('enableAnimations', checked)}
              />
            </div>
            
            <div className="flex justify-between items-center py-2">
              <Label htmlFor="highContrastMode" className="flex items-center gap-2">
                High Contrast Mode
              </Label>
              <Switch
                id="highContrastMode"
                checked={settings.display.highContrastMode}
                onCheckedChange={(checked) => updateDisplaySettings('highContrastMode', checked)}
              />
            </div>
            
            <div className="flex justify-between items-center py-2">
              <Label htmlFor="fontSize" className="flex items-center gap-2">
                Font Size
              </Label>
              <select
                id="fontSize"
                value={settings.display.fontSize}
                onChange={(e) => updateDisplaySettings('fontSize', e.target.value)}
                className="p-1 border rounded"
                style={{
                  backgroundColor: `#${theme.bgColor}`,
                  color: `#${theme.textColor}`,
                  borderColor: `#${theme.borderColor}`
                }}
              >
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
            </div>
            
            <div className="pt-4">
              <Button 
                onClick={() => setShowPersonalizationDialog(true)}
                className="flex items-center gap-2"
                style={{
                  backgroundColor: `#${theme.buttonBgColor}`,
                  color: `#${theme.textColor}`,
                  borderColor: `#${theme.borderColor}`
                }}
              >
                <Sliders className="w-4 h-4" />
                <span>Customize Theme</span>
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications" className="space-y-4 border p-4 rounded-sm" style={{ borderColor: `#${theme.borderColor}` }}>
          <div className="space-y-2">
            <h3 className="font-medium text-lg mb-4" style={{ color: `#${theme.textColor}` }}>Notification Settings</h3>
            
            <div className="flex justify-between items-center py-2">
              <Label htmlFor="enableNotifications" className="flex items-center gap-2">
                Enable Notifications
              </Label>
              <Switch
                id="enableNotifications"
                checked={settings.notifications.enableNotifications}
                onCheckedChange={(checked) => updateNotificationSettings('enableNotifications', checked)}
              />
            </div>
            
            <div className="flex justify-between items-center py-2">
              <Label htmlFor="soundEnabled" className="flex items-center gap-2">
                Sound Notifications
              </Label>
              <Switch
                id="soundEnabled"
                checked={settings.notifications.soundEnabled}
                onCheckedChange={(checked) => updateNotificationSettings('soundEnabled', checked)}
                disabled={!settings.notifications.enableNotifications}
              />
            </div>
            
            <div className="flex justify-between items-center py-2">
              <Label htmlFor="reminderNotifications" className="flex items-center gap-2">
                Reminder Notifications
              </Label>
              <Switch
                id="reminderNotifications"
                checked={settings.notifications.reminderNotifications}
                onCheckedChange={(checked) => updateNotificationSettings('reminderNotifications', checked)}
                disabled={!settings.notifications.enableNotifications}
              />
            </div>
            
            <div className="flex justify-between items-center py-2">
              <Label htmlFor="emailNotifications" className="flex items-center gap-2">
                Email Notifications
              </Label>
              <Switch
                id="emailNotifications"
                checked={settings.notifications.emailNotifications}
                onCheckedChange={(checked) => updateNotificationSettings('emailNotifications', checked)}
                disabled={!settings.notifications.enableNotifications}
              />
            </div>
          </div>
        </TabsContent>

        {/* Privacy Settings */}
        <TabsContent value="privacy" className="space-y-4 border p-4 rounded-sm" style={{ borderColor: `#${theme.borderColor}` }}>
          <div className="space-y-2">
            <h3 className="font-medium text-lg mb-4" style={{ color: `#${theme.textColor}` }}>Privacy Settings</h3>
            
            <div className="flex justify-between items-center py-2">
              <Label htmlFor="shareProfileData" className="flex items-center gap-2">
                Share Profile Data
              </Label>
              <Switch
                id="shareProfileData"
                checked={settings.privacy.shareProfileData}
                onCheckedChange={(checked) => updatePrivacySettings('shareProfileData', checked)}
              />
            </div>
            
            <div className="flex justify-between items-center py-2">
              <Label htmlFor="allowDirectMessages" className="flex items-center gap-2">
                Allow Direct Messages
              </Label>
              <Switch
                id="allowDirectMessages"
                checked={settings.privacy.allowDirectMessages}
                onCheckedChange={(checked) => updatePrivacySettings('allowDirectMessages', checked)}
              />
            </div>
            
            <div className="flex justify-between items-center py-2">
              <Label htmlFor="showOnlineStatus" className="flex items-center gap-2">
                Show Online Status
              </Label>
              <Switch
                id="showOnlineStatus"
                checked={settings.privacy.showOnlineStatus}
                onCheckedChange={(checked) => updatePrivacySettings('showOnlineStatus', checked)}
              />
            </div>
            
            <div className="flex justify-between items-center py-2">
              <Label htmlFor="saveSearchHistory" className="flex items-center gap-2">
                Save Search History
              </Label>
              <Switch
                id="saveSearchHistory"
                checked={settings.privacy.saveSearchHistory}
                onCheckedChange={(checked) => updatePrivacySettings('saveSearchHistory', checked)}
              />
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mt-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-yellow-800">Privacy Notice:</strong>
                <p className="text-sm text-yellow-700">
                  Your privacy is important to us. We only collect data necessary for the operation of the service.
                  You can delete your account and associated data at any time.
                </p>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Account Settings */}
        <TabsContent value="account" className="space-y-4 border p-4 rounded-sm" style={{ borderColor: `#${theme.borderColor}` }}>
          <div className="space-y-4">
            <h3 className="font-medium text-lg mb-4" style={{ color: `#${theme.textColor}` }}>Account Settings</h3>
            
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={settings.account.username}
                  onChange={(e) => updateAccountSettings('username', e.target.value)}
                  style={{
                    backgroundColor: `#${theme.bgColor}`,
                    color: `#${theme.textColor}`,
                    borderColor: `#${theme.borderColor}`
                  }}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={settings.account.name}
                  onChange={(e) => updateAccountSettings('name', e.target.value)}
                  style={{
                    backgroundColor: `#${theme.bgColor}`,
                    color: `#${theme.textColor}`,
                    borderColor: `#${theme.borderColor}`
                  }}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={settings.account.email}
                  onChange={(e) => updateAccountSettings('email', e.target.value)}
                  style={{
                    backgroundColor: `#${theme.bgColor}`,
                    color: `#${theme.textColor}`,
                    borderColor: `#${theme.borderColor}`
                  }}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="language">Preferred Language</Label>
                <select
                  id="language"
                  value={settings.account.language}
                  onChange={(e) => updateAccountSettings('language', e.target.value)}
                  className="w-full p-2 border rounded"
                  style={{
                    backgroundColor: `#${theme.bgColor}`,
                    color: `#${theme.textColor}`,
                    borderColor: `#${theme.borderColor}`
                  }}
                >
                  <option value="English">English</option>
                  <option value="Japanese">Japanese</option>
                  <option value="Spanish">Spanish</option>
                  <option value="French">French</option>
                  <option value="German">German</option>
                </select>
              </div>
            </div>
            
            <div className="pt-4">
              <Button 
                variant="destructive" 
                className="w-full"
              >
                Delete Account
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-between mt-6 pt-4 border-t" style={{ borderColor: `#${theme.borderColor}` }}>
        <Button
          onClick={handleReset}
          variant="outline"
          className="flex items-center gap-1"
          style={{
            backgroundColor: `#${theme.buttonBgColor}`,
            color: `#${theme.textColor}`,
            borderColor: `#${theme.borderColor}`
          }}
        >
          <HelpCircle className="w-4 h-4" />
          <span>Reset to Default</span>
        </Button>
        <Button
          onClick={handleSave}
          className="flex items-center gap-1"
          style={{
            backgroundColor: `#${theme.buttonBgColor}`,
            color: `#${theme.textColor}`,
            borderColor: `#${theme.borderColor}`
          }}
        >
          <Save className="w-4 h-4" />
          <span>Save Changes</span>
        </Button>
      </div>
    </div>
  );
};

export default SettingsPage;