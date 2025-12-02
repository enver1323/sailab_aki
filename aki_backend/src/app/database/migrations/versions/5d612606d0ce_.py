"""empty message

Revision ID: 5d612606d0ce
Revises: b6726a891e85
Create Date: 2025-12-02 13:45:27.505593

"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "5d612606d0ce"
down_revision = "b6726a891e85"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "user_patient_medical_record_evaluations",
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("patient_medical_record_id", sa.Integer(), nullable=False),
        sa.Column("column_name", sa.String(length=255), nullable=False),
        sa.Column("value", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(
            ["patient_medical_record_id"],
            ["patient_medical_records.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("user_id", "patient_medical_record_id", "column_name"),
    )


def downgrade():
    op.drop_table("evaluations")
    # ### end Alembic commands ###
