"""create_task_progress_and_feedback_submissions

Revision ID: d4a8e91f0c2b
Revises: c911855b4a2e
Create Date: 2026-10-24 23:10:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd4a8e91f0c2b'
down_revision: Union[str, Sequence[str], None] = 'c911855b4a2e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create campaign_task_progress table
    op.create_table(
        'campaign_task_progress',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('campaign_id', sa.Uuid(), nullable=False),
        sa.Column('task_id', sa.String(length=100), nullable=False),
        sa.Column('tester_id', sa.Uuid(), nullable=False),
        sa.Column('status', sa.String(length=30), server_default='not_started', nullable=False),
        sa.Column('completion_note', sa.Text(), nullable=True),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['campaign_id'], ['campaigns.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['tester_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('campaign_id', 'task_id', 'tester_id', name='uq_campaign_task_progress_campaign_task_tester'),
        sa.CheckConstraint(
            "status IN ('not_started', 'in_progress', 'completed')",
            name='check_valid_task_progress_status'
        ),
    )
    op.create_index('ix_campaign_task_progress_campaign_id', 'campaign_task_progress', ['campaign_id'])
    op.create_index('ix_campaign_task_progress_task_id', 'campaign_task_progress', ['task_id'])
    op.create_index('ix_campaign_task_progress_tester_id', 'campaign_task_progress', ['tester_id'])
    op.create_index('ix_campaign_task_progress_status', 'campaign_task_progress', ['status'])

    # 2. Create feedback_submissions table
    op.create_table(
        'feedback_submissions',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('campaign_id', sa.Uuid(), nullable=False),
        sa.Column('tester_id', sa.Uuid(), nullable=False),
        sa.Column('task_id', sa.String(length=100), nullable=True),
        sa.Column('feedback_type', sa.String(length=30), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('expected_behavior', sa.Text(), nullable=True),
        sa.Column('actual_behavior', sa.Text(), nullable=True),
        sa.Column('reproduction_steps', sa.Text(), nullable=True),
        sa.Column('severity', sa.String(length=20), nullable=True),
        sa.Column('status', sa.String(length=30), server_default='submitted', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['campaign_id'], ['campaigns.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['tester_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.CheckConstraint(
            "feedback_type IN ('general_feedback', 'bug_report')",
            name='check_valid_feedback_type'
        ),
        sa.CheckConstraint(
            "severity IS NULL OR severity IN ('low', 'medium', 'high', 'critical')",
            name='check_valid_feedback_severity'
        ),
        sa.CheckConstraint(
            "status IN ('submitted', 'in_review', 'resolved', 'needs_retest')",
            name='check_valid_feedback_status'
        ),
    )
    op.create_index('ix_feedback_submissions_campaign_id', 'feedback_submissions', ['campaign_id'])
    op.create_index('ix_feedback_submissions_tester_id', 'feedback_submissions', ['tester_id'])
    op.create_index('ix_feedback_submissions_task_id', 'feedback_submissions', ['task_id'])
    op.create_index('ix_feedback_submissions_feedback_type', 'feedback_submissions', ['feedback_type'])
    op.create_index('ix_feedback_submissions_severity', 'feedback_submissions', ['severity'])
    op.create_index('ix_feedback_submissions_status', 'feedback_submissions', ['status'])


def downgrade() -> None:
    op.drop_index('ix_feedback_submissions_status', table_name='feedback_submissions')
    op.drop_index('ix_feedback_submissions_severity', table_name='feedback_submissions')
    op.drop_index('ix_feedback_submissions_feedback_type', table_name='feedback_submissions')
    op.drop_index('ix_feedback_submissions_task_id', table_name='feedback_submissions')
    op.drop_index('ix_feedback_submissions_tester_id', table_name='feedback_submissions')
    op.drop_index('ix_feedback_submissions_campaign_id', table_name='feedback_submissions')
    op.drop_table('feedback_submissions')

    op.drop_index('ix_campaign_task_progress_status', table_name='campaign_task_progress')
    op.drop_index('ix_campaign_task_progress_tester_id', table_name='campaign_task_progress')
    op.drop_index('ix_campaign_task_progress_task_id', table_name='campaign_task_progress')
    op.drop_index('ix_campaign_task_progress_campaign_id', table_name='campaign_task_progress')
    op.drop_table('campaign_task_progress')
