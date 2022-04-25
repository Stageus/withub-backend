const router = require('express').Router();

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
        result.message = '이름은 2~10자의 한글, 영어, 숫자로만 이루어져야 합니다.';
        return res.send(result);
    }
});

module.exports = router;