#!/usr/bin/env node

/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║  ⛓️ QANTUM PRIME v28.2.2 - THE EXECUTIONER                                   ║
 * ║  Web3 Direct Access | Local Nonce | Raw TX Signing | Fire-and-Forget         ║
 * ╠══════════════════════════════════════════════════════════════════════════════╣
 * ║                                                                              ║
 * ║  HFT Blockchain Execution:                                                   ║
 * ║  • Local Nonce Management (no network queries during trades)                 ║
 * ║  • Raw Transaction Signing (local CPU, no RPC delay)                         ║
 * ║  • Pre-Approved Tokens (approve once, trade forever)                         ║
 * ║  • Fire-and-Forget Broadcast (don't wait for confirmation)                   ║
 * ║                                                                              ║
 * ║  Supported DEXes:                                                            ║
 * ║  • PancakeSwap V2 (BSC)                                                      ║
 * ║  • Uniswap V2/V3 (Ethereum)                                                  ║
 * ║  • QuickSwap (Polygon)                                                       ║
 * ║                                                                              ║
 * ║  ⚠️  WARNING: Real money is at stake! Use testnet first!                     ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

'use strict';

require('dotenv').config();
const { Web3 } = require('web3');
const v8 = require('v8');
v8.setFlagsFromString('--no-lazy');

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

const CONFIG = {
    // RPC Endpoints (use fast providers for HFT)
    RPC_URL: process.env.RPC_URL || 'https://bsc-dataseed.binance.org/',
    
    // Wallet
    PRIVATE_KEY: process.env.PRIVATE_KEY,
    
    // Trading
    MAX_SLIPPAGE_BPS: parseInt(process.env.MAX_SLIPPAGE_BPS || '50'), // 0.5%
    GAS_MULTIPLIER: parseFloat(process.env.GAS_MULTIPLIER || '1.2'),
    MAX_GAS_GWEI: parseInt(process.env.MAX_GAS_GWEI || '10'),
    
    // Mode
    LIVE_MODE: process.env.LIVE_MODE === 'true',
    
    // DEX Routers
    ROUTERS: {
        PANCAKESWAP_V2: '0x10ED43C718714eb63d5aA57B78B54704E256024E',
        UNISWAP_V2: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
        QUICKSWAP: '0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff'
    },
    
    // Common Tokens (BSC)
    TOKENS: {
        WBNB: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
        BUSD: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56',
        USDT: '0x55d398326f99059fF775485246999027B3197955',
        BTCB: '0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c',
        ETH: '0x2170Ed0880ac9A755fd29B2688956BD959F933F8'
    }
};

// Minimal ABI за DEX Router (optimized for memory)
const ROUTER_ABI = [
    {
        "constant": false,
        "inputs": [
            {"name": "amountIn", "type": "uint256"},
            {"name": "amountOutMin", "type": "uint256"},
            {"name": "path", "type": "address[]"},
            {"name": "to", "type": "address"},
            {"name": "deadline", "type": "uint256"}
        ],
        "name": "swapExactTokensForTokens",
        "outputs": [{"name": "amounts", "type": "uint256[]"}],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {"name": "amountOutMin", "type": "uint256"},
            {"name": "path", "type": "address[]"},
            {"name": "to", "type": "address"},
            {"name": "deadline", "type": "uint256"}
        ],
        "name": "swapExactETHForTokens",
        "outputs": [{"name": "amounts", "type": "uint256[]"}],
        "payable": true,
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {"name": "amountIn", "type": "uint256"},
            {"name": "amountOutMin", "type": "uint256"},
            {"name": "path", "type": "address[]"},
            {"name": "to", "type": "address"},
            {"name": "deadline", "type": "uint256"}
        ],
        "name": "swapExactTokensForETH",
        "outputs": [{"name": "amounts", "type": "uint256[]"}],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [
            {"name": "amountIn", "type": "uint256"},
            {"name": "path", "type": "address[]"}
        ],
        "name": "getAmountsOut",
        "outputs": [{"name": "amounts", "type": "uint256[]"}],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    }
];

// ERC20 ABI for approval
const ERC20_ABI = [
    {
        "constant": false,
        "inputs": [
            {"name": "spender", "type": "address"},
            {"name": "amount", "type": "uint256"}
        ],
        "name": "approve",
        "outputs": [{"name": "", "type": "bool"}],
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [
            {"name": "owner", "type": "address"},
            {"name": "spender", "type": "address"}
        ],
        "name": "allowance",
        "outputs": [{"name": "", "type": "uint256"}],
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [{"name": "account", "type": "address"}],
        "name": "balanceOf",
        "outputs": [{"name": "", "type": "uint256"}],
        "type": "function"
    }
];

