const router          = require('express').Router();
const ctrl            = require('../controllers/ordersController');
const authMiddleware  = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

router.post('/',          ctrl.create);
router.get('/',           authMiddleware, adminMiddleware, ctrl.getAll);
router.patch('/:id/status', authMiddleware, adminMiddleware, ctrl.updateStatus);

module.exports = router;
