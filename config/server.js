require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const mongoose = require('mongoose');
const database = require("./database");
var passport = require('passport');
const session = require('express-session');
var GoogleStrategy = require('passport-google-oauth20').Strategy;

const app = express();
const { Schema } = mongoose;
const userSchema = new Schema({
    userId: String,
    notes: [
        {   
            id:{type: String, unique:true},
            title: {type: String, unique:true},
            date: String,
            description: {type: String, unique: true}
        }
    ]
})
const User = mongoose.model('User', userSchema);

console.log(process.env.MONGO_URL);
mongoose.connect("mongodb+srv://jhpabel183:FakyFjNVcwXQykbh@cluster0.iuz0cpg.mongodb.net/notedb?retryWrites=true&w=majority")
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
    clientID: "393849242310-979js4cap1k3s0dlibrjv3ueo5p6u9af.apps.googleusercontent.com",
    clientSecret: "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",
    callbackURL: "http://localhost:4000/auth/google/callback"
},
    function (accessToken, refreshToken, profile, done) {
        User.findOne({ userId: profile.id })
            .then((response) => {
                if (response) {
                    return done(null, response);
                }
                else {
                    const newUser = new User({
                        userId: profile.id,
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
        const token = req.user.userId;
        //const token=req.user.token;
        // console.log(token);
        res.redirect(`http://localhost:3000?token=${token}`)
    });

app.post("/fetchdata", (req, res) => {
    //for checking I am using insetData;
    const {selector}=req.body;
    User.findOne({ userId: selector })
    .then((response)=>{
        res.json(response.notes);
    })
    .catch((err)=>{
        console.log(err);
    })
})
app.post("/addData",(req,res)=>{
    const {data,selector}=req.body;
    console.log("data arrived to this addData route");
    User.findOneAndUpdate({ userId: selector },
    { $push: { notes: data } },
    { new: true })
    .then((response)=>{
        // console.log(response);
    })
    .catch((err)=>{
        console.log(err);
    })
});
// app.post("/update",(req,res)=>{
//     const selector=req.body.slector;
//     User.findOne({ userId: selector })
//     .then((response)=>{
//         console.log(response);
//     })
//     .catch((err)=>{
//         console.log(err);
//     })
// });
app.listen(4000, () => console.log("server is connected on port 4000"));