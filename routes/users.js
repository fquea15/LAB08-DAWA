const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { body, validationResult } = require('express-validator'); // Añade esta línea

const router = express.Router();

const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String
});

const User = mongoose.model('User', userSchema);

router.get('/', async (req, res) => {
    try {
        const users = await User.find();
        res.render('index', { users, errors: [] }); // Agrega un array vacío de errores
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al cargar la lista de usuarios');
    }
});


router.get('/edit/:id', async (req, res) => {
    const user = await User.findById(req.params.id);
    res.render('partials/edit', { user });
});

router.post('/',
    body('name').notEmpty().withMessage('El nombre es requerido'),
    body('email').isEmail().withMessage('El email debe ser válido'),
    body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                const users = await User.find(); // Asegúrate de recuperar los usuarios antes de renderizar
                return res.render('index', { users, errors: errors.array() }); // Pasa los errores a la vista
            }

            const { name, email, password } = req.body;
            const hashedPassword = await bcrypt.hash(password, 10);

            const newUser = new User({
                name,
                email,
                password: hashedPassword
            });

            await newUser.save();
            res.redirect('/users');
        } catch (error) {
            console.error(error);
            res.status(500).send('Error al crear el usuario');
        }
    }
);

router.post('/update/:id', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const hashedPassword = password ? await bcrypt.hash(password, 10) : password;
        await User.findByIdAndUpdate(req.params.id, {
            name,
            email,
            password: hashedPassword
        });

        res.redirect('/users');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al actualizar el usuario');
    }
});

router.get('/delete/:id', async (req, res) => {
    await User.findByIdAndDelete(req.params.id);
    res.redirect('/users');
});

module.exports = router;
