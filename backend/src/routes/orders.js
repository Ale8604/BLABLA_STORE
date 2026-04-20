const router          = require('express').Router();
const ctrl            = require('../controllers/ordersController');
const authMiddleware  = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

const guard = [authMiddleware, adminMiddleware];

router.post('/',              ctrl.create);
router.get('/',               ...guard, ctrl.getAll);
router.get('/:id',            ...guard, ctrl.getOne);
router.patch('/:id/status',   ...guard, ctrl.updateStatus);

module.exports = router;
