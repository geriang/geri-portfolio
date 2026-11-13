"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});
const staticData_1 = __importDefault(require("./routes/staticData"));
const entity_1 = __importDefault(require("./routes/entity"));
app.use('/static-data', staticData_1.default);
app.use('/entity', entity_1.default);
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Backend listening on port ${PORT}`);
});
