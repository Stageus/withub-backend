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

app.use('/account', account);

app.listen(port, (req, res) => {
    console.log('server start at port', port);
});