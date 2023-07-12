const express = require("express");
const router = express.Router();
const mongoose = require("mongoose")
const User = require('../models/user');
const bcrypt = require("bcryptjs");

router.post('/register', (req, res, next) => {

    bcrypt.hash(req.body.password, 10, (err, hash) => {
        if (err) {
            return res.status(500).json({
                error: err
            });
        } else {
            const user = new User({
                id: new mongoose.Types.ObjectId(),
                email: req.body.email,
                password: hash
            });
            user.save()
                .then(result => {
                    return res.status(201).json({
                        message: "User created"
                    })
                })
                .catch(err => {
                    console.log(err);
                    res.status(500).json({
                        error: err
                    })
                })
        }
    })
});

module.exports = router;