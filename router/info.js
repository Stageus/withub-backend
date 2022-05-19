const router = require('express').Router();
const database = require('../module/database.js');
const tokenVerify = require('../module/tokenVerify.js');

const cmp = (a, b) => {
    const aDate = new Date(`${a.date}T${a.time}`);
    const bDate = new Date(`${b.date}T${b.time}`);

    return aDate.getTime() - bDate.getTime();
}

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
    const tomorrow = new Date(Date.parse(korea) + oneDay);
    tomorrow.setHours(0, 0, 0, 0);

    const day = korea.getDay() === 0 ? 7 : korea.getDay();
    
    let daily_commit = 0;
    (weekly_commit = []).length = day;
    weekly_commit.fill(0);
    (monthly_commit = []).length = korea.getDate();
    monthly_commit.fill(0);

    const thirty_commit = [];
    for (let i = 0; i < 30; i++) {
        const certainDay = new Date(Date.parse(korea) - oneDay * i);
        const today = certainDay.toISOString().split('T')[0];
        
        const tmp = new Object();
        tmp.date = `${today.split('-')[1]}-${today.split('-')[2]}`;
        tmp.commit = 0;
        thirty_commit.push(tmp);
    }
    const commit_list = [];

    const weekStart = new Date(Date.parse(korea) - (day - 1) * oneDay);
    weekStart.setHours(0, 0, 0, 0);
    const monthStart = new Date(Date.parse(korea));
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const thirtyStart = new Date(Date.parse(korea) - 30 * oneDay);
    thirtyStart.setHours(0, 0, 0, 0);

    for (const commit of commits) {
        const commitTime = new Date(Date.parse(commit.commit.committer.date) + 9 * hour);
        const dayDiff = Math.floor((tomorrow.getTime() - commitTime.getTime()) / oneDay);

        if (dayDiff === 0)
            daily_commit++;
        if (dayDiff < day)
            weekly_commit[dayDiff]++;
        if (dayDiff < korea.getDate())
            monthly_commit[dayDiff]++;
        if (dayDiff < 30) {
            thirty_commit[dayDiff].commit++;
            const tmp = new Object();
            tmp.date = commitTime.toISOString().split('T')[0];
            tmp.time = commitTime.toISOString().split('T')[1].split('.')[0];
            tmp.repository = `${commit.commit.url.split('/')[4]}/${commit.commit.url.split('/')[5]}`;
            tmp.commit_message = commit.commit.message;
            tmp.sha = commit.sha;
            commit_list.push(tmp);
        }
    }
    commit_list.sort(cmp);

    let len = 0;
    let lenArr = [];
    for (const num of monthly_commit) {
        if (num !== 0)
            len++;
        else {
            lenArr.push(len);
            len = 0;
        }
    }
    const continuous_commit = Math.max(...monthly_commit);

    const updateQuery = `UPDATE account.info SET 
                        daily_commit = $1, weekly_commit = $2, monthly_commit = $3, thirty_commit = $4, continuous_commit = $5, commit_list = $6
                        WHERE account_idx = $7`
    const update = await database(updateQuery, [daily_commit, weekly_commit, monthly_commit, JSON.stringify(thirty_commit), continuous_commit, JSON.stringify(commit_list), account_idx]);

    if (!update.success) {
        result.message = 'DB 접속 실패. 재시도 해주세요.';
        return res.send(result);
    }

    result.success = true;
    return res.send(result);
});

module.exports = router;