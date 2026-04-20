const router          = require('express').Router();
const ctrl            = require('../controllers/comisionesController');
const authMiddleware  = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

const guard = [authMiddleware, adminMiddleware];

router.get('/',       ...guard, ctrl.getAll);
router.post('/',      ...guard, ctrl.upsert);
router.delete('/:id', ...guard, ctrl.remove);

module.exports = router;
