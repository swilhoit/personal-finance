const WebSocket = require('ws');
const http = require('http');
const { createClient } = require('@supabase/supabase-js');

// Environment setup
require('dotenv').config({ path: '.env.local' });

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🚀 Starting OpenAI Realtime WebSocket Proxy Server');
console.log('📊 Config check:', {
  hasOpenAIKey: !!OPENAI_API_KEY,
  hasSupabaseUrl: !!SUPABASE_URL,
  hasSupabaseKey: !!SUPABASE_SERVICE_KEY
});

// Create Supabase admin client for authentication
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Create HTTP server
const server = http.createServer();

// Create WebSocket server
const wss = new WebSocket.Server({ 
  server,
  verifyClient: async (info) => {
    try {
      // Extract auth token from query parameters or headers
      const url = new URL(info.req.url, 'http://localhost');
      const authToken = url.searchParams.get('auth') || info.req.headers.authorization?.replace('Bearer ', '');
      
      console.log('🔍 Verifying client with token:', authToken ? 'present' : 'missing');
      
      if (!authToken) {
        console.log('❌ No auth token provided');
        return false;
      }

      // Verify the user is authenticated with Supabase
      console.log('🔍 Attempting to verify token:', authToken ? authToken.substring(0, 20) + '...' : 'null');
      const { data: { user }, error } = await supabase.auth.getUser(authToken);
      
      console.log('🔍 Supabase auth result:', { user: user ? { id: user.id, email: user.email } : null, error: error?.message });
      
      if (error || !user) {
        console.log('❌ Invalid auth token:', error?.message || 'No user found');
        return false;
      }

      console.log('✅ User authenticated:', user.id);
      info.req.user = user;
      return true;
    } catch (error) {
      console.log('❌ Auth verification failed:', error.message);
      return false;
    }
  }
});

wss.on('connection', async (clientWs, request) => {
  console.log('🔌 New WebSocket connection attempt');
  
  // Extract auth token from query parameters
  const url = new URL(request.url, 'http://localhost');
  const authToken = url.searchParams.get('auth');
  
  console.log('🔍 Auth token from URL:', authToken ? `present (${authToken.substring(0, 20)}...)` : 'missing');
  
  let user = null;
  
  if (authToken) {
    try {
      console.log('🔍 Verifying auth token with Supabase...');
      const { data: { user: authUser }, error } = await supabase.auth.getUser(authToken);
      
      console.log('🔍 Supabase auth result:', { 
        user: authUser ? { id: authUser.id, email: authUser.email } : null, 
        error: error?.message 
      });
      
      if (authUser && !error) {
        user = authUser;
        console.log('✅ User authenticated:', user.id);
      } else {
        console.log('❌ Authentication failed:', error?.message || 'No user found');
        clientWs.close(1008, 'Authentication failed');
        return;
      }
    } catch (error) {
      console.error('❌ Auth verification error:', error);
      clientWs.close(1008, 'Authentication error');
      return;
    }
  } else {
    console.log('❌ No auth token provided');
    clientWs.close(1008, 'No authentication token');
    return;
  }
  
  console.log(`🔌 Client connected successfully: ${user?.id || 'unknown'}`);

  let openaiWs = null;

  try {
    // Connect to OpenAI Realtime API
    console.log('🔗 Connecting to OpenAI Realtime API...');
    
    openaiWs = new WebSocket('wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01', {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'OpenAI-Beta': 'realtime=v1'
      }
    });

    // Forward messages from client to OpenAI
    clientWs.on('message', (message) => {
      if (openaiWs && openaiWs.readyState === WebSocket.OPEN) {
        const data = JSON.parse(message.toString());
        console.log('📤 Client → OpenAI:', data.type);
        
        // Log session updates specifically
        if (data.type === 'session.update') {
          console.log('🔧 Session update received:', JSON.stringify(data, null, 2));
        }
        
        openaiWs.send(JSON.stringify(data));
      }
    });

    // Handle OpenAI connection events
    openaiWs.onopen = () => {
      console.log('✅ Connected to OpenAI Realtime API');
      clientWs.send(JSON.stringify({ type: 'connection.established' }));
    };

    openaiWs.onmessage = async (event) => {
      const data = JSON.parse(event.data);
      console.log('📥 OpenAI → Client:', data.type);
      
      // Log any function-related events for debugging
      if (data.type.includes('function') || data.type.includes('tool')) {
        console.log('🔧 Function/Tool event:', JSON.stringify(data, null, 2));
      }
      
      // Also log conversation items that might contain function calls
      if (data.type === 'conversation.item.created' && data.item) {
        console.log('📝 Conversation item:', JSON.stringify(data.item, null, 2));
      }
      
      // Log session updates
      if (data.type === 'session.updated') {
        console.log('✅ Session updated confirmed:', JSON.stringify(data, null, 2));
      }
      
      // Handle function calls - check for ALL possible event types
      const isFunctionCall = (
        data.type === 'response.function_call_arguments.done' || 
        data.type === 'response.function_call.arguments.done' ||
        data.type === 'response.tool_calls.function.arguments.done' ||
        (data.type === 'conversation.item.created' && data.item?.type === 'function_call') ||
        (data.type === 'response.output_item.added' && data.item?.type === 'function_call') ||
        (data.item && data.item.type === 'function_call')
      );
      
      if (isFunctionCall) {
        try {
          console.log('🔧 Processing function call:', JSON.stringify(data, null, 2));
          
          // Extract function details based on event type
          let functionName, functionArgs, callId;
          
          if (data.type === 'response.function_call_arguments.done' || 
              data.type === 'response.function_call.arguments.done') {
            functionName = data.name;
            functionArgs = data.arguments;
            callId = data.call_id;
          } else if (data.type === 'response.tool_calls.function.arguments.done') {
            functionName = data.name;
            functionArgs = data.arguments;
            callId = data.call_id;
          } else if (data.item?.type === 'function_call') {
            functionName = data.item.name;
            functionArgs = data.item.arguments;
            callId = data.item.call_id || data.item.id;
          }
          
          console.log('📊 Extracted function details:', { functionName, functionArgs, callId });
          
          if (functionName && functionArgs) {
            console.log('🔍 About to call handleFunctionCall with user ID:', user?.id);
            console.log('🔍 User object:', user ? { id: user.id, email: user.email } : 'null');
            
            const functionResult = await handleFunctionCall({
              name: functionName,
              arguments: functionArgs
            }, user?.id);
            
            console.log('📊 Function result:', JSON.stringify(functionResult, null, 2));
            
            // Send function result back to OpenAI
            openaiWs.send(JSON.stringify({
              type: 'conversation.item.create',
              item: {
                type: 'function_call_output',
                call_id: callId,
                output: JSON.stringify(functionResult)
              }
            }));
            
            // Trigger response generation
            openaiWs.send(JSON.stringify({
              type: 'response.create'
            }));
            
            console.log('📊 Function call handled:', functionName);
          }
        } catch (error) {
          console.error('❌ Function call error:', error);
        }
      }
      
      // Forward message to client
      clientWs.send(event.data);
    };

    openaiWs.onerror = (error) => {
      console.error('❌ OpenAI WebSocket error:', error);
      clientWs.send(JSON.stringify({ 
        type: 'error', 
        error: { message: 'OpenAI connection failed' } 
      }));
    };

    openaiWs.onclose = (event) => {
      console.log('🔌 OpenAI connection closed:', event.code, event.reason);
      clientWs.send(JSON.stringify({ 
        type: 'connection.closed',
        code: event.code,
        reason: event.reason
      }));
    };

  } catch (error) {
    console.error('❌ Failed to connect to OpenAI:', error);
    clientWs.send(JSON.stringify({ 
      type: 'error', 
      error: { message: 'Failed to establish connection' } 
    }));
  }

  // Handle client disconnection
  clientWs.on('close', () => {
    console.log('🔌 Client disconnected:', user?.id || 'unknown');
    if (openaiWs) {
      openaiWs.close();
    }
  });

  clientWs.on('error', (error) => {
    console.error('❌ Client WebSocket error:', error);
  });
});

