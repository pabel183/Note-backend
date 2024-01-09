let dotenv=require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const mongoose = require('mongoose');
const database = require("./database");
var passport = require('passport');
const session = require('express-session');
var GoogleStrategy = require('passport-google-oauth20').Strategy;
const crypto = require('crypto');
const bcrypt = require('bcrypt');

const app = express();
const { Schema } = mongoose;
// const userSchema = new Schema({
//     userId: String,
//     notes: [
//         {
//             id: { type: String, unique: true },
//             title: { type: String, unique: true },
//             date: String,
//             description: { type: String, unique: true }
//         }
//     ]
// })
const userSchema = new Schema({
    userId: { type: String, unique: true },
    hashedPassword: String,
    notes: [
        {
            id: { type: String, unique: true },
            title: { type: String, unique: true },
            date: String,
            description: { type: String, unique: true }
        }
    ]
});
userSchema.pre('save', async function () {
    if (this.isModified('userId')) {
        this.hashedPassword = await bcrypt.hash(this.userId, 10);
    }
});
const User = mongoose.model('User', userSchema);

mongoose.connect(process.env.URL)
    .then(() => console.log("mongodb is connected"))
    .catch((error) => console.error(error));

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

let profile;
app.use(session({
    secret: 'mysecret',
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new GoogleStrategy({
    clientID: process.env.clientID,
    clientSecret: process.env.clientSecret,
    callbackURL: process.env.callbackURL,
},
    function (accessToken, refreshToken, profile, done) {
        const _ticket = crypto.createHash('sha256').update(profile.displayName + profile.id).digest('hex');
        User.findOne({ userId: _ticket })
            .then((response) => {
                if (response) {
                    return done(null, response);
                }
                else {
                    const newUser = new User({
                        userId: _ticket,
                        notes: []
                    })
                    const data = newUser.save()
                        .then((response) => {
                            return done(null, response);
                        })
                        .catch((err) => {
                            return done(err);
                        })
                }
            })
            .catch((err) => {
                return done(err);
            });
    })
);
passport.serializeUser((user, done) => {
    done(null, user);
});
passport.deserializeUser((user, done) => {
    done(null, user);
});

app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile'] }));

app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/login' }),
    function (req, res) {
        const _ticket = req.user.userId;
        res.redirect(`http://localhost:3000?_ticket=${_ticket}`)
    });

app.post("/fetchdata", (req, res) => {
    const { selector } = req.body;
    User.findOne({ userId: selector })
        .then((response) => {
            res.json(response.notes);
        })
        .catch((err) => {
            console.log(err);
        })
})
app.post("/addData", (req, res) => {
    const { data, selector } = req.body;
    User.findOneAndUpdate({ userId: selector },
        { $push: { notes: data } },
        { new: true })
        .then((response) => {
            res.status(200).send("Ok");
        })
        .catch((err) => {
            console.log(err);
        })
});
app.delete("/delete", (req, res) => {
    const { data, selector } = req.body;
    User.updateOne(
        { userId: selector },
        { $pull: { notes: { id: { $in: data.map(item => item.id) } } } }
    )
        .then((response) => {
            res.status(200).send("Ok");
        })
        .catch((err) => {
            console.log(err);
        });
});
app.put("/update", (req, res) => {
    const { data, selector } = req.body;
    User.updateOne(
        { userId: selector, 'notes.id': data.id },
        { $set: { 'notes.$.id': data.id, 'notes.$.title': data.title, 'notes.$.date': data.date, 'notes.$.description': data.description } }
    )
        .then((response) => {
            res.status(200).send("Ok");
        })
        .catch((err) => {
            console.log(err);
        });
});
app.listen(4000, () => console.log("server is connected on port 4000"));