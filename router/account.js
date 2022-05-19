const router = require('express').Router();
const jwt = require('jsonwebtoken')
const database = require('../module/database.js');
const tokenVerify = require('../module/tokenVerify.js');
const sendMail = require('../module/sendMail.js');
const axios = require('axios');

router.post('/login', async(req, res) => {
    const id = req.body.id;
    const pw = req.body.pw;
    const result = {
        success: false,
        token: '',
        message: '',
    };

    if (!id || !pw) {
        result.message = '입력하지 않은 정보가 있습니다.';
        return res.send(result);
    }

    const query = 'SELECT account_idx FROM account.info WHERE id = $1 AND pw = $2;';
    const value = [id, pw];
    const queryResult = await database(query, value);

    if (queryResult.success) {
        try {
            if (queryResult.list.length === 0) { // 일치하는 회원정보가 없을 경우
                throw '일치하는 회원정보가 없습니다.';
            }
            else { // 로그인 성공
                const jwtToken = jwt.sign({
                    account_idx: queryResult.list[0].account_idx,
                }, process.env.ACCESS_KEY, {
                    expiresIn: "14d",
                    issuer: "stageus",
                });
                
                result.success = true;
                result.token = jwtToken;
            }
            
            return res.send(result);      
        }
        catch (err) {
            result.message = err;
            return res.send(result);
        }
    }
    else {
        result.message = 'DB 조회 오류, 다시 시도해 주세요.';
        return res.send(result);
    }
});

router.post('/mail/auth', async(req, res) => {
    const id = req.body.id;
    const auth = req.body.auth;
    const token = req.body.token;
    const result = {
        success: false,
        message: '',
    }
    if (!id || !auth || !token) {
        result.message = '에러 발생. 다시 시도해 주세요.';
        return res.send(result);
    }

    const verify = await tokenVerify(token);
    if (!verify.success) {
        result.message = verify.message;
        return res.send(result);
    }

    if (verify.token.id === id && verify.token.auth === auth) {
        result.success = true;
        result.message = '인증이 확인되었습니다.';
    }
    else
        result.message = '인증번호가 일치하지 않습니다.';

    return res.send(result);
});

router.post('/mail', async(req, res) => {
    const id = req.body.id;
    const email = req.body.email;
    const result = {
        success: false,
        message: '',
        token: '',
    }

    if (!id || !email) {
        result.message = '에러 발생. 다시 시도해 주세요.';
        return res.send(result);
    }

    const emailCheckQuery = 'SELECT COUNT(*) FROM account.info WHERE email = $1;';
    const emailCheck = await database(emailCheckQuery, [email]);
    
    if (!emailCheck.success) {
        result.message = 'DB 접근 오류. 다시 시도해 주세요.';
        return res.send(result);
    }

    if (emailCheck.success && parseInt(emailCheck.list[0].count) !== 0) {
        result.message = '이미 가입정보가 존재하는 이메일 입니다.';
        return res.send(result);
    }

    let auth = '';
    for (let i = 0; i < 4; i++)
        auth += String(Math.floor(Math.random() * 10));
        
    const mailTitle = `[WITHUB] 회원가입 인증번호 메일입니다.`
    const mailContents = `인증번호는 ${auth} 입니다. 정확하게 입력해주세요.`;
    sendMail(email, mailTitle, mailContents);

    const jwtToken = jwt.sign({
        id: id,
        auth: auth,
    }, process.env.ACCESS_KEY, {
        expiresIn: "14d",
        issuer: "stageus",
    });
    result.success = true;
    result.message = '메일 전송 완료. 메일을 확인해주세요.';
    result.token = jwtToken;

    return res.send(result);
});

router.post('/duplicate/id', async(req, res) => {
    const id = req.body.id;
    const result = {
        success: false,
        message: '',
    }

    if (!id) {
        result.message = '에러 발생. 다시 시도해 주세요.';
        return res.send(result);
    }

    const duplicateCheckQuery = `SELECT COUNT(*) FROM account.info WHERE id = $1;`;
    const duplicateCheck = await database(duplicateCheckQuery, [id]);

    if (parseInt(duplicateCheck.list[0].count) === 0) {
        result.success = true;
        result.message = '사용 가능한 아이디 입니다.';
    }
    else {
        result.message = '이미 존재하는 아이디 입니다.';
    }

    return res.send(result);
});

