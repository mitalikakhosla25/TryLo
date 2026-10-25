"""create_campaign_applications_table

Revision ID: e82f93ab4d1c
Revises: b66ba9e0dd6c
Create Date: 2026-10-24 20:27:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'e82f93ab4d1c'
down_revision: Union[str, Sequence[str], None] = 'b66ba9e0dd6c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema: add screening_questions to campaigns and create campaign_applications table."""
    json_type = postgresql.JSONB(astext_type=sa.Text()).with_variant(sa.JSON(), 'sqlite')

    # 1. Add screening_questions to campaigns
    op.add_column(
        'campaigns',
        sa.Column('screening_questions', json_type, server_default='[]', nullable=False),
    )

    # 2. Create campaign_applications table
    op.create_table(
        'campaign_applications',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('campaign_id', sa.Uuid(), nullable=False),
        sa.Column('tester_id', sa.Uuid(), nullable=False),
        sa.Column('status', sa.String(length=30), server_default='pending', nullable=False),
        sa.Column('screening_answers', json_type, server_default='{}', nullable=False),
        sa.Column('motivation', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.CheckConstraint("status IN ('pending', 'accepted', 'rejected')", name='check_valid_application_status'),
        sa.ForeignKeyConstraint(['campaign_id'], ['campaigns.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['tester_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('campaign_id', 'tester_id', name='uq_campaign_applications_campaign_tester'),
    )
    op.create_index(op.f('ix_campaign_applications_campaign_id'), 'campaign_applications', ['campaign_id'], unique=False)
    op.create_index(op.f('ix_campaign_applications_tester_id'), 'campaign_applications', ['tester_id'], unique=False)
    op.create_index(op.f('ix_campaign_applications_status'), 'campaign_applications', ['status'], unique=False)


def downgrade() -> None:
    """Downgrade schema: drop campaign_applications table and screening_questions column."""
    op.drop_index(op.f('ix_campaign_applications_status'), table_name='campaign_applications')
    op.drop_index(op.f('ix_campaign_applications_tester_id'), table_name='campaign_applications')
    op.drop_index(op.f('ix_campaign_applications_campaign_id'), table_name='campaign_applications')
    op.drop_table('campaign_applications')
    op.drop_column('campaigns', 'screening_questions')
