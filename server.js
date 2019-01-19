const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const sessions = require("client-sessions");
const User = require("./models/user");
const bcrypt = require("bcrypt");

mongoose.connect("mongodb://localhost/ss-auth");
app.set("view engine", "ejs");

app.use(express.static(__dirname + "/public"));
app.use(bodyParser.urlencoded({extended: false}));

app.use(sessions({
  cookieName: "session",
  secret: "e21321dsaBTEdaAS",
  duration: 30 * 60 * 1000
}));

app.get("/", (req, res) => {
  res.render("index");
});

app.post("/register", (req, res) => {
  console.log(req.body.password);
  req.body.password = bcrypt.hashSync(req.body.password, 14);
  console.log(req.body.password);
  let user = new User(req.body);
  console.log(user);
  let error = user.validateSync();
  console.log(error);
  User.create(user, (err, savedUser) => {
    if(err){
      error = "Something bad happened.";
      console.log(err);
      if(err.code == 11000) {
        console.log("here");
      error = "This username is already taken.";
      }
      return res.render("register", { error: error });      
    }
    console.log(user);
    res.redirect("/dashboard");
  });
});

app.get("/register", (req, res) => {
  res.render("register", { error : ""});
});

app.get("/login", (req, res) => {
  res.render("login", {error : ""});
});


app.post("/login", (req, res) => {
  User.findOne({ email: req.body.email }, (err, user) => {
    if(!user || !bcrypt.compareSync(req.body.password, user.password)){
      return res.render("login", { error : "incorrect email and password."});
    }
    req.session.userId = user._id;
    res.redirect("/dashboard");
  });
});

app.get("/dashboard", (req, res) => {
  if(!(req.session && req.session.userId)){
    return res.redirect("/login");
  }
  User.findById(req.session.userId, (err, user) => {
    if(err) {
      return next(err);
    }
    if(!user){
      res.redirect("/login");
    }
    res.render("dashboard", {user: user});
  })
});

app.get("/logout", (req, res) => {
  req.session.reset();
  res.redirect("/login");
});

app.listen(3000, () => {
  console.log("started");
});