router.post('/duplicate/nickname', async(req, res) => {
    const nickname = req.body.nickname;
    const result = {
        success: false,
        message: '',
    }

    if (!nickname) {
        result.message = '에러 발생. 다시 시도해 주세요.';
        return res.send(result);
    }

    const duplicateCheckQuery = `SELECT COUNT(*) FROM account.info WHERE nickname = $1;`;
    const duplicateCheck = await database(duplicateCheckQuery, [nickname]);

    if (parseInt(duplicateCheck.list[0].count) === 0) {
        result.success = true;
        result.message = '사용 가능한 아이디 입니다.';
    }
    else {
        result.message = '이미 존재하는 아이디 입니다.';
    }

    return res.send(result);
});

router.get('/pw/after', async(req, res) => {
    const token = req.query.token;
    const pw = req.query.pw;
    const result = {
        success: false,
        message: '',
    }

    if (!token || !pw) {
        result.message = '에러 발생. 다시 시도해 주세요.';
        return res.send(result);
    }

    const verify = await tokenVerify(token);
    if (!verify.success) {
        result.message = verify.message;
        return res.send(result);
    }
    const checkPwQuery = 'SELECT pw FROM account.info WHERE account_idx = $1;';
    const checkPw = await database(checkPwQuery, [verify.token.account_idx]);

    if (!checkPw.success) {
        result.message = 'DB 접근 오류. 다시 시도해 주세요.';
        return res.send(result);
    }

    if (checkPw.list[0].pw === pw)
        result.success = true;
    else
        result.message = '비밀번호가 일치하지 않습니다.';

    return res.send(result);
});

router.patch('/pw/after', async(req, res) => {
    const token = req.body.token;
    const pw = req.body.pw;
    const result = {
        success: false,
        message: '',
    }

    if (!token || !pw) {
        result.message = '에러 발생. 다시 시도해 주세요.';
        return res.send(result);
    }

    const verify = await tokenVerify(token);
    if (!verify.success) {
        result.message = verify.message;
        return res.send(result);
    }
    const updatePwQuery = 'UPDATE account.info SET pw = $1 WHERE account_idx = $2;';
    const updatePw = await database(updatePwQuery, [pw, verify.token.account_idx]);

    if (updatePw.success) 
        result.success = true;
    else
        result.message = 'DB 접근 실패. 다시 시도해 주세요.';
    
    return res.send(result);
});

router.post('/id/auth', async(req, res) => {
    const email = req.body.email;
    const auth = req.body.auth;
    const token = req.body.token;
    const result = {
        success: false,
        message: '',
        id: '',
    }
    if (!auth || !token) {
        result.message = '에러 발생. 다시 시도해 주세요.';
        return res.send(result);
    }

    const verify = await tokenVerify(token);
    if (!verify.success) {
        result.message = verify.message;
        return res.send(result);
    }

    if (verify.token.email === email && verify.token.auth === auth) {
        const getIdQuery = `SELECT id FROM account.info WHERE email = $1;`;
        const getId = await database(getIdQuery, [email]);

        if (getId.success && getId.list !== []) {
            result.success = true;
            result.id = getId.list[0].id;
        }
        else if (getId.success && getId.list === []) {
            result.message = '입력하신 이메일에 해당하는 회원정보가 없습니다.';
        }
        else {
            result.message = 'DB 연결 오류. 재시도 해주세요.';
        }
    }
    else
        result.message = '인증번호가 일치하지 않습니다.';

    return res.send(result);
});

