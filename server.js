import dotenv from "dotenv";
dotenv.config();
import connectDB from "./database/connectDB.js";
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "./models/User.js";
import Post from "./models/Post.js";
/*import roleCheck from "./middleware/roleCheck.js";*/
import auth from "./middleware/auth.js";

const app = express();

app.use(express.json());
const port = process.env.PORT || 3001;

app.post("/register", async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).send("Bitte füllen Sie alle Felder aus");
  }

  const user = await User.findOne({ email });
  if (user) {
    return res.status(400).send("Benutzer existiert bereits");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = await User.create({
    username,
    email,
    password: hashedPassword,
  });
  res.status(201).send(newUser);
});

app.post("/login", async (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password) {
    return res.status(400).send("Bitte füllen Sie alle Felder aus");
  }

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).send("Benutzer nicht gefunden");
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(400).send("Falsches Passwort");
  }

  const token = jwt.sign({ id: user._id, email }, process.env.TOKEN_KEY, {
    expiresIn: "2h",
  });

  user.token = token;

  user.role = role;
  await user.save();

  res.status(200).json({ user });
});


app.post("/post", async (req, res) => {

    const post = await Post.create(req.body);
    res.status(201).json(post);

} );

app.get("/posts", async (req, res) => {
    const posts = await Post.find();
    res.status(200).send(posts);
} );

// delete post from posts list wenn der benutzer ein admin role hat. 
app.delete('/deletepost/:id',auth,async(req,res)=>{
  
    const user  = await User.findById(req.user.id)
    if(!user){
        return res.status(400).json({message:"Benutzer existiert nicht"})
    }
  
    if(user.role !== "admin"){
        return res.status(400).json({message:"Benutzer ist kein Admin"})
    }
     // ein post löschen 
    const post = await Post.findByIdAndDelete(req.params.id)

    res.status(201).json("post removed")
    
})





app.get("/users", async (req, res) => {
  const users = await User.find();
  res.status(200).send(users);
});

const startServer = async () => {
  try {
    await connectDB(process.env.MONGO_URL);
    console.log("Verbindung mit MongoDB hat geklappt");
    app.listen(port, () => {
      console.log("Server läuft auf:", port);
    });
  } catch (error) {
    console.log(error);
  }
};

startServer();
