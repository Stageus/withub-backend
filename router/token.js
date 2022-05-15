const router = require('express').Router();
const tokenVerify = require('../module/tokenVerify.js');

router.get('', async(req, res) => {
    const token = req.query.token;
    const result = {
        success: false,
        message: '',
    }

    if (!token) {
        result.message = '서버 접속 오류. 다시 시도해 주세요.';
        return res.send(result);
    }

    const verify = await tokenVerify(token);
    if (!verify.success) {
        result.message = verify.message;
        return res.send(result);
    }
    result.success = true;

    return res.send(result);
})

module.exports = router;