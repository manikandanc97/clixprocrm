import Papa from 'papaparse';

export const IMPORT_TEMPLATE_HEADERS = [
  "Full Name *",
  "Company",
  "Email *",
  "Phone",
  "Country",
  "State",
  "City",
  "Lead Source",
  "Pipeline",
  "Status",
  "Priority",
  "Deal Value",
  "Currency",
  "Assigned To",
  "Tags",
  "Notes"
];

export const SAMPLE_DATA = [
  [
    "Mohan", "Sri Balaji Traders", "arunkumar@example.com", "+91 98765 43210", "India", "Tamil Nadu", "Coimbatore", "Website", "Sales Pipeline", "New Lead", "Medium", "5000", "INR", "Sales Manager", "Retail", "Example lead for reference only"
  ],
  [
    "Gowtham", "Aadhavan Technologies", "priya@example.com", "+91 91234 56789", "India", "Tamil Nadu", "Chennai", "Referral", "Sales Pipeline", "New Lead", "High", "8000", "INR", "Sales Executive", "IT", "Sample data only"
  ]
];

export async function downloadSampleTemplate(type: 'csv' | 'xlsx' = 'csv') {
  const data = [IMPORT_TEMPLATE_HEADERS, ...SAMPLE_DATA];
  
  if (type === 'csv') {
    const csvContent = Papa.unparse(data);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "lead_import_template.csv";
    link.click();
  } else {
    const XLSX = await import('xlsx');
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "lead_import_template.xlsx");
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function downloadFailedRows(failedRows: any[], type: 'csv' | 'xlsx' = 'csv') {
  if (failedRows.length === 0) return;
  
  if (type === 'csv') {
    const csvContent = Papa.unparse(failedRows);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "failed_leads_import.csv";
    link.click();
  } else {
    const XLSX = await import('xlsx');
    const ws = XLSX.utils.json_to_sheet(failedRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Failed Rows");
    XLSX.writeFile(wb, "failed_leads_import.xlsx");
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function parseFile(file: File): Promise<any[]> {
  const fileExtension = file.name.split('.').pop()?.toLowerCase();
  
  if (fileExtension === 'csv') {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => resolve(results.data),
        error: (error) => reject(error)
      });
    });
  } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
    const XLSX = await import('xlsx');
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const json = XLSX.utils.sheet_to_json(worksheet);
          resolve(json);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = (error) => reject(error);
      reader.readAsArrayBuffer(file);
    });
  } else {
    throw new Error("Unsupported file format");
  }
}
