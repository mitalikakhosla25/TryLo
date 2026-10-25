"""add_rejection_note_to_campaign_applications

Revision ID: c911855b4a2e
Revises: e82f93ab4d1c
Create Date: 2026-10-24 21:15:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c911855b4a2e'
down_revision: Union[str, Sequence[str], None] = 'e82f93ab4d1c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add rejection_note column to campaign_applications table."""
    op.add_column(
        'campaign_applications',
        sa.Column('rejection_note', sa.Text(), nullable=True),
    )


def downgrade() -> None:
    """Drop rejection_note column from campaign_applications table."""
    op.drop_column('campaign_applications', 'rejection_note')
