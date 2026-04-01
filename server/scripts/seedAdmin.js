import mongoose from "mongoose";
import { connectDb } from "../src/config/db.js";
import { env } from "../src/config/env.js";
import { User } from "../src/models/User.js";

const run = async () => {
  await connectDb();

  const existing = await User.findOne({ email: env.seedAdmin.email.toLowerCase() });
  if (existing) {
    existing.role = "admin";
    existing.password = env.seedAdmin.password;
    await existing.save();
    console.log(`Updated admin ${existing.email}`);
  } else {
    await User.create({
      email: env.seedAdmin.email.toLowerCase(),
      password: env.seedAdmin.password,
      randomUsername: "AdminControl0001",
      role: "admin",
    });
    console.log(`Created admin ${env.seedAdmin.email}`);
  }

  await mongoose.disconnect();
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
