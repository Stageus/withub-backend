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
        friend_daily: -1,
        thirty_commit: [],
        my_month_total: 0,
        friend_month_total: 0,
        repository: []
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

    const getFriendInfoQuery = `SELECT b.committer, b.daily_commit, b.thirty_commit, SUM(a) AS month_total FROM (
                                SELECT committer, daily_commit, thirty_commit, unnest(monthly_commit) AS a FROM account.info WHERE nickname = $1) AS b 
                                GROUP BY b.committer, b.daily_commit, b.thirty_commit;
    `
    const getFriendInfo = await database(getFriendInfoQuery, [nickname]);
    if (!getFriendInfo.success) {
        result.message = 'DB 접속 오류. 재시도 해주세요.';
        return res.send(result);
    }
    result.committer = getFriendInfo.list[0].committer;
    result.friend_daily = getFriendInfo.list[0].daily_commit;
    result.thirty_commit = getFriendInfo.list[0].thirty_commit;
    result.friend_month_total = getFriendInfo.list[0].month_total;

    const getUserInfoQuery = `SELECT SUM(a) AS month_total FROM (SELECT unnest(monthly_commit) AS a FROM account.info WHERE account_idx = $1) AS b;`
    const getUserInfo = await database(getUserInfoQuery, [account_idx]);
    if (!getUserInfo.success) {
        result.message = 'DB 접속 오류. 재시도 해주세요.';
        return res.send(result);
    }
    result.my_month_total = getUserInfo.list[0].month_total;

    const getRepoQuery = `SELECT owner, name FROM account.repository WHERE account_idx = (SELECT account_idx FROM account.info WHERE nickname = $1);`
    const getRepo = await database(getRepoQuery, [nickname]);
    if (!getRepo.success) {
        result.message = 'DB 접속 오류. 재시도 해주세요.';
        return res.send(result);
    }
    result.repository = getRepo.list;

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
                    INNER JOIN account.friend AS f ON i.account_idx = f.following WHERE f.account_idx = $1;`;
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

    if (getIdx.list[0].account_idx === verify.token.account_idx) {
        result.message = '나 자신은 영원한 인생의 친구입니다.';
        return res.send(result);
    }

    if (getIdx.list.length === 0) {
        result.message = '존재하지 않는 회원입니다.';
        return res.send(result);
    }
    const friendIdx = getIdx.list[0].account_idx;

    const friendDupQuery = `SELECT friend_idx FROM account.friend WHERE account_idx = $1 AND following = $2;`;
    const friendDup = await database(friendDupQuery, [verify.token.account_idx, friendIdx]);

    if (!friendDup.success) {
        result.message = 'DB 접근 오류. 재시도 해주세요.';
        return res.send(result);
    }

    if (getIdx.list.length !== 0) {
        result.message = '이미 친구로 등록된 회원입니다.';
        return res.send(result);
    }

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

    const friendIdx = getIdx.list[0].account_idx;
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