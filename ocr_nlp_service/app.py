from flask import Flask, request, jsonify
import re

app = Flask(__name__)

# Carbon factors for common food items (kg CO2e per serving)
CARBON_FACTORS = {
    "ghee": 9.0,
    "milk": 3.2,
    "rice": 4.5,
    "chicken": 6.9,
    "beef": 27.0,
    "apple": 0.4,
    "banana": 0.5,
    "bread": 1.1,
    "pongal": 4.0,   # Pongal is rice+ghee mix (approximate)
    "vada": 1.5,
    "roast": 2.0,
    "poori": 3.0,

    # newly added items
    "fish burger": 8.0,    # approx (fish + bread + condiments)
    "fish chips": 7.5,     # fried fish + potato fries
    "soft drink": 0.3      # per 330ml can (avg value)
}


def clean_text(text):
    """Clean OCR text: lowercase, remove special chars"""
    text = text.lower()
    text = re.sub(r"[^a-z0-9\s]", " ", text)  # remove non-alphanumeric
    return text
@app.route("/calculate", methods=["POST"])
def calculate_carbon():
    data = request.json
    raw_text = data.get("text", "")
    print("📥 Raw text received:", raw_text)  # Debug

    if not raw_text:
        print("❌ No text provided in request")
        return jsonify({"error": "No text provided"}), 400

    text = clean_text(raw_text)
    print("✅ Cleaned text:", text)  # Debug

    found_items = {}
    total_emission = 0.0

    for item, factor in CARBON_FACTORS.items():
        if item in text:
            count = len(re.findall(item, text))
            emission = count * factor
            found_items[item] = {
                "count": count,
                "factor": factor,
                "emission": emission
            }
            total_emission += emission

            print(f"🔍 Found item: {item}, Count: {count}, "
                  f"Factor: {factor}, Emission: {emission}")  # Debug

    print("📊 Final found items:", found_items)  # Debug
    print("🌍 Total emission (kgCO2):", total_emission)  # Debug

    return jsonify({
        "items": found_items,
        "total_emission_kgCO2": round(total_emission, 2)
    })

if __name__ == "__main__":
    app.run(debug=True)
