// routes/auth.js
const express = require('express');
const router = express.Router();
const pool = require('../db');

// POST /auth/kakao-login
// 카카오 로그인 정보로 사용자 등록 혹은 로그인 처리
router.post('/kakao-login', async (req, res) => {
    const { kakao_id, users_nickname, profile_image_url } = req.body;

    if (!kakao_id || !users_nickname) {
        return res.status(400).json({ message: '필수 정보 누락' });
    }

    try {
        const conn = await pool.getConnection();

        // 이미 등록된 사용자 확인
        let sql = 'SELECT user_id FROM users WHERE kakao_id = ?';
        const [rows] = await conn.query(sql, [kakao_id]);
        let user_id;

        if (rows.length > 0) {
            // 기존 사용자: last_login 업데이트
            user_id = rows[0].user_id;
            sql = 'UPDATE users SET last_login = NOW() WHERE user_id = ?';
            await conn.query(sql, [user_id]);
        } else {
            // 신규 사용자: users 테이블에 삽입
            sql = `INSERT INTO users
                   (kakao_id, registered_at, last_login, users_nickname, profile_image_url)
                   VALUES (?, NOW(), NOW(), ?, ?)`;
            const [result] = await conn.query(sql, [kakao_id, users_nickname, profile_image_url]);
            user_id = result.insertId;
        }

        conn.release();
        res.json({ user_id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: '서버 에러' });
    }
});

// GET /auth/user?user_id=xxx
// 사용자 정보 조회
router.get('/user', async (req, res) => {
    const { user_id } = req.query;

    if (!user_id) {
        return res.status(400).json({ message: '필수 정보 누락' });
    }

    try {
        const conn = await pool.getConnection();
        const sql = `SELECT user_id, kakao_id, registered_at, last_login,
                            users_nickname, profile_image_url,
                            agree_terms, agree_privacy, agree_marketing
                     FROM users WHERE user_id = ?`;
        const [rows] = await conn.query(sql, [user_id]);
        conn.release();

        if (rows.length === 0) {
            return res.status(404).json({ message: '사용자 없음' });
        }

        res.json({ user: rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: '서버 에러' });
    }
});

module.exports = router;