#!/usr/bin/env node

// Test the chat API endpoint
async function testChat() {
  const url = 'http://localhost:3005/api/chat';
  
  // You'll need to replace this with a valid auth token from your browser
  // Get it from Application -> Cookies -> sb-* -> token
  const authToken = process.env.AUTH_TOKEN || '';
  
  if (!authToken) {
    console.log('Please set AUTH_TOKEN environment variable');
    console.log('You can get this from your browser cookies after logging in');
    console.log('Look for sb-* cookies and use the token value');
    return;
  }
  
  const messages = [
    {
      role: 'user',
      content: 'What are my recent transactions?'
    }
  ];
  
  try {
    console.log('Sending request to chat API...');
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `sb-access-token=${authToken}; sb-refresh-token=${authToken}`,
        'x-session-id': 'test-session-' + Date.now()
      },
      body: JSON.stringify({ messages })
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const error = await response.text();
      console.error('Error response:', error);
      return;
    }
    
    // The response should be a stream
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    
    console.log('\nStreaming response:');
    console.log('-'.repeat(50));
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value, { stream: true });
      process.stdout.write(chunk);
    }
    
    console.log('\n' + '-'.repeat(50));
    console.log('Stream complete');
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testChat();