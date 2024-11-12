const express = require('express');
const path = require('path');
const axios = require('axios');
const querystring = require('querystring');
const nodemailer = require('nodemailer');
require('dotenv').config(); // Load environment variables

const app = express();
const clientId = process.env.SPOTIFY_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
const redirectUri = 'http://localhost:3000/callback';

let users = []; // Temporary in-memory user storage for demo purposes

// Configure Nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER, // Your Gmail email
        pass: process.env.EMAIL_PASS  // Your Gmail password or app password
    }
});

// Serve static files
app.use(express.static(__dirname));

// Route for creating a user and sending verification email
app.post('/create-user', express.urlencoded({ extended: true }), (req, res) => {
    const { email, password } = req.body;

    // Generate a unique token for email verification (simple demo)
    const token = Math.random().toString(36).substring(2);

    // Store user data with verification status
    users.push({ email, password, verified: false, token });

    // Send verification email
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Verify your email',
        html: `<p>Click <a href="http://localhost:3000/verify?token=${token}">here</a> to verify your email.</p>`
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error sending email:', error);
            return res.send('Error sending verification email');
        }
        console.log('Verification email sent:', info.response);
        res.send('Verification email sent. Please check your inbox.');
    });
});

// Route for verifying email
app.get('/verify', (req, res) => {
    const token = req.query.token;
    const user = users.find(u => u.token === token);

    if (user) {
        user.verified = true;
        res.send('Email verified! You can now log in.');
    } else {
        res.send('Invalid verification link');
    }
});

// Route for handling login and Spotify permission request
app.post('/login', express.urlencoded({ extended: true }), (req, res) => {
    const { email, password } = req.body;
    const user = users.find(u => u.email === email && u.password === password);

    if (user && user.verified) {
        res.redirect('/login');
    } else if (user && !user.verified) {
        res.send('Please verify your email before logging in.');
    } else {
        res.send('Invalid credentials');
    }
});

// Spotify authorization route
app.get('/login', (req, res) => {
    const scopes = 'user-read-private user-read-email user-top-read';
    res.redirect('https://accounts.spotify.com/authorize?' +
        querystring.stringify({
            client_id: clientId,
            response_type: 'code',
            redirect_uri: redirectUri,
            scope: scopes
        })
    );
});

// Callback route for handling Spotify response
app.get('/callback', async (req, res) => {
    const code = req.query.code || null;

    try {
        const response = await axios.post('https://accounts.spotify.com/api/token',
            querystring.stringify({
                code: code,
                redirect_uri: redirectUri,
                grant_type: 'authorization_code'
            }),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64')
                }
            }
        );

        const { access_token } = response.data;
        res.send(`Spotify Access Token: ${access_token}`);
    } catch (error) {
        console.error('Error fetching Spotify access token:', error);
        res.send('Error during Spotify authorization');
    }
});

// Start the server
app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});
