"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

interface DiscordConnection {
  discordUserId: string;
  username: string;
  discriminator: string | null;
  avatar: string | null;
  connectedAt: string;
}

interface Guild {
  id: string;
  guild_id: string;
  guild_name: string;
  notification_channel_id: string | null;
  finance_channel_id: string | null;
  is_active: boolean;
  registered_at: string;
}

interface TellerEnrollment {
  id: string;
  enrollment_id: string;
  institution_name: string | null;
  status: string;
  created_at: string;
}

interface TellerAccount {
  id: string;
  name: string;
  type: string | null;
  institution_name: string | null;
  current_balance: number | null;
  last_synced_at: string | null;
}

interface IntegrationsClientProps {
  discordConnection: DiscordConnection | null;
  guilds: Guild[];
  tellerEnrollments: TellerEnrollment[];
  tellerAccounts: TellerAccount[];
  botInviteUrl: string | null;
}

export default function IntegrationsClient({
  discordConnection,
  guilds: initialGuilds,
  tellerAccounts,
  botInviteUrl,
}: IntegrationsClientProps) {
  const searchParams = useSearchParams();
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [guilds, setGuilds] = useState(initialGuilds);
  const [availableGuilds, setAvailableGuilds] = useState<Array<{ id: string; name: string; icon: string | null; isLinked: boolean }>>([]);
  const [isLoadingGuilds, setIsLoadingGuilds] = useState(false);
  const [isLinkingGuild, setIsLinkingGuild] = useState<string | null>(null);

  useEffect(() => {
    const success = searchParams.get('success');
    const error = searchParams.get('error');

    if (success === 'discord_connected') {
      setNotification({ type: 'success', message: 'Discord account connected successfully!' });
    } else if (error) {
      setNotification({ type: 'error', message: `Error: ${error.replace(/_/g, ' ')}` });
    }

    // Clear notification after 5 seconds
    if (success || error) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  const handleDisconnectDiscord = async () => {
    if (!confirm('Are you sure you want to disconnect your Discord account? This will also remove all linked servers.')) {
      return;
    }

    setIsDisconnecting(true);
    try {
      const response = await fetch('/api/discord/connection', {
        method: 'DELETE',
      });

      if (response.ok) {
        setNotification({ type: 'success', message: 'Discord disconnected successfully' });
        setTimeout(() => window.location.reload(), 1500);
      } else {
        throw new Error('Failed to disconnect');
      }
    } catch (error) {
      setNotification({ type: 'error', message: 'Failed to disconnect Discord' });
    } finally {
      setIsDisconnecting(false);
    }
  };

  const fetchAvailableGuilds = async () => {
    if (!discordConnection) return;

    setIsLoadingGuilds(true);
    try {
      const response = await fetch('/api/discord/guilds');
      if (response.ok) {
        const data = await response.json();
        setAvailableGuilds(data.guilds || []);
      } else {
        throw new Error('Failed to fetch guilds');
      }
    } catch {
      setNotification({ type: 'error', message: 'Failed to load Discord servers' });
    } finally {
      setIsLoadingGuilds(false);
    }
  };

  const handleLinkGuild = async (guildId: string, guildName: string) => {
    setIsLinkingGuild(guildId);
    try {
      const response = await fetch('/api/discord/guilds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guildId, guildName }),
      });

      if (response.ok) {
        setNotification({ type: 'success', message: 'Server linked successfully' });
        // Refresh available guilds
        await fetchAvailableGuilds();
        // Refresh page to show updated guilds
        setTimeout(() => window.location.reload(), 1500);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to link server');
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to link server';
      setNotification({ type: 'error', message });
    } finally {
      setIsLinkingGuild(null);
    }
  };

  const handleUnlinkGuild = async (guildId: string) => {
    if (!confirm('Are you sure you want to unlink this Discord server?')) {
      return;
    }

    try {
      const response = await fetch('/api/discord/register', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guildId }),
      });

      if (response.ok) {
        setGuilds(guilds.filter(g => g.guild_id !== guildId));
        setNotification({ type: 'success', message: 'Server unlinked successfully' });
        // Refresh available guilds
        await fetchAvailableGuilds();
      } else {
        throw new Error('Failed to unlink server');
      }
    } catch {
      setNotification({ type: 'error', message: 'Failed to unlink server' });
    }
  };

  const getDiscordAvatarUrl = (userId: string, avatar: string | null) => {
    if (!avatar) return null;
    return `https://cdn.discordapp.com/avatars/${userId}/${avatar}.png`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <Link href="/settings" className="text-gray-600 hover:text-gray-900">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Integrations</h1>
              <p className="text-sm text-gray-600 mt-1">
                Connect and manage your external services
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
          <div className={`p-4 rounded-lg ${notification.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
            {notification.message}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 gap-6">

          {/* Discord Integration */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-900 rounded-lg flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Discord</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Receive notifications and use commands in Discord
                  </p>
                </div>
              </div>

              {discordConnection ? (
                <button
                  onClick={handleDisconnectDiscord}
                  disabled={isDisconnecting}
                  className="px-4 py-2 text-sm text-red-600 border border-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  {isDisconnecting ? 'Disconnecting...' : 'Disconnect'}
                </button>
              ) : (
                <a
                  href="/api/discord/oauth/authorize"
                  className="px-4 py-2 text-sm bg-[#5865F2] text-white rounded-lg hover:bg-[#4752C4] transition-colors"
                >
                  Connect Discord
                </a>
              )}
            </div>

            {discordConnection ? (
              <div className="space-y-4">
                {/* Connected Account */}
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center gap-3">
                    {discordConnection.avatar && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={getDiscordAvatarUrl(discordConnection.discordUserId, discordConnection.avatar) || undefined}
                        alt="Discord avatar"
                        className="w-10 h-10 rounded-full"
                      />
                    )}
                    <div>
                      <div className="font-medium">
                        {discordConnection.username}
                        {discordConnection.discriminator && `#${discordConnection.discriminator}`}
                      </div>
                      <div className="text-xs text-gray-500">
                        Connected {new Date(discordConnection.connectedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Link Servers */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-medium text-sm mb-1">Link Your Discord Servers</h3>
                      <p className="text-xs text-gray-600 mb-3">
                        Select which Discord servers should receive financial notifications and bot commands.
                      </p>
                    </div>
                  </div>

                  {availableGuilds.length === 0 && !isLoadingGuilds && (
                    <button
                      onClick={fetchAvailableGuilds}
                      className="px-4 py-2 bg-[#5865F2] text-white text-sm rounded-lg hover:bg-[#4752C4] transition-colors"
                    >
                      Load My Servers
                    </button>
                  )}

                  {isLoadingGuilds && (
                    <div className="text-sm text-gray-600">Loading servers...</div>
                  )}

                  {availableGuilds.length > 0 && (
                    <div className="space-y-2 mt-3">
                      {availableGuilds.map((guild) => (
                        <div key={guild.id} className="bg-white rounded-lg p-3 border border-gray-200 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {guild.icon && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={guild.icon} alt="" className="w-8 h-8 rounded-full" />
                            )}
                            <div>
                              <div className="font-medium text-sm">{guild.name}</div>
                              {guild.isLinked && (
                                <div className="text-xs text-green-600">✓ Linked</div>
                              )}
                            </div>
                          </div>
                          {!guild.isLinked && (
                            <button
                              onClick={() => handleLinkGuild(guild.id, guild.name)}
                              disabled={isLinkingGuild === guild.id}
                              className="px-3 py-1 text-sm bg-[#5865F2] text-white rounded hover:bg-[#4752C4] transition-colors disabled:opacity-50"
                            >
                              {isLinkingGuild === guild.id ? 'Linking...' : 'Link'}
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t border-blue-200">
                    <p className="text-xs text-gray-600 mb-2">
                      Don&apos;t see your server? Make sure the bot is invited first.
                    </p>
                    {botInviteUrl && (
                      <a
                        href={botInviteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => {
                          setTimeout(() => fetchAvailableGuilds(), 2000);
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-[#5865F2] text-white text-sm rounded-lg hover:bg-[#4752C4] transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Invite Bot to a Server
                      </a>
                    )}
                  </div>
                </div>

                {/* Linked Servers */}
                {guilds.length > 0 && (
                  <div>
                    <h3 className="font-medium text-sm mb-3">Linked Servers ({guilds.length})</h3>
                    <div className="space-y-2">
                      {guilds.map((guild) => (
                        <div key={guild.guild_id} className="bg-white rounded-lg p-4 border border-gray-200 flex items-center justify-between">
                          <div>
                            <div className="font-medium text-sm">{guild.guild_name}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              Linked {new Date(guild.registered_at).toLocaleDateString()}
                            </div>
                          </div>
                          <button
                            onClick={() => handleUnlinkGuild(guild.guild_id)}
                            className="text-sm text-red-600 hover:text-red-700"
                          >
                            Unlink
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 text-sm">
                  Connect your Discord account to receive financial notifications and use bot commands.
                </p>
              </div>
            )}
          </div>

          {/* Teller Banking */}
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Bank Accounts</h2>
                  <p className="text-xs text-gray-500 mt-1">
                    Connect your bank accounts via Teller
                  </p>
                </div>
              </div>
            </div>

            {tellerAccounts.length > 0 ? (
              <div className="space-y-2">
                {tellerAccounts.map((account) => (
                  <div key={account.id} className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-sm">{account.name}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {account.institution_name} • {account.type}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">
                          ${account.current_balance?.toFixed(2) || '0.00'}
                        </div>
                        {account.last_synced_at && (
                          <div className="text-xs text-gray-500 mt-1">
                            Updated {new Date(account.last_synced_at).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 text-sm mb-4">
                  No bank accounts connected yet.
                </p>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-colors"
                >
                  Connect Bank Account
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
