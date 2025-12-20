const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { overview, userPerformance, trends } = require('../controllers/analyticsController');

router.get('/overview', auth, overview);
router.get('/user/:userId', auth, userPerformance);
router.get('/trends', auth, trends);

module.exports = router;