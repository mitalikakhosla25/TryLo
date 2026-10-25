"""add_state_column_to_startups

Revision ID: 3a9f0e1b2c4d
Revises: 2823c68f60b5
Create Date: 2026-10-25 14:40:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '3a9f0e1b2c4d'
down_revision: Union[str, Sequence[str], None] = '2823c68f60b5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema by adding nullable state column and index to startups."""
    op.add_column('startups', sa.Column('state', sa.String(length=100), nullable=True))
    op.create_index(op.f('ix_startups_state'), 'startups', ['state'], unique=False)


def downgrade() -> None:
    """Downgrade schema by dropping state index and column from startups."""
    op.drop_index(op.f('ix_startups_state'), table_name='startups')
    op.drop_column('startups', 'state')
