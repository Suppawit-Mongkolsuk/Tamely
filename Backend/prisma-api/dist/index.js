"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
// ⚠️ ต้องโหลด dotenv ก่อน import อื่นๆ
// eslint-disable-next-line @typescript-eslint/no-require-imports
require('dotenv').config();
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const client_1 = require("@prisma/client");
// Routes
const auth_routes_1 = __importDefault(require("./modules/auth/auth.routes"));
const oauth_routes_1 = __importDefault(require("./modules/oauth/oauth.routes"));
const workspace_routes_1 = __importDefault(require("./modules/workspace/workspace.routes"));
const room_routes_1 = __importDefault(require("./modules/room/room.routes"));
const message_routes_1 = __importDefault(require("./modules/message/message.routes"));
const post_routes_1 = __importDefault(require("./modules/post/post.routes"));
const task_routes_1 = __importDefault(require("./modules/task/task.routes"));
const notification_routes_1 = __importDefault(require("./modules/notification/notification.routes"));
const dm_routes_1 = __importDefault(require("./modules/dm/dm.routes"));
const ai_routes_1 = __importDefault(require("./modules/ai/ai.routes"));
const oauth_config_1 = __importDefault(require("./modules/oauth/oauth.config"));
const chat_gateway_1 = require("./modules/chat/chat.gateway");
const supabase_storage_1 = require("./utils/supabase-storage");
// Middlewares
const error_1 = require("./middlewares/error");
exports.prisma = new client_1.PrismaClient();
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const initialPort = Number(process.env.PORT) || 8080;
// ========================
// Global Middlewares
// ========================
app.use((0, helmet_1.default)());
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim());
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // อนุญาต request ที่ไม่มี origin (เช่น curl, Postman)
        if (!origin)
            return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        callback(new Error(`CORS: Origin ${origin} not allowed`));
    },
    credentials: true,
}));
app.use((0, morgan_1.default)('dev'));
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
app.use(oauth_config_1.default.initialize()); // Passport (OAuth)
// ========================
// Routes
// ========================
app.get('/', (req, res) => {
    res.send('Hello from Tamely API!');
});
app.get('/health', async (req, res) => {
    try {
        await exports.prisma.$connect();
        res.json({ status: 'ok', db: 'connected to Supabase' });
    }
    catch (error) {
        res.status(500).json({ status: 'error', message: String(error) });
    }
});
// TURN credentials endpoint (ให้ Frontend ดึง ICE servers ที่มี TURN)
app.get('/api/turn-credentials', async (_req, res) => {
    var _a;
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    if (!accountSid || !authToken) {
        res.json({ iceServers: [] });
        return;
    }
    try {
        const credentials = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
        const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Tokens.json`, { method: 'POST', headers: { Authorization: `Basic ${credentials}` } });
        const data = await response.json();
        const iceServers = ((_a = data.ice_servers) !== null && _a !== void 0 ? _a : []).map((s) => {
            var _a, _b;
            return ({
                urls: (_b = (_a = s.urls) !== null && _a !== void 0 ? _a : s.url) !== null && _b !== void 0 ? _b : '',
                ...(s.username ? { username: s.username } : {}),
                ...(s.credential ? { credential: s.credential } : {}),
            });
        });
        res.json({ iceServers });
    }
    catch (_b) {
        res.json({ iceServers: [] });
    }
});
// API Routes
app.use('/api/auth', auth_routes_1.default);
app.use('/api/oauth', oauth_routes_1.default);
app.use('/api/workspaces', workspace_routes_1.default);
app.use('/api', room_routes_1.default);
app.use('/api', message_routes_1.default);
app.use('/api', post_routes_1.default);
app.use('/api', task_routes_1.default);
app.use('/api', notification_routes_1.default);
app.use('/api', dm_routes_1.default);
app.use('/api', ai_routes_1.default);
// ========================
// Error Handler (ต้องอยู่ท้ายสุดเสมอ)
// ========================
app.use(error_1.errorHandler);
// ========================
// Socket.IO
// ========================
(0, chat_gateway_1.initSocketIO)(server, allowedOrigins);
// ========================
// Start Server
// ========================
const startServer = (port) => {
    server
        .once('error', (error) => {
        if (error.code === 'EADDRINUSE') {
            console.warn(`Port ${port} is in use, trying ${port + 1}...`);
            startServer(port + 1);
            return;
        }
        throw error;
    })
        .listen(port, () => {
        console.log(`Server running on http://localhost:${port}`);
        // Ensure Supabase buckets exist on startup
        (0, supabase_storage_1.ensureBucket)(supabase_storage_1.CHAT_FILES_BUCKET, true).catch(() => { });
    });
};
startServer(initialPort);
// Graceful shutdown — ปิด Prisma เมื่อ server หยุด
process.on('SIGINT', async () => {
    await exports.prisma.$disconnect();
    console.log(' Prisma disconnected');
    process.exit(0);
});
//# sourceMappingURL=index.js.map