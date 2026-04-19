const router          = require('express').Router();
const { register, login, me, findAccount, resetPassword } = require('../controllers/authController');
const authMiddleware  = require('../middleware/authMiddleware');

router.post('/register',       register);
router.post('/login',          login);
router.get('/me',              authMiddleware, me);
router.post('/find-account',   findAccount);
router.post('/reset-password', resetPassword);

module.exports = router;
