import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';
import { getDashboard } from './src/controllers/dashboardController.js';

dotenv.config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const user = await User.findOne({ email: 'faizanwer0000@gmail.com' });
  
  const req = { user };
  const res = {
    status: (code) => {
      console.log('Status:', code);
      return res;
    },
    json: (data) => {
      console.log('JSON:', JSON.stringify(data, null, 2));
    }
  };

  try {
    await getDashboard(req, res);
  } catch (err) {
    console.error(err.stack);
  }
  
  process.exit(0);
});
