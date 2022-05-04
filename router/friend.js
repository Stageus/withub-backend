const router = require('express').Router();
const tokenVerify = require('../module/tokenVerify.js');
const database = requre('../module/database.js');

router.get('/info', async(req, res) => {

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

    
});

router.post('', async(req, res) => {

});

router.delete('', async(req, res) => {

});

module.exports = router;