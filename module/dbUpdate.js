

// // const token = req.query.token;
// const day = 1000 * 60 * 60 * 24;
// const result = {
//     success: false,
//     message: '',
//     today_commit: 0,
//     monthly_commit: [],
//     friend_avg: -1,
//     area_avg: -1,
//     tips: [],
// }

// // if (!token) {
// //     result.message = '에러 발생. 다시 입력해 주세요.';
// //     return res.send(result);
// // }

// const verify = await tokenVerify(token);
// if (!verify.success) {
//     result.message = verify.message;
//     return res.send(result);
// }

// const getRepoQuery = `SELECT committer, owner, name FROM account.repository AS r 
//                         INNER JOIN account.info AS i ON r.account_idx = i.account_idx WHERE r.account_idx = $1;`;
// // const getRepo = await database(getRepoQuery, [verify.token.account_idx]);
// const getRepo = await database(getRepoQuery, [1]);

// if (!getRepo.success) {
//     result.message = 'DB 접근 오류. 다시 시도해 주세요.';
//     return res.send(result);
// }

// const committer = getRepo.list[0].committer;
// const today = new Date();
// today.setHours(0, 0, 0, 0);

// const yesterday = new Date(Date.parse(today) - 1 * day);
// const monthAgo = new Date(Date.parse(today) - 31 * day);

// const todayMM = String(today.getMonth() + 1).length === 1 ? `0${today.getMonth() + 1}` : today.getMonth() + 1;
// const todayDD = String(today.getDate()).length === 1 ? `0${today.getDate()}` : today.getDate();
// const todayString = `${today.getFullYear()}-${todayMM}-${todayDD}`;

// for (let i = 0; i < 30; i++) {
//     const tmp = new Object();
//     const ago = new Date(Date.parse(today) - (29 - i) * day);
//     const mm = String(ago.getMonth() + 1).length === 1 ? `0${ago.getMonth() + 1}` : ago.getMonth() + 1;
//     const dd = String(ago.getDate()).length === 1 ? `0${ago.getDate()}` : ago.getDate();
//     const date = `${ago.getFullYear()}-${mm}-${dd}`;
//     tmp.date = date;
//     tmp.commit = 0;

//     result.monthly_commit.push(tmp);
// }

// for (const repo of getRepo.list) {
//     const response = await axios.get(`${process.env.GITHUB_URL}/repos/${repo.owner}/${repo.name}/commits?since=${monthAgo}&until=${today}`, {
//         headers: {
//             Authorization: process.env.GITHUB_TOKEN,
//         }
//     });

//     for (const data of response.data) {
//         if (data.commit.committer.name === committer) {
//             const commitDay = data.commit.committer.date.split('T')[0];
//             const idx = result.monthly_commit.findIndex(value => {
//                 return value.date === commitDay;
//             });
//             result.monthly_commit[idx].commit++;

//             if (todayString === commitDay)
//                 result.today_commit++;
//         }
//     }
// }

// const getFriendQuery = `SELECT committer, owner, name FROM account.repository AS r
//                         INNER JOIN account.info AS i ON r.account_idx = i.account_idx
//                         INNER JOIN account.friend AS f ON i.account_idx = f.account_idx WHERE r.account_idx = $1;`;
// // const getFriend = await database(getFriendQuery, [verify.token.account_idx]);
// const getFriend = await database(getFriendQuery, [1]);
// let friendCommitSum = 0;

// if (!getFriend.success) {
//     result.message = 'DB 접근 오류. 다시 시도해 주세요.';
//     return res.send(result);
// }

// for (const repo of getFriend.list) {
//     const response = await axios.get(`${process.env.GITHUB_URL}/repos/${repo.owner}/${repo.name}/commits?since=${yesterday}&until=${today}`, {
//         headers: {
//             Authorization: process.env.GITHUB_TOKEN,
//         }
//     });

//     for (const data of response.data) {
//         if (data.commit.committer.name === repo.committer)
//             friendCommitSum++;
//     }
// }

// const getFriendCountQuery = `SELECT COUNT(*) FROM account.friend WHERE account_idx = $1;`;
// // const getFriendCount = await database(getFriendCountQuery, [verify.token.account_idx]);
// const getFriendCount = await database(getFriendCountQuery, [1]);

// if (!getFriendCount.success) {
//     result.message = 'DB 접근 오류. 다시 시도해 주세요.';
//     return res.send(result);
// }

// result.friend_avg = friendCommitSum / parseInt(getFriendCount.list[0].count);