// Function to handle financial data function calls
async function handleFunctionCall(data, userId) {
  const { name, arguments: args } = data;
  
  try {
    const parsedArgs = JSON.parse(args);
    
    console.log(`🔍 Function call: ${name} for user: ${userId}`);
    
    switch (name) {
      case 'get_recent_transactions':
        console.log(`📊 Querying transactions for user: ${userId} with limit: ${parsedArgs.limit || 10}`);
        
        const { data: transactions, error } = await supabase
          .from('transactions')
          .select('date, name, merchant_name, amount, iso_currency_code, category')
          .eq('user_id', userId)
          .order('date', { ascending: false })
          .limit(parsedArgs.limit || 10);
        
        console.log(`📊 Query result: ${transactions?.length || 0} transactions found`);
        if (error) {
          console.error('📊 Query error:', error);
        }
        
        return {
          transactions: transactions || [],
          message: `Found ${transactions?.length || 0} recent transactions`
        };
        
      case 'get_spending_by_category':
        const days = parsedArgs.days || 30;
        const since = new Date();
        since.setDate(since.getDate() - days);
        
        const { data: spending } = await supabase
          .from('transactions') 
          .select('category, amount')
          .eq('user_id', userId)
          .gte('date', since.toISOString().slice(0, 10));
        
        const totals = new Map();
        spending?.forEach(t => {
          const key = t.category || 'Uncategorized';
          totals.set(key, (totals.get(key) || 0) + Number(t.amount));
        });
        
        return {
          spending: Array.from(totals.entries()).map(([category, total]) => ({ 
            category, 
            total: Math.abs(total)
          })),
          period: `${days} days`,
          message: `Spending breakdown for the last ${days} days`
        };
        
      case 'get_account_balances':
        const { data: accounts } = await supabase
          .from('plaid_accounts')
          .select('name, official_name, current_balance, iso_currency_code')
          .eq('user_id', userId);
        
        return {
          accounts: accounts || [],
          message: `Found ${accounts?.length || 0} linked accounts`
        };
        
      default:
        return { error: `Unknown function: ${name}` };
    }
  } catch (error) {
    console.error(`Function call error (${name}):`, error);
    return { error: error.message };
  }
}

// Start server
const PORT = process.env.PORT || process.env.REALTIME_PORT || 8080;
server.listen(PORT, () => {
  console.log(`🎤 OpenAI Realtime WebSocket Proxy running on port ${PORT}`);
  console.log(`📡 Connect to: ws://localhost:${PORT}?auth=YOUR_SUPABASE_TOKEN`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('📴 Shutting down WebSocket server...');
  wss.close();
  server.close();
});