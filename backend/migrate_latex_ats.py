import sqlite3
import json
from app.core.latex_ats import calculate_ats_score, DEFAULT_PRIYA_PATEL_LATEX_RESUME

conn = sqlite3.connect("trylo.db")
c = conn.cursor()

c.execute("PRAGMA table_info(tester_resumes)")
existing_cols = [row[1] for row in c.fetchall()]
print("Existing columns in tester_resumes:", existing_cols)

# Add missing columns
cols_to_add = [
    ("ats_score", "INTEGER"),
    ("ats_breakdown", "JSON"),
    ("ats_feedback", "JSON"),
    ("latex_source", "TEXT"),
    ("is_latex_verified", "BOOLEAN DEFAULT 0"),
]

for col_name, col_type in cols_to_add:
    if col_name not in existing_cols:
        print(f"Adding column {col_name} ({col_type})...")
        c.execute(f"ALTER TABLE tester_resumes ADD COLUMN {col_name} {col_type}")

# Create index on ats_score for high-performance filtering
try:
    c.execute("CREATE INDEX IF NOT EXISTS ix_tester_resumes_ats_score ON tester_resumes (ats_score)")
except Exception as e:
    print("Index error:", e)

conn.commit()

# Now populate Priya Patel's ATS score and LaTeX source
ats_data = calculate_ats_score(DEFAULT_PRIYA_PATEL_LATEX_RESUME)
print(f"Calculated ATS Score: {ats_data['ats_score']}")

# Find Priya Patel (tester@trylo.io)
c.execute("SELECT id FROM users WHERE email = 'tester@trylo.io'")
user_row = c.fetchone()
if user_row:
    priya_id = user_row[0]
    c.execute("""
        UPDATE tester_resumes
        SET ats_score = ?,
            ats_breakdown = ?,
            ats_feedback = ?,
            latex_source = ?,
            is_latex_verified = 1,
            file_name = 'Priya_Patel_Senior_QA_Automation_Attested.tex'
        WHERE tester_id = ?
    """, (
        ats_data["ats_score"],
        json.dumps(ats_data["breakdown"]),
        json.dumps(ats_data["feedback"]),
        DEFAULT_PRIYA_PATEL_LATEX_RESUME,
        priya_id,
    ))
    print(f"Updated Priya Patel resume with ATS score {ats_data['ats_score']}.")

# Also populate Rohan Verma
c.execute("SELECT id FROM users WHERE email = 'rohan.tester@trylo.io'")
rohan_row = c.fetchone()
if rohan_row:
    rohan_id = rohan_row[0]
    rohan_latex = DEFAULT_PRIYA_PATEL_LATEX_RESUME.replace("Priya", "Rohan").replace("Patel", "Verma")
    rohan_ats = calculate_ats_score(rohan_latex)
    c.execute("""
        UPDATE tester_resumes
        SET ats_score = ?,
            ats_breakdown = ?,
            ats_feedback = ?,
            latex_source = ?,
            is_latex_verified = 1,
            file_name = 'Rohan_Verma_Senior_QA_CV_Attested.tex'
        WHERE tester_id = ?
    """, (
        rohan_ats["ats_score"],
        json.dumps(rohan_ats["breakdown"]),
        json.dumps(rohan_ats["feedback"]),
        rohan_latex,
        rohan_id,
    ))
    print(f"Updated Rohan Verma resume with ATS score {rohan_ats['ats_score']}.")

conn.commit()
conn.close()
print("Migration completed successfully.")

