import mongoose from 'mongoose'
const Schema = mongoose.Schema;

const ItemSchema = new Schema({
  name: String,
  raw_line: String,
  quantity: Number,
  unit: String,
  co2_kg: Number
});
const ReceiptSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  filename: String,
  items: [ItemSchema],
  total_co2_kg: Number,
  createdAt: { type: Date, default: Date.now }
});
const Receipt=mongoose.model("Receipt",ReceiptSchema);
export default Receipt;