// ═══════════════════════════════════════════════════════════════════════════════
// CHAIN EXECUTOR CLASS
// ═══════════════════════════════════════════════════════════════════════════════

class ChainExecutor {
    constructor(options = {}) {
        this.rpcUrl = options.rpcUrl || CONFIG.RPC_URL;
        this.routerAddress = options.router || CONFIG.ROUTERS.PANCAKESWAP_V2;
        this.liveMode = options.liveMode ?? CONFIG.LIVE_MODE;
        
        // Initialize Web3
        this.web3 = new Web3(this.rpcUrl);
        
        // Wallet setup
        this.account = null;
        this.localNonce = null;
        this.chainId = null;
        
        // Contract instance
        this.router = new this.web3.eth.Contract(ROUTER_ABI, this.routerAddress);
        
        // Statistics
        this.stats = {
            executed: 0,
            confirmed: 0,
            failed: 0,
            totalGasUsed: 0n,
            totalLatency: 0,
            pendingTx: new Map()
        };
        
        // Gas cache (avoid repeated calls)
        this.cachedGasPrice = null;
        this.gasPriceExpiry = 0;
    }

    /**
     * Initialize the executor (call once at startup)
     */
    async initialize() {
        console.log(`\n⛓️ EXECUTIONER INITIALIZING...`);
        console.log(`   RPC: ${this.rpcUrl}`);
        console.log(`   Router: ${this.routerAddress}`);
        console.log(`   Mode: ${this.liveMode ? '🔴 LIVE' : '🟢 SIMULATION'}`);
        
        // Setup wallet if private key exists
        if (CONFIG.PRIVATE_KEY && CONFIG.PRIVATE_KEY !== '0x_YOUR_PRIVATE_KEY_HERE') {
            try {
                this.account = this.web3.eth.accounts.privateKeyToAccount(CONFIG.PRIVATE_KEY);
                this.web3.eth.accounts.wallet.add(this.account);
                
                // Get initial nonce
                this.localNonce = await this.web3.eth.getTransactionCount(this.account.address, 'pending');
                this.chainId = await this.web3.eth.getChainId();
                
                // Get balance
                const balance = await this.web3.eth.getBalance(this.account.address);
                const balanceEth = this.web3.utils.fromWei(balance, 'ether');
                
                console.log(`   Wallet: ${this.account.address.substring(0, 10)}...${this.account.address.slice(-8)}`);
                console.log(`   Balance: ${parseFloat(balanceEth).toFixed(4)} BNB`);
                console.log(`   Nonce: ${this.localNonce}`);
                console.log(`   Chain ID: ${this.chainId}`);
                
            } catch (error) {
                console.error(`   ❌ Wallet Error: ${error.message}`);
                this.account = null;
            }
        } else {
            console.log(`   Wallet: Not configured (SIMULATION only)`);
        }
        
        console.log(`\n🔫 EXECUTIONER READY\n`);
        return this;
    }

    /**
     * Get cached gas price (avoid repeated RPC calls)
     */
    async getGasPrice() {
        const now = Date.now();
        
        // Cache gas price for 1 second
        if (this.cachedGasPrice && now < this.gasPriceExpiry) {
            return this.cachedGasPrice;
        }
        
        const gasPrice = await this.web3.eth.getGasPrice();
        const multiplied = BigInt(Math.floor(Number(gasPrice) * CONFIG.GAS_MULTIPLIER));
        const maxGas = BigInt(CONFIG.MAX_GAS_GWEI * 1e9);
        
        this.cachedGasPrice = multiplied < maxGas ? multiplied : maxGas;
        this.gasPriceExpiry = now + 1000;
        
        return this.cachedGasPrice;
    }

    /**
     * Calculate minimum output with slippage
     */
    async getAmountOutMin(amountIn, path) {
        try {
            const amounts = await this.router.methods.getAmountsOut(amountIn, path).call();
            const expectedOut = BigInt(amounts[amounts.length - 1]);
            const slippage = BigInt(10000 - CONFIG.MAX_SLIPPAGE_BPS);
            return (expectedOut * slippage) / 10000n;
        } catch {
            return 0n; // If estimation fails, use 0 (100% slippage - dangerous!)
        }
    }

