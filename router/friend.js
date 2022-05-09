const router = require('express').Router();
const tokenVerify = require('../module/tokenVerify.js');
const database = require('../module/database.js');

router.get('/info', async(req, res) => {
    const token = req.query.token;
    const nickname = req.query.nickname;
    const result = {
        success: false,
        message: '',
        committer: '',
        friend_today: -1,
        monthly_commit: [],
        friend_avg: 0,
        area_avg: 0,
        my_total: 0,
        friend_total: 0,
    }

    if (!token || !nickname) {
        result.message = '서버 접속 오류, 다시 시도해 주세요.';
        return res.send(result);
    }

    const verify = await tokenVerify(token);
    if (!verify.success) {
        result.message = verify.message;
        return res.send(result);
    }
    const account_idx = verify.token.account_idx;
    
    const getInfoQuery = `SELECT committer, daily_commit, monthly_commit, thirty_commit, commit_avg FROM account.info AS i 
                                INNER JOIN account.area AS a ON i.area_idx = a.area_idx WHERE i.nickname = $1`;
    const getInfo = await database(getInfoQuery, [nickname]);

    if (!getInfo.success) {
        result.message = 'DB 접근 오류, 다시 시도해 주세요.';
        return res.send(result);
    }

    result.area_avg = getInfo.list[0].commit_avg;
    result.friend_today = getInfo.list[0].daily_commit;
    result.committer = getInfo.list[0].committer;
    result.monthly_commit = getInfo.list[0].thirty_commit.map((value, index) => {
        const ago = new Date(Date.parse(today) - (29 - index) * day);
        const tmp = Object();
        tmp.date = `${String(ago.getMonth() + 1)}-${ago.getDate()}`;
        tmp.commit = parseInt(value);
        
        return tmp;
    });
    const zero1 = 0;
    result.friend_total = getInfo.list[0].monthly_commit.reduce((prev, cur) => {
        prev + cur, zero1;
    });

    const getFriendCommitQuery = `SELECT * FROM account.info AS i 
                                    INNER JOIN account.friend AS f ON i.account_idx = f.following 
                                    WHERE f.account_idx = (SELECT DISTINCT(account_idx) FROM account.info WHERE nickname='$1');`;
    const getFriendCommit = await database(getFriendCommitQuery, [nickname]);

    if (!getFriendCommit.success) {
        result.message = 'DB 접근 오류, 다시 시도해 주세요.';
        return res.send(result);
    }

    let sum = 0;
    getFriendCommit.list[0].daily_commit.forEach(value => {
        if (parseInt(value) !== -1)
            sum += parseInt(value)
    });
    result.friend_avg = sum / getFriendCommit.list[0].daily_commit.length;

    const getMyTotalQuery = `SELECT monthly_commit FROM account.info WHERE account_idx = $1;`;
    const getMyTotal = await database(getMyTotalQuery, [account_idx]);

    if (!getMyTotal.success) {
        result.message = 'DB 접근 오류, 다시 시도해 주세요.';
        return res.send(result);
    }

    const zero2 = 0;
    result.my_total = getMyTotal.list[0].monthly_commit.reduce((prev, cur) => {
        prev + cur, zero2;
    });

    return res.send(result);
});

router.get('', async(req, res) => {
    const token = req.query.token;
    const result = {
        success: false,
        message: '',
        friends: [],
    }

    if (!token) {
        result.message = '서버 연결 실패. 재시도 해주세요.';
        return res.send(result);
    }
    const verify = await tokenVerify(token);
    if (!verify.success) {
        result.message = verify.message;
        return res.send(result);
    }

    const query = `SELECT nickname, avatar_url FROM account.info AS i 
                    INNER JOIN account.friend AS f ON i.account_idx = f.account_idx WHERE i.account_idx = 1;`;
    const queryResult = await database(query, [verify.token.account_idx]);
    
    if (!queryResult.success) {
        result.meesage = 'DB 접근 실패. 재시도 해주세요.';
        return res.send(result);
    }

    result.success = true;
    result.friends = queryResult.list;

    return res.send(result);
});

router.post('', async(req, res) => {
    const token = req.body.token;
    const nickname = req.body.nickname;
    const result = {
        success: false,
        message: '',
    }

    if (!token || !nickname) {
        result.message = '서버 연결 오류. 재시도 해주세요.';
        return res.send(result);
    }

    const verify = await tokenVerify(token);
    if (!verify.success) {
        result.message = verify.message;
        return res.send(result);
    }

    const getIdxQuery = `SELECT account_idx FROM account.info WHERE nickname = $1;`;
    const getIdx = await database(getIdxQuery, [nickname]);

    if (!getIdx.success) {
        result.message = 'DB 접근 오류. 재시도 해주세요.';
        return res.send(result);
    }

    const friendIdx = getidx.list[0].account_idx;
    const insertFriendQuery = `INSERT INTO account.friend(account_idx, following) VALUES($1, $2);`;
    const insertFriend = await database(insertFriendQuery, [verify.token.account_idx, friendIdx]);

    if (!insertFriend.success) {
        result.message = 'DB 접근 오류. 재시도 해주세요.';
        return res.send(result);
    }

    result.success = true;
    
    return res.send(result);
});

router.delete('', async(req, res) => {
    const token = req.body.token;
    const nickname = req.body.nickname;
    const result = {
        success: false,
        message: '',
    }

    if (!token || !nickname) {
        result.message = '서버 연결 오류. 재시도 해주세요.';
        return res.send(result);
    }

    const verify = await tokenVerify(token);
    if (!verify.success) {
        result.message = verify.message;
        return res.send(result);
    }

    const getIdxQuery = `SELECT account_idx FROM account.info WHERE nickname = $1;`;
    const getIdx = await database(getIdxQuery, [nickname]);

    if (!getIdx.success) {
        result.message = 'DB 접근 오류. 재시도 해주세요.';
        return res.send(result);
    }

    const friendIdx = getidx.list[0].account_idx;
    const deleteFriendQuery = `DELETE FROM account.friend WHERE account_idx = $1 AND following = $2;`;
    const deleteFriend = await database(deleteFriendQuery, [verify.token.account_idx, friendIdx]);

    if (!deleteFriend.success) {
        result.message = 'DB 접근 오류. 재시도 해주세요.';
        return res.send(result);
    }

    result.success = true;
    
    return res.send(result);
});

module.exports = router;