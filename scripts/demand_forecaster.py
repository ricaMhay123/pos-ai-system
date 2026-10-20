#!/usr/bin/env python3
"""
Convenience entry point for Phase 3.2: ML Demand Forecasting.
Runs apps/ml-service/demand_forecaster.py.
"""

import sys
import subprocess
from pathlib import Path

def main():
    target_script = Path(__file__).resolve().parent.parent / "apps" / "ml-service" / "demand_forecaster.py"
    cmd = [sys.executable, str(target_script)] + sys.argv[1:]
    res = subprocess.run(cmd)
    sys.exit(res.returncode)

if __name__ == "__main__":
    main()
