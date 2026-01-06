import sqlite3
import os

db_path = os.path.join(os.getcwd(), 'backend', 'vitalinuage.db')
print(f"DB Path: {db_path}")
conn = sqlite3.connect(db_path)
c = conn.cursor()
c.execute("SELECT name FROM sqlite_master WHERE type='table';")
print("Tables:", c.fetchall())
conn.close()
