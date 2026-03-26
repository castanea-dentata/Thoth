const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const path = require('path');
const express = require('express');
const { customAlphabet } = require('nanoid');
const config = require('config');
const { logWithRequest } = require('./log.js');
const prisma = require('./prisma.js');
const { authenticateUser, verifyPassword } = require('./auth.js');
const router = express.Router();
const FormData = require('form-data');
const Mailgun = require('mailgun.js');
const fs = require('fs');

let mailgun;
if (config.get('mailgunAPIKey')) {
    const mailgunClient = new Mailgun(FormData);
    mailgun = mailgunClient.client({
        username: 'api',
        key: config.get('mailgunAPIKey'),
        url: config.get('mailgunBaseURL') || 'https://api.mailgun.net',
    });
}

const dataTypes = require('../client/dataTypes.js');
const Library = dataTypes.Library;

// one day in many years this can go away.
eval(`${fs.readFileSync(path.join(__dirname, './sha3.js'))}`);

router.post('/register', async (req, res) => {
    const username = String(req.body.username).toLowerCase().trim();
    const password = String(req.body.password);
    let email = String(req.body.email);

    const errors = [];

    if (!username) {
        errors.push({ field: 'username', message: 'Please enter a username.' });
    }
    if (username && (username.length < 3 || username.length > 32)) {
        errors.push({ field: 'username', message: 'Please enter a username between 3 and 32 characters.' });
    }
    if (!email) {
        errors.push({ field: 'email', message: 'Please enter an email.' });
    }

    email = email.trim();

    if (!password) {
        errors.push({ field: 'password', message: 'Please enter a password.' });
    }
    if (password && (password.length < 5 || password.length > 60)) {
        errors.push({ field: 'password', message: 'Please enter a password between 5 and 60 characters.' });
    }
    if (errors.length) {
        return res.status(400).json({ errors });
    }

    logWithRequest(req, { message: 'Attempting to register', username });

    try {
        const existingUsername = await prisma.user.findUnique({ where: { username } });
        if (existingUsername) {
            logWithRequest(req, { message: 'User exists', username });
            return res.status(400).json({ errors: [{ field: 'username', message: 'That username already exists, please pick a different username.' }] });
        }

        const existingEmail = email ? await prisma.user.findUnique({ where: { email } }) : null;
        if (existingEmail) {
            logWithRequest(req, { message: 'User email exists', email });
            return res.status(400).json({ errors: [{ field: 'email', message: 'A user with that email already exists.' }] });
        }
        console.log('Email check passed, starting password hash');
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);
        const buf = await new Promise((resolve, reject) => {
            crypto.randomBytes(48, (err, buf) => {
                if (err) reject(err);
                else resolve(buf);
            });
        });
        const token = buf.toString('hex');

        let library;
        if (req.body.library) {
            try {
                const libraryInstance = new Library();
                libraryInstance.load(JSON.parse(req.body.library));
                library = JSON.parse(JSON.stringify(libraryInstance.save()));
            } catch (e) {
                logWithRequest(req, { message: 'Library parsing issue', username });
                return res.status(400).json({ errors: [{ message: 'Unable to parse your library. Contact support.' }] });
            }
        } else {
            library = JSON.parse(JSON.stringify(new Library().save()));
        }

        logWithRequest(req, { message: 'Saving new user', username });
        await prisma.user.create({
            data: {
                username,
                password: hash,
                email,
                token,
                syncToken: 0,
                library,
            },
        });

        res.cookie('lp', token, { path: '/', maxAge: 365 * 24 * 60 * 1000 });
        return res.status(200).json({ username, library: JSON.stringify(library), syncToken: 0 });
    } catch (err) {
        console.log('FULL ERROR:', JSON.stringify(err, null, 2));
        console.log('ERROR MESSAGE:', err.message);
        logWithRequest(req, { message: 'Registration error', error: err });
        return res.status(500).json({ message: 'An error occurred, please try again later.' });
    }
});

router.post('/signin', (req, res) => {
    authenticateUser(req, res, returnLibrary);
});

function stripFunctions(obj) {
    return JSON.parse(JSON.stringify(obj, (key, value) => {
        if (typeof value === 'function') return undefined;
        if (value === undefined) return null;
        return value;
    }));
}

function returnLibrary(req, res, user) {
    console.log('LIBRARY TYPE:', typeof user.library);
    console.log('LIBRARY:', JSON.stringify(user.library).substring(0, 100));
    logWithRequest(req, { message: 'signed in', username: user.username });
    if (!user.syncToken) {
        prisma.user.update({
            where: { username: user.username },
            data: { syncToken: 0 },
        });
    }
    return res.json({ username: user.username, library: JSON.stringify(user.library), syncToken: user.syncToken });
}

router.post('/saveLibrary', (req, res) => {
    authenticateUser(req, res, saveLibrary);
});

