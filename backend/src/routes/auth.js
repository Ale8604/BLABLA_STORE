const router          = require('express').Router();
const { register, login, me, findAccount, resetPassword, updateMe, updatePassword } = require('../controllers/authController');
const authMiddleware  = require('../middleware/authMiddleware');

router.post('/register',       register);
router.post('/login',          login);
router.get('/me',              authMiddleware, me);
router.patch('/me',            authMiddleware, updateMe);
router.patch('/me/password',   authMiddleware, updatePassword);
router.post('/find-account',   findAccount);
router.post('/reset-password', resetPassword);

module.exports = router;
