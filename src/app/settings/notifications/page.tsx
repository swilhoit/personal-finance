import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import NotificationsClient from "./NotificationsClient";

export default async function NotificationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch Discord connection status
  const { data: discordConnection } = await supabase
    .from('discord_connections')
    .select('discord_user_id, discord_username, is_active')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single();

  // Fetch linked Discord guilds
  const { data: guilds } = await supabase
    .from('discord_guilds')
    .select('id, guild_id, guild_name, notification_channel_id, is_active')
    .eq('user_id', user.id)
    .eq('is_active', true);

  return (
    <NotificationsClient
      isDiscordConnected={!!discordConnection}
      discordUsername={discordConnection?.discord_username || null}
      guilds={guilds || []}
    />
  );
}
