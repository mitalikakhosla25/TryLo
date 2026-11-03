import sqlite3

con = sqlite3.connect('D:/TryLo-main/TryLo-main/backend/trylo.db')
cur = con.cursor()
tables = [row[0] for row in cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").fetchall()]
print('Existing tables in trylo.db:')
for t in tables:
    count = cur.execute(f"SELECT count(*) FROM {t}").fetchone()[0]
    indices = [row[1] for row in cur.execute(f"PRAGMA index_list({t})").fetchall()]
    print(f"Table: {t:<28} Rows: {count:<4} Indices: {indices}")

print("\nUsers currently in trylo.db:")
for row in cur.execute("SELECT id, email, full_name, role FROM users").fetchall():
    print(" ", row)

print("\nStartups currently in trylo.db:")
for row in cur.execute("SELECT id, name, slug, company_stage, city, state FROM startups").fetchall():
    print(" ", row)

print("\nCampaigns currently in trylo.db:")
for row in cur.execute("SELECT id, title, slug, status, reward_type, reward_amount FROM campaigns").fetchall():
    print(" ", row)

con.close()

