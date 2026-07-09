"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_controller_1 = require("../controllers/auth.controller");
const auth_middleware_1 = __importDefault(require("../middleware/auth.middleware"));
const router = express_1.default.Router();
router.post('/login', auth_controller_1.login);
router.post('/register', auth_controller_1.register);
router.post('/refresh', auth_controller_1.refreshToken);
router.post('/logout', auth_controller_1.logout);
router.post('/forgot-password', auth_controller_1.forgotPassword);
router.post('/reset-password', auth_controller_1.resetPassword);
router.get('/profile', auth_middleware_1.default, auth_controller_1.getProfile);
router.patch('/profile', auth_middleware_1.default, auth_controller_1.updateProfile);
router.post('/change-password', auth_middleware_1.default, auth_controller_1.changePassword);
exports.default = router;
