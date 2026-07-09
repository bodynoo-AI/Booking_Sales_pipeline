"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const conflict_controller_1 = require("../controllers/conflict.controller");
const router = express_1.default.Router();
router.get('/', conflict_controller_1.listConflicts);
router.post('/check', conflict_controller_1.checkConflicts);
exports.default = router;
