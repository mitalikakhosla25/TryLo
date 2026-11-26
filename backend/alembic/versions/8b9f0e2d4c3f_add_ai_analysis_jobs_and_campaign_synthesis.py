"""add_ai_analysis_jobs_and_campaign_synthesis

Revision ID: 8b9f0e2d4c3f
Revises: 7a8e9f1c3d2e
Create Date: 2026-11-26 14:50:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '8b9f0e2d4c3f'
down_revision: Union[str, Sequence[str], None] = ('7a8e9f1c3d2e', '3a9f0e1b2c4d')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

json_type = postgresql.JSONB().with_variant(sa.JSON(), "sqlite")


def upgrade() -> None:
    # 1. Add ai_analysis_status and ai_analyzed_at to feedback_submissions
    with op.batch_alter_table('feedback_submissions') as batch_op:
        batch_op.add_column(
            sa.Column('ai_analysis_status', sa.String(length=30), nullable=False, server_default='pending')
        )
        batch_op.add_column(
            sa.Column('ai_analyzed_at', sa.DateTime(timezone=True), nullable=True)
        )
        batch_op.create_index('ix_feedback_submissions_ai_status', ['ai_analysis_status'])

    # 2. Create ai_analysis_jobs table
    op.create_table(
        'ai_analysis_jobs',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('feedback_id', sa.Uuid(), nullable=False),
        sa.Column('campaign_id', sa.Uuid(), nullable=False),
        sa.Column('job_type', sa.String(length=50), nullable=False, server_default='individual_triage'),
        sa.Column('status', sa.String(length=30), nullable=False, server_default='pending'),
        sa.Column('attempts', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('max_attempts', sa.Integer(), nullable=False, server_default='3'),
        sa.Column('last_error', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['campaign_id'], ['campaigns.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['feedback_id'], ['feedback_submissions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_ai_analysis_jobs_campaign_id', 'ai_analysis_jobs', ['campaign_id'])
    op.create_index('ix_ai_analysis_jobs_feedback_id', 'ai_analysis_jobs', ['feedback_id'])
    op.create_index('ix_ai_analysis_jobs_status', 'ai_analysis_jobs', ['status'])
    op.create_index('ix_ai_analysis_jobs_created_at', 'ai_analysis_jobs', ['created_at'])

    # 3. Create campaign_ai_synthesis table
    op.create_table(
        'campaign_ai_synthesis',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('campaign_id', sa.Uuid(), nullable=False),
        sa.Column('version', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('is_outdated', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('total_reports_analyzed', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('feedback_ids_snapshot', json_type, nullable=False),
        sa.Column('release_readiness_score', sa.Integer(), nullable=False, server_default='100'),
        sa.Column('release_readiness_verdict', sa.String(length=50), nullable=False, server_default='READY FOR RELEASE'),
        sa.Column('critical_blocker', json_type, nullable=True),
        sa.Column('top_prioritized_actions', json_type, nullable=False),
        sa.Column('duplicate_clusters', json_type, nullable=False),
        sa.Column('recurring_issues', json_type, nullable=False),
        sa.Column('device_browser_patterns', json_type, nullable=True),
        sa.Column('severity_distribution', json_type, nullable=True),
        sa.Column('recommendations', json_type, nullable=False),
        sa.Column('executive_summary_markdown', sa.Text(), nullable=False, server_default=''),
        sa.Column('unified_pr_brief_markdown', sa.Text(), nullable=False, server_default=''),
        sa.Column('provider', sa.String(length=50), nullable=False, server_default='Local Offline Engine'),
        sa.Column('model', sa.String(length=100), nullable=False, server_default='trylo-deterministic-nlp'),
        sa.Column('synthesized_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.ForeignKeyConstraint(['campaign_id'], ['campaigns.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_campaign_ai_synthesis_campaign_id', 'campaign_ai_synthesis', ['campaign_id'])
    op.create_index('ix_campaign_ai_synthesis_is_outdated', 'campaign_ai_synthesis', ['is_outdated'])
    op.create_index('ix_campaign_ai_synthesis_synthesized_at', 'campaign_ai_synthesis', ['synthesized_at'])


def downgrade() -> None:
    op.drop_table('campaign_ai_synthesis')
    op.drop_table('ai_analysis_jobs')
    with op.batch_alter_table('feedback_submissions') as batch_op:
        batch_op.drop_index('ix_feedback_submissions_ai_status')
        batch_op.drop_column('ai_analyzed_at')
        batch_op.drop_column('ai_analysis_status')
