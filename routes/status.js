const express = require('express');
const router = express.Router();
const rbpool = require('../db');

// POST /status/update
router.post('/update', async (req, res) => {
    const { user_id, status_message } = req.body;

    if (!user_id || !status_message) {
        return res.status(400).json({ message: '필수 정보 누락' });
    }

    try {
        const conn = await rbpool.getConnection();
        const sql = 'UPDATE users SET status_message = ? WHERE user_id = ?';
        await conn.query(sql, [status_message, user_id]);
        conn.release();
        res.json({ message: '상태 메시지 업데이트 완료' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: '서버 에러' });
    }
});

module.exports = router;