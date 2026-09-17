import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';
import { getPersonalizedAssessments } from './src/controllers/assessmentController.js';

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
    await getPersonalizedAssessments(req, res);
  } catch (err) {
    console.error(err.stack);
  }
  
  process.exit(0);
});