    /**
     * INSTANT EXECUTION - Token to Token Swap
     * @param {string} tokenIn - Input token address
     * @param {string} tokenOut - Output token address  
     * @param {string|BigInt} amountIn - Amount in smallest unit (wei)
     * @param {Object} options - Optional overrides
     */
    async executeSwap(tokenIn, tokenOut, amountIn, options = {}) {
        const start = process.hrtime.bigint();
        const tradeId = `TX-${Date.now().toString(36).toUpperCase()}`;
        
        // Simulation mode check
        if (!this.liveMode || !this.account) {
            const end = process.hrtime.bigint();
            const latency = Number(end - start) / 1_000_000;
            
            console.log(`🎮 [SIMULATION] ${tradeId}`);
            console.log(`   ${tokenIn.slice(0, 10)}... → ${tokenOut.slice(0, 10)}...`);
            console.log(`   Amount: ${amountIn} wei`);
            console.log(`   Latency: ${latency.toFixed(2)}ms`);
            
            this.stats.executed++;
            return { 
                success: true, 
                mode: 'simulation',
                tradeId,
                latency 
            };
        }

        try {
            // 1. Prepare swap path
            const path = [tokenIn, tokenOut];
            
            // 2. Get minimum output (with slippage protection)
            const amountOutMin = options.amountOutMin || await this.getAmountOutMin(amountIn.toString(), path);
            
            // 3. Encode function call (synchronous - super fast!)
            const deadline = Math.floor(Date.now() / 1000) + 60; // 1 minute
            const data = this.router.methods.swapExactTokensForTokens(
                amountIn.toString(),
                amountOutMin.toString(),
                path,
                this.account.address,
                deadline
            ).encodeABI();

            // 4. Build transaction
            const gasPrice = await this.getGasPrice();
            const tx = {
                from: this.account.address,
                to: this.routerAddress,
                data: data,
                gas: options.gas || 250000,
                gasPrice: gasPrice.toString(),
                nonce: this.localNonce,
                chainId: this.chainId
            };

            // 5. Sign locally (CPU operation - fast!)
            const signedTx = await this.web3.eth.accounts.signTransaction(tx, CONFIG.PRIVATE_KEY);

            // 6. Increment local nonce IMMEDIATELY (ready for next trade)
            this.localNonce++;
            this.stats.executed++;

            // 7. FIRE-AND-FORGET broadcast
            const encodingTime = Number(process.hrtime.bigint() - start) / 1_000_000;
            
            console.log(`⛓️ [BROADCAST] ${tradeId} | Encoding: ${encodingTime.toFixed(2)}ms`);
            
            // Track pending TX
            this.stats.pendingTx.set(tradeId, {
                hash: signedTx.transactionHash,
                timestamp: Date.now()
            });

            // Send and handle confirmation asynchronously
            this.web3.eth.sendSignedTransaction(signedTx.rawTransaction)
                .on('receipt', (receipt) => {
                    const totalLatency = Date.now() - this.stats.pendingTx.get(tradeId)?.timestamp;
                    console.log(`✅ [CONFIRMED] ${tradeId} | Block: ${receipt.blockNumber} | Gas: ${receipt.gasUsed} | ${totalLatency}ms`);
                    this.stats.confirmed++;
                    this.stats.totalGasUsed += BigInt(receipt.gasUsed);
                    this.stats.pendingTx.delete(tradeId);
                })
                .on('error', (error) => {
                    console.error(`❌ [FAILED] ${tradeId}: ${error.message}`);
                    this.stats.failed++;
                    this.stats.pendingTx.delete(tradeId);
                    // Reset nonce on failure
                    this.syncNonce();
                });

            const end = process.hrtime.bigint();
            const latency = Number(end - start) / 1_000_000;
            this.stats.totalLatency += latency;

            return {
                success: true,
                mode: 'live',
                tradeId,
                txHash: signedTx.transactionHash,
                latency
            };

        } catch (error) {
            const end = process.hrtime.bigint();
            const latency = Number(end - start) / 1_000_000;
            
            console.error(`❌ [ERROR] ${tradeId}: ${error.message}`);
            this.stats.failed++;
            
            // Sync nonce on error
            await this.syncNonce();
            
            return {
                success: false,
                mode: 'live',
                tradeId,
                error: error.message,
                latency
            };
        }
    }

    /**
     * Execute native token (BNB/ETH) to token swap
     */
    async executeSwapNativeToToken(tokenOut, amountIn, options = {}) {
        if (!this.liveMode || !this.account) {
            console.log(`🎮 [SIMULATION] Native → ${tokenOut.slice(0, 10)}... | ${amountIn} wei`);
            return { success: true, mode: 'simulation' };
        }

        const path = [CONFIG.TOKENS.WBNB, tokenOut];
        const amountOutMin = options.amountOutMin || await this.getAmountOutMin(amountIn.toString(), path);
        const deadline = Math.floor(Date.now() / 1000) + 60;

        const data = this.router.methods.swapExactETHForTokens(
            amountOutMin.toString(),
            path,
            this.account.address,
            deadline
        ).encodeABI();

        const tx = {
            from: this.account.address,
            to: this.routerAddress,
            data: data,
            value: amountIn.toString(),
            gas: options.gas || 250000,
            gasPrice: (await this.getGasPrice()).toString(),
            nonce: this.localNonce++,
            chainId: this.chainId
        };

        const signedTx = await this.web3.eth.accounts.signTransaction(tx, CONFIG.PRIVATE_KEY);
        
        // Fire and forget
        this.web3.eth.sendSignedTransaction(signedTx.rawTransaction)
            .catch(err => console.error('Native swap error:', err.message));

        return { success: true, txHash: signedTx.transactionHash };
    }

