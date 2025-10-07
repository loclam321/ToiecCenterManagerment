"""fix course and learning path

Revision ID: ae4f751f8003
Revises: 5f21576acf92
Create Date: 2025-10-07 11:19:31.362688

"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision = "ae4f751f8003"
down_revision = "5f21576acf92"
branch_labels = None
depends_on = None


def upgrade():
    # Kiểm tra xem bảng courses đã tồn tại chưa
    connection = op.get_bind()
    inspector = sa.inspect(connection)
    tables = inspector.get_table_names()

    # 1. Chỉ tạo bảng courses nếu chưa tồn tại
    if "courses" not in tables:
        op.create_table(
            "courses",
            sa.Column("course_id", sa.String(length=10), nullable=False),
            sa.Column("course_code", sa.String(length=32), nullable=True),
            sa.Column("course_name", sa.String(length=100), nullable=False),
            sa.Column("course_description", sa.Text(), nullable=True),
            sa.Column("target_score", mysql.SMALLINT(unsigned=True), nullable=True),
            sa.Column(
                "level",
                sa.Enum(
                    "BEGINNER", "INTERMEDIATE", "ADVANCED", name="course_level_enum"
                ),
                nullable=True,
            ),
            sa.Column(
                "mode",
                sa.Enum("ONLINE", "OFFLINE", "HYBRID", name="course_mode_enum"),
                nullable=True,
            ),
            sa.Column("schedule_text", sa.String(length=120), nullable=True),
            sa.Column("start_date", sa.Date(), nullable=True),
            sa.Column("end_date", sa.Date(), nullable=True),
            sa.Column("session_count", mysql.SMALLINT(unsigned=True), nullable=True),
            sa.Column("total_hours", mysql.SMALLINT(unsigned=True), nullable=True),
            sa.Column(
                "tuition_fee", mysql.DECIMAL(precision=12, scale=2), nullable=True
            ),
            sa.Column("capacity", mysql.SMALLINT(unsigned=True), nullable=True),
            sa.Column(
                "status",
                sa.Enum(
                    "DRAFT",
                    "OPEN",
                    "RUNNING",
                    "CLOSED",
                    "ARCHIVED",
                    name="course_status_enum",
                ),
                server_default="OPEN",
                nullable=False,
            ),
            sa.Column(
                "is_deleted",
                mysql.TINYINT(unsigned=True),
                server_default="0",
                nullable=False,
            ),
            sa.Column("teacher_id", sa.String(length=10), nullable=True),
            sa.Column("learning_path_id", sa.String(length=10), nullable=True),
            sa.Column("campus_id", sa.String(length=10), nullable=True),
            sa.Column(
                "created_at",
                sa.DateTime(timezone=True),
                server_default=sa.text("now()"),
                nullable=False,
            ),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
            sa.CheckConstraint(
                "(start_date IS NULL AND end_date IS NULL) OR (start_date <= end_date)",
                name="chk_course_dates_valid",
            ),
            sa.CheckConstraint(
                "capacity IS NULL OR capacity >= 0", name="chk_course_capacity_nonneg"
            ),
            sa.CheckConstraint("tuition_fee >= 0", name="chk_course_tuition_nonneg"),
            sa.PrimaryKeyConstraint("course_id"),
            sa.UniqueConstraint("course_code"),
        )

    # 2. Sửa foreign key constraint trong bảng classes nếu tồn tại
    if "classes" in tables:
        try:
            with op.batch_alter_table("classes", schema=None) as batch_op:
                batch_op.drop_constraint("classes_ibfk_1", type_="foreignkey")
                batch_op.create_foreign_key(
                    "classes_ibfk_1", "courses", ["course_id"], ["course_id"]
                )
        except Exception as e:
            print(f"Warning: Could not update classes foreign key: {e}")

    # 3. Drop bảng course cũ nếu tồn tại
    if "course" in tables:
        try:
            op.drop_table("course")
        except Exception as e:
            print(f"Warning: Could not drop old course table: {e}")

    # 4. Update learning_paths foreign key
    if "learning_paths" in tables:
        try:
            with op.batch_alter_table("learning_paths", schema=None) as batch_op:
                # Thử drop constraint cũ
                try:
                    batch_op.drop_constraint(
                        "learning_paths_ibfk_1", type_="foreignkey"
                    )
                except:
                    pass  # Constraint có thể không tồn tại

                # Tạo constraint mới
                batch_op.create_foreign_key(
                    "learning_paths_ibfk_1",
                    "courses",
                    ["course_id"],
                    ["course_id"],
                    onupdate="CASCADE",
                    ondelete="CASCADE",
                )
        except Exception as e:
            print(f"Warning: Could not update learning_paths foreign key: {e}")

    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table("learning_paths", schema=None) as batch_op:
        batch_op.drop_constraint(None, type_="foreignkey")
        batch_op.create_foreign_key(
            batch_op.f("learning_paths_ibfk_1"),
            "course",
            ["course_id"],
            ["course_id"],
            onupdate="CASCADE",
            ondelete="CASCADE",
        )

    with op.batch_alter_table("classes", schema=None) as batch_op:
        batch_op.drop_constraint(None, type_="foreignkey")
        batch_op.create_foreign_key(
            batch_op.f("classes_ibfk_1"), "course", ["course_id"], ["course_id"]
        )

    op.create_table(
        "course",
        sa.Column(
            "course_id",
            mysql.VARCHAR(collation="utf8mb4_unicode_ci", length=10),
            nullable=False,
        ),
        sa.Column(
            "cou_course_id",
            mysql.VARCHAR(collation="utf8mb4_unicode_ci", length=10),
            nullable=True,
        ),
        sa.Column(
            "course_name",
            mysql.VARCHAR(collation="utf8mb4_unicode_ci", length=100),
            nullable=True,
        ),
        sa.Column(
            "course_description",
            mysql.VARCHAR(collation="utf8mb4_unicode_ci", length=1024),
            nullable=True,
        ),
        sa.Column(
            "course_code",
            mysql.VARCHAR(collation="utf8mb4_unicode_ci", length=15),
            nullable=True,
        ),
        sa.Column(
            "course_status",
            mysql.VARCHAR(collation="utf8mb4_unicode_ci", length=50),
            nullable=True,
        ),
        sa.ForeignKeyConstraint(
            ["cou_course_id"],
            ["course.course_id"],
            name=op.f("course_ibfk_1"),
            onupdate="RESTRICT",
            ondelete="RESTRICT",
        ),
        sa.PrimaryKeyConstraint("course_id"),
        mysql_collate="utf8mb4_unicode_ci",
        mysql_default_charset="utf8mb4",
        mysql_engine="InnoDB",
    )
    op.drop_table("courses")
    # ### end Alembic commands ###
