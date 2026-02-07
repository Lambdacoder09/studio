
"use client"

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useToast } from '@/hooks/use-toast';

interface ExcelImportButtonProps {
  onImport: (data: any[]) => void;
}

export default function ExcelImportButton({ onImport }: ExcelImportButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsLoading(true);
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          onImport(jsonData);
        } catch (error) {
          toast({
            variant: 'destructive',
            title: 'Import Failed',
            description: 'Failed to parse the Excel file. Please check the file format.',
          });
        }
        setIsLoading(false);
      };
      reader.readAsArrayBuffer(file);
    }
  };

  return (
    <Button asChild variant="outline">
      <label htmlFor="excel-import" className="flex items-center gap-2 cursor-pointer">
        <Upload className="h-4 w-4" />
        Import from Excel
        <input
          id="excel-import"
          type="file"
          className="hidden"
          accept=".xlsx, .xls"
          onChange={handleFileChange}
          disabled={isLoading}
        />
      </label>
    </Button>
  );
}