async function saveLibrary(req, res, user) {
    if (typeof req.body.syncToken === 'undefined') {
        logWithRequest(req, { message: 'Missing syncToken', username: user.username });
        return res.status(400).send('Please refresh this page to upgrade to the latest version of LighterPack.');
    }
    if (!req.body.username || !req.body.data) {
        logWithRequest(req, { message: 'bad save: missing username or data', username: user.username });
        return res.status(400).json({ message: 'An error occurred while saving your data. Please refresh your browser and try again.' });
    }
    if (req.body.username != user.username) {
        logWithRequest(req, { message: 'bad save: bad username', initiatedby: user.username, initiatedfor: req.body.username });
        return res.status(401).json({ message: 'An error occurred while saving your data. Please refresh your browser and login again.' });
    }
    if (parseInt(req.body.syncToken) !== user.syncToken) {
        logWithRequest(req, { message: 'out of date syncToken', username: user.username });
        return res.status(400).json({ message: 'Your list is out of date - please refresh your browser.' });
    }

    let library;
    try {
        library = JSON.parse(req.body.data, (key, value) => {
            if (value === undefined) return null;
            return value;
        });
    } catch (e) {
        logWithRequest(req, { message: 'Library parsing issue', username: user.username });
        return res.status(400).json({ errors: [{ message: 'An error occurred while saving your data - unable to parse library. If this persists, please contact support.' }] });
    }

    try {
        const newSyncToken = user.syncToken + 1;
        console.log('ABOUT TO UPDATE LIBRARY, sequence:', library.sequence);
        const updated = await prisma.user.update({
            where: { username: user.username },
            data: {
                library: library,
                syncToken: newSyncToken,
            },
        });
        console.log('UPDATED LIBRARY IN DB:', JSON.stringify(updated.library).substring(0, 200));
        logWithRequest(req, { message: 'saved library', username: user.username });
        return res.status(200).json({ message: 'success', syncToken: newSyncToken });
    } catch (err) {
        console.log('SAVE ERROR:', Object.keys(err), err.constructor.name);
        console.log('SAVE ERROR MESSAGE:', err.message);
        console.log('SAVE ERROR META:', JSON.stringify(err.meta));
        logWithRequest(req, { message: 'Save library error', error: err });
        return res.status(500).json({ message: 'An error occurred while saving your data.' });
    }
}

router.post('/externalId', (req, res) => {
    authenticateUser(req, res, externalId);
});

async function externalId(req, res, user) {
    const alphabet = customAlphabet('1234567890abcdefghijklmnopqrstuvwxyz', 6);
    const id = alphabet();
    logWithRequest(req, { message: 'Id generated', id });

    try {
        const users = await prisma.user.findMany({
            where: {
                library: {
                    path: ['lists'],
                    array_contains: [{ externalId: id }],
                },
            },
        });

        if (users.length) {
            logWithRequest(req, { message: 'Id collision', id });
            return res.status(500).json({ message: 'An error occurred' });
        }

        return res.status(200).json({ id });
    } catch (err) {
        logWithRequest(req, { message: 'Id lookup error', id });
        return res.status(500).json({ message: 'An error occurred' });
    }
}

router.post('/forgotPassword', async (req, res) => {
    const username = String(req.body.username).toLowerCase().trim();
    if (!username || username.length < 1) {
        return res.status(400).json({ errors: [{ message: 'Please enter a valid username.' }] });
    }

    try {
        const user = await prisma.user.findUnique({ where: { username } });
        if (!user) {
            return res.status(400).json({ errors: [{ message: 'An error occurred' }] });
        }

        const email = user.email;
        const newPassword = Math.random().toString(36).slice(-8);
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(newPassword, salt);

        const message = `Hello ${username},\n Apparently you forgot your password. Here's your new one: \n\n Username: ${username}\n Password: ${newPassword}\n\n If you continue to have problems, please reply to this email with details.\n\n Thanks!`;

        logWithRequest(req, { message: 'Attempting to send new password', username });

        if (!mailgun) {
            logWithRequest(req, { message: 'Mailgun not configured', username });
            return res.status(500).json({ message: 'Email service not configured. Please contact the administrator.' });
        }
        
        await mailgun.messages.create(config.get('mailgunDomain'), {
            from: 'Thoth <info@mg.lighterpack.com>',
            to: [email],
            'h:Reply-To': 'Thoth <info@lighterpack.com>',
            subject: 'Your new Thoth password',
            text: message,
        });

        await prisma.user.update({
            where: { username },
            data: { password: hash },
        });

        logWithRequest(req, { message: 'password changed for user', username });
        return res.status(200).json({ username });
    } catch (err) {
        logWithRequest(req, err);
        return res.status(500).json({ message: 'An error occurred' });
    }
});

