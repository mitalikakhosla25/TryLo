"""add_verification_resume_certs_and_reviews

Revision ID: 7a8e9f1c3d2e
Revises: 2823c68f60b5
Create Date: 2026-11-01 14:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '7a8e9f1c3d2e'
down_revision: Union[str, Sequence[str], None] = '2823c68f60b5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

json_type = postgresql.JSONB().with_variant(sa.JSON(), "sqlite")


def upgrade() -> None:
    # 1. startup_verifications
    op.create_table(
        'startup_verifications',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('startup_id', sa.Uuid(), nullable=False),
        sa.Column('legal_entity_name', sa.String(length=255), nullable=False),
        sa.Column('registration_type', sa.String(length=100), nullable=False),
        sa.Column('registration_number', sa.String(length=100), nullable=False),
        sa.Column('tax_identifier', sa.String(length=100), nullable=True),
        sa.Column('document_url', sa.String(length=500), nullable=True),
        sa.Column('document_name', sa.String(length=255), nullable=True),
        sa.Column('corporate_email', sa.String(length=255), nullable=True),
        sa.Column('is_corporate_email_verified', sa.Boolean(), server_default=sa.text('false'), nullable=False),
        sa.Column('verification_status', sa.String(length=50), server_default=sa.text("'pending'"), nullable=False),
        sa.Column('rejection_reason', sa.Text(), nullable=True),
        sa.Column('verified_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['startup_id'], ['startups.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.CheckConstraint("verification_status IN ('unverified', 'pending', 'verified', 'rejected')", name='check_valid_verification_status'),
    )
    op.create_index(op.f('ix_startup_verifications_startup_id'), 'startup_verifications', ['startup_id'], unique=True)
    op.create_index(op.f('ix_startup_verifications_registration_number'), 'startup_verifications', ['registration_number'], unique=False)
    op.create_index(op.f('ix_startup_verifications_verification_status'), 'startup_verifications', ['verification_status'], unique=False)

    # 2. tester_resumes
    op.create_table(
        'tester_resumes',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('tester_id', sa.Uuid(), nullable=False),
        sa.Column('resume_url', sa.String(length=500), nullable=True),
        sa.Column('file_name', sa.String(length=255), nullable=True),
        sa.Column('github_url', sa.String(length=500), nullable=True),
        sa.Column('portfolio_url', sa.String(length=500), nullable=True),
        sa.Column('bug_bounty_url', sa.String(length=500), nullable=True),
        sa.Column('specializations', json_type, nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['tester_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_tester_resumes_tester_id'), 'tester_resumes', ['tester_id'], unique=True)

    # 3. tester_certifications
    op.create_table(
        'tester_certifications',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('tester_id', sa.Uuid(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('issuing_organization', sa.String(length=200), nullable=False),
        sa.Column('credential_id', sa.String(length=100), nullable=True),
        sa.Column('credential_url', sa.String(length=500), nullable=True),
        sa.Column('issue_date', sa.Date(), nullable=True),
        sa.Column('expiry_date', sa.Date(), nullable=True),
        sa.Column('verification_status', sa.String(length=50), server_default=sa.text("'pending'"), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['tester_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.CheckConstraint("verification_status IN ('pending', 'verified', 'rejected')", name='check_valid_cert_verification_status'),
    )
    op.create_index(op.f('ix_tester_certifications_tester_id'), 'tester_certifications', ['tester_id'], unique=False)
    op.create_index(op.f('ix_tester_certifications_verification_status'), 'tester_certifications', ['verification_status'], unique=False)

    # 4. tester_endorsements
    op.create_table(
        'tester_endorsements',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('tester_id', sa.Uuid(), nullable=False),
        sa.Column('endorser_id', sa.Uuid(), nullable=False),
        sa.Column('skill_name', sa.String(length=100), nullable=False),
        sa.Column('endorsement_note', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['endorser_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['tester_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('tester_id', 'endorser_id', 'skill_name', name='uq_tester_endorser_skill'),
    )
    op.create_index(op.f('ix_tester_endorsements_tester_id'), 'tester_endorsements', ['tester_id'], unique=False)
    op.create_index(op.f('ix_tester_endorsements_endorser_id'), 'tester_endorsements', ['endorser_id'], unique=False)

    # 5. tester_employer_reviews
    op.create_table(
        'tester_employer_reviews',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('tester_id', sa.Uuid(), nullable=False),
        sa.Column('reviewer_id', sa.Uuid(), nullable=True),
        sa.Column('campaign_id', sa.Uuid(), nullable=True),
        sa.Column('reviewer_name', sa.String(length=200), nullable=False),
        sa.Column('reviewer_title', sa.String(length=100), nullable=True),
        sa.Column('company_name', sa.String(length=200), nullable=False),
        sa.Column('overall_rating', sa.Integer(), nullable=False),
        sa.Column('thoroughness_rating', sa.Integer(), nullable=True),
        sa.Column('responsiveness_rating', sa.Integer(), nullable=True),
        sa.Column('bug_report_quality_rating', sa.Integer(), nullable=True),
        sa.Column('review_text', sa.Text(), nullable=False),
        sa.Column('project_scope', sa.String(length=255), nullable=True),
        sa.Column('is_verified', sa.Boolean(), server_default=sa.text('true'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['campaign_id'], ['campaigns.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['reviewer_id'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['tester_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.CheckConstraint('overall_rating >= 1 AND overall_rating <= 5', name='check_valid_overall_rating'),
        sa.CheckConstraint('thoroughness_rating IS NULL OR (thoroughness_rating >= 1 AND thoroughness_rating <= 5)', name='check_valid_thoroughness_rating'),
        sa.CheckConstraint('responsiveness_rating IS NULL OR (responsiveness_rating >= 1 AND responsiveness_rating <= 5)', name='check_valid_responsiveness_rating'),
        sa.CheckConstraint('bug_report_quality_rating IS NULL OR (bug_report_quality_rating >= 1 AND bug_report_quality_rating <= 5)', name='check_valid_bug_report_quality_rating'),
    )
    op.create_index(op.f('ix_tester_employer_reviews_campaign_id'), 'tester_employer_reviews', ['campaign_id'], unique=False)
    op.create_index(op.f('ix_tester_employer_reviews_reviewer_id'), 'tester_employer_reviews', ['reviewer_id'], unique=False)
    op.create_index(op.f('ix_tester_employer_reviews_tester_id'), 'tester_employer_reviews', ['tester_id'], unique=False)


def downgrade() -> None:
    op.drop_table('tester_employer_reviews')
    op.drop_table('tester_endorsements')
    op.drop_table('tester_certifications')
    op.drop_table('tester_resumes')
    op.drop_table('startup_verifications')
