const router          = require('express').Router();
const ctrl            = require('../controllers/vendedoresController');
const authMiddleware  = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

const guard = [authMiddleware, adminMiddleware];

router.get('/',       ...guard, ctrl.getAll);
router.post('/',      ...guard, ctrl.create);
router.patch('/:id',  ...guard, ctrl.update);
router.delete('/:id', ...guard, ctrl.remove);

module.exports = router;
