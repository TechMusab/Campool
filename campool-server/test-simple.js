const express = require('express');
const app = express();

app.use(express.json());

app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Simple test server working' });
});

app.get('/api/test', (req, res) => {
    res.json({ message: 'API test endpoint working' });
});

app.post('/api/auth/login', (req, res) => {
    res.json({ message: 'Login endpoint reached', body: req.body });
});

module.exports = app;
