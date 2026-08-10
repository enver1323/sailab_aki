"""merge baseline_creatinine evaluations into b_cr

Revision ID: a1c3b7d90f42
Revises: f07202381418
Create Date: 2026-08-10 12:00:00.000000

"""
from alembic import op

# revision identifiers, used by Alembic.
revision = 'a1c3b7d90f42'
down_revision = 'f07202381418'
branch_labels = None
depends_on = None

TABLE = "user_patient_medical_record_evaluations"
LEGACY_COLUMN = "baseline_creatinine"
CANONICAL_COLUMN = "b_cr"


def upgrade():
    op.execute(
        f"""
        UPDATE {TABLE} AS canonical
        SET value = GREATEST(canonical.value, legacy.value)
        FROM {TABLE} AS legacy
        WHERE canonical.column_name = '{CANONICAL_COLUMN}'
          AND legacy.column_name = '{LEGACY_COLUMN}'
          AND canonical.user_id = legacy.user_id
          AND canonical.patient_medical_record_id = legacy.patient_medical_record_id
        """
    )

    op.execute(
        f"""
        UPDATE {TABLE} AS legacy
        SET column_name = '{CANONICAL_COLUMN}'
        WHERE legacy.column_name = '{LEGACY_COLUMN}'
          AND NOT EXISTS (
              SELECT 1 FROM {TABLE} AS canonical
              WHERE canonical.column_name = '{CANONICAL_COLUMN}'
                AND canonical.user_id = legacy.user_id
                AND canonical.patient_medical_record_id = legacy.patient_medical_record_id
          )
        """
    )

    op.execute(f"DELETE FROM {TABLE} WHERE column_name = '{LEGACY_COLUMN}'")


def downgrade():
    pass
