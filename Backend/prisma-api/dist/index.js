"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const client_1 = require("@prisma/client");
const dotenv_1 = __importDefault(require("dotenv"));
// Routes
const auth_routes_1 = __importDefault(require("./modules/auth/auth.routes"));
// Middlewares
const error_1 = require("./middlewares/error");
dotenv_1.default.config();
exports.prisma = new client_1.PrismaClient();
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const port = process.env.PORT || 8080;
// ========================
// Global Middlewares
// ========================
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
}));
app.use((0, morgan_1.default)('dev'));
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
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
// API Routes
app.use('/api/auth', auth_routes_1.default);
// ========================
// Error Handler (ต้องอยู่ท้ายสุดเสมอ)
// ========================
app.use(error_1.errorHandler);
// ========================
// Start Server
// ========================
server.listen(port, () => {
    console.log(`🚀 Server running on http://localhost:${port}`);
});
// Graceful shutdown — ปิด Prisma เมื่อ server หยุด
process.on('SIGINT', async () => {
    await exports.prisma.$disconnect();
    console.log('🔌 Prisma disconnected');
    process.exit(0);
});
//# sourceMappingURL=index.js.map