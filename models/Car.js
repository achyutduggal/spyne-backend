const mongoose = require('mongoose');

const CarSchema = new mongoose.Schema({
  title:       { type: String, required: true },
  description: { type: String, required: true },
  tags:        [String],
  images:      [String],
  owner:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt:   { type: Date, default: Date.now },
});

module.exports = mongoose.model('Car', CarSchema);
