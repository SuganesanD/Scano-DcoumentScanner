import { Component, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import * as Mammoth from 'mammoth';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import jsPDF from 'jspdf';
import { PdfViewerModule } from 'ng2-pdf-viewer';
import { saveAs } from 'file-saver';
import { Document, Packer, Paragraph } from 'docx';
import { CouchService } from '../../Services/couch.service';
import * as d3 from 'd3';
import { style } from '@angular/animations';
import { SidebarComponent } from "../sidebar/sidebar.component";

@Component({
  selector: 'app-file-history',
  standalone: true,
  imports: [FormsModule, HttpClientModule, CommonModule, PdfViewerModule, SidebarComponent],
  templateUrl: './file-history.component.html',
  styleUrl: './file-history.component.css'
})
export class FileHistoryComponent implements OnInit {

  user_id: string = localStorage.getItem("userId")!;
  getdata: any[] = [];
  selectedContent: any = null;
  contentType: string = '';
  today: Date = new Date();
  showselectformatvariable: boolean = false;
  selectedFormat: any;
  summarizedcontent: any;
  content: string = '';
  fileType: string = '';
  fileName: string = '';
  downloadfile: boolean = false;
  selectedDateFilter: string = 'all'; // Default filter to show all documents
  filteredData: any[] = [];


  constructor(private data: CouchService, private sanitizer: DomSanitizer) { }

  ngOnInit(): void {
    this.getDocuments();
  }

  getDocuments(): void {
    console.log(this.user_id);

    this.data.get_document(this.user_id).subscribe({
      next: (response: any) => {
        console.log(response);

        if (response && response.rows && response.rows.length > 0) {
          this.getdata = response.rows.map((row: any, index: number) => {
            const attachments = row.doc._attachments || {};
            const attachmentKeys = Object.keys(attachments);

            let fileContent: any = null;
            let fileType: string | null = null;
            let decodedContent: any = null;
            let contentType: string = '';

            if (attachmentKeys.length > 0) {
              const firstAttachmentKey = attachmentKeys[0];
              const firstAttachment = attachments[firstAttachmentKey];

              fileType = firstAttachment.content_type;
              fileContent = firstAttachment.data;

              if (fileType?.includes('image')) {
                decodedContent = this.sanitizer.bypassSecurityTrustUrl(`data:${fileType};base64,${fileContent}`);
                contentType = 'image';
              } else if (fileType?.includes('pdf')) {
                decodedContent = this.sanitizer.bypassSecurityTrustResourceUrl(`data:${fileType};base64,${fileContent}`);
                contentType = 'pdf';
              } else if (fileType?.includes('text') || fileType?.includes('plain')) {
                decodedContent = this.decodeBase64Unicode(fileContent);
                contentType = 'text';
              } else if (fileType?.includes('word') || fileType?.includes('msword') || fileType?.includes('vnd.openxmlformats-officedocument.wordprocessingml.document')) {
                decodedContent = fileContent;
                contentType = 'doc';
              } else {
                decodedContent = 'Unsupported format';
                contentType = 'unknown';
              }
            }

            return {
              index: index + 1,
              document_name: row.doc.data.uploaded_document_name || attachmentKeys[0] || 'Unknown',
              summarized_document_name: row.doc.data.summarized_document_name || 'No summary available',
              summarized_document_content: row.doc.data.summarized_document_content,
              date: row.doc.data.date || 'N/A',
              file: fileContent,
              fileType: fileType,
              decodedContent: decodedContent,
              contentType: contentType
            };

          });
          this.applyDateFilter();
        } else {
          this.getdata = [];
        }
        const formatCounts = this.processData(this.getdata);
        this.createPieChart(formatCounts);
        this.sortDocuments()
        this.createLineChart(formatCounts)
      },
      error: (error) => {
        console.error('Error fetching documents:', error);
        alert('An error occurred while fetching documents,Make sure you login in !');
      }
    });
  }

  sortOrder: 'asc' | 'desc' = 'asc';

  toggleSortOrder() {
    this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    this.sortDocuments()
  }



  sortDocuments() {
    this.filteredData.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return this.sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });
  }

  applyDateFilter() {
    const today = new Date();
    let startDate: Date | null = null;

    if (this.selectedDateFilter === 'last3days') {
      startDate = new Date();
      startDate.setDate(today.getDate() - 3);
    } else if (this.selectedDateFilter === 'last7days') {
      startDate = new Date();
      startDate.setDate(today.getDate() - 7);
    } else if (this.selectedDateFilter === 'last30days') {
      startDate = new Date();
      startDate.setDate(today.getDate() - 30);
    }

    if (startDate) {
      this.filteredData = this.getdata.filter(doc => {
        const docDate = new Date(doc.date); // Convert stored date to Date object
        return docDate >= startDate && docDate <= today;
      });
    } else {
      this.filteredData = [...this.getdata]; // Show all documents if "All Documents" is selected
    }
    const filteredFormatCounts = this.processData(this.filteredData);
    // this.createPieChart(filteredFormatCounts);
    this.createLineChart(filteredFormatCounts);

  
  }




  processData(data: any[]) {
    const formatCounts: { [key: string]: number } = {};

    data.forEach(doc => {
      const format = doc.contentType; // Get content type (pdf, text, image, doc)
      if (format) {
        formatCounts[format] = (formatCounts[format] || 0) + 1;
      }
    });

    return Object.entries(formatCounts).map(([format, count]) => ({
      format,
      count
    }));
  }



  createPieChart(data: { format: string; count: number }[]) {
    const heading = "activities";
    d3.select("#chart").selectAll("*").remove();


    const container = document.getElementById("chart");
    if (!container) return;

    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight || 300;

    const width = containerWidth;
    const height = containerHeight;
    const radius = Math.min(width, height) / 3; // Adjust to fit in the center
    const innerRadius = radius - 30;

    const svg = d3.select("#chart")
        .append("svg")
        .attr("width", width)
        .attr("height", height + 80) // Extra height for the legend
        .append("g")
        .attr("transform", `translate(${width / 2}, ${height / 2 - 20})`)
        .style("background-color","#FFF") ; // Center the pie chart
       

    // Define color mapping
    const colorMap: { [key: string]: string } = {
        pdf: "#9BBFE0",
        text: "#E8A45A",
        image: "#3380ff",
        doc: "#FBE45F",
        unknown: "#C6D68F"
    };

    const pie = d3.pie<{ format: string; count: number }>().value(d => d.count);

    const arc = d3.arc<d3.PieArcDatum<{ format: string; count: number }>>()
        .innerRadius(innerRadius)
        .outerRadius(radius);

    const arcExpanded = d3.arc<d3.PieArcDatum<{ format: string; count: number }>>()
        .innerRadius(innerRadius)
        .outerRadius(radius + 10); // Expand slice on hover

    const arcs = svg.selectAll(".arc")
        .data(pie(data))
        .enter()
        .append("g")
        .attr("class", "arc");

    // **Tooltip**
    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("background", "black")
        .style("color", "white")
        .style("padding", "8px")
        .style("border-radius", "5px")
        .style("display", "none")
        .style("transition", "opacity 0.2s ease")
        .style("pointer-events", "none");

    // **Draw pie slices with animation**
    arcs.append("path")
        .attr("fill", d => colorMap[d.data.format] || "#000000")
        .transition()
        .ease(d3.easeBounceOut)
        .duration(1000)
        .attrTween("d", function (d) {
            const i = d3.interpolate({ startAngle: 0, endAngle: 0 }, d);
            return function (t) {
                return arc(i(t))!;
            };
        });

    // **Hover effect: expand slice**
    arcs.select("path")
        .on("mouseover", function (event, d) {
            d3.select(this)
                .transition()
                .duration(200)
                .attr("d", arcExpanded(d)); // Expand slice

            tooltip.style("display", "block")
                .html(`<strong>${d.data.format}</strong>: ${d.data.count} files`)
                .style("left", `${event.pageX + 15}px`)
                .style("top", `${event.pageY - 25}px`)
                .style("opacity", "1");
        })
        .on("mousemove", function (event) {
            tooltip.style("left", `${event.pageX + 15}px`)
                .style("top", `${event.pageY - 25}px`);
        })
        .on("mouseout", function (event, d) {
            d3.select(this)
                .transition()
                .duration(200)
                .attr("d", arc(d)); // Restore to original size

            tooltip.style("opacity", "0").style("display", "none");
        });

    // **Legend (Centered Below in Vertical Direction)**
    const legendX = width / 2; // Center legend horizontally
    const legendY = height -30; // Move legend below the pie chart

    const legend = d3.select("#chart").select("svg")
        .append("g")
        .attr("transform", `translate(${legendX - 30}, ${legendY})`); // Adjust for centering

    const legendItems = legend.selectAll(".legend-item")
        .data(data)
        .enter()
        .append("g")
        .attr("class", "legend-item")
        .attr("transform", (_, i) => `translate(0, ${i * 20})`); // Space legends vertically

    legendItems.append("rect")
        .attr("width", 15)
        .attr("height", 15)
        .attr("fill", d => colorMap[d.format] || "#000000");

    legendItems.append("text")
        .attr("x", 20)
        .attr("y", 12)
        .attr("font-size", "12px")
        .text(d => `${d.format}`);
}






