const express = require('express');
const router = express.Router();
const rbpool = require('../db');

// GET /reports/weekly?user_id=xxx
router.get('/weekly', async (req, res) => {
    const { user_id } = req.query;

    if (!user_id) {
        return res.status(400).json({ message: '필수 정보 누락' });
    }

    try {
        const conn = await rbpool.getConnection();

        // 최근 7일간 요일별 성공률 계산 (mission_results 기반)
        const sql = `
            SELECT 
                DAYOFWEEK(completed_at) AS day_num,
                DATE(completed_at) AS date_only,
                COUNT(*) AS total_missions,
                SUM(CASE WHEN is_success = 1 THEN 1 ELSE 0 END) AS completed_missions
            FROM mission_results
            WHERE user_id = ?
              AND completed_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
            GROUP BY DATE(completed_at), DAYOFWEEK(completed_at)
            ORDER BY date_only ASC
        `;
        const [rows] = await conn.query(sql, [user_id]);
        conn.release();

        // 요일 매핑 (MySQL 기준: 1=일요일 ~ 7=토요일)
        const dayMap = ['일', '월', '화', '수', '목', '금', '토'];
        const successByDay = {
            '월': 0, '화': 0, '수': 0, '목': 0, '금': 0, '토': 0, '일': 0
        };
        const dayCount = {};

        let totalRateSum = 0;
        let countedDays = 0;

        for (const row of rows) {
            const day = dayMap[row.day_num % 7]; // 1~7 → '일'~'토'
            const rate = Math.round((row.completed_missions / row.total_missions) * 100);
            successByDay[day] = rate;
            totalRateSum += rate;
            countedDays += 1;
        }

        const weeklyAverage = countedDays > 0 ? (totalRateSum / countedDays).toFixed(1) : '0.0';
        const bestDay = Object.entries(successByDay).sort((a, b) => b[1] - a[1])[0]?.[0] || '-';

        res.json({
            successByDay,         // { 월: 80, 화: 90, ... }
            weeklyAverage,        // '85.0'
            bestDay               // '목'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: '서버 에러' });
    }
});

// POST /reports/save-weekly
router.post('/save-weekly', async (req, res) => {
    const {
        user_id, week_start_date,
        monday_success_rate, tuesday_success_rate, wednesday_success_rate,
        thursday_success_rate, friday_success_rate, saturday_success_rate, sunday_success_rate,
        weekly_average_success_rate, best_day, next_week_goal
    } = req.body;

    if (!user_id || !week_start_date) {
        return res.status(400).json({ message: '필수 정보 누락' });
    }

    try {
        const conn = await rbpool.getConnection();
        const sql = `
            INSERT INTO routine_reports (
                user_id, week_start_date,
                monday_success_rate, tuesday_success_rate, wednesday_success_rate,
                thursday_success_rate, friday_success_rate, saturday_success_rate, sunday_success_rate,
                weekly_average_success_rate, best_day, next_week_goal, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `;
        await conn.query(sql, [
            user_id, week_start_date,
            monday_success_rate, tuesday_success_rate, wednesday_success_rate,
            thursday_success_rate, friday_success_rate, saturday_success_rate, sunday_success_rate,
            weekly_average_success_rate, best_day, next_week_goal
        ]);
        conn.release();
        res.json({ message: '주간 리포트 저장 완료' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: '서버 에러' });
    }
});

// GET /reports/history?user_id=xxx&limit=4
router.get('/history', async (req, res) => {
    const { user_id, limit = 4 } = req.query;

    if (!user_id) {
        return res.status(400).json({ message: '필수 정보 누락' });
    }

    try {
        const conn = await rbpool.getConnection();
        const sql = `
            SELECT
                week_start_date,
                monday_success_rate, tuesday_success_rate, wednesday_success_rate,
                thursday_success_rate, friday_success_rate, saturday_success_rate, sunday_success_rate,
                weekly_average_success_rate, best_day, next_week_goal
            FROM routine_reports
            WHERE user_id = ?
            ORDER BY week_start_date DESC
            LIMIT ?
        `;
        const [rows] = await conn.query(sql, [user_id, parseInt(limit)]);
        conn.release();

        res.json({ history: rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: '서버 에러' });
    }
});

module.exports = router;