router.post('/forgotUsername', async (req, res) => {
    const email = String(req.body.email).toLowerCase().trim();
    if (!email || email.length < 1) {
        return res.status(400).json({ errors: [{ message: 'Please enter a valid email.' }] });
    }

    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(400).json({ message: 'An error occurred' });
        }

        const username = user.username;
        const message = `Hello ${username},\n Apparently you forgot your username. Here it is: \n\n Username: ${username}\n\n If you continue to have problems, please reply to this email with details.\n\n Thanks!`;

        logWithRequest(req, { message: 'Attempting to send username', email, username });

        if (!mailgun) {
            logWithRequest(req, { message: 'Mailgun not configured', username });
            return res.status(500).json({ message: 'Email service not configured. Please contact the administrator.' });
        }

        await mailgun.messages.create(config.get('mailgunDomain'), {
            from: 'Thoth <info@mg.lighterpack.com>',
            to: [email],
            'h:Reply-To': 'Thoth <info@lighterpack.com>',
            subject: 'Your Thoth username',
            text: message,
        });

        logWithRequest(req, { message: 'sent username message for user', username, email });
        return res.status(200).json({ email });
    } catch (err) {
        logWithRequest(req, err);
        return res.status(500).json({ message: 'An error occurred' });
    }
});

router.post('/account', (req, res) => {
    authenticateUser(req, res, account);
});

async function account(req, res, user) {
    logWithRequest(req, { message: 'Starting account changes', username: user.username });
    try {
        await verifyPassword(user.username, String(req.body.currentPassword));

        if (req.body.newPassword) {
            const newPassword = String(req.body.newPassword);
            const errors = [];

            if (newPassword.length < 5 || newPassword.length > 60) {
                errors.push({ field: 'newPassword', message: 'Please enter a password between 5 and 60 characters.' });
            }
            if (errors.length) {
                return res.status(400).json({ errors });
            }

            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash(newPassword, salt);

            const data = { password: hash };
            if (req.body.newEmail) {
                data.email = String(req.body.newEmail);
                logWithRequest(req, { message: 'Changing Email', username: user.username });
            }

            await prisma.user.update({ where: { username: user.username }, data });
            logWithRequest(req, { message: 'Changing PW', username: user.username });
            return res.status(200).json({ message: 'success' });
        } else if (req.body.newEmail) {
            await prisma.user.update({
                where: { username: user.username },
                data: { email: String(req.body.newEmail) },
            });
            logWithRequest(req, { message: 'Changing Email', username: user.username });
            return res.status(200).json({ message: 'success' });
        }
    } catch (err) {
        logWithRequest(req, { message: 'Account bad current password', username: user.username });
        return res.status(400).json({ errors: [{ field: 'currentPassword', message: 'Your current password is incorrect.' }] });
    }
}

router.post('/delete-account', (req, res) => {
    authenticateUser(req, res, deleteAccount);
});

async function deleteAccount(req, res, user) {
    logWithRequest(req, { message: 'Starting account delete', username: user.username });
    try {
        await verifyPassword(user.username, String(req.body.password));

        if (req.body.username !== user.username) {
            logWithRequest(req, { message: 'Bad account deletion - wrong user', requestedUsername: req.body.username, initiatedby: user.username });
            return res.status(400).json({ message: 'An error occurred, please try logging out and in again.' });
        }

        await prisma.user.delete({ where: { username: user.username } });
        logWithRequest(req, { message: 'Completed account delete', username: user.username });
        return res.status(200).json({ message: 'success' });
    } catch (err) {
        logWithRequest(req, { message: 'Bad account deletion - invalid password', username: req.body.username });
        return res.status(400).json({ errors: [{ field: 'currentPassword', message: 'Your current password is incorrect.' }] });
    }
}

router.post('/imageUpload', (req, res) => {
    return res.status(501).json({ message: 'Image upload is not currently supported.' });
});

async function imageUpload(req, res, user) {
    const form = new formidable.IncomingForm();
    form.parse(req, async (err, fields, files) => {
        if (err) {
            logWithRequest(req, 'form parse error');
            return res.status(500).json({ message: 'An error occurred' });
        }
        if (!files || !files.image) {
            logWithRequest(req, 'No image in upload');
            return res.status(500).json({ message: 'An error occurred' });
        }

        try {
            const imagePath = files.image.path;
            const formData = new FormData();
            formData.append('image', fs.createReadStream(imagePath));
            formData.append('type', 'file');

            const response = await fetch('https://api.imgur.com/3/image', {
                method: 'POST',
                headers: {
                    Authorization: `Client-ID ${config.get('imgurClientID')}`,
                },
                body: formData,
            });

            if (!response.ok) {
                logWithRequest(req, 'imgur post fail!');
                return res.status(500).json({ message: 'An error occurred.' });
            }

            const body = await response.json();
            return res.send(body);
        } catch (e) {
            logWithRequest(req, 'imgur post fail!');
            return res.status(500).json({ message: 'An error occurred.' });
        }
    });
}

module.exports = router;