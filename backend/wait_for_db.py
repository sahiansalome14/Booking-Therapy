import os
import time
import sys
import django
from django.db import connections
from django.db.utils import OperationalError

def main():
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
    print("⏳ Waiting for database to become available...")
    try:
        django.setup()
    except Exception as e:
        print(f"❌ Django setup failed: {e}", file=sys.stderr)
        sys.exit(1)

    for i in range(30):
        try:
            # Intentar establecer conexión y abrir un cursor
            connections['default'].cursor()
            print("🚀 Database is ready and accepting connections!")
            sys.exit(0)
        except OperationalError as e:
            print(f"⚠️ Database not ready yet (attempt {i+1}/30): {e}")
            time.sleep(2)
        except Exception as e:
            print(f"❌ Unexpected error connecting to database: {e}", file=sys.stderr)
            sys.exit(1)

    print("❌ Timeout: Database was not ready in time.", file=sys.stderr)
    sys.exit(1)

if __name__ == "__main__":
    main()
