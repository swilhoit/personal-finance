"use client";

import { useState, useEffect } from "react";

interface NotificationSchedule {
  id: string;
  schedule_type: string;
  is_enabled: boolean;
  cron_expression: string;
  timezone: string;
  discord_guild_id: string | null;
  discord_channel_id: string | null;
  settings: Record<string, unknown>;
  last_run_at: string | null;
  next_run_at: string | null;
}

interface Guild {
  guild_id: string;
  guild_name: string;
}

interface NotificationSettingsProps {
  guilds: Guild[];
}

const SCHEDULE_TYPES = [
  {
    type: 'weekly_report',
    name: 'Weekly Financial Report',
    description: 'Receive a summary of your spending, income, and top categories every week',
    icon: '📊',
    defaultCron: '0 10 * * 0',
    cronOptions: [
      { label: 'Sunday 10am', value: '0 10 * * 0' },
      { label: 'Monday 9am', value: '0 9 * * 1' },
      { label: 'Saturday 10am', value: '0 10 * * 6' },
    ],
  },
  {
    type: 'budget_alert',
    name: 'Budget Alerts',
    description: 'Get notified when you approach or exceed your budget limits',
    icon: '💰',
    defaultCron: '0 9 * * *',
    cronOptions: [
      { label: 'Daily at 9am', value: '0 9 * * *' },
      { label: 'Daily at 6pm', value: '0 18 * * *' },
    ],
    extraSettings: {
      threshold_percent: { label: 'Alert at % of budget', default: 80, type: 'number', min: 50, max: 100 },
    },
  },
  {
    type: 'market_alert',
    name: 'Market & Watchlist Alerts',
    description: 'Get price alerts when stocks on your watchlist hit target prices',
    icon: '📈',
    defaultCron: '0 14-21 * * 1-5',
    cronOptions: [
      { label: 'Hourly (market hours)', value: '0 14-21 * * 1-5' },
      { label: 'Every 2 hours', value: '0 14,16,18,20 * * 1-5' },
    ],
  },
  {
    type: 'daily_summary',
    name: 'Daily Transaction Summary',
    description: 'Receive a daily summary of new transactions',
    icon: '📝',
    defaultCron: '0 18 * * *',
    cronOptions: [
      { label: 'Daily at 6pm', value: '0 18 * * *' },
      { label: 'Daily at 9pm', value: '0 21 * * *' },
    ],
  },
];

