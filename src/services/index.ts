/**
 * Services Index
 * Export all services for easy importing
 */

export { TellerService, syncTellerToSupabase, getTellerConnectConfig } from './tellerService';
export type { TellerAccount, TellerBalance, TellerTransaction } from './tellerService';

export { MarketService } from './marketService';
export type { TickerData, PortfolioCategory } from './marketService';

export { NewsService } from './newsService';
export type { NewsArticle, NewsSentiment } from './newsService';

export { DiscordService, DiscordBot, DiscordColors } from './discordService';
export type { DiscordEmbed, DiscordWebhookMessage } from './discordService';

export { AnalysisService } from './analysisService';
export type { WeeklyAnalysis } from './analysisService';

