import React, { useRef, useState } from 'react';
import { User, SessionDevice } from '../types';
import { ICONS } from '../constants';
import { Icon } from '../components/Icon';

const mockSessions: SessionDevice[] = [
    { id: '1', isCurrent: true, browser: 'Chrome', os: 'macOS', ip: '192.168.1.101', lastActive: new Date().toISOString() },
    { id: '2', isCurrent: false, browser: 'Safari', os: 'iOS', ip: '78.122.54.210', lastActive: new Date(Date.now() - 86400000 * 2).toISOString() },
    { id: '3', isCurrent: false, browser: 'Firefox', os: 'Windows', ip: '201.34.110.8', lastActive: new Date(Date.now() - 86400000 * 7).toISOString() },
];

const SettingsCard: React.FC<{ title: string; description: string; children: React.ReactNode; icon: string; }> = ({ title, description, children, icon }) => (
    <div className="bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg">
        <div className="p-6 border-b border-[var(--color-border)]">
            <div className="flex items-start space-x-4">
                <div className="bg-[var(--color-surface-3)] p-2 rounded-lg">
                    <Icon path={icon} className="w-6 h-6 text-[var(--color-primary)]" />
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-white">{title}</h3>
                    <p className="text-sm text-[var(--color-text-secondary)] mt-1">{description}</p>
                </div>
            </div>
        </div>
        <div className="p-6">
            {children}
        </div>
    </div>
);

const InputField: React.FC<{ label: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; type?: string; }> = ({ label, value, onChange, type = "text" }) => (
    <div>
        <label className="text-sm font-medium text-[var(--color-text-secondary)]">{label}</label>
        <input
            type={type}
            value={value}
            onChange={onChange}
            className="mt-1 w-full bg-[var(--color-surface-3)] border border-[var(--color-border)] rounded-lg p-3 text-sm focus:ring-2 focus:ring-[var(--color-primary)]"
        />
    </div>
);

