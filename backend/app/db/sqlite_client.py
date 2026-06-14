import sqlite3
from app.utils.path_helper import get_data_root

def get_connection():
    return sqlite3.connect(os.path.join(get_data_root(), "noteflow.db"))
