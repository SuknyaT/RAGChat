import express from 'express';
import path from 'path';

import cors from 'cors';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { initDb, getDb } from './db';
import { authenticate, authorize, generateToken, AuthRequest } from './middleware/auth';
import { interpretAudienceRequest } from './services/ai.service';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Auth Routes
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  const db = getDb();
  const user = await db.get('SELECT * FROM users WHERE username = ?', [username]);

  if (user && await bcrypt.compare(password, user.password)) {
    const token = generateToken(user);
    res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// Admin only: Create user
app.post('/api/users', authenticate, authorize(['admin']), async (req, res) => {
  const { username, password, role } = req.body;
  const db = getDb();
  const hashedPassword = await bcrypt.hash(password, 10);
  const id = uuidv4();
  
  try {
    await db.run('INSERT INTO users (id, username, password, role) VALUES (?, ?, ?, ?)', [id, username, hashedPassword, role]);
    res.json({ id, username, role });
  } catch (err) {
    res.status(400).json({ error: 'Username already exists' });
  }
});

// Conversation Routes
app.get('/api/conversations', authenticate, async (req: AuthRequest, res) => {
  const db = getDb();
  const conversations = await db.all('SELECT * FROM conversations WHERE userId = ? ORDER BY lastUpdated DESC', [req.user!.id]);
  res.json(conversations);
});

app.post('/api/conversations', authenticate, async (req: AuthRequest, res) => {
  const { title } = req.body;
  const db = getDb();
  const id = uuidv4();
  const now = new Date().toISOString();
  
  await db.run('INSERT INTO conversations (id, userId, title, lastUpdated) VALUES (?, ?, ?, ?)', [id, req.user!.id, title, now]);
  res.json({ id, title, lastUpdated: now });
});

app.get('/api/conversations/:id/messages', authenticate, async (req, res) => {
  const db = getDb();
  const messages = await db.all('SELECT * FROM messages WHERE conversationId = ? ORDER BY timestamp ASC', [req.params.id]);
  res.json(messages.map(m => ({
    ...m,
    signals: m.signals ? JSON.parse(m.signals) : []
  })));
});

app.post('/api/conversations/:id/messages', authenticate, async (req: AuthRequest, res) => {
  const { content } = req.body;
  const db = getDb();
  const conversationId = req.params.id;
  
  // 1. Save user message
  const userMsgId = uuidv4();
  const now = new Date().toISOString();
  await db.run('INSERT INTO messages (id, conversationId, role, content, timestamp) VALUES (?, ?, ?, ?, ?)', 
    [userMsgId, conversationId, 'user', content, now]);

  // 2. Get history for AI
  const history = await db.all('SELECT role, content FROM messages WHERE conversationId = ? ORDER BY timestamp ASC', [conversationId]);

  // 3. Call AI
  try {
    const aiResponse = await interpretAudienceRequest(content, history);
    
    // 4. Save AI message
    const aiMsgId = uuidv4();
    await db.run('INSERT INTO messages (id, conversationId, role, content, signals, estimatedSize, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)', 
      [aiMsgId, conversationId, 'assistant', aiResponse.content, JSON.stringify(aiResponse.signals), aiResponse.estimatedSize, new Date().toISOString()]);

    // 5. Update conversation lastUpdated
    await db.run('UPDATE conversations SET lastUpdated = ? WHERE id = ?', [new Date().toISOString(), conversationId]);

    res.json({
      id: aiMsgId,
      role: 'assistant',
      content: aiResponse.content,
      signals: aiResponse.signals,
      insights: aiResponse.insights,
      estimatedSize: aiResponse.estimatedSize,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    console.error('AI Error:', err);
    res.status(500).json({ error: 'AI interpretation failed: ' + err.message });
  }
});

// Taxonomy search
app.get('/api/taxonomy/search', authenticate, async (req, res) => {
  const { q } = req.query;
  const db = getDb();
  const results = await db.all('SELECT * FROM taxonomy WHERE description LIKE ? OR value LIKE ? LIMIT 20', [`%${q}%`, `%${q}%`]);
  res.json(results);
});


// Initialize and start
initDb().then(async () => {
  // Create default admin if not exists
  const db = getDb();
  const admin = await db.get('SELECT * FROM users WHERE username = ?', ['admin']);
  if (!admin) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await db.run('INSERT INTO users (id, username, password, role) VALUES (?, ?, ?, ?)', [uuidv4(), 'admin', hashedPassword, 'admin']);
    
    const plannerPassword = await bcrypt.hash('planner123', 10);
    await db.run('INSERT INTO users (id, username, password, role) VALUES (?, ?, ?, ?)', [uuidv4(), 'planner', plannerPassword, 'planner']);
    console.log('Default users created: admin/admin123, planner/planner123');
  }

  // Serve static files from React app in production
  const clientDistPath = path.join(__dirname, '../../client/dist');
  app.use(express.static(clientDistPath));

  // Catch-all for SPA routing
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(clientDistPath, 'index.html'));
    }
  });

  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
});
