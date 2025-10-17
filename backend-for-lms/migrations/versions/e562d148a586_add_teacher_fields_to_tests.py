"""add teacher and scheduling fields to tests

Revision ID: e562d148a586
Revises: f715af7b54da
Create Date: 2025-10-17 15:05:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "e562d148a586"
down_revision = "f715af7b54da"
branch_labels = None
depends_on = None


def upgrade():
    op.execute("ALTER TABLE tests MODIFY test_total_questions INT NULL")
    op.execute(
        "ALTER TABLE tests MODIFY test_status VARCHAR(20) NOT NULL DEFAULT 'DRAFT'"
    )

    with op.batch_alter_table("tests", schema=None) as batch_op:
        batch_op.add_column(sa.Column("class_id", sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column("teacher_id", sa.String(length=10), nullable=True))
        batch_op.add_column(
            sa.Column("available_from", sa.DateTime(timezone=True), nullable=True)
        )
        batch_op.add_column(
            sa.Column("due_at", sa.DateTime(timezone=True), nullable=True)
        )
        batch_op.add_column(
            sa.Column(
                "max_attempts",
                sa.Integer(),
                nullable=False,
                server_default="2",
            )
        )
        batch_op.add_column(sa.Column("time_limit_min", sa.Integer(), nullable=True))
        batch_op.add_column(
            sa.Column(
                "created_at",
                sa.DateTime(timezone=True),
                server_default=sa.text("CURRENT_TIMESTAMP"),
                nullable=True,
            )
        )
        batch_op.add_column(
            sa.Column(
                "updated_at",
                sa.DateTime(timezone=True),
                server_default=sa.text("CURRENT_TIMESTAMP"),
                nullable=True,
            )
        )
        batch_op.create_index("ix_tests_class_id", ["class_id"], unique=False)
        batch_op.create_index("ix_tests_teacher_id", ["teacher_id"], unique=False)
        batch_op.create_foreign_key(
            "fk_tests_class_id",
            "classes",
            ["class_id"],
            ["class_id"],
            ondelete="SET NULL",
            onupdate="CASCADE",
        )
        batch_op.create_foreign_key(
            "fk_tests_teacher_id",
            "teachers",
            ["teacher_id"],
            ["user_id"],
            ondelete="SET NULL",
            onupdate="CASCADE",
        )

    op.execute("UPDATE tests SET max_attempts = COALESCE(max_attempts, 2)")
    op.execute("UPDATE tests SET test_total_questions = COALESCE(test_total_questions, 0)")
    op.execute(
        "UPDATE tests SET created_at = COALESCE(created_at, CURRENT_TIMESTAMP)"
    )
    op.execute(
        "UPDATE tests SET updated_at = COALESCE(updated_at, CURRENT_TIMESTAMP)"
    )


def downgrade():
    with op.batch_alter_table("tests", schema=None) as batch_op:
        batch_op.drop_constraint("fk_tests_teacher_id", type_="foreignkey")
        batch_op.drop_constraint("fk_tests_class_id", type_="foreignkey")
        batch_op.drop_index("ix_tests_teacher_id")
        batch_op.drop_index("ix_tests_class_id")
        batch_op.drop_column("updated_at")
        batch_op.drop_column("created_at")
        batch_op.drop_column("time_limit_min")
        batch_op.drop_column("max_attempts")
        batch_op.drop_column("due_at")
        batch_op.drop_column("available_from")
        batch_op.drop_column("teacher_id")
        batch_op.drop_column("class_id")

    op.execute("ALTER TABLE tests MODIFY test_status DATETIME NULL")
    op.execute("ALTER TABLE tests MODIFY test_total_questions DATETIME NULL")
*** End Patch
