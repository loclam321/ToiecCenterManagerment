"""Initial migration with all models

Revision ID: 5f21576acf92
Revises: 
Create Date: 2025-10-07 09:24:14.722788

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '5f21576acf92'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # Sửa từ 'course' thành 'courses'
    op.create_table('courses',
    sa.Column('course_id', sa.String(length=10), nullable=False),
    sa.Column('course_code', sa.String(length=32), nullable=True),  # Sửa length
    sa.Column('course_name', sa.String(length=100), nullable=False),  # Thêm nullable=False
    sa.Column('course_description', sa.Text(), nullable=True),  # Sửa từ String sang Text
    sa.Column('target_score', sa.SMALLINT(), nullable=True),
    sa.Column('level', sa.Enum('BEGINNER', 'INTERMEDIATE', 'ADVANCED', name='course_level_enum'), nullable=True),
    sa.Column('mode', sa.Enum('ONLINE', 'OFFLINE', 'HYBRID', name='course_mode_enum'), nullable=True, default='OFFLINE'),
    sa.Column('schedule_text', sa.String(length=120), nullable=True),
    sa.Column('start_date', sa.Date(), nullable=True),
    sa.Column('end_date', sa.Date(), nullable=True),
    sa.Column('session_count', sa.SMALLINT(), nullable=True),
    sa.Column('total_hours', sa.SMALLINT(), nullable=True),
    sa.Column('tuition_fee', sa.DECIMAL(precision=12, scale=2), nullable=True),
    sa.Column('capacity', sa.SMALLINT(), nullable=True),
    sa.Column('status', sa.Enum('DRAFT', 'OPEN', 'RUNNING', 'CLOSED', 'ARCHIVED', name='course_status_enum'), nullable=False, server_default='OPEN'),
    sa.Column('is_deleted', sa.TINYINT(), nullable=False, server_default='0'),
    sa.Column('teacher_id', sa.String(length=10), nullable=True),
    sa.Column('learning_path_id', sa.String(length=10), nullable=True),
    sa.Column('campus_id', sa.String(length=10), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
    sa.PrimaryKeyConstraint('course_id'),
    sa.UniqueConstraint('course_code'),
    sa.CheckConstraint('tuition_fee >= 0', name='chk_course_tuition_nonneg'),
    sa.CheckConstraint('capacity IS NULL OR capacity >= 0', name='chk_course_capacity_nonneg'),
    sa.CheckConstraint('(start_date IS NULL AND end_date IS NULL) OR (start_date <= end_date)', name='chk_course_dates_valid')
    )
    
    # Và sửa tất cả các reference từ 'course.course_id' thành 'courses.course_id'
    op.create_table('part',
    sa.Column('part_id', sa.Integer(), nullable=False),
    sa.Column('part_code', sa.String(length=10), nullable=False),
    sa.Column('part_name', sa.String(length=10), nullable=False),
    sa.Column('part_section', sa.String(length=10), nullable=False),
    sa.Column('part_order_in_test', sa.Integer(), nullable=False),
    sa.PrimaryKeyConstraint('part_id')
    )
    op.create_table('rooms',
    sa.Column('room_id', sa.Integer(), nullable=False),
    sa.Column('room_name', sa.String(length=50), nullable=True),
    sa.Column('room_capacity', sa.Integer(), nullable=True),
    sa.Column('room_type', sa.String(length=50), nullable=True),
    sa.Column('room_location', sa.String(length=100), nullable=True),
    sa.Column('room_status', sa.String(length=20), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
    sa.PrimaryKeyConstraint('room_id')
    )
    op.create_table('students',
    sa.Column('user_id', sa.String(length=10), nullable=False),
    sa.Column('user_name', sa.String(length=100), nullable=True),
    sa.Column('user_password', sa.String(length=255), nullable=True),
    sa.Column('user_gender', sa.String(length=1), nullable=True),
    sa.Column('user_email', sa.String(length=100), nullable=True),
    sa.Column('user_birthday', sa.Date(), nullable=True),
    sa.Column('user_telephone', sa.String(length=15), nullable=True),
    sa.Column('sd_startlv', sa.String(length=100), nullable=True),
    sa.Column('sd_enrollmenttdate', sa.Date(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('is_email_verified', sa.Boolean(), nullable=False),
    sa.PrimaryKeyConstraint('user_id')
    )
    op.create_table('teachers',
    sa.Column('user_id', sa.String(length=10), nullable=False),
    sa.Column('user_name', sa.String(length=100), nullable=True),
    sa.Column('user_password', sa.String(length=255), nullable=True),
    sa.Column('user_gender', sa.String(length=1), nullable=True),
    sa.Column('user_email', sa.String(length=100), nullable=True),
    sa.Column('user_birthday', sa.Date(), nullable=True),
    sa.Column('user_telephone', sa.String(length=15), nullable=True),
    sa.Column('tch_specialization', sa.String(length=100), nullable=True),
    sa.Column('tch_qualification', sa.String(length=100), nullable=True),
    sa.Column('tch_hire_date', sa.Date(), nullable=True),
    sa.Column('tch_avtlink', sa.String(length=255), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
    sa.PrimaryKeyConstraint('user_id')
    )
    op.create_table('tests',
    sa.Column('test_id', sa.Integer(), nullable=False),
    sa.Column('test_name', sa.String(length=100), nullable=True),
    sa.Column('test_description', sa.Text(), nullable=True),
    sa.Column('test_duration_min', sa.Integer(), nullable=True),
    sa.Column('test_total_questions', sa.DateTime(), nullable=True),
    sa.Column('test_status', sa.DateTime(), nullable=True),
    sa.PrimaryKeyConstraint('test_id')
    )
    op.create_table('users',
    sa.Column('user_id', sa.String(length=10), nullable=False),
    sa.Column('user_name', sa.String(length=100), nullable=True),
    sa.Column('user_password', sa.String(length=255), nullable=True),
    sa.Column('user_gender', sa.String(length=1), nullable=True),
    sa.Column('user_email', sa.String(length=100), nullable=True),
    sa.Column('user_birthday', sa.Date(), nullable=True),
    sa.Column('user_telephone', sa.String(length=15), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('user_type', sa.String(length=20), nullable=True),
    sa.PrimaryKeyConstraint('user_id')
    )
    op.create_table('words',
    sa.Column('w_index', sa.Integer(), nullable=False),
    sa.Column('w_english', sa.String(length=100), nullable=True),
    sa.Column('w_vietnamese', sa.String(length=100), nullable=True),
    sa.Column('w_englishmean', sa.String(length=255), nullable=True),
    sa.Column('w_vietnamesemean', sa.String(length=255), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
    sa.PrimaryKeyConstraint('w_index')
    )
    op.create_table('classes',
    sa.Column('class_id', sa.Integer(), nullable=False),
    sa.Column('course_id', sa.String(length=10), nullable=False),
    sa.Column('class_name', sa.String(length=100), nullable=True),
    sa.Column('class_startdate', sa.Date(), nullable=True),
    sa.Column('class_enddate', sa.Date(), nullable=True),
    sa.Column('class_maxstudents', sa.Integer(), nullable=True),
    sa.Column('class_currentenrollment', sa.Integer(), nullable=True),
    sa.Column('class_status', sa.String(length=30), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
    sa.ForeignKeyConstraint(['course_id'], ['courses.course_id'], ),
    sa.PrimaryKeyConstraint('class_id')
    )
    op.create_table('items',
    sa.Column('item_id', sa.Integer(), nullable=False),
    sa.Column('part_id', sa.Integer(), nullable=False),
    sa.Column('test_id', sa.Integer(), nullable=True),
    sa.Column('item_group_key', sa.String(length=50), nullable=True),
    sa.Column('item_stimulus_text', sa.Text(), nullable=True),
    sa.Column('item_question_text', sa.Text(), nullable=True),
    sa.Column('item_image_path', sa.String(length=255), nullable=True),
    sa.Column('item_audio_path', sa.String(length=255), nullable=True),
    sa.Column('item_order_in_part', sa.Integer(), nullable=False),
    sa.ForeignKeyConstraint(['part_id'], ['part.part_id'], onupdate='RESTRICT', ondelete='RESTRICT'),
    sa.ForeignKeyConstraint(['test_id'], ['tests.test_id'], onupdate='RESTRICT', ondelete='RESTRICT'),
    sa.PrimaryKeyConstraint('item_id')
    )
    op.create_table('learning_paths',
    sa.Column('course_id', sa.String(length=10), nullable=False),
    sa.Column('lp_id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('lp_name', sa.String(length=100), nullable=True),
    sa.Column('lp_desciption', sa.Text(), nullable=True),
    sa.Column('lp_summary', sa.Text(), nullable=True),
    sa.Column('program_outline_json', sa.Text(), nullable=True),
    sa.Column('highlights_json', sa.Text(), nullable=True),
    sa.Column('intro_video_url', sa.String(length=255), nullable=True),
    sa.Column('thumbnail_url', sa.String(length=255), nullable=True),
    sa.Column('banner_url', sa.String(length=255), nullable=True),
    sa.Column('published_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
    sa.ForeignKeyConstraint(['course_id'], ['courses.course_id'], onupdate='CASCADE', ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('course_id')
    )
    with op.batch_alter_table('learning_paths', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_learning_paths_lp_id'), ['lp_id'], unique=True)

    op.create_table('student_words',
    sa.Column('user_id', sa.String(length=10), nullable=False),
    sa.Column('w_index', sa.Integer(), nullable=False),
    sa.Column('learned_date', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.Column('proficiency_level', sa.Integer(), nullable=True),
    sa.Column('last_reviewed', sa.DateTime(timezone=True), nullable=True),
    sa.ForeignKeyConstraint(['user_id'], ['students.user_id'], ),
    sa.ForeignKeyConstraint(['w_index'], ['words.w_index'], ),
    sa.PrimaryKeyConstraint('user_id', 'w_index')
    )
    op.create_table('choices',
    sa.Column('choice_id', sa.Integer(), nullable=False),
    sa.Column('item_id', sa.Integer(), nullable=False),
    sa.Column('choice_label', sa.String(length=1), nullable=False),
    sa.Column('choice_content', sa.Text(), nullable=False),
    sa.Column('choice_is_correct', sa.Boolean(), nullable=False),
    sa.ForeignKeyConstraint(['item_id'], ['items.item_id'], onupdate='RESTRICT', ondelete='RESTRICT'),
    sa.PrimaryKeyConstraint('choice_id')
    )
    op.create_table('enrollments',
    sa.Column('user_id', sa.String(length=10), nullable=False),
    sa.Column('class_id', sa.Integer(), nullable=False),
    sa.Column('enrolled_date', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.Column('last_activity_date', sa.DateTime(timezone=True), nullable=True),
    sa.Column('status', sa.String(length=20), nullable=True),
    sa.ForeignKeyConstraint(['class_id'], ['classes.class_id'], ),
    sa.ForeignKeyConstraint(['user_id'], ['students.user_id'], ),
    sa.PrimaryKeyConstraint('user_id', 'class_id')
    )
    op.create_table('lesson',
    sa.Column('ls_id', sa.Integer(), nullable=False),
    sa.Column('lp_id', sa.Integer(), nullable=True),
    sa.Column('part_id', sa.Integer(), nullable=True),
    sa.Column('ls_name', sa.String(length=150), nullable=True),
    sa.Column('ls_link', sa.String(length=255), nullable=True),
    sa.Column('ls_date', sa.Date(), nullable=True),
    sa.ForeignKeyConstraint(['lp_id'], ['learning_paths.lp_id'], onupdate='RESTRICT', ondelete='RESTRICT'),
    sa.ForeignKeyConstraint(['part_id'], ['part.part_id'], onupdate='RESTRICT', ondelete='RESTRICT'),
    sa.PrimaryKeyConstraint('ls_id')
    )
    op.create_table('schedules',
    sa.Column('schedule_id', sa.Integer(), nullable=False),
    sa.Column('room_id', sa.Integer(), nullable=False),
    sa.Column('class_id', sa.Integer(), nullable=False),
    sa.Column('user_id', sa.String(length=10), nullable=False),
    sa.Column('schedule_date', sa.Date(), nullable=True),
    sa.Column('schedule_startime', sa.Time(), nullable=True),
    sa.Column('schedule_endtime', sa.Time(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
    sa.ForeignKeyConstraint(['class_id'], ['classes.class_id'], ),
    sa.ForeignKeyConstraint(['room_id'], ['rooms.room_id'], ),
    sa.ForeignKeyConstraint(['user_id'], ['teachers.user_id'], ),
    sa.PrimaryKeyConstraint('schedule_id')
    )
    op.create_table('attempts',
    sa.Column('att_id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('test_id', sa.Integer(), nullable=False),
    sa.Column('user_id', sa.String(length=10), nullable=False),
    sa.Column('class_id', sa.Integer(), nullable=False),
    sa.Column('att_started_at', sa.DateTime(), nullable=True),
    sa.Column('att_submitted_at', sa.DateTime(), nullable=True),
    sa.Column('att_raw_score', sa.Integer(), nullable=True),
    sa.Column('att_scaled_listening', sa.Integer(), nullable=True),
    sa.Column('att_scaled_reading', sa.Integer(), nullable=True),
    sa.Column('att_status', sa.String(length=12), nullable=True),
    sa.Column('att_responses_json', sa.String(length=10), nullable=True),
    sa.ForeignKeyConstraint(['test_id'], ['tests.test_id'], onupdate='RESTRICT', ondelete='RESTRICT'),
    sa.ForeignKeyConstraint(['user_id', 'class_id'], ['enrollments.user_id', 'enrollments.class_id'], onupdate='RESTRICT', ondelete='RESTRICT'),
    sa.PrimaryKeyConstraint('att_id')
    )
    op.create_table('vocalbulary',
    sa.Column('vc_index', sa.Integer(), nullable=False),
    sa.Column('ls_id', sa.Integer(), nullable=False),
    sa.Column('vc_english', sa.String(length=100), nullable=True),
    sa.Column('vc_vietnamese', sa.String(length=100), nullable=True),
    sa.Column('vc_englishmean', sa.String(length=255), nullable=True),
    sa.Column('vc_vietnamesemean', sa.String(length=255), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
    sa.ForeignKeyConstraint(['ls_id'], ['lesson.ls_id'], ),
    sa.PrimaryKeyConstraint('vc_index')
    )
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_table('vocalbulary')
    op.drop_table('attempts')
    op.drop_table('schedules')
    op.drop_table('lesson')
    op.drop_table('enrollments')
    op.drop_table('choices')
    op.drop_table('student_words')
    with op.batch_alter_table('learning_paths', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_learning_paths_lp_id'))

    op.drop_table('learning_paths')
    op.drop_table('items')
    op.drop_table('classes')
    op.drop_table('words')
    op.drop_table('users')
    op.drop_table('tests')
    op.drop_table('teachers')
    op.drop_table('students')
    op.drop_table('rooms')
    op.drop_table('part')
    op.drop_table('courses')
    # ### end Alembic commands ###
