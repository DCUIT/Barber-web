import sqlite3
import os
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "database.db")
conn = sqlite3.connect(DB_PATH)
c = conn.cursor()
c.execute('SELECT * FROM orders')
rows = c.fetchall()
print('Orders:', rows)
c.execute('SELECT * FROM users')
print('Users:', c.fetchall())
conn.close()