router.post('/id', async(req, res) => {
    const email = req.body.email;
    const result = {
        success: false,
        message: '',
        token: '',
    }
    if (!email) {
        result.message = '에러 발생. 다시 시도해 주세요.';
        return res.send(result);
    }

    const emailCheckQuery = 'SELECT COUNT(*) FROM account.info WHERE email = $1;';
    const emailCheck = await database(emailCheckQuery, [email]);
    
    if (!emailCheck.success) {
        result.message = 'DB 접근 오류. 다시 시도해 주세요.';
        return res.send(result);
    }

    if (emailCheck.success && parseInt(emailCheck.list[0].count) === 0) {
        result.message = '입력하신 정보에 해당하는 회원정보가 없습니다.';
        return res.send(result);
    }

    let auth = '';
    for (let i = 0; i < 4; i++)
        auth += String(Math.floor(Math.random() * 10));

    const mailTitle = `[WITHUB] 아이디찾기 인증번호 메일입니다.`
    const mailContents = `인증번호는 ${auth} 입니다. 정확하게 입력해주세요.`;
    sendMail(email, mailTitle, mailContents);

    const jwtToken = jwt.sign({
        email: email,
        auth: auth,
    }, process.env.ACCESS_KEY, {
        expiresIn: "14d",
        issuer: "stageus",
    });
    result.success = true;
    result.meesage = '메일 전송 완료. 메일을 확인해주세요.';
    result.token = jwtToken;

    return res.send(result);
});

router.post('/pw/auth', async(req, res) => {
    const id = req.body.id;
    const email = req.body.email;
    const auth = req.body.auth;
    const token = req.body.token;
    const result = {
        success: false,
        message: '',
    }
    if (!auth || !token) {
        result.message = '에러 발생. 다시 시도해 주세요.';
        return res.send(result);
    }

    const verify = await tokenVerify(token);
    if (!verify.success) {
        result.message = verify.message;
        return res.send(result);
    }

    if (verify.token.email === email && verify.token.auth === auth) {
        const getPwQuery = `SELECT COUNT(*) FROM account.info WHERE email = $1 AND id = $2`;
        const getPw = await database(getPwQuery, [email, id]);

        if (getPw.success && parseInt(getPw.list[0].count) !== 0)
            result.success = true;
        else if (getPw.success && parseInt(getPw.list[0].count) === 0)
            result.message = '입력하신 정보에 해당하는 회원정보가 없습니다.';
        else
            result.message = 'DB 연결 오류. 재시도 해주세요.';
    }
    else
        result.message = '인증번호가 일치하지 않습니다.';

    return res.send(result);
});

router.post('/pw', async(req, res) => {
    const email = req.body.email;
    const id = req.body.id;
    const result = {
        success: false,
        message: '',
        token: '',
    }
    if (!email || !id) {
        result.message = '에러 발생. 다시 시도해 주세요.';
        return res.send(result);
    }

    const emailCheckQuery = 'SELECT COUNT(*) FROM account.info WHERE EXISTS (SELECT 1 FROM account.info WHERE email = $1 AND id = $2);';
    const emailCheck = await database(emailCheckQuery, [email, id]);
    
    if (!emailCheck.success) {
        result.message = 'DB 접근 오류. 다시 시도해 주세요.';
        return res.send(result);
    }

    if (emailCheck.success && parseInt(emailCheck.list[0].count) === 0) {
        result.message = '입력하신 정보에 해당하는 회원정보가 없습니다.';
        return res.send(result);
    }

    let auth = '';
    for (let i = 0; i < 4; i++)
        auth += String(Math.floor(Math.random() * 10));

    const mailTitle = `[WITHUB] 비밀번호찾기 인증번호 메일입니다.`
    const mailContents = `인증번호는 ${auth} 입니다. 정확하게 입력해주세요.`;
    sendMail(email, mailTitle, mailContents);

    const jwtToken = jwt.sign({
        email: email,
        id: id,
        auth: auth,
    }, process.env.ACCESS_KEY, {
        expiresIn: "14d",
        issuer: "stageus",
    });
    result.success = true;
    result.meesage = '메일 전송 완료. 메일을 확인해주세요.';
    result.token = jwtToken;

    return res.send(result);
});

