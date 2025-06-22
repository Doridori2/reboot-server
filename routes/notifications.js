const express = require('express');
const router = express.Router();
const rbpool = require('../db');

// GET /notifications/preview?user_id=xxx
router.get('/preview', async (req, res) => {
    const { user_id } = req.query;

    if (!user_id) {
        return res.status(400).json({ message: '필수 정보 누락' });
    }

    try {
        const conn = await rbpool.getConnection();
        const sql = 'SELECT * FROM notifications WHERE user_id = ? AND DATE(notification_time) = CURDATE()';
        const [notifications] = await conn.query(sql, [user_id]);
        conn.release();
        res.json({ notifications });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: '서버 에러' });
    }
});

module.exports = router;