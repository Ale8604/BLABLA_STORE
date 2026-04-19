const router         = require('express').Router();
const ctrl           = require('../controllers/productsController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

const guard = [authMiddleware, adminMiddleware];

router.get('/',              ctrl.getAll);
router.get('/:id',           ctrl.getOne);
router.post('/',      ...guard, ctrl.create);
router.put('/:id',    ...guard, ctrl.update);
router.patch('/:id/archive', ...guard, ctrl.archive);
router.delete('/:id', ...guard, ctrl.remove);

module.exports = router;
