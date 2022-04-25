const jwt = require('jsonwebtoken');

const tokenVerify = async(token) => {
    const result = {
        'success': false,
        'token': '',
        'message': '',
    }

    try {
        result.token = await jwt.verify(token, process.env.ACCESS_KEY);
        result.success = true;
    }
    catch (err) {
        if (err.name === 'TokenExpireError')
            result.message = '로그인 토큰이 만료되었습니다. 다시 로그인 해 주세요.';
        else 
            result.message = '유효하지 않은 토큰입니다.';
    }
    finally {
        return result;
    }
}

module.exports = tokenVerify;