export const AccountSettingsPage: React.FC<{
    user: User;
    onUpdateUser: (updatedUser: Partial<User>) => void;
    onAvatarChange: (file: File) => void;
}> = ({ user, onUpdateUser, onAvatarChange }) => {
    const [currentUser, setCurrentUser] = useState(user);
    const avatarInputRef = useRef<HTMLInputElement>(null);

    const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement>, field: keyof User) => {
        setCurrentUser({ ...currentUser, [field]: e.target.value });
    };

    const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            onAvatarChange(e.target.files[0]);
        }
    };

    return (
        <div className="h-full overflow-y-auto pr-2">
            <div className="max-w-4xl mx-auto space-y-8">
                <SettingsCard title="Profile" description="Manage your personal information." icon={ICONS.userCircle}>
                    <div className="flex items-center space-x-6">
                        <input type="file" ref={avatarInputRef} onChange={handleAvatarFileChange} accept="image/*" className="hidden" />
                        <button onClick={() => avatarInputRef.current?.click()} className="group relative">
                            <img
                                src={user.avatar || `https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&background=8B5CF6&color=fff&rounded=true&size=96`}
                                alt="User avatar"
                                className="w-24 h-24 rounded-full object-cover transition-opacity group-hover:opacity-80"
                            />
                            <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                <Icon path={ICONS.edit} className="w-8 h-8 text-white" />
                            </div>
                        </button>
                        <div className="flex-grow grid grid-cols-2 gap-4">
                            <InputField label="First Name" value={currentUser.firstName} onChange={(e) => handleFieldChange(e, 'firstName')} />
                            <InputField label="Last Name" value={currentUser.lastName} onChange={(e) => handleFieldChange(e, 'lastName')} />
                        </div>
                    </div>
                     <div className="mt-4">
                        <label className="text-sm font-medium text-[var(--color-text-secondary)]">Email Address</label>
                         <div className="flex items-center space-x-2 mt-1">
                           <input type="email" value={currentUser.email} readOnly className="flex-grow bg-[var(--color-surface-3)] border border-[var(--color-border)] rounded-lg p-3 text-sm text-gray-400 cursor-not-allowed" />
                           <button className="px-4 py-2.5 rounded-lg border border-[var(--color-border)] text-sm font-semibold hover:bg-[var(--color-surface-3)]">Change</button>
                         </div>
                    </div>
                    <div className="mt-6 flex justify-end">
                       <button onClick={() => onUpdateUser(currentUser)} className="px-5 py-2.5 rounded-lg bg-[var(--color-primary)] text-sm font-semibold text-white hover:bg-[var(--color-primary-hover)]">Save Changes</button>
                    </div>
                </SettingsCard>

                <SettingsCard title="Password" description="Change your password regularly to keep your account secure." icon={ICONS.key}>
                   <div className="flex justify-between items-center">
                       <p className="text-sm text-[var(--color-text-secondary)]">Last changed: about 2 months ago</p>
                       <button className="px-4 py-2.5 rounded-lg border border-[var(--color-border)] text-sm font-semibold hover:bg-[var(--color-surface-3)]">Change Password</button>
                   </div>
                </SettingsCard>

                <SettingsCard title="Multi-Factor Authentication" description="Add an extra layer of security to your account." icon={ICONS.shieldCheck}>
                   <div className="flex justify-between items-center">
                       <div>
                           <p className="font-semibold">{user.mfaEnabled ? "Authenticator App is enabled" : "Authenticator App"}</p>
                           <p className="text-sm text-[var(--color-text-secondary)]">{user.mfaEnabled ? "You are using an authenticator app for 2FA." : "Use an app like Google Authenticator or Authy."}</p>
                       </div>
                       <button className={`px-4 py-2.5 rounded-lg text-sm font-semibold ${user.mfaEnabled ? 'bg-red-600/20 text-red-400 hover:bg-red-600/40' : 'bg-green-600/20 text-green-400 hover:bg-green-600/40'}`}>
                           {user.mfaEnabled ? "Disable" : "Enable"}
                        </button>
                   </div>
                </SettingsCard>

                 <SettingsCard title="Linked Accounts" description="Manage third-party accounts linked for sign-in." icon={ICONS.at}>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center p-4 rounded-lg bg-[var(--color-surface-3)]">
                           <div className="flex items-center space-x-3">
                               <Icon path={ICONS.google} className="w-6 h-6" />
                               <div>
                                   <p className="font-semibold">Google</p>
                                   <p className="text-sm text-[var(--color-text-secondary)]">{user.linkedProviders.includes('google') ? user.email : "Not connected"}</p>
                               </div>
                           </div>
                           <button className={`px-4 py-2 rounded-lg text-sm font-semibold ${user.linkedProviders.includes('google') ? 'border border-[var(--color-border)] hover:bg-[var(--color-surface-1)]' : 'bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)]'}`}>
                                {user.linkedProviders.includes('google') ? 'Disconnect' : 'Connect'}
                           </button>
                        </div>
                         <div className="flex justify-between items-center p-4 rounded-lg bg-[var(--color-surface-3)]">
                           <div className="flex items-center space-x-3">
                               <Icon path={ICONS.apple} className="w-6 h-6" />
                               <div>
                                   <p className="font-semibold">Apple</p>
                                   <p className="text-sm text-[var(--color-text-secondary)]">{user.linkedProviders.includes('apple') ? user.email : "Not connected"}</p>
                               </div>
                           </div>
                           <button className={`px-4 py-2 rounded-lg text-sm font-semibold ${user.linkedProviders.includes('apple') ? 'border border-[var(--color-border)] hover:bg-[var(--color-surface-1)]' : 'bg-white text-black hover:bg-gray-200'}`}>
                                {user.linkedProviders.includes('apple') ? 'Disconnect' : 'Connect'}
                           </button>
                        </div>
                    </div>
                </SettingsCard>
                
                <SettingsCard title="Active Sessions" description="This is a list of devices that have logged into your account. Revoke any sessions that you do not recognize." icon={ICONS.desktop}>
                    <ul className="space-y-3">
                        {mockSessions.map(session => (
                            <li key={session.id} className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-surface-3)]">
                                <div className="flex items-center space-x-3">
                                    <Icon path={session.os.includes('iOS') || session.os.includes('Android') ? ICONS.mobile : ICONS.desktop} className="w-8 h-8 text-[var(--color-text-secondary)]" />
                                    <div>
                                        <p className="font-semibold">{session.browser} on {session.os} {session.isCurrent && <span className="text-xs text-green-400 font-medium ml-2">(This device)</span>}</p>
                                        <p className="text-sm text-[var(--color-text-secondary)]">{session.ip} &middot; Last active {new Date(session.lastActive).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                {!session.isCurrent && <button className="px-3 py-1.5 rounded-lg border border-[var(--color-border)] text-xs font-semibold hover:bg-[var(--color-surface-1)]">Revoke</button>}
                            </li>
                        ))}
                    </ul>
                </SettingsCard>

                 <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-red-300">Delete Account</h3>
                     <p className="text-sm text-red-300/80 mt-1">Permanently delete your account and all associated data. This action is irreversible and will take effect after a 30-day grace period.</p>
                     <div className="mt-4 flex justify-end">
                        <button className="px-4 py-2.5 rounded-lg bg-red-600 text-sm font-semibold text-white hover:bg-red-700">Delete My Account</button>
                     </div>
                </div>
            </div>
        </div>
    );
};
