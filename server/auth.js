import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import config from 'config';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { logWithRequest } from './log.js';
import prisma from './prisma.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const moderatorList = config.get('moderators');

// one day in many years this can go away.
eval(`${fs.readFileSync(path.join(__dirname, './sha3.js'))}`);

const authenticateModerator = function (req, res, callback) {
    authenticateUser(req, res, (req, res, user) => {
        if (!isModerator(user.username)) {
            return res.status(403).json({ message: 'Denied.' });
        }
        callback(req, res, user);
    });
};

const authenticateUser = function (req, res, callback) {
    if (!req.cookies.lp && (!req.body.username || !req.body.password)) {
        return res.status(401).json({ message: 'Please log in.' });
    }
    if (req.body.username && req.body.password) {
        const username = String(req.body.username).toLowerCase().trim();
        const password = String(req.body.password);
        verifyPassword(username, password)
            .then((user) => {
                generateSession(req, res, user, callback);
            })
            .catch((err) => {
                logWithRequest(req, err);
                if (err.code && err.message) {
                    logWithRequest(req, { message: `error on verifyPassword for: ${username}`, error: err.message });
                    res.status(err.code).json({ message: err.message });
                } else {
                    res.status(500).json({ message: 'An error occurred, please try again later.' });
                }
            });
    } else {
        prisma.user.findFirst({ where: { token: req.cookies.lp } })
            .then((user) => {
                if (!user) {
                    logWithRequest(req, { message: 'bad cookie!' });
                    return res.status(404).json({ message: 'Please log in again.' });
                }
                req.lighterpackusername = user.username || 'UNKNOWN';
                callback(req, res, user);
            })
            .catch((err) => {
                logWithRequest(req, { message: 'Error on authenticateUser else', error: err });
                return res.status(500).json({ message: 'An error occurred, please try again later.' });
            });
    }
};

const verifyPassword = function (username, password) {
    return new Promise((resolve, reject) => {
        prisma.user.findUnique({ where: { username } })
            .then((user) => {
                if (!user) {
                    return reject({ code: 404, message: 'Invalid username and/or password.' });
                }

                bcrypt.compare(password, user.password, (err, result) => {
                    if (err) {
                        return reject({ code: 500, message: 'An error occurred, please try again later.' });
                    }
                    if (!result) {
                        const sha3password = CryptoJS.SHA3(password + username).toString(CryptoJS.enc.Base64);
                        bcrypt.compare(sha3password, user.password, (err, result) => {
                            if (err) {
                                reject({ code: 500, message: 'An error occurred, please try again later.' });
                            }
                            if (!result) {
                                if (sha3password === user.password) {
                                    resolve(user);
                                } else {
                                    reject({ code: 404, message: 'Invalid username and/or password. Please refresh the page before trying again.' });
                                }
                            } else {
                                bcrypt.genSalt(10, (err, salt) => {
                                    if (err) {
                                        return reject({ code: 500, message: 'An error occurred, please try again later.' });
                                    }
                                    bcrypt.hash(password, salt, (err, hash) => {
                                        if (err) {
                                            return reject({ code: 500, message: 'An error occurred, please try again later.' });
                                        }
                                        prisma.user.update({
                                            where: { username },
                                            data: { password: hash },
                                        });
                                        resolve(user);
                                    });
                                });
                            }
                        });
                    } else {
                        resolve(user);
                    }
                });
            })
            .catch((err) => {
                return reject({ code: 500, message: 'An error occurred, please try again later.' });
            });
    });
};

const generateSession = function (req, res, user, callback) {
    crypto.randomBytes(48, (ex, buf) => {
        const token = buf.toString('hex');
        prisma.user.update({
            where: { username: user.username },
            data: { token },
        }).then((updatedUser) => {
            res.cookie('lp', token, { path: '/', maxAge: 365 * 24 * 60 * 1000 });
            callback(req, res, updatedUser);
        });
    });
};

function isModerator(username) {
    return moderatorList.indexOf(username) > -1;
}

export {
    authenticateModerator,
    authenticateUser,
    verifyPassword,
    generateSession,
    isModerator,
};