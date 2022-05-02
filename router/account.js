const router = require('express').Router();
const database = require('../module/database.js');
const tokenVerify = require('../module/tokenVerify.js');
const sendMail = require('../module/sendMail.js');
const axios = require('axios');
const format = require('pg-format');

router.get('login', async(req, res) => {
    const id = req.body.id;
    const pw = req.body.pw;
    const result = {
        'success': false,
        'token': '',
        'message': '',
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
                }, process.env.LOGIN_ACCESS_KEY, {
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

router.post('', async(req, res) => {
    const id = req.body.id;
    const pw = req.body.pw;
    const nickname = req.body.nickname;
    const email = req.body.string;
    const area = req.body.area;
    const committer = req.body.committer;
    const repository = req.body.repository;
    const response = await axios.get(process.env.GITHUB_URL + '/users/' + committer, {
        headers: {
            AUthorization: process.env.GITHUB_TOKEN,
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

    const insertUserQuery = `INSERT INTO account.info(area, id, pw, nickname, email, committer, avatar_url) VALUES ($1, $2, $3, $4, $5, $6, $7);`;
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
            result.message = 'DB 접근 실패. 재시도 해주세요.'
        }
    }
    else {
        result.message = 'DB 접근 실패. 재시도 해주세요.'
    }

    return res.send(result);
});

router.post('/mail', async(req, res) => {
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

    let auth = '';
    for (let i = 0; i < 4; i++)
    auth += String(Math.floor(Math.random() * 10));

    const mailTitle = `[WITHUB] 회원가입 인증번호 메일입니다.`
    const mailContents = `인증번호는 ${randomNumber} 입니다. 정확하게 입력해주세요.`;
    sendMail(email, mailTitle, mailContents);

    const jwtToken = jwt.sign({
        email: email,
        auth: auth,
    }, process.env.AUTH_ACCESS_KEY, {
        expiresIn: "14d",
        issuer: "stageus",
    });
    result.success = true;
    result.meesage = isSend.message;
    result.token = jwtToken;

    return res.send(result);
});

router.get('/mail/auth', async(req, res) => {
    const email = req.query.email;
    const token = req.query.token;
    const result = {
        success: false,
        message: '',
    }
    if (!email || !token) {
        result.message = '에러 발생. 다시 시도해 주세요.';
        return res.send(result);
    }

    const verify = await tokenVerify(token);
    if (verify.token.email === email && verify.token.auth === auth)
        result.success = true;
    else
        result.message = '인증번호가 일치하지 않습니다.';

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

    if (!id) {
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


module.exports = router;