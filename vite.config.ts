import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import { defineConfig, Plugin } from 'vite';

// Server-backed couple synchronization plugin with multi-device SSE and separate account authentication
function coupleApiPlugin(): Plugin {
  const STORE_FILE = path.resolve(__dirname, '.couple-data.json');

  // In-memory persistent state
  let coupleData: {
    users: Record<string, any>;
    tokens: Record<string, string>; // token -> userId
    couples: Record<string, any>;
  } = {
    users: {
      'user-aalu': {
        id: 'user-aalu',
        email: 'aalu@karsh.love',
        password: 'love',
        nickname: 'Aalu',
        avatar: 'avatar-aalu',
        pairCode: 'KARSH-FOREVER',
        createdAt: Date.now(),
      },
      'user-petu': {
        id: 'user-petu',
        email: 'petu@karsh.love',
        password: 'love',
        nickname: 'Petu',
        avatar: 'avatar-petu',
        pairCode: 'KARSH-FOREVER',
        createdAt: Date.now(),
      },
    },
    tokens: {
      'token-aalu': 'user-aalu',
      'token-petu': 'user-petu',
    },
    couples: {},
  };

  try {
    if (fs.existsSync(STORE_FILE)) {
      const content = fs.readFileSync(STORE_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      coupleData.couples = parsed.couples || {};
      coupleData.users = { ...coupleData.users, ...(parsed.users || {}) };
      coupleData.tokens = { ...coupleData.tokens, ...(parsed.tokens || {}) };
    }
  } catch (e) {
    console.error('Failed to read couple store, initializing default store', e);
  }

  function saveStore() {
    try {
      fs.writeFileSync(STORE_FILE, JSON.stringify(coupleData, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to persist couple store', e);
    }
  }

  // SSE streaming clients (pairCode -> Set of response objects)
  const sseListeners = new Map<string, Set<any>>();

  function broadcastToCouple(pairCode: string, payload: any) {
    const clients = sseListeners.get(pairCode);
    if (clients && clients.size > 0) {
      const dataStr = `data: ${JSON.stringify(payload)}\n\n`;
      clients.forEach((client) => {
        try {
          client.write(dataStr);
        } catch {
          clients.delete(client);
        }
      });
    }
  }

  // Helper to ensure default couple exists
  const defaultPair = 'KARSH-FOREVER';
  if (!coupleData.couples[defaultPair]) {
    coupleData.couples[defaultPair] = {
      pairCode: defaultPair,
      createdAt: Date.now(),
      anniversaryDate: '2024-02-14',
      user1: {
        id: 'user-aalu',
        nickname: 'Aalu',
        avatar: 'avatar-aalu',
        statusMessage: 'Forever and always Karsh ❤️',
        mood: 'in-love',
        isOnline: true,
        lastSeen: Date.now(),
        consentShareOnline: true,
      },
      user2: {
        id: 'user-petu',
        nickname: 'Petu',
        avatar: 'avatar-petu',
        statusMessage: 'Thinking of you my Aalu 💕',
        mood: 'happy',
        isOnline: true,
        lastSeen: Date.now(),
        consentShareOnline: true,
      },
      messages: [],
      memories: [
        {
          id: 'mem-1',
          title: 'The Beginning of Karsh',
          date: '2024-02-14',
          description: 'Our first glance at the cozy café. The start of our forever: only us.',
          category: 'milestone',
          createdAt: Date.now() - 1000 * 60 * 60 * 24 * 30,
        },
        {
          id: 'mem-2',
          title: 'Midnight Talk Under Starlight',
          date: '2024-05-20',
          description: 'We talked until 3 AM and forgot what cold felt like.',
          category: 'date',
          createdAt: Date.now() - 1000 * 60 * 60 * 24 * 10,
        },
      ],
      diaries: [
        {
          id: 'diary-1',
          authorId: 'user-aalu',
          authorNickname: 'Aalu',
          title: 'Why I smile every morning',
          content: 'Waking up knowing we are in this together makes every sunrise softer. Karsh — only us, forever.',
          mood: 'grateful',
          isLocked: false,
          createdAt: Date.now() - 1000 * 60 * 60 * 24 * 5,
        },
      ],
      typingUser: null,
      typingTimestamp: 0,
    };
    saveStore();
  }

  return {
    name: 'couple-api-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) {
          return next();
        }

        const url = new URL(req.url, 'http://localhost:3000');
        const pathname = url.pathname;

        const parseBody = (): Promise<any> => {
          return new Promise((resolve) => {
            let data = '';
            req.on('data', (chunk) => { data += chunk; });
            req.on('end', () => {
              try {
                resolve(data ? JSON.parse(data) : {});
              } catch {
                resolve({});
              }
            });
          });
        };

        const json = (data: any, status = 200) => {
          res.statusCode = status;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(data));
        };

        // Extract user identity from Authorization header or query param
        const authHeader = req.headers['authorization'];
        let requestUserId = (url.searchParams.get('userId') || '').trim();
        if (authHeader && authHeader.startsWith('Bearer ')) {
          const token = authHeader.substring(7);
          if (coupleData.tokens[token]) {
            requestUserId = coupleData.tokens[token];
          }
        }

        try {
          // --- 1. Authentication Endpoints ---
          if (pathname === '/api/auth/register' && req.method === 'POST') {
            const body = await parseBody();
            const email = (body.email || '').trim().toLowerCase();
            const password = body.password || '';
            const nickname = body.nickname || 'Sweetheart';
            const avatar = body.avatar || (nickname.toLowerCase().includes('petu') ? 'avatar-petu' : 'avatar-aalu');
            const pairCode = (body.pairCode || 'KARSH-FOREVER').toUpperCase();

            if (!email || !password) {
              return json({ success: false, error: 'Email and password are required' }, 400);
            }

            // Check if existing user
            const existingUser = Object.values(coupleData.users).find((u) => u.email === email);
            if (existingUser) {
              return json({ success: false, error: 'Account already exists. Please log in.' }, 400);
            }

            const userId = `user-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
            const token = `token-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

            const newUser = {
              id: userId,
              email,
              password,
              nickname,
              avatar,
              pairCode,
              createdAt: Date.now(),
            };

            coupleData.users[userId] = newUser;
            coupleData.tokens[token] = userId;

            // Connect to couple room if exists or add as user2
            const couple = coupleData.couples[pairCode];
            if (couple) {
              if (couple.user1.id !== userId && (!couple.user2 || couple.user2.id === userId)) {
                couple.user2 = {
                  id: userId,
                  nickname,
                  avatar,
                  statusMessage: 'Forever and always ❤️',
                  mood: 'in-love',
                  isOnline: true,
                  lastSeen: Date.now(),
                  consentShareOnline: true,
                };
              }
            }

            saveStore();
            return json({ success: true, token, user: newUser });
          }

          if (pathname === '/api/auth/login' && req.method === 'POST') {
            const body = await parseBody();
            const email = (body.email || '').trim().toLowerCase();
            const password = body.password || '';

            const user = Object.values(coupleData.users).find(
              (u) => (u.email === email || u.nickname.toLowerCase() === email) && u.password === password
            );

            if (!user) {
              return json({ success: false, error: 'Invalid email or password' }, 401);
            }

            const token = `token-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
            coupleData.tokens[token] = user.id;
            saveStore();

            return json({ success: true, token, user });
          }

          if (pathname === '/api/auth/me' && req.method === 'GET') {
            if (!requestUserId || !coupleData.users[requestUserId]) {
              return json({ success: false, error: 'Unauthenticated' }, 401);
            }
            return json({ success: true, user: coupleData.users[requestUserId] });
          }

          // --- 2. Real-Time Server-Sent Events (SSE) Stream ---
          if (pathname === '/api/couple/stream' && req.method === 'GET') {
            const pairCode = (url.searchParams.get('pairCode') || 'KARSH-FOREVER').toUpperCase();
            const couple = coupleData.couples[pairCode];

            if (!couple) {
              return json({ success: false, error: 'Couple not found' }, 404);
            }

            res.writeHead(200, {
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache',
              'Connection': 'keep-alive',
            });

            if (!sseListeners.has(pairCode)) {
              sseListeners.set(pairCode, new Set());
            }
            sseListeners.get(pairCode)!.add(res);

            // Send initial ping
            res.write(`data: ${JSON.stringify({ type: 'CONNECTED', pairCode })}\n\n`);

            req.on('close', () => {
              const clients = sseListeners.get(pairCode);
              if (clients) {
                clients.delete(res);
              }
            });
            return;
          }

          // --- 3. Couple Session Init & Join ---
          if (pathname === '/api/couple/init' && req.method === 'POST') {
            const body = await parseBody();
            const pairCode = (body.pairCode || 'KARSH-FOREVER').toUpperCase();

            if (!coupleData.couples[pairCode]) {
              coupleData.couples[pairCode] = {
                pairCode,
                createdAt: Date.now(),
                anniversaryDate: body.anniversaryDate || '2024-02-14',
                user1: {
                  id: body.userId || 'user-aalu',
                  nickname: body.nickname || 'Aalu',
                  avatar: 'avatar-aalu',
                  statusMessage: 'Forever and always Karsh ❤️',
                  mood: 'in-love',
                  isOnline: true,
                  lastSeen: Date.now(),
                  consentShareOnline: true,
                },
                user2: {
                  id: 'user-petu',
                  nickname: 'Petu',
                  avatar: 'avatar-petu',
                  statusMessage: 'Thinking of you my Aalu 💕',
                  mood: 'happy',
                  isOnline: true,
                  lastSeen: Date.now(),
                  consentShareOnline: true,
                },
                messages: [],
                memories: [],
                diaries: [],
                typingUser: null,
                typingTimestamp: 0,
              };
              saveStore();
            }

            return json({ success: true, couple: coupleData.couples[pairCode] });
          }

          if (pathname === '/api/couple/join' && req.method === 'POST') {
            const body = await parseBody();
            const pairCode = (body.pairCode || '').toUpperCase();
            const couple = coupleData.couples[pairCode];

            if (!couple) {
              return json({ success: false, error: 'Invitation code not found' }, 404);
            }

            if (!couple.user2 || couple.user2.id === body.userId) {
              couple.user2 = {
                id: body.userId || 'user-petu',
                nickname: body.nickname || 'Petu',
                avatar: 'avatar-petu',
                statusMessage: 'Thinking of you 💕',
                mood: 'happy',
                isOnline: true,
                lastSeen: Date.now(),
                consentShareOnline: true,
              };
              saveStore();
              broadcastToCouple(pairCode, { type: 'COUPLE_UPDATED', couple });
            }

            return json({ success: true, couple });
          }

          // --- 4. Synchronization & Heartbeat ---
          if (pathname === '/api/couple/sync' && req.method === 'GET') {
            const pairCode = (url.searchParams.get('pairCode') || 'KARSH-FOREVER').toUpperCase();
            const userId = requestUserId || url.searchParams.get('userId');
            const couple = coupleData.couples[pairCode];

            if (!couple) {
              return json({ success: false, error: 'Couple not found' }, 404);
            }

            // Participant security check
            const isParticipant =
              userId === couple.user1?.id ||
              userId === couple.user2?.id ||
              userId === 'user-aalu' ||
              userId === 'user-petu';

            if (!isParticipant) {
              return json({ success: false, error: 'Unauthorized: You are not a participant in this couple space' }, 403);
            }

            // Update user's lastSeen if consent
            if (userId === couple.user1?.id && couple.user1?.consentShareOnline) {
              couple.user1.isOnline = true;
              couple.user1.lastSeen = Date.now();
            } else if (userId === couple.user2?.id && couple.user2?.consentShareOnline) {
              couple.user2.isOnline = true;
              couple.user2.lastSeen = Date.now();
            }

            if (Date.now() - couple.typingTimestamp > 4000) {
              couple.typingUser = null;
            }

            return json({ success: true, couple });
          }

          // --- 5. Message Dispatch with Strict Idempotency & Delivery Tracking ---
          if (pathname === '/api/couple/message' && req.method === 'POST') {
            const body = await parseBody();
            const pairCode = (body.pairCode || 'KARSH-FOREVER').toUpperCase();
            const couple = coupleData.couples[pairCode];

            if (!couple) {
              return json({ success: false, error: 'Couple not found' }, 404);
            }

            const incomingMsg = body.message;
            if (!incomingMsg || !incomingMsg.clientMessageId) {
              return json({ success: false, error: 'Invalid message payload' }, 400);
            }

            // Check authorization: only the 2 couple users can send
            const senderId = incomingMsg.senderId;
            const isAuthorized =
              senderId === couple.user1?.id ||
              senderId === couple.user2?.id ||
              senderId === 'user-aalu' ||
              senderId === 'user-petu' ||
              senderId === 'user-1' ||
              senderId === 'user-2';
            if (!isAuthorized) {
              return json({ success: false, error: 'Forbidden: sender is not in this couple' }, 403);
            }

            // Idempotent Deduplication Check
            const existing = couple.messages.find(
              (m: any) => m.clientMessageId === incomingMsg.clientMessageId || m.id === incomingMsg.id
            );

            if (existing) {
              return json({ success: true, message: existing, duplicate: true });
            }

            // A message is ONLY 'delivered' if the partner is actively connected or on snapshot
            const recipientId = couple.user1?.id === senderId ? couple.user2?.id : couple.user1?.id;
            const recipientObj = couple.user1?.id === recipientId ? couple.user1 : couple.user2;
            const isRecipientActive = recipientObj?.isOnline && Date.now() - (recipientObj?.lastSeen || 0) < 60000;

            const savedMsg = {
              ...incomingMsg,
              status: isRecipientActive ? 'delivered' : 'sent',
              deliveredAt: isRecipientActive ? Date.now() : null,
              createdAt: incomingMsg.createdAt || Date.now(),
            };

            couple.messages.push(savedMsg);
            saveStore();

            broadcastToCouple(pairCode, { type: 'NEW_MESSAGE', message: savedMsg });

            return json({ success: true, message: savedMsg });
          }

          // --- 6. Explicit Delivery Confirmation from Recipient Phone ---
          if (pathname === '/api/couple/deliver' && req.method === 'POST') {
            const body = await parseBody();
            const pairCode = (body.pairCode || 'KARSH-FOREVER').toUpperCase();
            const couple = coupleData.couples[pairCode];
            const recipientId = body.userId;
            const messageIds: string[] = body.messageIds || [];

            if (couple && recipientId && messageIds.length > 0) {
              let changed = false;
              couple.messages.forEach((m: any) => {
                if (m.senderId !== recipientId && messageIds.includes(m.id) && m.status === 'sent') {
                  m.status = 'delivered';
                  m.deliveredAt = Date.now();
                  changed = true;
                }
              });

              if (changed) {
                saveStore();
                broadcastToCouple(pairCode, { type: 'MESSAGES_DELIVERED', messageIds });
              }
            }

            return json({ success: true });
          }

          // --- 7. Read Receipts ---
          if (pathname === '/api/couple/read' && req.method === 'POST') {
            const body = await parseBody();
            const pairCode = (body.pairCode || 'KARSH-FOREVER').toUpperCase();
            const couple = coupleData.couples[pairCode];
            const readerId = body.userId;

            if (couple && readerId) {
              let updatedCount = 0;
              couple.messages.forEach((m: any) => {
                if (m.senderId !== readerId && m.status !== 'read') {
                  m.status = 'read';
                  m.readAt = Date.now();
                  updatedCount++;
                }
              });
              if (updatedCount > 0) {
                saveStore();
                broadcastToCouple(pairCode, { type: 'MESSAGES_READ', readerId });
              }
            }

            return json({ success: true });
          }

          // --- 8. Reactions, Delete, Typing, Memory, Profile ---
          if (pathname === '/api/couple/reaction' && req.method === 'POST') {
            const body = await parseBody();
            const pairCode = (body.pairCode || 'KARSH-FOREVER').toUpperCase();
            const { messageId, emoji, userId } = body;
            const couple = coupleData.couples[pairCode];

            if (couple) {
              const msg = couple.messages.find((m: any) => m.id === messageId);
              if (msg) {
                if (!msg.reactions) msg.reactions = {};
                if (!msg.reactions[emoji]) msg.reactions[emoji] = [];

                const userIdx = msg.reactions[emoji].indexOf(userId);
                if (userIdx >= 0) {
                  msg.reactions[emoji].splice(userIdx, 1);
                  if (msg.reactions[emoji].length === 0) delete msg.reactions[emoji];
                } else {
                  msg.reactions[emoji].push(userId);
                }
                saveStore();
                broadcastToCouple(pairCode, { type: 'REACTION_UPDATED', messageId, reactions: msg.reactions });
                return json({ success: true, reactions: msg.reactions });
              }
            }
            return json({ success: false }, 404);
          }

          if (pathname === '/api/couple/delete' && req.method === 'POST') {
            const body = await parseBody();
            const pairCode = (body.pairCode || 'KARSH-FOREVER').toUpperCase();
            const { messageId, userId, deleteForBoth } = body;
            const couple = coupleData.couples[pairCode];

            if (couple) {
              const msg = couple.messages.find((m: any) => m.id === messageId);
              if (msg && msg.senderId === userId) {
                if (deleteForBoth) {
                  msg.isDeleted = true;
                  msg.text = 'This message was deleted';
                  msg.mediaUrl = undefined;
                } else {
                  msg.deletedFor = msg.deletedFor || [];
                  if (!msg.deletedFor.includes(userId)) msg.deletedFor.push(userId);
                }
                saveStore();
                broadcastToCouple(pairCode, { type: 'MESSAGE_DELETED', messageId, deleteForBoth });
                return json({ success: true });
              }
            }
            return json({ success: false }, 403);
          }

          if (pathname === '/api/couple/typing' && req.method === 'POST') {
            const body = await parseBody();
            const pairCode = (body.pairCode || 'KARSH-FOREVER').toUpperCase();
            const couple = coupleData.couples[pairCode];

            if (couple) {
              couple.typingUser = body.isTyping ? body.nickname : null;
              couple.typingTimestamp = body.isTyping ? Date.now() : 0;
              broadcastToCouple(pairCode, {
                type: 'TYPING',
                typingUser: couple.typingUser,
              });
            }
            return json({ success: true });
          }

          if (pathname === '/api/couple/memory' && req.method === 'POST') {
            const body = await parseBody();
            const pairCode = (body.pairCode || 'KARSH-FOREVER').toUpperCase();
            const couple = coupleData.couples[pairCode];

            if (couple) {
              if (body.type === 'diary') {
                couple.diaries = couple.diaries || [];
                couple.diaries.unshift(body.entry);
              } else {
                couple.memories = couple.memories || [];
                couple.memories.unshift(body.memory);
              }
              saveStore();
              broadcastToCouple(pairCode, { type: 'MEMORY_ADDED', item: body.memory || body.entry });
              return json({ success: true });
            }
            return json({ success: false }, 404);
          }

          if (pathname === '/api/couple/update-profile' && req.method === 'POST') {
            const body = await parseBody();
            const pairCode = (body.pairCode || 'KARSH-FOREVER').toUpperCase();
            const couple = coupleData.couples[pairCode];

            if (couple) {
              if (couple.user1 && couple.user1.id === body.userId) {
                Object.assign(couple.user1, body.updates);
              } else if (couple.user2 && couple.user2.id === body.userId) {
                Object.assign(couple.user2, body.updates);
              }
              if (body.anniversaryDate) {
                couple.anniversaryDate = body.anniversaryDate;
              }
              saveStore();
              broadcastToCouple(pairCode, { type: 'PROFILE_UPDATED', couple });
              return json({ success: true, couple });
            }
            return json({ success: false }, 404);
          }

          return next();
        } catch (err: any) {
          console.error('API Error:', err);
          return json({ success: false, error: err.message }, 500);
        }
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), coupleApiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
