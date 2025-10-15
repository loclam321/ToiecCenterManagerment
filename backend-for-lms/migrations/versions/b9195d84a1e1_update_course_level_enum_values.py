"""Update course level enum values

Revision ID: b9195d84a1e1
Revises: d240edbc7955
Create Date: 2025-10-15 23:40:35.667875

"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision = "b9195d84a1e1"
down_revision = "d240edbc7955"  # ID của migration trước đó
branch_labels = None
depends_on = None


def upgrade():
    # Bước 1: Convert dữ liệu cũ sang format mới
    op.execute(
        """
        UPDATE courses 
        SET level = CASE 
            WHEN level = 'BEGINNER' THEN '300–450'
            WHEN level = 'INTERMEDIATE' THEN '450–600'
            WHEN level = 'ADVANCED' THEN '600–750'
            WHEN level = '300–450' THEN '300–450'
            WHEN level = '450–600' THEN '450–600'
            WHEN level = '600–750' THEN '600–750'
            WHEN level = '750–900' THEN '750–900'
            ELSE NULL
        END
        WHERE level IS NOT NULL
    """
    )

    # Bước 2: Thay đổi Enum type
    with op.batch_alter_table("courses", schema=None) as batch_op:
        batch_op.alter_column(
            "level",
            existing_type=sa.Enum(
                "BEGINNER", "INTERMEDIATE", "ADVANCED", name="course_level_enum"
            ),
            type_=sa.Enum(
                "300–450", "450–600", "600–750", "750–900", name="course_levels"
            ),
            existing_nullable=True,
        )


def downgrade():
    # Bước 1: Đổi lại Enum type
    with op.batch_alter_table("courses", schema=None) as batch_op:
        batch_op.alter_column(
            "level",
            existing_type=sa.Enum(
                "300–450", "450–600", "600–750", "750–900", name="course_levels"
            ),
            type_=sa.Enum(
                "BEGINNER", "INTERMEDIATE", "ADVANCED", name="course_level_enum"
            ),
            existing_nullable=True,
        )

    # Bước 2: Convert data về format cũ
    op.execute(
        """
        UPDATE courses 
        SET level = CASE 
            WHEN level = '300–450' THEN 'BEGINNER'
            WHEN level = '450–600' THEN 'INTERMEDIATE'
            WHEN level = '600–750' THEN 'ADVANCED'
            WHEN level = '750–900' THEN 'ADVANCED'
            ELSE level
        END
        WHERE level IS NOT NULL
    """
    )
