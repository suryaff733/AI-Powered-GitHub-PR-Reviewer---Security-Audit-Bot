// Sample code for AI Security & Performance Audit Bot Verification
import express from 'express';
import Stripe from 'stripe';

const app = express();

// 1. Vulnerability: Hardcoded API Key
const stripe = new Stripe('sk_test_51MzDemoFakeSecretKeyForAuditBotTest999');

// 2. Vulnerability: SQL Injection via string concatenation
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const sql = "SELECT * FROM users WHERE username = '" + username + "' AND password = '" + password + "'";
  const user = await db.query(sql);
  res.json({ success: true, user });
});

// 3. Performance issue: O(N^2) synchronous loop over arrays
export function matchTransactions(orders, transactions) {
  return orders.map(order => {
    const tx = transactions.find(t => t.orderId === order.id);
    return { ...order, transaction: tx };
  });
}
