/**
 * ExportManager Module
 * Handles export to various formats (PNG, PDF, Excel, etc.)
 */

class ExportManager {
  constructor(gantt, options = {}) {
    this.gantt = gantt;
    this.options = options;
  }

  /**
   * Export to PNG
   * @param {string} filename - Output filename
   * @param {Object} styleSheet - Custom stylesheet
   * @returns {Promise<Blob>} PNG blob
   */
  async toPNG(filename = "gantt-chart", styleSheet = null) {
    const canvas = await this.toCanvas(styleSheet);
    const blob = await this.canvasToBlob(canvas, "image/png");

    if (filename) {
      this.downloadBlob(blob, `${filename}.png`);
    }

    return blob;
  }

  /**
   * Export to PDF
   * @param {string} filename - Output filename
   * @param {Object} options - PDF options
   * @returns {Promise<Blob>} PDF blob
   */
  async toPDF(filename = "gantt-chart", options = {}) {
    const canvas = await this.toCanvas(options.styleSheet);
    const imgData = canvas.toDataURL("image/png");

    // PDF generation requires external library
    // This is a placeholder that would use jsPDF or similar
    console.warn(
      "PDF export requires jsPDF library. Use toPNG for image export."
    );

    return null;
  }

  /**
   * Export to Excel/CSV
   * @param {string} filename - Output filename
   * @param {Object} options - Export options
   * @returns {Blob} CSV blob
   */
  toExcel(filename = "gantt-chart", options = {}) {
    const tasks = this.gantt.originalData || [];
    const columns = options.columns || [
      "id",
      "name",
      "start_date",
      "duration",
      "progress",
    ];
    const separator = options.separator || ",";

    // Build CSV
    const header = columns.join(separator);
    const rows = tasks.map((task) => {
      return columns
        .map((col) => {
          let value = task[col];
          if (value === undefined || value === null) {
            value = "";
          }
          if (typeof value === "string" && value.includes(separator)) {
            value = `"${value}"`;
          }
          return value;
        })
        .join(separator);
    });

    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });

    if (filename) {
      this.downloadBlob(blob, `${filename}.csv`);
    }

    return blob;
  }

  /**
   * Export to JSON
   * @param {string} filename - Output filename
   * @param {boolean} pretty - Pretty print JSON
   * @returns {Blob} JSON blob
   */
  toJSON(filename = "gantt-chart", pretty = true) {
    const data = {
      tasks: this.gantt.originalData || [],
      links: this.gantt.options?.links || [],
      exportDate: new Date().toISOString(),
      version: "1.0",
    };

    const json = pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
    const blob = new Blob([json], { type: "application/json" });

    if (filename) {
      this.downloadBlob(blob, `${filename}.json`);
    }

    return blob;
  }

  /**
   * Export to SVG
   * @param {string} filename - Output filename
   * @returns {Blob} SVG blob
   */
  toSVG(filename = "gantt-chart") {
    const { element } = this.gantt;
    const clone = element.cloneNode(true);

    // Get dimensions
    const width = element.scrollWidth;
    const height = element.scrollHeight;

    // Create SVG wrapper
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", width);
    svg.setAttribute("height", height);
    svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");

    // Create foreignObject to embed HTML
    const foreignObject = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "foreignObject"
    );
    foreignObject.setAttribute("width", "100%");
    foreignObject.setAttribute("height", "100%");
    foreignObject.appendChild(clone);

    svg.appendChild(foreignObject);

    // Get styles
    const styles = this.getComputedStyles();
    const styleElement = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "style"
    );
    styleElement.textContent = styles;
    svg.insertBefore(styleElement, svg.firstChild);

    const svgString = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgString], { type: "image/svg+xml" });

    if (filename) {
      this.downloadBlob(blob, `${filename}.svg`);
    }

    return blob;
  }

  /**
   * Convert element to canvas
   * @param {Object} styleSheet - Custom stylesheet
   * @returns {Promise<HTMLCanvasElement>} Canvas element
   */
  async toCanvas(styleSheet = null) {
    const { element } = this.gantt;
    const width = element.scrollWidth;
    const height = element.scrollHeight;

    // Create canvas
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");

    // Fill background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);

    // Convert HTML to image using foreignObject
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
        <style>${styleSheet || this.getComputedStyles()}</style>
        <foreignObject width="100%" height="100%">
          ${element.outerHTML}
        </foreignObject>
      </svg>
    `;

    const img = new Image();
    const svgBlob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    return new Promise((resolve, reject) => {
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);
        resolve(canvas);
      };
      img.onerror = (err) => {
        URL.revokeObjectURL(url);
        reject(err);
      };
      img.src = url;
    });
  }

  /**
   * Convert canvas to blob
   * @param {HTMLCanvasElement} canvas - Canvas element
   * @param {string} type - MIME type
   * @param {number} quality - Quality (0-1)
   * @returns {Promise<Blob>} Blob
   */
  canvasToBlob(canvas, type = "image/png", quality = 0.95) {
    return new Promise((resolve) => {
      canvas.toBlob(resolve, type, quality);
    });
  }

  /**
   * Get computed styles from gantt
   * @returns {string} CSS string
   */
  getComputedStyles() {
    const styles = [];

    // Get all stylesheets
    for (const sheet of document.styleSheets) {
      try {
        for (const rule of sheet.cssRules || sheet.rules) {
          styles.push(rule.cssText);
        }
      } catch (e) {
        // Cross-origin stylesheets may throw
        console.warn("Could not access stylesheet:", e);
      }
    }

    return styles.join("\n");
  }

  /**
   * Download blob as file
   * @param {Blob} blob - Blob to download
   * @param {string} filename - Filename
   */
  downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.style.display = "none";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => URL.revokeObjectURL(url), 100);
  }

  /**
   * Print gantt chart
   * @param {Object} options - Print options
   */
  print(options = {}) {
    const { element } = this.gantt;
    const printWindow = window.open("", "_blank");

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Gantt Chart</title>
        <style>
          ${this.getComputedStyles()}
          @media print {
            body { margin: 0; }
            .js-gantt { width: 100%; }
          }
        </style>
      </head>
      <body>
        ${element.outerHTML}
        <script>
          window.onload = function() {
            window.print();
            ${options.closeAfterPrint ? "window.close();" : ""}
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  }

  /**
   * Get export formats
   * @returns {string[]} Available formats
   */
  getAvailableFormats() {
    return ["png", "pdf", "csv", "excel", "json", "svg"];
  }

  /**
   * Export to specified format
   * @param {string} format - Export format
   * @param {string} filename - Filename
   * @param {Object} options - Export options
   * @returns {Promise<Blob>} Exported blob
   */
  async export(format, filename = "gantt-chart", options = {}) {
    switch (format.toLowerCase()) {
      case "png":
        return this.toPNG(filename, options.styleSheet);
      case "pdf":
        return this.toPDF(filename, options);
      case "csv":
      case "excel":
        return this.toExcel(filename, options);
      case "json":
        return this.toJSON(filename, options.pretty);
      case "svg":
        return this.toSVG(filename);
      default:
        throw new Error(`Unknown export format: ${format}`);
    }
  }
}

export { ExportManager };
