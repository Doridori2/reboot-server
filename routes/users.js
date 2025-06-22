//회원가입, 로그인 API 작성
// routes/users.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../db');

// 회원가입 API (카카오 로그인 기반)
router.post('/signup', async (req, res) => {
  const { kakao_id} = req.body;

  try {
    // 카카오 ID로 이미 가입된 사용자가 있는지 확인
    const [rows] = await db.query('SELECT * FROM users WHERE kakao_id = ?', [kakao_id]);

    // 이미 가입된 사용자라면 400 에러와 메시지 반환
    if (rows.length > 0) {
      return res.status(400).json({ message: '이미 가입된 사용자입니다' });
    }

    // 새로운 사용자 정보 삽입
    // 쿼리 실행 (프로미스를 사용하여 async/await 사용)
con.promise().query('SELECT * FROM users WHERE kakao_id = ?', [kakao_id])
.then(([rows]) => {
  // 쿼리 결과 처리
})
.catch(err => {
  // 에러 처리
});

    // 회원가입 성공 메시지
    res.status(201).json({ message: '회원가입 성공' });
  } catch (err) {
    // 에러가 발생하면 서버 오류 메시지 반환
    console.error(err);
    res.status(500).json({ message: '회원가입 실패' });
  }
});

// 로그인 API (카카오 ID 기반)
router.post('/login', async (req, res) => {
  const { kakao_id } = req.body;

  try {
    // 카카오 ID로 사용자 정보 조회
    const [rows] = await db.query('SELECT * FROM users WHERE kakao_id = ?', [kakao_id]);

    const user = rows[0];

    // 사용자가 존재하지 않으면 400 에러와 메시지 반환
    if (!user) {
      return res.status(400).json({ message: '사용자가 존재하지 않습니다' });
    }

    // 로그인 성공 후 JWT 토큰 발급
    const token = jwt.sign({ userId: user.user_id }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    // 토큰 반환
    res.json({ token });
  } catch (err) {
    // 에러가 발생하면 서버 오류 메시지 반환
    console.error(err);
    res.status(500).json({ message: '로그인 실패' });
  }
});

// POST /users/set-nickname
router.post('/set-nickname', async (req, res) => {
  const { user_id, users_nickname } = req.body;

  if (!user_id || !users_nickname) {
      return res.status(400).json({ message: '필수 정보 누락' });
  }

  try {
      const conn = await rbpool.getConnection();
      const sql = 'UPDATE users SET users_nickname = ? WHERE user_id = ?';
      await conn.query(sql, [users_nickname, user_id]);
      conn.release();
      res.json({ message: '닉네임 설정 완료' });
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: '서버 에러' });
  }
});


module.exports = router;
