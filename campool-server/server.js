require('dotenv').config();
const http = require('http');
const app = require('./src/index.js');

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);
server.listen(PORT, () => {
	console.log(`Campool server listening on port ${PORT}`);
});





