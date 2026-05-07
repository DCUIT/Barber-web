from flask import Flask, jsonify, request
from flask_cors import CORS
import sqlite3, json
import os
from flask_jwt_extended import *
from functools import wraps
from datetime import timedelta

app = Flask(__name__)
CORS(app)

app.config["JWT_SECRET_KEY"] = "secret"
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=24)  # Token valid for 24 hours
jwt = JWTManager(app)

# Database path - use absolute path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "database.db")

def admin_required(f):
    @jwt_required()
    @wraps(f)
    def decorated(*args, **kwargs):
        user_id = get_jwt_identity()
        if str(user_id) != "1":
            return jsonify({"msg": "Admin only"}), 403
        return f(*args, **kwargs)
    return decorated

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

@app.route("/")
def home():
    return "API OK"

# REGISTER - Tạo tài khoản mới
@app.route("/register", methods=["POST"])
def register():
    data = request.json
    db = get_db()

    # Kiểm tra username đã tồn tại chưa
    existing = db.execute(
        "SELECT * FROM users WHERE username=?",
        (data["username"],)
    ).fetchone()

    if existing:
        return jsonify({"msg": "Tài khoản đã tồn tại"}), 400

    # Thêm user mới
    db.execute(
        "INSERT INTO users (username, password) VALUES (?, ?)",
        (data["username"], data["password"])
    )
    db.commit()

    return jsonify({"msg": "Đăng ký thành công"})

# LOGIN
@app.route("/login", methods=["POST"])
def login():
    data = request.json
    db = get_db()

    user = db.execute(
        "SELECT * FROM users WHERE username=? AND password=?",
        (data["username"], data["password"])
    ).fetchone()

    if not user:
        return jsonify({"msg": "Sai tài khoản"}), 401

    token = create_access_token(identity=str(user["id"]), additional_claims={"username": user["username"]})
    return jsonify(access_token=token, username=user["username"])

# FOODS
@app.route("/foods")
def foods():
    db = get_db()
    data = db.execute("SELECT * FROM foods").fetchall()

    return jsonify([
        dict(f) for f in data
    ])

# ADD FOOD
@app.route("/foods", methods=["POST"])
@admin_required
def add_food():
    data = request.json
    db = get_db()

    db.execute(
        "INSERT INTO foods (name, price, image) VALUES (?, ?, ?)",
        (data["name"], data["price"], data.get("image", ""))
    )
    db.commit()

    return jsonify({"msg": "added"})

# ORDER
@app.route("/order", methods=["POST"])
@jwt_required()
def order():
    user_id = get_jwt_identity()
    data = request.json

    db = get_db()
    db.execute(
        "INSERT INTO orders (user_id, items, status) VALUES (?, ?, ?)",
        (user_id, json.dumps(data["cart"]), "pending")
    )
    db.commit()

    return jsonify({"msg": "order saved"})

# GET ORDERS
@app.route("/orders")
@jwt_required()
def get_orders():
    db = get_db()
    user_id = get_jwt_identity()

    if str(user_id) == "1":
        # Admin sees all orders
        orders = db.execute(
            "SELECT o.*, u.username as user FROM orders o LEFT JOIN users u ON o.user_id = u.id ORDER BY o.id DESC"
        ).fetchall()
    else:
        # Regular user only sees their own orders
        orders = db.execute(
            "SELECT o.*, u.username as user FROM orders o LEFT JOIN users u ON o.user_id = u.id WHERE o.user_id = ? ORDER BY o.id DESC",
            (user_id,)
        ).fetchall()

    return jsonify([dict(o) for o in orders])

# DELETE FOOD
@app.route("/foods/<int:food_id>", methods=["DELETE"])
@admin_required
def delete_food(food_id):
    db = get_db()
    db.execute("DELETE FROM foods WHERE id=?", (food_id,))
    db.commit()
    return jsonify({"msg": "deleted"})

# UPDATE FOOD
@app.route("/foods/<int:food_id>", methods=["PUT"])
@admin_required
def update_food(food_id):
    data = request.json
    db = get_db()
    db.execute(
        "UPDATE foods SET name=?, price=?, image=? WHERE id=?",
        (data.get("name"), data.get("price"), data.get("image", ""), food_id)
    )
    db.commit()
    return jsonify({"msg": "updated"})

# UPDATE ORDER STATUS (admin only)
@app.route("/orders/<int:order_id>", methods=["PUT"])
@admin_required
def update_order_status(order_id):
    data = request.json
    db = get_db()
    new_status = data.get("status")
    
    valid_statuses = ["pending", "paid", "cancelled", "refunded"]
    if new_status not in valid_statuses:
        return jsonify({"msg": "Invalid status"}), 400
    
    db.execute(
        "UPDATE orders SET status=? WHERE id=?",
        (new_status, order_id)
    )
    db.commit()
    return jsonify({"msg": "updated", "status": new_status})

# CANCEL ORDER (user can cancel their own pending orders)
@app.route("/orders/<int:order_id>/cancel", methods=["PUT"])
@jwt_required()
def cancel_order(order_id):
    user_id = get_jwt_identity()
    db = get_db()
    
    # Check if order exists and belongs to user
    order = db.execute(
        "SELECT * FROM orders WHERE id=? AND user_id=?",
        (order_id, user_id)
    ).fetchone()
    
    if not order:
        return jsonify({"msg": "Order not found"}), 404
    
    if order["status"] != "pending":
        return jsonify({"msg": "Can only cancel pending orders"}), 400
    
    db.execute(
        "UPDATE orders SET status='cancelled' WHERE id=?",
        (order_id,)
    )
    db.commit()
    return jsonify({"msg": "order cancelled", "status": "cancelled"})

# STATS
@app.route("/stats")
@admin_required
def get_stats():
    db = get_db()
    
    # Total foods
    foods_count = db.execute("SELECT COUNT(*) as count FROM foods").fetchone()["count"]
    
    # Total orders
    orders_count = db.execute("SELECT COUNT(*) as count FROM orders").fetchone()["count"]
    
    # Total users
    users_count = db.execute("SELECT COUNT(*) as count FROM users").fetchone()["count"]
    
    # Total revenue (if price in orders)
    orders = db.execute("SELECT items FROM orders").fetchall()
    total_revenue = 0
    for o in orders:
        try:
            items = json.loads(o["items"])
            for item in items:
                total_revenue += item.get("price", 0) * item.get("quantity", 1)
        except:
            pass
    
    return jsonify({
        "foods_count": foods_count,
        "orders_count": orders_count,
        "users_count": users_count,
        "total_revenue": total_revenue
    })

if __name__ == "__main__":
    app.run(debug=True)