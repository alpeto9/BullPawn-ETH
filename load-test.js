#!/usr/bin/env node

const axios = require('axios');
const { ethers } = require('ethers');
require('dotenv').config();

// Configuration
const BACKEND_URL = process.env.BACKEND_URL || 'http://a316730cbb1834385aae1280841d9e71-453188197.us-west-2.elb.amazonaws.com';
const CONCURRENT_USERS = 1; // Single user to avoid nonce conflicts
const REQUESTS_PER_USER = 5; // More requests per user
const DELAY_BETWEEN_REQUESTS = 15000; // 15 seconds between requests

// Blockchain configuration
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const ZKSYNC_RPC_URL = process.env.ZKSYNC_RPC_URL || 'https://sepolia.era.zksync.dev';

if (!PRIVATE_KEY) {
  console.error('❌ PRIVATE_KEY not found in environment variables');
  console.log('💡 Please set PRIVATE_KEY in your .env file');
  process.exit(1);
}

console.log(`🚀 Starting load test with ${CONCURRENT_USERS} users, ${REQUESTS_PER_USER} requests each`);
console.log(`📡 Backend URL: ${BACKEND_URL}`);
console.log(`⛓️  Blockchain: zkSync Sepolia`);
console.log(`🔑 Using wallet: ${PRIVATE_KEY.slice(0, 10)}...`);

async function simulateUser(userId) {
  console.log(`👤 User ${userId} starting...`);
  
  // Create wallet instance
  const provider = new ethers.providers.JsonRpcProvider(ZKSYNC_RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  
  // Check wallet balance
  const balance = await provider.getBalance(wallet.address);
  console.log(`👤 User ${userId} - Wallet: ${wallet.address}`);
  console.log(`👤 User ${userId} - Balance: ${ethers.utils.formatEther(balance)} ETH`);
  
  if (balance === 0n) {
    console.log(`⚠️  User ${userId} - Wallet has no ETH, skipping...`);
    return;
  }
  
  for (let i = 0; i < REQUESTS_PER_USER; i++) {
    try {
      // Get ETH price
      const priceResponse = await axios.get(`${BACKEND_URL}/api/pawn/price/eth`);
      console.log(`👤 User ${userId} - ETH Price: $${priceResponse.data.price}`);
      
      // Wait a bit before creating pawn to avoid rapid requests
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Create a real pawn transaction
      const ethAmount = 0.000001; // Very small amount: 0.000001 ETH
      console.log(`👤 User ${userId} - Creating pawn with ${ethAmount} ETH...`);
      
      const createResponse = await axios.post(`${BACKEND_URL}/api/pawn/create`, {
        ethAmount: ethAmount.toString()
      });
      
      if (createResponse.data.txHash) {
        console.log(`✅ User ${userId} - Created pawn: ${createResponse.data.txHash}`);
        
        // Wait for transaction to be mined
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Try to redeem the pawn (this might fail if not enough USDT, but that's ok)
        try {
          const redeemResponse = await axios.post(`${BACKEND_URL}/api/pawn/redeem`, {
            positionId: createResponse.data.positionId,
            usdtAmount: Math.floor(ethAmount * priceResponse.data.price * 0.7).toString() // 70% LTV
          });
          console.log(`✅ User ${userId} - Redeemed pawn: ${redeemResponse.data.txHash}`);
        } catch (redeemError) {
          console.log(`⚠️  User ${userId} - Could not redeem pawn (expected): ${redeemError.response?.data?.error || redeemError.message}`);
        }
      } else {
        console.log(`❌ User ${userId} - Failed to create pawn: ${createResponse.data.error || 'Unknown error'}`);
      }
      
    } catch (error) {
      console.error(`❌ User ${userId} - Error:`, error.response?.data || error.message);
    }
    
    // Wait between requests
    if (i < REQUESTS_PER_USER - 1) {
      console.log(`⏳ User ${userId} - Waiting ${DELAY_BETWEEN_REQUESTS/1000}s before next request...`);
      await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_REQUESTS));
    }
  }
  
  console.log(`✅ User ${userId} completed all requests`);
}

async function runLoadTest() {
  const startTime = Date.now();
  
  // Start all users concurrently
  const userPromises = [];
  for (let i = 1; i <= CONCURRENT_USERS; i++) {
    userPromises.push(simulateUser(i));
  }
  
  // Wait for all users to complete
  await Promise.all(userPromises);
  
  const endTime = Date.now();
  const duration = (endTime - startTime) / 1000;
  
  console.log(`\n🎉 Load test completed in ${duration.toFixed(2)} seconds`);
  console.log(`📊 Total requests: ${CONCURRENT_USERS * REQUESTS_PER_USER * 2} (price + create per user)`);
  console.log(`⛓️  Real blockchain transactions were created on zkSync Sepolia`);
  console.log(`📈 Check your Grafana dashboard for updated metrics!`);
  console.log(`🔗 View transactions on: https://sepolia.explorer.zksync.io/`);
}

// Run the load test
runLoadTest().catch(console.error);
