const express = require('express');
const app = express();
const port = 80;
const cors = require('cors');
const cookieParser = require('cookie-parser');
const schedule = require('node-schedule');
require('dotenv').config({ path: './.env' });

const database = require('./module/database.js');
const tokenVerify = require('./module/tokenVerify.js');
const axios = require('axios')

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

app.use('/account', account);
app.use('/commit', commit);
app.use('/friend', friend);
app.use('/token', token);

app.listen(port, async (req, res) => {
    console.log('server start at port', port);

    // const fiveMinuteUpdate = schedule.scheduleJob('0 0/15 * * * *', async() => {
    //     console.log('15분')
    // });

    // const dailyUpdate = schedule.scheduleJob('0 0 15 1-31 * *', async() => {
    //     console.log('매일');
    // });

    // const weeklyUpdate = schedule.scheduleJob('0 0 15 * * MON', async() => {
    //     console.log('매주');
    // });

    // const monthlyUpdate = schedule.scheduleJob('0 0 15 1 1-12 *', async() => {
    //     console.log('매월');
    // }); 
});