createLineChart(data: { format: string; count: number }[]) {
  d3.select("#lineChart").selectAll("*").remove(); // Clear previous chart

  const margin = { top: 50, right: 30, bottom: 50, left: 60 };
  const width = 600 - margin.left - margin.right;
  const height = 400 - margin.top - margin.bottom;

  const svg = d3.select("#lineChart")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

  // **X Scale (File Types)**
  const xScale = d3.scalePoint()
    .domain(data.map(d => d.format))
    .range([0, width])
    .padding(0.5);

  // **Y Scale (Number of Files)**
  const yScale = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.count)! * 1.2])
    .nice()
    .range([height, 0]);

  // **X Axis**
  svg.append("g")
    .attr("transform", `translate(0, ${height})`)
    .call(d3.axisBottom(xScale))
    .selectAll("text")
    .attr("transform", "rotate(-15)")
    .style("text-anchor", "end")
    .style("font-size", "14px")
    .style("fill", "#333"); // Custom color

  // **Y Axis**
  svg.append("g")
    .call(d3.axisLeft(yScale))
    .selectAll("text")
    .style("font-size", "14px")
    .style("fill", "#333"); // Custom color

  // **Remove Grid Lines & Axis Lines**
  svg.selectAll(".domain").remove(); // Removes the axis lines
  svg.selectAll(".tick line").remove(); // Removes tick lines

  // **Line Generator**
  const line = d3.line<{ format: string; count: number }>()
    .x(d => xScale(d.format)!)
    .y(d => yScale(d.count)!)
    .curve(d3.curveCatmullRom); // Smooth curves

  // **Draw the Line with Animation**
  const path = svg.append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", "#007bff") // Blue color
    .attr("stroke-width", 4)
    .attr("stroke-linecap", "round")
    .attr("d", line)
    .style("filter", "drop-shadow(0px 4px 6px rgba(0,0,0,0.2))"); // Subtle shadow

  // **Path Animation**
  const totalLength = path.node()?.getTotalLength() || 0;
  path.attr("stroke-dasharray", totalLength + " " + totalLength)
    .attr("stroke-dashoffset", totalLength)
    .transition()
    .duration(1000)
    .ease(d3.easeCubicOut)
    .attr("stroke-dashoffset", 0);

  // **Add Data Points**
  const circles = svg.selectAll("circle")
    .data(data)
    .enter()
    .append("circle")
    .attr("cx", d => xScale(d.format)!)
    .attr("cy", d => yScale(d.count)!)
    .attr("r", 0) // Start small for animation
    .attr("fill", "#ff4500") // Orange color
    .attr("stroke", "#fff")
    .attr("stroke-width", 2)
    .style("filter", "drop-shadow(0px 0px 5px rgba(0,0,0,0.3))");

  // **Animate Circles**
  circles.transition()
    .delay((_, i) => i * 150) // Staggered effect
    .duration(800)
    .attr("r", 6);

  // **Tooltip**
  const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("background", "#333")
    .style("color", "#fff")
    .style("padding", "8px")
    .style("border-radius", "5px")
    .style("display", "none")
    .style("transition", "opacity 0.2s ease")
    .style("pointer-events", "none");

  circles
    .on("mouseover", function (event, d) {
      d3.select(this).transition().duration(200).attr("r", 9);
      tooltip.style("display", "block")
        .html(`<strong>${d.format}</strong>: ${d.count} files`)
        .style("left", `${event.pageX + 15}px`)
        .style("top", `${event.pageY - 25}px`)
        .style("opacity", "1");
    })
    .on("mousemove", function (event) {
      tooltip.style("left", `${event.pageX + 15}px`)
        .style("top", `${event.pageY - 25}px`);
    })
    .on("mouseout", function () {
      d3.select(this).transition().duration(200).attr("r", 6);
      tooltip.style("opacity", "0").style("display", "none");
    });

  // **Chart Title**
  svg.append("text")
    .attr("x", width / 2)
    .attr("y", -20)
    .attr("text-anchor", "middle")
    .style("font-size", "18px")
    .style("font-weight", "bold")
    .style("fill", "#333")
    .text("File Uploads Over Time");

  // **X Axis Label**
  svg.append("text")
    .attr("x", width / 2)
    .attr("y", height + 40)
    .attr("text-anchor", "middle")
    .style("font-size", "14px")
    .style("fill", "#333")
    .text("File Type");

  // **Y Axis Label**
  svg.append("text")
    .attr("x", -height / 2)
    .attr("y", -50)
    .attr("text-anchor", "middle")
    .attr("transform", "rotate(-90)")
    .style("font-size", "14px")
    .style("fill", "#333")
    .text("Number of Files");
}


  




  displayContentsample(content: any, fileType?: string): void {
    if (!content) {
      this.selectedContent = null;
      this.contentType = 'text';
      return;
    }
    this.showselectformatvariable = false

    if (fileType?.includes('image')) {
      const imageUrl = `data:${fileType};base64,${content}`;
      console.log("Image URL:", imageUrl);  // ✅ Debugging
      this.selectedContent = imageUrl;
      this.contentType = 'image';
    }
    // ✅ Check if this logs correctly
    else if (fileType?.includes('pdf')) {
      const pdfSrc = `data:${fileType};base64,${content}`;
      this.selectedContent = pdfSrc
      this.contentType = 'pdf';
    } else if (fileType?.includes('text') || fileType?.includes('plain')) {
      this.selectedContent = this.decodeBase64Unicode(content);
      this.contentType = 'text';
    } else if (fileType?.includes('word')) {
      const byteArray = new Uint8Array(atob(content).split('').map(c => c.charCodeAt(0)));
      const blob = new Blob([byteArray], { type: fileType });
      const reader = new FileReader();

      reader.onload = (event: any) => {
        Mammoth.convertToHtml({ arrayBuffer: event.target.result }).then((result) => {
          this.selectedContent = this.sanitizer.bypassSecurityTrustHtml(result.value);
          this.contentType = 'doc';
        });
      };
      reader.readAsArrayBuffer(blob);
    } else {
      this.selectedContent = 'Unsupported format';
      this.contentType = 'unknown';
    }
  }

  selectedSummary: string | null = null;

  displayContentSummary(content: string): void {
    this.selectedContent = content;
    this.contentType = 'text'
    console.log(this.selectedContent);
    this.showselectformatvariable = false
  }




  decodeBase64Unicode(str: string): string {
    try {
      return decodeURIComponent(atob(str).split('').map((c) =>
        '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
      ).join(''));
    } catch (e) {
      console.error('Base64 decoding error:', e);
      return 'Error decoding text';
    }
  }



  closeSummary(): void {
    this.selectedContent = null;
    this.showselectformatvariable = false
    this.downloadfile = false
  }

  showselectformat(summarizedcontent: any) {
    this.showselectformatvariable = true
    this.summarizedcontent = summarizedcontent
    this.selectedFormat = ''
  }



  downloadSummary(content: string, fileType: string): void {
    if (content.length==0) {
      alert('No content available.');
      return;
    }
    if (fileType == '') {
      alert("Please select any file type before downloading!")
    }
    else {
      const fileName = `summary.${this.getFileExtensions(fileType)}`;
      this.createBlob(content, fileType).then((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      });
      this.closeSummary()
    }
  }

  // ✅ Get correct file extension
  getFileExtensions(fileType: string): string {
    return fileType === 'txt' ? 'txt' : fileType === 'pdf' ? 'pdf' : 'docx';
  }

  // ✅ Create Blob based on file type
  createBlob(content: string, fileType: string): Promise<Blob> {
    if (fileType === 'txt') {
      return Promise.resolve(new Blob([content], { type: 'text/plain' }));
    } else if (fileType === 'pdf') {
      return this.createPDFBlob(content);
    } else if (fileType === 'docx') {
      return this.createDOCXBlob(content);
    } else {
      return Promise.reject(new Error('Unsupported file type'));
    }
  }

  // ✅ Properly generates a PDF with correct MIME type
  createPDFBlob(content: string): Promise<Blob> {
    return new Promise((resolve) => {
      const pdf = new jsPDF();
      const margin = 10;
      const pageWidth = pdf.internal.pageSize.getWidth() - 2 * margin;
      const textLines = pdf.splitTextToSize(content, pageWidth);

      pdf.text(textLines, margin, margin);

      const pdfBlob = new Blob([pdf.output('arraybuffer')], { type: 'application/pdf' });
      resolve(pdfBlob);
    });
  }

  // ✅ DOCX file generation
  createDOCXBlob(content: string): Promise<Blob> {
    return new Promise((resolve) => {
      const doc = new Document({
        sections: [{ children: [new Paragraph(content)] }],
      });

      Packer.toBlob(doc).then((blob) => resolve(new Blob([blob], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })));
    });
  }

  downloadFileauth(content: string, fileType: string, fileName: string) {
    this.content = content;
    this.fileType = fileType;
    this.fileName = fileName;
    this.downloadfile = true;
  }

  downloadFile(content: string, fileType: string, fileName: string): void {
    if (!content || !fileType) {
      console.error("Invalid file content or type!");
      return;
    }

    // ✅ Extract Base64 part (removes MIME prefix)
    const base64Data = this.extractBase64Data(content);

    // ✅ Convert Base64 to Uint8Array
    const byteArray = this.base64ToUint8Array(base64Data);

    // ✅ Create a Blob with the correct MIME type
    const blob = new Blob([byteArray], { type: fileType });

    // ✅ Generate a URL for download
    const url = URL.createObjectURL(blob);

    // ✅ Create a link element and trigger download
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName || `download.${this.getFileExtension(fileType)}`;
    document.body.appendChild(a);
    a.click();

    // ✅ Cleanup
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    this.closeSummary()
    this.downloadfile = false
  }


  // ✅ Extracts Base64 part (removes MIME prefix like "data:image/png;base64,")
  extractBase64Data(base64String: string): string {
    return base64String.includes(',') ? base64String.split(',')[1] : base64String;
  }

  // ✅ Converts Base64 to Uint8Array for binary file downloads
  base64ToUint8Array(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const length = binaryString.length;
    const bytes = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  // ✅ Determines the correct file extension based on MIME type
  getFileExtension(mimeType: string): string {
    const mimeMap: { [key: string]: string } = {
      'image/png': 'png',
      'image/jpeg': 'jpg',
      'image/gif': 'gif',
      'application/pdf': 'pdf',
      'text/plain': 'txt',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx'
    };
    return mimeMap[mimeType] || 'bin'; // Default to '.bin' for unknown types
  }
}



