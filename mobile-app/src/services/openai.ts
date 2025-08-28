import OpenAI from 'openai';
import { supabase } from '../config/supabase';
import Constants from 'expo-constants';

// Get API key from Expo constants (works in production builds)
const OPENAI_API_KEY = Constants.expoConfig?.extra?.EXPO_PUBLIC_OPENAI_API_KEY || 
                       Constants.manifest?.extra?.EXPO_PUBLIC_OPENAI_API_KEY ||
                       '';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Required for client-side usage in React Native
});

interface TransactionData {
  amount: number;
  category: string | null;
  merchant_name: string | null;
  date: string;
}

interface BudgetData {
  category_id: string;
  amount: number;
  categories?: { name?: string };
}

// Demo transactions for when no real data exists
const DEMO_TRANSACTIONS = [
  { amount: -45.99, category: 'Food & Dining', merchant_name: 'Whole Foods', date: new Date().toISOString() },
  { amount: -12.50, category: 'Transportation', merchant_name: 'Uber', date: new Date(Date.now() - 86400000).toISOString() },
  { amount: -89.99, category: 'Shopping', merchant_name: 'Amazon', date: new Date(Date.now() - 172800000).toISOString() },
  { amount: -1200.00, category: 'Bills & Utilities', merchant_name: 'Rent Payment', date: new Date(Date.now() - 259200000).toISOString() },
  { amount: -75.00, category: 'Entertainment', merchant_name: 'Netflix Annual', date: new Date(Date.now() - 345600000).toISOString() },
  { amount: 2500.00, category: 'Income', merchant_name: 'Salary Deposit', date: new Date(Date.now() - 432000000).toISOString() },
  { amount: -32.18, category: 'Food & Dining', merchant_name: 'Starbucks', date: new Date(Date.now() - 518400000).toISOString() },
  { amount: -156.23, category: 'Bills & Utilities', merchant_name: 'Electric Bill', date: new Date(Date.now() - 604800000).toISOString() },
];

const DEMO_ACCOUNTS = [
  { name: 'Checking Account', current_balance: 3245.67, available_balance: 3245.67 },
  { name: 'Savings Account', current_balance: 12500.00, available_balance: 12500.00 },
  { name: 'Credit Card', current_balance: -1234.56, available_balance: 8765.44 },
];

export async function getAIResponse(prompt: string, userId: string): Promise<string> {
  try {
    const lowerPrompt = prompt.toLowerCase();
    
    // Prepare context based on the question
    let context = '';
    let usingDemoData = false;
    
    // Fetch relevant data based on the prompt
    if (lowerPrompt.includes('spending') || lowerPrompt.includes('expense') || lowerPrompt.includes('transaction')) {
      const { data: transactions } = await supabase
        .from('transactions')
        .select('amount, category, merchant_name, date')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .limit(50);
      
      // Use demo data if no real transactions exist
      const transactionData = (transactions && transactions.length > 0) ? transactions : DEMO_TRANSACTIONS;
      usingDemoData = !transactions || transactions.length === 0;
      
      if (transactionData.length > 0) {
        const totalSpending = transactionData
          .filter(t => t.amount < 0)
          .reduce((sum, t) => sum + Math.abs(t.amount), 0);
        
        const categorySpending: Record<string, number> = {};
        transactionData.forEach(t => {
          if (t.amount < 0) {
            const cat = t.category || 'Uncategorized';
            categorySpending[cat] = (categorySpending[cat] || 0) + Math.abs(t.amount);
          }
        });
        
        context += `${usingDemoData ? '[Using demo data] ' : ''}User's recent transactions summary:\n`;
        context += `- Total spending: $${totalSpending.toFixed(2)}\n`;
        context += `- Top categories: ${Object.entries(categorySpending)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 3)
          .map(([cat, amt]) => `${cat}: $${amt.toFixed(2)}`)
          .join(', ')}\n`;
        context += `- Recent transactions: ${transactionData.slice(0, 5)
          .map(t => `${t.merchant_name || 'Unknown'}: $${Math.abs(t.amount).toFixed(2)}`)
          .join(', ')}\n`;
      }
    }
    
    if (lowerPrompt.includes('budget')) {
      const currentMonth = new Date().toISOString().slice(0, 7);
      const { data: budgets } = await supabase
        .from('budgets')
        .select('*, categories(*)')
        .eq('user_id', userId)
        .eq('month', currentMonth);
      
      if (budgets && budgets.length > 0) {
        context += `User's current budgets:\n`;
        budgets.forEach(b => {
          context += `- ${b.categories?.name || 'Category'}: $${b.amount} budgeted\n`;
        });
      }
    }
    
    if (lowerPrompt.includes('account') || lowerPrompt.includes('balance')) {
      const { data: accounts } = await supabase
        .from('plaid_accounts')
        .select('name, current_balance, available_balance')
        .eq('user_id', userId);
      
      // Use demo accounts if no real accounts exist
      const accountData = (accounts && accounts.length > 0) ? accounts : DEMO_ACCOUNTS;
      const usingDemoAccounts = !accounts || accounts.length === 0;
      
      if (accountData.length > 0) {
        const totalBalance = accountData.reduce((sum, a) => sum + (a.current_balance || 0), 0);
        context += `${usingDemoAccounts ? '[Using demo data] ' : ''}User's accounts:\n`;
        context += `- Total balance: $${totalBalance.toFixed(2)}\n`;
        accountData.forEach(a => {
          context += `- ${a.name}: $${(a.current_balance || 0).toFixed(2)}`;
          if (a.available_balance !== null && a.available_balance !== a.current_balance) {
            context += ` (available: $${a.available_balance.toFixed(2)})`;
          }
          context += '\n';
        });
      }
    }
    
    // Create the chat completion
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a helpful personal finance assistant. You help users understand their spending patterns, manage budgets, and make better financial decisions. 
          Be concise, friendly, and actionable in your responses. Use emojis sparingly for emphasis.
          ${context ? `\nContext about the user's finances:\n${context}` : ''}`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    });
    
    return completion.choices[0]?.message?.content || 'I apologize, but I couldn\'t generate a response. Please try again.';
    
  } catch (error) {
    console.error('OpenAI API error:', error);
    
    // Provide a fallback response based on the prompt
    if (prompt.toLowerCase().includes('help')) {
      return `I can help you with:
📊 Analyzing your spending patterns
💰 Managing budgets and savings
📈 Understanding financial trends
🔄 Tracking recurring charges
💡 Providing money-saving tips

Just ask me anything about your finances!`;
    }
    
    return 'I apologize, but I\'m having trouble connecting to the AI service. Please try again in a moment.';
  }
}