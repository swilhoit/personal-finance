import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import IntegrationsClient from "./IntegrationsClient";

export default async function IntegrationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch Discord connection status
  const { data: discordConnection } = await supabase
    .from('discord_connections')
    .select('discord_user_id, discord_username, discord_discriminator, discord_avatar, is_active, created_at')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single();

  // Fetch linked Discord guilds
  const { data: guilds } = await supabase
    .from('discord_guilds')
    .select('id, guild_id, guild_name, notification_channel_id, finance_channel_id, is_active, registered_at')
    .eq('user_id', user.id)
    .eq('is_active', true);

  // Fetch Teller enrollments
  const { data: tellerEnrollments } = await supabase
    .from('teller_enrollments')
    .select('id, enrollment_id, institution_name, status, created_at')
    .eq('user_id', user.id)
    .eq('status', 'active');

  // Fetch Teller accounts
  const { data: tellerAccounts } = await supabase
    .from('teller_accounts')
    .select('id, name, type, institution_name, current_balance, last_synced_at')
    .eq('user_id', user.id)
    .eq('is_active', true);

  const botInviteUrl = process.env.DISCORD_CLIENT_ID
    ? `https://discord.com/oauth2/authorize?client_id=${process.env.DISCORD_CLIENT_ID}&permissions=3147776&scope=bot%20applications.commands`
    : null;

  return (
    <IntegrationsClient
      discordConnection={discordConnection ? {
        discordUserId: discordConnection.discord_user_id,
        username: discordConnection.discord_username,
        discriminator: discordConnection.discord_discriminator,
        avatar: discordConnection.discord_avatar,
        connectedAt: discordConnection.created_at,
      } : null}
      guilds={guilds || []}
      tellerEnrollments={tellerEnrollments || []}
      tellerAccounts={tellerAccounts || []}
      botInviteUrl={botInviteUrl}
    />
  );
}
