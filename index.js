import express from "express";
import db from "./db/index.js";
import { usersTable, userSession } from "./db/schema.js";
import { eq } from "drizzle-orm";
import userRouter from "./routes/user.routes.js";

const app = express();
app.use(express.json());

const PORT = process.env.PORT ?? 8000;

app.use(async function (req, res, next) {
  const sessionId = req.headers["x-session-id"];
  if (!sessionId) {
    return next();
  }

  const [session] = await db
    .select({
      sessionId: userSession.id,
      id: usersTable.id,
      userId: userSession.userId,
      name: usersTable.name,
      email: usersTable.email,
    })
    .from(userSession)
    .rightJoin(usersTable, eq(userSession.userId, usersTable.id))
    .where((table) => eq(table.sessionId, sessionId))
    .limit(1);
  if (!session) {
    return next();
  }

  req.user = session;
  next();
});

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.use("/user", userRouter);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