router.patch('/pw', async(req, res) => {
    const pw = req.body.pw;
    const token = req.body.token;
    const result = {
        success: false,
        message: '',
    }

    if (!pw || !token) {
        result.message = '에러 발생. 다시 시도해 주세요.';
        return res.send(result);
    }

    const pwRegexp1 = /[0-9]/; // 숫자 체크 정규표현식
	const pwRegexp2 = /[a-zA-Z]/; // 영어 체크 정규표현식
	const pwRegexp3 = /[~!@#$%^&*()_+|<>?:{}]/; // 특문 체크 정규표현식	
    if (!pwRegexp1.test(pw) || !pwRegexp2.test(pw) || !pwRegexp3.test(pw) || pw.length < 8 || pw.length > 20) {
        result.message = '비밀번호는 8~20자의 영문, 숫자, 특수문자를 만드시 포함하여야 합니다.';
        return res.send(result);
    }

    const verify = await tokenVerify(token);

    if (!verify.success) {
        result.message = verify.message;
        return res.send(result);
    }

    const updatePwQuery = 'UPDATE account.info SET pw = $1 WHERE email = $2 AND id = $3;';
    const updatePw = await database(updatePwQuery, [pw, verify.token.email, verify.token.id]);

    if (updatePw.success)
        result.success = true;
    else
        result.message = 'DB 접근 실패. 다시 시도해 주세요.';

    return res.send(result);
});

router.patch('/area', async(req, res) => {
    const token = req.body.token;
    const area = req.body.area;
    const result = {
        success: false,
        message: '',
    }

    if (!token || !area) {
        result.message = '에러 발생. 다시 입력해 주세요.';
        return res.send(result);
    }

    const verify = await tokenVerify(token);
    if (!verify.success) {
        result.message = verify.message;
        return res.send(result);
    }

    const updateAreaQuery = 'UPDATE account.info SET area_idx = $1 WHERE account_idx = $2;';
    const updateArea = await database(updateAreaQuery, [area, verify.token.account_idx]);

    if (updateArea.success)
        result.success = true;
    else
        result.message = 'DB 접근 실패. 다시 시도해 주세요.';

    return res.send(result);
});

router.get('/repo', async(req, res) => {
    const token = req.query.token;
    const result = {
        success: false,
        message: '',
        committer: '',
        repository: [],
    }

    if (!token) {
        result.message = '에러 발생. 다시 입력해 주세요.';
        return res.send(result);
    }

    const verify = await tokenVerify(token);
    if (!verify.success) {
        result.message = verify.message;
        return res.send(result);
    }
    const account_idx = verify.token.account_idx;
    
    const getRepoQuery = `SELECT owner, name, i.committer FROM account.repository AS r 
                            INNER JOIN account.info AS i ON r.account_idx = i.account_idx WHERE i.account_idx = $1;`;
    const getRepo = await database(getRepoQuery, [account_idx]);
    if (!getRepo.success) {
        result.message = 'DB 접속 오류. 재시도 해주세요.';
        return res.send(result);
    }
    result.committer = getRepo.list[0].committer;
    for (const value of getRepo.list) {
        const tmp = Object();
        tmp.owner = value.owner;
        tmp.name = value.name;
        
        result.repository.push(tmp);
    }
    result.success = true;

    return res.send(result);
});

router.patch('/repo', async(req, res) => {
    const token = req.body.token;
    const repository = req.body.repository;
    const result = {
        success: false,
        message: '',
    }

    if (!token || !repository) {
        result.message = '에러 발생. 다시 입력해 주세요.';
        return res.send(result);
    }

    const verify = await tokenVerify(token);
    if (!verify.success) {
        result.message = verify.message;
        return res.send(result);
    }
    const account_idx = verify.token.account_idx;

    const insertRepoQuery = `INSERT INTO account.repository(account_idx, owner, name) VALUES ($1, $2, $3);`
    for (const repo of repository) {
        const insertRepo = await database(insertRepoQuery, [account_idx, repo.owner, repo.name]);

        if (!insertRepo.success) {
            if (insertRepo.code === '23505')
                continue;

            result.message = 'DB 접속 오류. 재시도 해주세요.';
            return res.send(result);
        }
    }
        
    result.success = true;
    return res.send(result);
});

router.patch('/nickname', async(req, res) => {
    const nickname = req.body.nickname;
    const token = req.body.token;
    const result = {
        success: false,
        message: '',
    }

    if (!nickname || !token) {
        result.message = '에러 발생. 다시 시도해 주세요.';
        return res.send(result);
    }

    const nicknameRegexp = /^[a-zA-Z가-힣0-9]{2,10}$/; // 2~10자의 한글, 영어, 숫자
    if (!nicknameRegexp.test(nickname)) {
        result.message = '닉네임은 2~10자의 한글, 영어, 숫자로만 이루어져야 합니다.';
        return res.send(result);
    }

    const verify = await tokenVerify(token);
    if (!verify.success) {
        result.message = verify.message;
        return res.send(result);
    }

    const patchNicknameQuery = `UPDATE account.info SET nickname = $1 WHERE account_idx = $2;`;
    const patchNickname = await database(patchNicknameQuery, [nickname, verify.token.account_idx]);

    if (!patchNickname.success) {
        result.message = 'DB 접속 오류, 재시도 해주세요.';
        return res.send(result);
    }

    result.success = true;
    return res.send(result);
});

router.get('/info', async(req, res) => {
    const token = req.query.token;
    const result = {
        success: false,
        message: '',
        avatar_url: '',
        nickname: '',
    }

    if (!token) {
        result.message = '에러 발생. 다시 시도해 주세요.';
        return res.send(result);
    }

    const verify = await tokenVerify(token);
    if (!verify.success) {
        result.message = verify.message;
        return res.send(result);
    }

    const getInfoQuery = `SELECT nickname, avatar_url FROM account.info WHERE account_idx = $1;`;
    const getInfo = await database(getInfoQuery, [verify.token.account_idx]);

    if (!getInfo.success) {
        result.message = 'DB 접속 오류, 재시도 해주세요.';
        return res.send(result);
    }

    result.avatar_url = getInfo.list[0].avatar_url;
    result.nickname = getInfo.list[0].nickname;
    result.success = true;
    return res.send(result);
})

router.delete('', async(req, res) => {
    const token = req.body.token;
    const result = {
        success: false,
        message: '',
    }

    if (!token) {
        result.message = '에러 발생. 다시 입력해 주세요.';
        return res.send(result);
    }

    const verify = await tokenVerify(token);
    if (!verify.success) {
        result.message = verify.message;
        return res.send(result);
    }

    const deleteUserQuery = 'DELETE FROM account.info WHERE account_idx = $1;';
    const deleteUser = await database(deleteUserQuery, [verify.token.account_idx]);

    if (deleteUser.success) {
        result.success = true;
        result.message = '회원 탈퇴가 완료되었습니다.';
    }
    else
        result.message = '삭제 실패, 재시도 해주세요.';
});

router.get('', async(req, res) => {
    const token = req.query.token;
    const result = {
        success: false,
        message: '',
        committer: '',
        daily_commit: -1,
        thirty_commit: [],
        friend_avg: -1,
        area_avg: -1,
    }

    if (!token) {
        result.message = '에러 발생. 다시 입력해 주세요.';
        return res.send(result);
    }

    const verify = await tokenVerify(token);
    if (!verify.success) {
        result.message = verify.message;
        return res.send(result);
    }
    const account_idx = verify.token.account_idx;

    const getFriendAVGQuery = `SELECT ROUND(CAST(AVG(a) AS NUMERIC), 1) FROM (SELECT daily_commit AS a FROM account.info AS i 
                            INNER JOIN account.friend AS f ON i.account_idx = f.following WHERE f.account_idx = $1) AS b;`;
    const getFriendAVG = await database(getFriendAVGQuery, [account_idx]);
    if (!getFriendAVG.success) {
        result.message = 'DB 접속 오류. 재시도 해주세요.';
        return res.send(result);
    }
    
    getFriendAVG.list[0].round === null ? -1 : result.friend_avg = getFriendAVG.list[0].round;

    const getAreaAVGQuery = `SELECT ROUND(CAST(AVG(a) AS NUMERIC), 1) FROM (
                            SELECT daily_commit AS a FROM account.info WHERE area_idx = (SELECT area_idx FROM account.info WHERE account_idx = $1)) AS b;`;
    const getAreaAVG = await database(getAreaAVGQuery, [account_idx])
    if (!getAreaAVG.success) {
        result.message = 'DB 접속 오류. 재시도 해주세요.';
        return res.send(result);
    }
    getAreaAVG.list[0].round === null ? -1 : result.area_avg = getAreaAVG.list[0].round;

    const getInfoQuery = `SELECT committer, daily_commit, thirty_commit FROM account.info WHERE account_idx = $1;`;
    const getInfo = await database(getInfoQuery, [account_idx]);
    if (!getInfo.success) {
        result.message = 'DB 접속 오류. 재시도 해주세요.';
        return res.send(result);
    }
    result.committer = getInfo.list[0].committer;
    result.daily_commit = getInfo.list[0].daily_commit;
    result.thirty_commit = getInfo.list[0].thirty_commit.reverse();
    result.success = true;

    return res.send(result);
});

router.post('', async(req, res) => {
    const id = req.body.id;
    const pw = req.body.pw;
    const nickname = req.body.nickname;
    const email = req.body.email;
    const area = req.body.area;
    const committer = req.body.committer;
    const repository = req.body.repository;
    const response = await axios.get(process.env.GITHUB_URL + '/users/' + committer, {
        headers: {
            Authorization: process.env.GITHUB_TOKEN,
        }
    });
    const avatar_url = response.data.avatar_url;
    const result = {
        success: false,
        message: '',
    }
    
    if (!id || !pw || !nickname || !email || !area || !committer || !repository) {
        result.message = '에러 발생. 다시 입력해 주세요.';
        return res.send(result);
    }

    const idRegexp = /^[a-z0-9]{5,15}$/; // 5~15자의 영어 대소문자, 숫자
    if (!idRegexp.test(id)) {
        result.message = '아이디는 5~15자의 영문, 숫자로만 이루어져야 합니다.';
        return res.send(result);
    }

    const pwRegexp1 = /[0-9]/; // 숫자 체크 정규표현식
	const pwRegexp2 = /[a-zA-Z]/; // 영어 체크 정규표현식
	const pwRegexp3 = /[~!@#$%^&*()_+|<>?:{}]/; // 특문 체크 정규표현식	
    if (!pwRegexp1.test(pw) || !pwRegexp2.test(pw) || !pwRegexp3.test(pw) || pw.length < 8 || pw.length > 20) {
        result.message = '비밀번호는 8~20자의 영문, 숫자, 특수문자를 만드시 포함하여야 합니다.';
        return res.send(result);
    }

    const nicknameRegexp = /^[a-zA-Z가-힣0-9]{2,10}$/; // 2~10자의 한글, 영어, 숫자
    if (!nicknameRegexp.test(nickname)) {
        result.message = '닉네임은 2~10자의 한글, 영어, 숫자로만 이루어져야 합니다.';
        return res.send(result);
    }

    const insertUserQuery = `INSERT INTO account.info(area_idx, id, pw, nickname, email, committer, avatar_url) VALUES ($1, $2, $3, $4, $5, $6, $7);`;
    const insertUser = await database(insertUserQuery, [area, id, pw, nickname, email, committer, avatar_url]);

    if (insertUser.success) {
        const getIdxQuery = `SELECT account_idx FROM account.info WHERE id = $1`;
        const getIdx = await database(getIdxQuery, [id]);

        if (getIdx.success) {
            const insertRepoQuery = `INSERT INTO account.repository(account_idx, owner, name) VALUES ($1, $2, $3);`
            for (const repo of repository)
                await database(insertRepoQuery, [getIdx.list[0].account_idx, repo.owner, repo.name]);
        }
        else {
            console.log("여기");
            result.message = 'DB 접근 실패. 재시도 해주세요.'
        }
    }
    else {
        console.log("저기");
        result.message = 'DB 접근 실패. 재시도 해주세요.'
    }
    result.success = true;

    return res.send(result);
});

module.exports = router;