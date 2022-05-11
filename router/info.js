const router = require('express').Router();
const database = require('../module/database.js');
const tokenVerify = require('../module/tokenVerify.js');
const format = require('pg-format');

router.post('', async(req, res) => {
    const token = req.body.token;
    const commits = req.body.commits;
    const result = {
        success: false,
        message: '',
    }

    if (!token || !commits) {
        result.message = '서버 연결 오류. 재시도 해주세요.';
        return res.send(result);
    }

    const verify = await tokenVerify(token);
    if (!verify.success) {
        result.message = verify.message;
        return res.send(result);
    }
    const account_idx = verify.token.account_idx;

    const hour = 60 * 60 * 1000;
    const oneDay = 24 * 60 * 60 * 1000;
    const cur = new Date();
    const UTC = cur.getTime() + (cur.getTimezoneOffset() * 60 * 1000);
    const korea = new Date(UTC + 9 * hour);
    const day = korea.getDay() === 0 ? 7 : korea.getDay();
    
    // const today = korea.toISOString().split('T')[0];
    (weekly_commit = []).length = day;
    weekly_commit.fill(0);
    (monthly_commit = []).length = korea.getDate();
    monthly_commit.fill(0);
    (thirty_commit = []).length = 30;
    thirty_commit.fill(0);

    const weekStart = new Date(Date.parse(korea) - (day - 1) * oneDay);
    weekStart.setHours(0, 0, 0, 0);
    const monthStart = new Date(Date.parse(korea));
    monthStart.setDate(1);
    const thirtyStart = new Date(Date.parse(korea) - 30 * oneDay);
    thirtyStart.setHours(0, 0, 0, 0);

    return res.send(result);
});

module.exports = router;