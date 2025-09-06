const { createClient } = require("@supabase/supabase-js");
require('dotenv').config({ path: '.env.local' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing env: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, key);

async function seedDemoData() {
  try {
    console.log("🌱 Seeding demo data...");
    
    // Get the first user
    const { data: { users } } = await supabase.auth.admin.listUsers();
    const user = users?.[0];
    
    if (!user) {
      console.error("❌ No user found. Please create a user first.");
      process.exit(1);
    }
    
    console.log(`👤 Using user: ${user.email} (${user.id})`);
    const userId = user.id;
    
    // Create demo plaid item (fake bank)
    const demoItemId = "demo_bank_item_123";
    console.log("🏦 Creating demo bank item...");
    await supabase.from("plaid_items").upsert({
      user_id: userId,
      item_id: demoItemId,
      access_token: "demo_access_token",
      institution_id: "demo_bank",
      institution_name: "Demo Bank"
    }, { onConflict: "item_id" });
    
    // Create demo accounts
    console.log("💳 Creating demo accounts...");
    const demoAccounts = [
      {
        user_id: userId,
        item_id: demoItemId,
        account_id: "demo_checking_123",
        name: "Demo Checking",
        official_name: "Demo Bank Checking Account",
        mask: "1234",
        type: "depository",
        subtype: "checking",
        current_balance: 2500.00,
        available_balance: 2450.00,
        iso_currency_code: "USD"
      },
      {
        user_id: userId,
        item_id: demoItemId,
        account_id: "demo_savings_456",
        name: "Demo Savings",
        official_name: "Demo Bank Savings Account",
        mask: "5678",
        type: "depository", 
        subtype: "savings",
        current_balance: 8750.50,
        available_balance: 8750.50,
        iso_currency_code: "USD"
      }
    ];
    
    await supabase.from("plaid_accounts").upsert(demoAccounts, { onConflict: "account_id" });
    
    // Create demo categories
    console.log("📂 Creating demo categories...");
    const demoCategories = [
      { user_id: userId, name: "Groceries", type: "expense" },
      { user_id: userId, name: "Restaurants", type: "expense" },
      { user_id: userId, name: "Gas", type: "expense" },
      { user_id: userId, name: "Shopping", type: "expense" },
      { user_id: userId, name: "Salary", type: "income" },
      { user_id: userId, name: "Entertainment", type: "expense" }
    ];
    
    const { data: categories } = await supabase.from("categories").upsert(demoCategories, { onConflict: "user_id,name" }).select();
    
    // Create demo transactions
    console.log("💸 Creating demo transactions...");
    const now = new Date();
    const demoTransactions = [
      {
        user_id: userId,
        account_id: "demo_checking_123",
        transaction_id: "demo_tx_1",
        name: "Whole Foods Market",
        merchant_name: "Whole Foods",
        amount: 87.43,
        date: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 day ago
        category: "Groceries",
        category_id: categories?.find(c => c.name === "Groceries")?.id,
        iso_currency_code: "USD"
      },
      {
        user_id: userId,
        account_id: "demo_checking_123",
        transaction_id: "demo_tx_2",
        name: "Shell Gas Station",
        merchant_name: "Shell",
        amount: 45.20,
        date: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 2 days ago
        category: "Gas",
        category_id: categories?.find(c => c.name === "Gas")?.id,
        iso_currency_code: "USD"
      },
      {
        user_id: userId,
        account_id: "demo_checking_123",
        transaction_id: "demo_tx_3",
        name: "Netflix",
        merchant_name: "Netflix",
        amount: 15.99,
        date: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3 days ago
        category: "Entertainment",
        category_id: categories?.find(c => c.name === "Entertainment")?.id,
        iso_currency_code: "USD"
      },
      {
        user_id: userId,
        account_id: "demo_checking_123",
        transaction_id: "demo_tx_4",
        name: "Starbucks",
        merchant_name: "Starbucks",
        amount: 5.75,
        date: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 4 days ago
        category: "Restaurants",
        category_id: categories?.find(c => c.name === "Restaurants")?.id,
        iso_currency_code: "USD"
      },
      {
        user_id: userId,
        account_id: "demo_checking_123",
        transaction_id: "demo_tx_5",
        name: "Amazon Purchase",
        merchant_name: "Amazon",
        amount: 129.99,
        date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 5 days ago
        category: "Shopping",
        category_id: categories?.find(c => c.name === "Shopping")?.id,
        iso_currency_code: "USD"
      },
      {
        user_id: userId,
        account_id: "demo_checking_123",
        transaction_id: "demo_tx_6",
        name: "Salary Deposit",
        merchant_name: "Demo Corp",
        amount: -3500.00, // Negative for income
        date: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days ago
        category: "Salary",
        category_id: categories?.find(c => c.name === "Salary")?.id,
        iso_currency_code: "USD"
      },
      {
        user_id: userId,
        account_id: "demo_checking_123", 
        transaction_id: "demo_tx_7",
        name: "Target",
        merchant_name: "Target",
        amount: 67.32,
        date: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 8 days ago
        category: "Shopping",
        category_id: categories?.find(c => c.name === "Shopping")?.id,
        iso_currency_code: "USD"
      },
      {
        user_id: userId,
        account_id: "demo_checking_123",
        transaction_id: "demo_tx_8",
        name: "Chipotle",
        merchant_name: "Chipotle",
        amount: 12.45,
        date: new Date(now.getTime() - 9 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 9 days ago
        category: "Restaurants",
        category_id: categories?.find(c => c.name === "Restaurants")?.id,
        iso_currency_code: "USD"
      },
      {
        user_id: userId,
        account_id: "demo_checking_123",
        transaction_id: "demo_tx_9",
        name: "Uber Ride",
        merchant_name: "Uber",
        amount: 23.50,
        date: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 10 days ago
        category: "Transportation",
        category_id: null,
        iso_currency_code: "USD"
      },
      {
        user_id: userId,
        account_id: "demo_checking_123",
        transaction_id: "demo_tx_10",
        name: "Costco",
        merchant_name: "Costco",
        amount: 156.78,
        date: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 12 days ago
        category: "Groceries",
        category_id: categories?.find(c => c.name === "Groceries")?.id,
        iso_currency_code: "USD"
      }
    ];
    
    await supabase.from("transactions").upsert(demoTransactions, { onConflict: "transaction_id" });
    
    console.log("✅ Demo data seeded successfully!");
    console.log(`📊 Created:`);
    console.log(`   - ${demoAccounts.length} accounts`);
    console.log(`   - ${demoTransactions.length} transactions`);
    console.log(`   - ${demoCategories.length} categories`);
    console.log("");
    console.log("🎤 Your voice AI should now have data to work with!");
    console.log("💬 Try asking: 'What's my balance?' or 'Show me recent transactions'");
    
  } catch (error) {
    console.error("❌ Error seeding demo data:", error);
    process.exit(1);
  }
}

seedDemoData();
