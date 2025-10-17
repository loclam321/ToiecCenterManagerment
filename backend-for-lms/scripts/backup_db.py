"""
Script backup database trước khi test
Chạy: python scripts/backup_db.py
"""

import shutil
import os
from datetime import datetime

def backup_database():
    """Backup database file"""
    
    # Paths
    src = 'instance/lms.db'
    backup_dir = 'backups'
    
    # Create backup directory if not exists
    if not os.path.exists(backup_dir):
        os.makedirs(backup_dir)
        print(f"✅ Đã tạo thư mục backup: {backup_dir}")
    
    # Create backup filename with timestamp
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    dst = os.path.join(backup_dir, f'lms_backup_{timestamp}.db')
    
    # Check if source exists
    if not os.path.exists(src):
        print(f"❌ Không tìm thấy database: {src}")
        return False
    
    # Copy file
    try:
        shutil.copy2(src, dst)
        file_size = os.path.getsize(dst) / (1024 * 1024)  # MB
        print(f"\n✅ Backup thành công!")
        print(f"   Source: {src}")
        print(f"   Destination: {dst}")
        print(f"   Size: {file_size:.2f} MB")
        print(f"   Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        return True
    except Exception as e:
        print(f"❌ Lỗi khi backup: {str(e)}")
        return False

def list_backups():
    """List all backups"""
    backup_dir = 'backups'
    
    if not os.path.exists(backup_dir):
        print("⚠️  Chưa có backup nào")
        return
    
    backups = [f for f in os.listdir(backup_dir) if f.endswith('.db')]
    
    if not backups:
        print("⚠️  Chưa có backup nào")
        return
    
    print(f"\n📁 Danh sách backups ({len(backups)} files):")
    print("="*70)
    
    for backup in sorted(backups, reverse=True):
        filepath = os.path.join(backup_dir, backup)
        size = os.path.getsize(filepath) / (1024 * 1024)
        mtime = datetime.fromtimestamp(os.path.getmtime(filepath))
        print(f"   {backup:40} | {size:6.2f} MB | {mtime.strftime('%Y-%m-%d %H:%M')}")
    
    print("="*70)

if __name__ == '__main__':
    print("\n🔄 DATABASE BACKUP UTILITY")
    print("="*70)
    
    # List existing backups
    list_backups()
    
    # Create new backup
    print("\n🆕 Tạo backup mới...")
    backup_database()
