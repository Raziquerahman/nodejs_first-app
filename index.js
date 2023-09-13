import express from "express";
import path from "path";
import mongoose from "mongoose";
import cookieParser  from "cookie-parser";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";


// data base connection
mongoose
  .connect("mongodb://127.0.0.1:27017", {
  dbName: "backend",
  })
.then(() => console.log("Database Connected"))
.catch((e) => console.log(e));

//creating Schema
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password:String,
})   ;
 
// model
const User = mongoose.model("User", userSchema);

// creating server below
const app = express();

// middleware
// directly use  nhi kr skte, so uske liye "app.use()" likhte hai.
app.use(express.static(path.join(path.resolve(),"public")));
app.use(express.urlencoded({extended: true}));// using to get the data from form
 app.use(cookieParser());

  // setting up view Engine
  app.set("view engine", "ejs");

  const isAuthenticated = async(req, res, next) => {
     const {token} = req.cookies;
     if (token) {

     const decoded = jwt.verify(token,"utrsfghfhg")
     req.user = await User.findById(decoded._id) // user ka data permanently save krane ke liye req.user kiya gya hai. jisse sara data user me save ho jayega


      next();
     }else{
      res.redirect("/login");
     }
  };

app.get("/", isAuthenticated, (req, res) => {
res.render("logout",{ name: req.user.name});
});  

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/register",(req, res) => {
res.render("register");
}); 

app.post("/login", async(req, res) => {
const {email, password } = req.body;

let user = await User.findOne({email});

if (!user) return res.redirect("/register");

const isMatch = await bcrypt.compare(password, user.password);

if (!isMatch) return res.render("login", { email, message: "Incorrect Password !!!"});

const token = jwt.sign({_id:user._id}, "utrsfghfhg");

res.cookie("token", token, {
 httpOnly:true,
  expires: new Date(Date.now()+60*1000) 
});
res.redirect("/");
});

// to create new user we use async await in the function
app.post("/register", async(req, res) => {
  const {name, email,password } = req.body;

let user = await User.findOne({email})
if (user) {
  return res.redirect("/login");
}

// hashing the password for security purpose
const hashedPassword = await bcrypt.hash(password,10);
 user =  await User.create({ 
     name,
     email,
     password: hashedPassword,
  });
  const token = jwt.sign({_id:user._id}, "utrsfghfhg");

  res.cookie("token", token, {
   httpOnly:true,
    expires: new Date(Date.now()+60*1000) 
});
  res.redirect("/");
});
   
app.get("/logout", (req, res) => {
  res.cookie("token", null, {
   httpOnly:true, 
   expires: new Date(Date.now()), 
});
  res.redirect("/");    
});

app.listen(5000, () => {
    console.log("Server is working !");
 });