export default function NotificationSettings({ guilds }: NotificationSettingsProps) {
  const [schedules, setSchedules] = useState<NotificationSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    try {
      const response = await fetch('/api/notification-schedules');
      if (response.ok) {
        const data = await response.json();
        setSchedules(data.schedules || []);
      }
    } catch (err) {
      console.error('Failed to fetch schedules:', err);
    } finally {
      setLoading(false);
    }
  };

  const getScheduleForType = (type: string): NotificationSchedule | undefined => {
    return schedules.find(s => s.schedule_type === type);
  };

  const handleToggle = async (scheduleType: string, currentlyEnabled: boolean) => {
    const existingSchedule = getScheduleForType(scheduleType);
    setSaving(scheduleType);
    setError(null);

    try {
      const config = SCHEDULE_TYPES.find(t => t.type === scheduleType);
      const defaultGuild = guilds[0];

      const response = await fetch('/api/notification-schedules', {
        method: existingSchedule ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          existingSchedule
            ? { id: existingSchedule.id, is_enabled: !currentlyEnabled }
            : {
                schedule_type: scheduleType,
                is_enabled: true,
                cron_expression: config?.defaultCron,
                discord_guild_id: defaultGuild?.guild_id,
              }
        ),
      });

      if (response.ok) {
        const data = await response.json();
        if (existingSchedule) {
          setSchedules(prev =>
            prev.map(s => (s.id === existingSchedule.id ? data.schedule : s))
          );
        } else {
          setSchedules(prev => [...prev, data.schedule]);
        }
        setSuccess(`${config?.name} ${!currentlyEnabled ? 'enabled' : 'disabled'}`);
        setTimeout(() => setSuccess(null), 3000);
      } else {
        throw new Error('Failed to update schedule');
      }
    } catch {
      setError('Failed to update notification settings');
    } finally {
      setSaving(null);
    }
  };

  const handleUpdateSchedule = async (
    scheduleType: string,
    updates: Partial<NotificationSchedule>
  ) => {
    const existingSchedule = getScheduleForType(scheduleType);
    if (!existingSchedule) return;

    setSaving(scheduleType);
    setError(null);

    try {
      const response = await fetch('/api/notification-schedules', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: existingSchedule.id, ...updates }),
      });

      if (response.ok) {
        const data = await response.json();
        setSchedules(prev =>
          prev.map(s => (s.id === existingSchedule.id ? data.schedule : s))
        );
        setSuccess('Settings updated');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        throw new Error('Failed to update');
      }
    } catch {
      setError('Failed to update settings');
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-16 bg-gray-100 rounded"></div>
            <div className="h-16 bg-gray-100 rounded"></div>
            <div className="h-16 bg-gray-100 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Discord Notifications</h2>
          <p className="text-sm text-gray-600 mt-1">
            Configure recurring reports and alerts sent to your Discord server
          </p>
        </div>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm">
          {success}
        </div>
      )}

      {guilds.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-600 mb-2">No Discord servers linked</p>
          <p className="text-sm text-gray-500">
            Link a Discord server above to enable notifications
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {SCHEDULE_TYPES.map(config => {
            const schedule = getScheduleForType(config.type);
            const isEnabled = schedule?.is_enabled ?? false;
            const isSaving = saving === config.type;

            return (
              <div
                key={config.type}
                className={`border rounded-lg p-4 transition-colors ${
                  isEnabled ? 'border-blue-200 bg-blue-50/50' : 'border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{config.icon}</span>
                    <div>
                      <h3 className="font-medium text-gray-900">{config.name}</h3>
                      <p className="text-sm text-gray-600 mt-0.5">{config.description}</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isEnabled}
                      onChange={() => handleToggle(config.type, isEnabled)}
                      disabled={isSaving}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {/* Expanded settings when enabled */}
                {isEnabled && schedule && (
                  <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
                    {/* Schedule timing */}
                    <div className="flex items-center gap-3">
                      <label className="text-sm text-gray-600 min-w-24">Schedule:</label>
                      <select
                        value={schedule.cron_expression}
                        onChange={e =>
                          handleUpdateSchedule(config.type, { cron_expression: e.target.value })
                        }
                        disabled={isSaving}
                        className="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {config.cronOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Discord channel */}
                    <div className="flex items-center gap-3">
                      <label className="text-sm text-gray-600 min-w-24">Server:</label>
                      <select
                        value={schedule.discord_guild_id || ''}
                        onChange={e =>
                          handleUpdateSchedule(config.type, { discord_guild_id: e.target.value })
                        }
                        disabled={isSaving}
                        className="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {guilds.map(guild => (
                          <option key={guild.guild_id} value={guild.guild_id}>
                            {guild.guild_name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Extra settings (like threshold) */}
                    {config.extraSettings &&
                      Object.entries(config.extraSettings).map(([key, setting]) => (
                        <div key={key} className="flex items-center gap-3">
                          <label className="text-sm text-gray-600 min-w-24">{setting.label}:</label>
                          <input
                            type={setting.type}
                            min={setting.min}
                            max={setting.max}
                            value={(schedule.settings as Record<string, number>)?.[key] ?? setting.default}
                            onChange={e =>
                              handleUpdateSchedule(config.type, {
                                settings: {
                                  ...schedule.settings,
                                  [key]: parseInt(e.target.value),
                                },
                              })
                            }
                            disabled={isSaving}
                            className="w-20 text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <span className="text-sm text-gray-500">%</span>
                        </div>
                      ))}

                    {/* Last run info */}
                    {schedule.last_run_at && (
                      <p className="text-xs text-gray-500 mt-2">
                        Last sent: {new Date(schedule.last_run_at).toLocaleString()}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}




