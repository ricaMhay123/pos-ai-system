#!/usr/bin/env python3
"""
Convenience entry point for Phase 3.1: AI Data Pipeline Setup.
Runs the standalone extraction script located in apps/ml-service/extract_sales_data.py.
"""

import sys
import subprocess
from pathlib import Path

def main():
    target_script = Path(__file__).resolve().parent.parent / "apps" / "ml-service" / "extract_sales_data.py"
    cmd = [sys.executable, str(target_script)] + sys.argv[1:]
    res = subprocess.run(cmd)
    sys.exit(res.returncode)

if __name__ == "__main__":
    main()
