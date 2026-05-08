import sqlite3
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "database.db")

conn = sqlite3.connect(DB_PATH)
c = conn.cursor()

c.execute("DROP TABLE IF EXISTS users")
c.execute("CREATE TABLE users (id INTEGER PRIMARY KEY, username TEXT, password TEXT)")

c.execute("DROP TABLE IF EXISTS foods")
c.execute("CREATE TABLE foods (id INTEGER PRIMARY KEY, name TEXT, price INTEGER, image TEXT)")

c.execute("DROP TABLE IF EXISTS orders")
c.execute("CREATE TABLE orders (id INTEGER PRIMARY KEY, user_id INTEGER, items TEXT, status TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP)")

c.execute("INSERT INTO users VALUES (NULL, 'admin', '123')")

foods = [
    ("Pizza", 100000, "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=500"),
    ("Burger", 50000, "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=500"),
]

c.executemany("INSERT INTO foods (name, price, image) VALUES (?, ?, ?)", foods)

conn.commit()
conn.close()