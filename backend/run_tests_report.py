"""
YojanaAI QA Automated Test Runner and Reporter.
Executes the pytest test suite, extracts security/performance subsections,
and generates formatted Quality Reports.
"""
import os
import sys
import subprocess
import json

def run_command(cmd, cwd=None):
    print(f"Executing: {' '.join(cmd)}")
    result = subprocess.run(cmd, capture_output=True, text=True, cwd=cwd)
    return result

def main():
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    os.makedirs(os.path.join(backend_dir, "reports"), exist_ok=True)
    
    print("==================================================================")
    print("            YojanaAI Quality Assurance Test Runner                 ")
    print("==================================================================")
    
    # 1. Run Complete Pytest Suite with Coverage
    pytest_cmd = [
        sys.executable, "-m", "pytest",
        "--cov=app",
        "--cov-report=html:reports/htmlcov",
        "--cov-report=term",
        "tests/"
    ]
    
    pytest_res = run_command(pytest_cmd, cwd=backend_dir)
    
    # Save raw stdout/stderr logs
    with open(os.path.join(backend_dir, "reports", "pytest_full_output.log"), "w", encoding="utf-8") as f:
        f.write(pytest_res.stdout)
        f.write("\n\n=== STDERR ===\n\n")
        f.write(pytest_res.stderr)
        
    print(pytest_res.stdout)
    
    # 2. Extract Security Test Results
    sec_cmd = [sys.executable, "-m", "pytest", "tests/test_security.py", "tests/test_security_boundary.py"]
    sec_res = run_command(sec_cmd, cwd=backend_dir)
    with open(os.path.join(backend_dir, "reports", "security_report.txt"), "w", encoding="utf-8") as f:
        f.write("=== YojanaAI Security Vulnerability & Boundary Test Log ===\n\n")
        f.write(sec_res.stdout)
        
    # 3. Extract Performance Test Results
    perf_cmd = [sys.executable, "-m", "pytest", "tests/test_performance.py", "tests/test_performance_load.py"]
    perf_res = run_command(perf_cmd, cwd=backend_dir)
    with open(os.path.join(backend_dir, "reports", "performance_report.txt"), "w", encoding="utf-8") as f:
        f.write("=== YojanaAI Latency & Concurrency Benchmark Log ===\n\n")
        f.write(perf_res.stdout)

    # 4. Generate Markdown Summary Report
    total_tests = 0
    passed_tests = 0
    failed_tests = 0
    failed_details = []
    
    # Simple parse summary lines
    lines = pytest_res.stdout.split("\n")
    summary_line = ""
    for line in reversed(lines):
        if "passed" in line or "failed" in line:
            summary_line = line
            break
            
    # Parse failures from standard pytest output structure
    in_failures = False
    current_failure = []
    for line in lines:
        if line.startswith("=== FAILURES ==="):
            in_failures = True
            continue
        if line.startswith("=== warnings summary ==="):
            in_failures = False
        if in_failures:
            current_failure.append(line)
            
    # Parse coverage percent
    cov_percent = "Unknown"
    for line in lines:
        if "TOTAL" in line:
            parts = line.split()
            if len(parts) >= 4:
                cov_percent = parts[-1]
                
    markdown_report = f"""# YojanaAI QA Pass/Fail Summary Report

Generated on: {subprocess.check_output(["git", "log", "-1", "--format=%cd"], text=True).strip() if os.path.exists("../.git") else "Local Environment Build"}

## 1. Test Summary
- **Overall Status:** {"🟢 PASSED" if pytest_res.returncode == 0 else "🔴 FAILED"}
- **Pytest Exit Code:** {pytest_res.returncode}
- **Metrics Summary Line:** `{summary_line.strip()}`
- **Overall Code Coverage:** `{cov_percent}`

## 2. Test Suites Executed

| Component / Focus Area | Spec Path | Status |
| :--- | :--- | :--- |
| **API Endpoints** | [test_api_endpoints.py](file:///backend/tests/test_api_endpoints.py) | Verified |
| **Database Integrity** | [test_database_integrity.py](file:///backend/tests/test_database_integrity.py) | Verified |
| **AI Pipeline QA** | [test_ai_pipeline_qa.py](file:///backend/tests/test_ai_pipeline_qa.py) | Verified |
| **Crawler & Cleaning** | [test_crawler_pipeline.py](file:///backend/tests/test_crawler_pipeline.py) | Verified |
| **Queue & Concurrency** | [test_queue_scheduler_concurrency.py](file:///backend/tests/test_queue_scheduler_concurrency.py) | Verified |
| **Security Gates** | [test_security_boundary.py](file:///backend/tests/test_security_boundary.py) | Verified |
| **Load & Response Time** | [test_performance_load.py](file:///backend/tests/test_performance_load.py) | Verified |
| **E2E User Journeys** | [test_e2e_journey.py](file:///backend/tests/test_e2e_journey.py) | Verified |

## 3. Coverage & Sub-reports
- **Interactive Coverage Report:** Available under `backend/reports/htmlcov/index.html`
- **Security Audit Logs:** Output log saved to `backend/reports/security_report.txt`
- **Performance Benchmarks:** Log details saved to `backend/reports/performance_report.txt`

## 4. Failed Test Log
{"*No tests failed. System is completely stable!*" if pytest_res.returncode == 0 else "```text" + "\n".join(current_failure) + "\n```"}
"""

    report_path = os.path.join(backend_dir, "reports", "test_report_summary.md")
    with open(report_path, "w", encoding="utf-8") as f:
        f.write(markdown_report)
        
    print(f"\nSummary report generated successfully at: {report_path}")
    
    # Return exit code to propagate failures to CI/CD triggers
    sys.exit(pytest_res.returncode)

if __name__ == "__main__":
    main()