    /**
     * Approve token for router (do this once per token)
     */
    async approveToken(tokenAddress, amount = null) {
        if (!this.account) {
            console.log(`🎮 [SIMULATION] Approve ${tokenAddress}`);
            return { success: true, mode: 'simulation' };
        }

        const maxAmount = amount || '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
        const token = new this.web3.eth.Contract(ERC20_ABI, tokenAddress);
        
        const data = token.methods.approve(this.routerAddress, maxAmount).encodeABI();
        
        const tx = {
            from: this.account.address,
            to: tokenAddress,
            data: data,
            gas: 100000,
            gasPrice: (await this.getGasPrice()).toString(),
            nonce: this.localNonce++,
            chainId: this.chainId
        };

        const signedTx = await this.web3.eth.accounts.signTransaction(tx, CONFIG.PRIVATE_KEY);
        const receipt = await this.web3.eth.sendSignedTransaction(signedTx.rawTransaction);
        
        console.log(`✅ Token Approved: ${receipt.transactionHash}`);
        return { success: true, txHash: receipt.transactionHash };
    }

    /**
     * Check token allowance
     */
    async checkAllowance(tokenAddress) {
        if (!this.account) return BigInt(0);
        
        const token = new this.web3.eth.Contract(ERC20_ABI, tokenAddress);
        const allowance = await token.methods.allowance(this.account.address, this.routerAddress).call();
        return BigInt(allowance);
    }

    /**
     * Sync nonce with network (recovery from errors)
     */
    async syncNonce() {
        if (!this.account) return;
        this.localNonce = await this.web3.eth.getTransactionCount(this.account.address, 'pending');
        console.log(`🔄 Nonce synced: ${this.localNonce}`);
    }

    /**
     * Get execution statistics
     */
    getStats() {
        const avgLatency = this.stats.executed > 0
            ? (this.stats.totalLatency / this.stats.executed).toFixed(2)
            : 0;
        
        return {
            mode: this.liveMode ? 'LIVE' : 'SIMULATION',
            executed: this.stats.executed,
            confirmed: this.stats.confirmed,
            failed: this.stats.failed,
            pending: this.stats.pendingTx.size,
            successRate: this.stats.executed > 0
                ? ((this.stats.confirmed / this.stats.executed) * 100).toFixed(1) + '%'
                : 'N/A',
            totalGasUsed: this.stats.totalGasUsed.toString(),
            avgLatency: avgLatency + 'ms'
        };
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// STANDALONE TEST
// ═══════════════════════════════════════════════════════════════════════════════

if (require.main === module) {
    (async () => {
        console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║  ⛓️ THE EXECUTIONER - Web3 Direct Access Test                                ║
╚══════════════════════════════════════════════════════════════════════════════╝
`);

        const executor = new ChainExecutor();
        await executor.initialize();

        // Test swaps (SIMULATION mode unless LIVE_MODE=true)
        console.log('\n📍 Testing swap execution...\n');

        // Test 1: WBNB → BUSD
        await executor.executeSwap(
            CONFIG.TOKENS.WBNB,
            CONFIG.TOKENS.BUSD,
            '1000000000000000' // 0.001 BNB
        );

        // Test 2: BUSD → USDT
        await executor.executeSwap(
            CONFIG.TOKENS.BUSD,
            CONFIG.TOKENS.USDT,
            '1000000000000000000' // 1 BUSD
        );

        // Test 3: Native BNB → Token
        await executor.executeSwapNativeToToken(
            CONFIG.TOKENS.BUSD,
            '500000000000000' // 0.0005 BNB
        );

        console.log('\n📊 EXECUTION STATS:', executor.getStats());

        console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║  ⚠️  IMPORTANT NOTES:                                                        ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  To enable LIVE trading:                                                     ║
║  1. Copy .env.example to .env                                                ║
║  2. Set your PRIVATE_KEY (use a dedicated wallet!)                           ║
║  3. Set LIVE_MODE=true                                                       ║
║  4. Ensure you have approved tokens for the router                           ║
║                                                                              ║
║  MEV Protection:                                                             ║
║  - Consider using Flashbots or MEV Blocker RPC                               ║
║  - Private RPCs can help avoid front-running                                 ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
`);

    })();
}

module.exports = { ChainExecutor, CONFIG };
