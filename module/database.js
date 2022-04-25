const { Client } = require('pg');
const config = {
    user: process.env.PG_USER,
    host: process.env.HOST,
    database: process.env.DATABASE,
    password: process.env.PASSWORD,
    port: process.env.PORT,
};

const database = async(query, value) => {
    const client = new Client(config);
    const result = {
        'success': false,
        'list': [],
        'code': '',
        'detail': '',
    }

    try {
        await client.connect(); 
        const queryResult = await client.query(query, value);
        result.success = true;
        result.list = queryResult.rows;
    }
    catch (err) {
        console.log(err);
        result.code = err.code;
        result.detail = err.detail;
    }
    finally {
        await client.end();
        return result;
    }
}

module.exports = database;