const express = require('express');
const app = express();
const port = 80;
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config({ path: './.env' });

const corsOptions = {
    origin: '*',
    credentials: true,
    methods: ['POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
};
app.options('*', cors(corsOptions));
app.use(cors(corsOptions)); 

app.use(cookieParser());

app.use(express.json());
app.use(express.static(__dirname));

const account = require('./router/account.js');
const commit = require('./router/commit.js');
const friend = require('./router/friend.js');
const token = require('./router/token.js');
const info = require('./router/info.js');

app.use('/account', account);
app.use('/commit', commit);
app.use('/friend', friend);
app.use('/token', token);
app.use('/info', info);

app.listen(port, async (req, res) => {
    console.log('server start at port', port);
});