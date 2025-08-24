import mongoose from 'mongoose';
const Schema = mongoose.Schema;

// Sub-schema for food items
const FoodItemSchema = new Schema({
  name: { type: String, required: true },
  quantity: { type: Number, default: 1 },
  unit: { type: String, default: 'kg' },
  carbon: { type: Number, required: true }
});

// Sub-schema for shopping (non-food)
const ShoppingItemSchema = new Schema({
  name: { type: String, required: true },
  carbon: { type: Number, required: true }
});

// Sub-schema for travel
const TravelSchema = new Schema({
  vehicle: { type: String, required: true },
  distance_km: { type: Number, required: true },
  carbon: { type: Number, required: true }
});

// Sub-schema for each carbon entry (daily upload)
const CarbonEntrySchema = new Schema({
  date: { type: Date, default: Date.now },
  totalCarbon: { type: Number, required: true },
  food: [FoodItemSchema],
  shopping: [ShoppingItemSchema],
  travel: [TravelSchema]
});

// User schema
const UserSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  carbonEntries: [CarbonEntrySchema]  // multiple daily entries
});

const User = mongoose.model("User", UserSchema);
export default User;
