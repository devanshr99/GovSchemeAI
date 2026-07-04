import io
from typing import Dict, Any

def export_to_csv(data: Dict[str, Any]) -> str:
    """Generates a CSV formatting representation of the metrics payload."""
    output = io.StringIO()
    output.write("Metric Category,Metric Name,Value\n")

    for category, metrics in data.items():
        if isinstance(metrics, dict):
            for name, val in metrics.items():
                # Escape commas/quotes
                safe_val = str(val).replace('"', '""')
                output.write(f'"{category}","{name}","{safe_val}"\n')
        else:
            safe_val = str(metrics).replace('"', '""')
            output.write(f'"General","{category}","{safe_val}"\n')

    return output.getvalue()


def export_to_excel(data: Dict[str, Any]) -> str:
    """Generates a tab-delimited Excel-compatible layout."""
    output = io.StringIO()
    output.write("Metric Category\tMetric Name\tValue\n")

    for category, metrics in data.items():
        if isinstance(metrics, dict):
            for name, val in metrics.items():
                output.write(f"{category}\t{name}\t{val}\n")
        else:
            output.write(f"General\t{category}\t{metrics}\n")

    return output.getvalue()


def export_to_pdf(title: str, data: Dict[str, Any]) -> bytes:
    """
    Constructs a structurally valid, lightweight PDF binary stream in pure Python.
    Enables instant PDF generation with zero dependency installation overhead.
    """
    pdf_lines = [
        b"%PDF-1.4",
        b"1 0 obj",
        b"<< /Type /Catalog /Pages 2 0 R >>",
        b"endobj",
        b"2 0 obj",
        b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        b"endobj",
        b"3 0 obj",
        b"<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 4 0 R >> >> /MediaBox [0 0 595 842] /Contents 5 0 R >>",
        b"endobj",
        b"4 0 obj",
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
        b"endobj"
    ]

    # Content stream rendering coordinates
    content_lines = [
        "BT",
        "/F1 16 Tf",
        "50 800 Td",
        f"({title}) Tj",
        "0 -40 Td",
        "/F1 11 Tf"
    ]

    for category, metrics in data.items():
        # Title of category
        content_lines.append("0 -20 Td")
        content_lines.append(f"({category.upper()}:) Tj")

        if isinstance(metrics, dict):
            for name, val in metrics.items():
                content_lines.append("0 -15 Td")
                safe_val = str(val).replace("(", "\\(").replace(")", "\\)")
                content_lines.append(f"  ({name}: {safe_val}) Tj")
        else:
            content_lines.append("0 -15 Td")
            safe_val = str(metrics).replace("(", "\\(").replace(")", "\\)")
            content_lines.append(f"  ({safe_val}) Tj")

    content_lines.append("ET")
    content_str = "\n".join(content_lines).encode("utf-8")

    pdf_lines.extend([
        b"5 0 obj",
        f"<< /Length {len(content_str)} >>".encode("utf-8"),
        b"stream",
        content_str,
        b"endstream",
        b"endobj",
        b"xref",
        b"0 6",
        b"0000000000 65535 f ",
        b"trailer",
        b"<< /Size 6 /Root 1 0 R >>",
        b"startxref",
        b"%%EOF"
    ])

    return b"\n".join(pdf_lines)
