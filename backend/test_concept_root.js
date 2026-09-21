import mongoose from "mongoose";
import User from "./src/models/User.js";
import { getConceptRoot } from "./src/controllers/conceptRootController.js";

async function run() {
  await mongoose.connect("mongodb+srv://amanyt27082005_db_user:mlBv42m94lekLwwv@namastenode.ompokw3.mongodb.net/aifinity");
  
  const user = await User.findOne({ name: "Faiz Anwer" });
  console.log("Testing for user:", user.email);

  const req = { user };
  const res = {
    json: (data) => console.log("RES.JSON:", JSON.stringify(data, null, 2)),
    status: (code) => {
      console.log("RES.STATUS:", code);
      return { json: (data) => console.log("RES.JSON:", JSON.stringify(data, null, 2)) };
    }
  };

  await getConceptRoot(req, res);
  process.exit();
}

run();
