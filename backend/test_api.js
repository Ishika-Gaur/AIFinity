import mongoose from "mongoose";
import User from "./src/models/User.js";
import app from "./src/app.js"; // Assuming app.js exports the express app
import http from "http";

async function run() {
  await mongoose.connect("mongodb+srv://amanyt27082005_db_user:mlBv42m94lekLwwv@namastenode.ompokw3.mongodb.net/aifinity");
  const user = await User.findOne({ name: "Faiz Anwer" });
  
  // Create a token
  const jwt = (await import("jsonwebtoken")).default;
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || "fallback_dev_secret_key_change_in_prod");
  
  const server = http.createServer(app);
  server.listen(0, async () => {
    const port = server.address().port;
    const res = await fetch(`http://localhost:${port}/api/concept-root`, {
      headers: { cookie: `token=${token}` }
    });
    const text = await res.text();
    console.log("STATUS:", res.status);
    console.log("BODY:", text);
    process.exit();
  });
}
run();
