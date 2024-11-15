const express = require('express');
const app = express();
require('dotenv').config();
const mongoose = require('mongoose');
const cors = require('cors');

app.use(express.json());


mongoose
  .connect("mongodb+srv://achyut1234duggal:JLMoPvJezqrwhpr1@cluster0.ades5.mongodb.net/", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.log(err));

const authRoutes = require('./routes/auth');
const carRoutes = require('./routes/cars');

app.use('/api/auth', authRoutes);
app.use('/api/cars', carRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
