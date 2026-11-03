import sqlite3

con = sqlite3.connect('D:/TryLo-main/trylo.db')
cur = con.cursor()
tables = [row[0] for row in cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").fetchall()]
print('Existing tables in D:/TryLo-main/trylo.db:')
for t in tables:
    count = cur.execute(f"SELECT count(*) FROM {t}").fetchone()[0]
    print(f"Table: {t:<28} Rows: {count:<4}")

print("\nStartups in D:/TryLo-main/trylo.db:")
for row in cur.execute("SELECT id, name, slug, company_stage, city, state FROM startups").fetchall():
    print(" ", row)

con.close()

