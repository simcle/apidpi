require('dotenv').config();
const {validationResult} = require('express-validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');

const User = require('../models/users');

// register
exports.UserRegister = async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        return res.status(400).json(errors.array());
    };

    const name = req.body.name;
    const email = req.body.email;
    const password = req.body.password;
    
    const hashPassword = await bcrypt.hash(password, 10);
    const register = new User({
        name: name,
        email: email,
        password: hashPassword
    })
    register.save()
    .then(() => {
        res.status(201).send('Success');
    })
    .catch(err => {
        res.status(400).send(err);
    });
};

// user login
exports.UserLogin = (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        return res.status(400).json(errors.array());
    };
    
    const email = req.body.email;
    const password = req.body.password;

    User.findOne({email: email})
    .then(result => {
        if(!result) {
            return res.status(400).send('Email not found');
        }
        (async () => {
            try {
                if( await bcrypt.compare(password, result.password)) {
                    const user = {email: result.email}
                    const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '1d'})
                    const refreshToken = jwt.sign(user, process.env.REFRESH_TOKEN_SECRET)
                    const data = {
                        id: result._id,
                        name: result.name,
                        email: result.email,
                        avatar: result.avatar,
                        accessToken: accessToken,
                        refreshToken: refreshToken
                    }
                    result.refreshToken = refreshToken
                    result.save();

                    res.status(200).json(data);
                } else {
                    res.status(400).send('Wrong password');
                }
            } catch (error) {
                res.status(400).send()
            }
        })();
    });
};

// user update
exports.UserUpdate = (req, res) => {
    const errors = validationResult(req)

    if(!errors.isEmpty()) {
        return res.status(400).json(errors.array());
    }

    const userId = req.params.userId;
    User.findById(userId)
    .then(user => {
        if (!user) {
            return res.status(400).send('User not found');
        }
        if(req.file) {
            if(user.avatar) {
                removeImage(user.avatar);
            }
            user.name = req.body.name;
            user.email = req.body.email;
            user.avatar = req.file.path;
        } else {
            user.name = req.body.name;
            user.email = req.body.email;
        }
        return user.save();
    })
    .then(result => {
        const data = {
            id: result._id,
            name: result.name,
            email: result.email,
            avatar: result.avatar,
        }
      res.status(200).json({message: 'Update successfully', data: data})  
    })
    .catch(err => {
        res.status(400).send(err);
    })
};

// refresh token
exports.RefreshToken = (req, res) => {
    const refreshToken = req.body.token;
    if(refreshToken == null ) return res.sendStatus(401);
    User.findOne({refreshToken: refreshToken})
    .then(result => {
        if (!result) return res.sendStatus(403);
        jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
            if(err) return res.sendStatus(403);
            const accessToken = jwt.sign({email: user.email}, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '1d'});
            res.json({accessToken: accessToken});
        })
    })
    .catch(err => {
        return res.status(400).send(err);
    })
}

// user logout
exports.UserLogout = (req, res) => {
    User.findOne({refreshToken: req.body.token})
    .then(result => {
        result.refreshToken = '';
        result.save()
        res.sendStatus(204);
    })
}

// remove image from storage
const removeImage = (filePath) => {
    filePath = path.join(__dirname, '../..', filePath);
    fs.unlink(filePath, err => {
       if(err) return;
    })
}