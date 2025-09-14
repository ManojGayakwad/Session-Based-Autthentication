import express from "express";
import db from "../db/index.js";
import { usersTable, userSession } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { randomBytes, createHmac } from "node:crypto";

const router = express.Router();

router.patch('/', async(req, res) => {
    const user = req.user;
    if(!user){
        return res.status(401).json({message: "Unauthorized user"});
    }

    const {name } = req.body;
    await db.update(usersTable).set({name}).where(eq(usersTable.id, user.id));

    res.json({message: "Successfully Updated", user: {name}});
});

// Return current logged-in user (placeholder)
router.get("/", async (req, res) => {
    const user = req.user;
    // const sessionId = req.headers['x-session-id'];
    // if(!sessionId){
    //     return res.status(401).json({message: "Unauthorized"});
    // }
    // const [session] = await db.select(
    //     {id: userSession.id, userId: userSession.userId, 
    //         name: usersTable.name, email: usersTable.email
    //     }
    // ).from(userSession)
    // .rightJoin(usersTable, eq(userSession.userId, usersTable.id))
    // .where(eq(userSession.id, sessionId)).limit(1);
    if(!user){
        return res.status(401).json({message: "Unauthorized user"});
    }
    res.json({message: "Current logged in user", user});
});

// Register a new user
router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  const existingUser = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email))   // ✅ Correct drizzle eq usage
    .limit(1);

  if (existingUser.length > 0) {
    return res.status(400).json({ message: "User already exists" });
  }

  const salt = randomBytes(256).toString("hex");
  const hash = createHmac("sha256", salt).update(password).digest("hex");

  const [newUser] = await db
    .insert(usersTable)
    .values({ name, email, password: hash, salt })
    .returning({ id: usersTable.id });

  res.status(201).json({ status: "success", data: { userId: newUser.id } });
});

// Login a user (placeholder)
router.post("/login",async (req, res) => {
    const {email, password} = req.body;

    const [existingUser] = await db
    .select({
        id:usersTable.id,
        email: usersTable.email,
        salt: usersTable.salt,
        password: usersTable.password
    })
    .from(usersTable)
    .where(eq(usersTable.email, email))
    .limit(1);
 
    if(!existingUser){
        return res.status(400).json({message: "Invalid credentials"});
    }

    const {salt, password: hashedPassword} = existingUser;

    const hash = createHmac("sha256", salt).update(password).digest("hex");

    if(hash !== hashedPassword){
        return res.status(400).json({message: "Invalid credentials"});
    }

     const [session] = await db.insert(userSession).values({
        userId: existingUser.id
     }).returning({id: userSession.id});
    res.json({message: "Login successful", sessionId: session.id});

});

// Logout a user (placeholder)
router.post("/logout", (req, res) => {
  res.json({ message: "Logout route" });
});

export default router;
