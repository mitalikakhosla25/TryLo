"""add_scheduled_at_and_lease_expires_at_to_ai_analysis_jobs

Revision ID: 9c0f1e3d5a4b
Revises: 8b9f0e2d4c3f
Create Date: 2026-11-26 15:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '9c0f1e3d5a4b'
down_revision: Union[str, Sequence[str], None] = '8b9f0e2d4c3f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table('ai_analysis_jobs') as batch_op:
        batch_op.add_column(
            sa.Column(
                'scheduled_at',
                sa.DateTime(timezone=True),
                server_default=sa.text('CURRENT_TIMESTAMP'),
                nullable=False,
            )
        )
        batch_op.add_column(
            sa.Column(
                'lease_expires_at',
                sa.DateTime(timezone=True),
                nullable=True,
            )
        )
        batch_op.create_index('ix_ai_analysis_jobs_scheduled_at', ['scheduled_at'])
        batch_op.create_index('ix_ai_analysis_jobs_lease_expires_at', ['lease_expires_at'])


def downgrade() -> None:
    with op.batch_alter_table('ai_analysis_jobs') as batch_op:
        batch_op.drop_index('ix_ai_analysis_jobs_lease_expires_at')
        batch_op.drop_column('lease_expires_at')
        batch_op.drop_index('ix_ai_analysis_jobs_scheduled_at')
        batch_op.drop_column('scheduled_at')
