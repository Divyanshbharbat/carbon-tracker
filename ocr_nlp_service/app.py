import re
from flask import Flask, request, jsonify
from difflib import get_close_matches

app = Flask(__name__)

CARBON_FACTORS = {
    "ghee": 9.0,
    "milk": 3.2,
    "rice": 4.5,
    "chicken": 6.9,
    "beef": 27.0,
    "apple": 0.4,
    "banana": 0.5,
    "bread": 1.1,
    "pongal": 4.0,
    "vada": 1.5,
    "roast": 2.0,
    "poori": 3.0,
    "fish burger": 6.0,
    "fish chips": 5.5,
    "soft drink": 0.3,
}

def parse_item_quantity(text_line):
    """Parse lines like '* rian chips - 2' and return (item_name, quantity)"""
    match = re.match(r"[*\s]*([\w\s]+)-\s*(\d+)", text_line.strip())
    if match:
        item_name = match.group(1).strip().lower()
        quantity = int(match.group(2))
        print(f"🔹 Parsed line: '{text_line.strip()}' => item: '{item_name}', qty: {quantity}")
        return item_name, quantity
    return None, 0

def map_to_known_item(item_name):
    """Fuzzy match OCR/Gemini item name to known CARBON_FACTORS keys"""
    matches = get_close_matches(item_name, CARBON_FACTORS.keys(), n=1, cutoff=0.6)
    if matches:
        print(f"✅ Mapped '{item_name}' to known item '{matches[0]}'")
        return matches[0]
    else:
        print(f"⚠️ No close match found for '{item_name}'")
        return None

@app.route("/calculate", methods=["POST"])
def calculate_carbon():
    data = request.json
    raw_text = data.get("text", "")
    print("📥 Raw text received:", raw_text)
    
    if not raw_text:
        print("❌ No text provided in request")
        return jsonify({"status": "error", "message": "No text provided"}), 400

    total_emission = 0.0
    found_items = {}

    # Split text into lines
    lines = raw_text.split("\n")
    for line in lines:
        item_name, qty = parse_item_quantity(line)
        if item_name:
            known_item = map_to_known_item(item_name)
            if known_item:
                factor = CARBON_FACTORS[known_item]
                emission = qty * factor
                total_emission += emission
                found_items[known_item] = {
                    "count": qty,
                    "factor": factor,
                    "emission": round(emission, 2)
                }
                print(f"📊 Calculated emission for '{known_item}': {emission} kgCO2")
            else:
                print(f"⚠️ Item not recognized: {item_name}")

    print("🌍 Total carbon emission:", total_emission)
    print("📋 Item breakdown:", found_items)

    return jsonify({
        "status": "success",
        "extracted_text": raw_text,
        "carbon_emission_total": round(total_emission, 2),
        "item_breakdown": found_items
    })

if __name__ == "__main__":
    app.run(debug=True, port=5001)
