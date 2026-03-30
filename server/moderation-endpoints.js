import bcrypt from 'bcryptjs';
import express from 'express';
import crypto from 'crypto';
import config from 'config';
import { logWithRequest } from './log.js';
import prisma from './prisma.js';
import { authenticateModerator } from './auth.js';

const router = express.Router();

function escapeRegExp(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

async function search(req, res) {
    const searchQuery = escapeRegExp(String(req.query.q).toLowerCase().trim());

    try {
        const users = await prisma.user.findMany({
            where: {
                OR: [
                    { username: { contains: searchQuery, mode: 'insensitive' } },
                    { email: { contains: searchQuery, mode: 'insensitive' } },
                ],
            },
            select: {
                username: true,
                email: true,
                library: true,
            },
        });

        res.json({ results: users });
    } catch (err) {
        logWithRequest(req, err);
        res.status(500).json({ message: 'An error occurred' });
    }
}

router.get('/moderation/search', (req, res) => {
    authenticateModerator(req, res, search);
});

async function resetPassword(req, res) {
    const username = String(req.body.username).toLowerCase().trim();
    logWithRequest(req, { message: 'MODERATION Reset password start', username });

    try {
        const user = await prisma.user.findUnique({ where: { username } });
        if (!user) {
            logWithRequest(req, { message: 'MODERATION Reset password for unknown', username });
            return res.status(500).json({ message: 'An error occurred.' });
        }

        const buf = await new Promise((resolve, reject) => {
            crypto.randomBytes(12, (err, buf) => {
                if (err) reject(err);
                else resolve(buf);
            });
        });
        const newPassword = buf.toString('hex');

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(newPassword, salt);

        await prisma.user.update({
            where: { username },
            data: { password: hash },
        });

        logWithRequest(req, { message: 'MODERATION password changed', username });
        return res.status(200).json({ newPassword });
    } catch (err) {
        logWithRequest(req, { message: 'MODERATION Reset password error', username });
        return res.status(500).json({ message: 'An error occurred' });
    }
}

router.post('/moderation/reset-password', (req, res) => {
    authenticateModerator(req, res, resetPassword);
});

async function clearSession(req, res) {
    const username = String(req.body.username).toLowerCase().trim();
    logWithRequest(req, { message: 'MODERATION Clear session start', username });

    try {
        const user = await prisma.user.findUnique({ where: { username } });
        if (!user) {
            logWithRequest(req, { message: 'MODERATION Clear session for unknown', username });
            return res.status(500).json({ message: 'An error occurred.' });
        }

        await prisma.user.update({
            where: { username },
            data: { token: '' },
        });

        logWithRequest(req, { message: 'MODERATION Clear session succeeded', username });
        return res.status(200).json({ message: 'success' });
    } catch (err) {
        logWithRequest(req, { message: 'MODERATION Clear session error', username });
        return res.status(500).json({ message: 'An error occurred' });
    }
}

router.post('/moderation/clear-session', (req, res) => {
    authenticateModerator(req, res, clearSession);
});

export default router;