import { Router } from 'express'
import { login, register, logout, profile, verifyToken, fetchDevices, getAllUsers, deleteUser,updateUser } from '../controllers/auth.controller.js';
import { authRequired } from '../middlewares/validateToken.js';
import { validateSchema } from "../middlewares/validator.middleware.js";
import { loginSchema, registerSchema } from "../schemas/auth.schema.js";
const router = Router();

router.post('/register', validateSchema(registerSchema), register)
router.post('/login', validateSchema(loginSchema), login)
router.post('/logout', logout)
router.get('/profile', authRequired, profile)
router.get('/verify', verifyToken)
router.get('/devices', fetchDevices)

router.get('/users', getAllUsers)

router.post('/deleteuser',deleteUser);





router.post('/updateUser', validateSchema(registerSchema),updateUser);


export default router;