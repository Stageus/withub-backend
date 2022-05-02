const nodeMailer = require('nodemailer');

const mailPoster = nodeMailer.createTransport({
    service: 'Naver',
    host: 'smtp.naver.com',
    port: 587,
    auth: {
        user: process.env.NAVER_EMAIL,
        pass: process.env.NAVER_PWD,
    }
});

const sendMail = (email, title, contents) => {
    const mailOption = {
        from: process.env.NAVER_EMAIL,
        to: email,
        subject: title,
        text: contents
    };

    mailPoster.sendMail(mailOption, (err, info) => {
        if (err)
            console.log(err);
        else
            console.log(info);
    });
}

module.exports = sendMail;