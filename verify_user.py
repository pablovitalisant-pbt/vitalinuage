import sqlite3

# Connect to database
conn = sqlite3.connect('vitalinuage.db')
cursor = conn.cursor()

# Update user to verified
cursor.execute("UPDATE users SET is_verified = 1 WHERE email = 'pablovitalisant@gmail.com'")
conn.commit()

# Verify the update
cursor.execute("SELECT email, is_verified FROM users WHERE email = 'pablovitalisant@gmail.com'")
result = cursor.fetchone()

if result:
    print(f"✅ Usuario actualizado: {result[0]} | is_verified = {result[1]}")
else:
    print("❌ Usuario no encontrado")

conn.close()
