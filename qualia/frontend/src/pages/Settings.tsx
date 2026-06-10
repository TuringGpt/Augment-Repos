import { useState } from 'react';
import { useTheme } from 'next-themes';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getUserFromToken } from '@/lib/jwt';
import { toast } from 'sonner';
import { UserIcon, BellIcon, ShieldIcon, PaletteIcon } from 'lucide-react';

/**
 * Settings Page Component
 * 
 * Provides user settings interface including:
 * - Profile information
 * - Theme preferences
 * - Notification settings
 * - Account security
 */
function Settings() {
  const { theme, setTheme } = useTheme();
  const user = getUserFromToken();
  
  // Local state for form fields
  // Fall back to user.sub if email is not present in the token
  const [email] = useState(user?.email || user?.sub || '');
  const [name, setName] = useState(user?.name || '');

  const handleSaveProfile = () => {
    // TODO: Implement API call to update profile
    toast('Changes not saved yet', {
      description: 'Profile update functionality will be available soon.',
    });
  };

  const handleChangePassword = () => {
    // TODO: Implement password change functionality
    toast('Feature coming soon', {
      description: 'Password change functionality will be available soon.',
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="border-t border-border" />

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <UserIcon className="w-5 h-5 text-primary" />
            <CardTitle>Profile Information</CardTitle>
          </div>
          <CardDescription>
            Update your personal information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={email}
              readOnly
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              Your email address cannot be changed
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Display Name</Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
            />
          </div>
          <Button onClick={handleSaveProfile}>Save Changes</Button>
        </CardContent>
      </Card>

      {/* Theme Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <PaletteIcon className="w-5 h-5 text-primary" />
            <CardTitle>Appearance</CardTitle>
          </div>
          <CardDescription>
            Customize the appearance of the application
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Theme</Label>
            <div className="flex gap-3">
              <Button
                variant={theme === 'light' ? 'default' : 'outline'}
                onClick={() => setTheme('light')}
                className="flex-1"
              >
                Light
              </Button>
              <Button
                variant={theme === 'dark' ? 'default' : 'outline'}
                onClick={() => setTheme('dark')}
                className="flex-1"
              >
                Dark
              </Button>
              <Button
                variant={theme === 'system' ? 'default' : 'outline'}
                onClick={() => setTheme('system')}
                className="flex-1"
              >
                System
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <BellIcon className="w-5 h-5 text-primary" />
            <CardTitle>Notifications</CardTitle>
          </div>
          <CardDescription>
            Manage how you receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Notification settings coming soon
          </p>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldIcon className="w-5 h-5 text-primary" />
            <CardTitle>Security</CardTitle>
          </div>
          <CardDescription>
            Manage your account security and password
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Password</Label>
            <p className="text-sm text-muted-foreground">
              Change your password to keep your account secure
            </p>
            <Button onClick={handleChangePassword} variant="outline">
              Change Password
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default Settings;
