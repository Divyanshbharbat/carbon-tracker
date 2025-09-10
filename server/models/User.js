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

// Sub-schema for each carbon entry (bill upload)
const CarbonEntrySchema = new Schema({
  uploadDate: { type: Date, default: Date.now }, // exact timestamp
  entryDate: { 
    type: String, 
    default: () => new Date().toISOString().split("T")[0]  // ✅ Correct placement
  },
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
  carbonEntries: [CarbonEntrySchema]  // multiple uploads allowed per day
});

const User = mongoose.model("User", UserSchema);
export default User;
