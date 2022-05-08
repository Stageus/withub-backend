const router = require('express').Router();
const database = require('../module/database.js');
const tokenVerify = require('../module/tokenVerify.js');

router.get('/rank/area', async(req, res) => {
    const token = req.query.token;
    const result = {
        success: false,
        message: '',
        daily_rank: [],
        weekly_rank: [],
        monthly_rank: [],
        continuous_rank: [],
    }

    if (!token) {
        result.message = '서버 접속 오류. 재시도 해주세요.';
        return res.send(result);
    }

    const verify = await tokenVerify(token);
    if (!verify.success) {
        result.message = verify.message;
        return res.send(result);
    }
    const account_idx = verify.token.account_idx;
});

router.get('/rank/friend', async(req, res) => {
    const token = req.query.token;
    const result = {
        success: false,
        message: '',
        daily_rank: [],
        weekly_rank: [],
        monthly_rank: [],
        continuous_rank: [],
    }

    if (!token) {
        result.message = '서버 접속 오류. 재시도 해주세요.';
        return res.send(result);
    }

    const verify = await tokenVerify(token);
    if (!verify.success) {
        result.message = verify.message;
        return res.send(result);
    }
    const account_idx = verify.token.account_idx;
    
    const dailyRankQuery = `SELECT nickname, daily_commit FROM account.info AS i 
                            INNER JOIN account.friend AS f ON i.account_idx = f.following WHERE f.account_idx = $1 ORDER BY daily_commit DESC;`;
    const dailyRank = await database(dailyRankQuery, [account_idx]);
    if (!dailyRank.success) {
        result.message = 'DB 접속 오류. 재시도 해주세요.';
        return res.send(result);
    }
    result.daily_rank = dailyRank.list[0];

    const weeklyRankQuery = `SELECT b.nickname, SUM(a) AS count FROM 
                            (SELECT nickname, unnest(weekly_commit) AS a FROM account.info AS i 
                            INNER JOIN account.friend AS f ON i.account_idx = f.following WHERE f.account_idx = $1) AS b 
                            GROUP BY b.nickname ORDER BY total DESC`;
    const weeklyRank = await database(weeklyRankQuery, [account_idx]);
    if (!weeklyRank.success) {
        result.message = 'DB 접속 오류. 재시도 해주세요.';
        return res.send(result);
    }
    result.weekly_rank = weeklyRank.list[0];

    const monthlyRankQuery = `SELECT b.nickname, SUM(a) AS count FROM 
                            (SELECT nickname, unnest(monthly_commit) AS a FROM account.info AS i 
                            INNER JOIN account.friend AS f ON i.account_idx = f.following WHERE f.account_idx = $1) AS b 
                            GROUP BY b.nickname ORDER BY total DESC`; // 월간 커밋 수 반환
    const monthlyRank = await database(monthlyRankQuery, [account_idx]);
    if (!monthlyRank.success) {
        result.message = 'DB 접속 오류. 재시도 해주세요.';
        return res.send(result);
    }
    result.monthly_rank = monthlyRank.list[0];

    const continuousRankQuery = `SELECT nickname, continuous_commit FROM account.info AS i 
                                INNER JOIN account.friend AS f ON i.account_idx = f.following WHERE f.account_idx = $1 ORDER BY continuous_commit DESC;`;
    const continuousRank = await database(continuousRankQuery, [account_idx]);
    if (!continuousRank.success) {
        result.message = 'DB 접속 오류. 재시도 해주세요.';
        return res.send(result);
    }
    result.continuous_rank = continuousRank.list[0];

    return res.send(result);
});

router.get('', async(req, res) => {

});

module.exports = router;