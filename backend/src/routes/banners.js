const router = require('express').Router();
const ctrl   = require('../controllers/bannersController');
const auth   = require('../middleware/authMiddleware');
const admin  = require('../middleware/adminMiddleware');

const guard = [auth, admin];

router.get('/',       ctrl.getAll);
router.post('/',      ...guard, ctrl.create);
router.put('/:id',   ...guard, ctrl.update);
router.delete('/:id',...guard, ctrl.remove);

module.exports = router;
