import { useCallback, useState } from 'react';
import { Upload, FileText } from 'lucide-react';
import { Button } from '../ui/button';

interface FileUploadCardProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  maxSize?: number; // in MB
  className?: string;
}

export function FileUploadCard({ 
  onFileSelect, 
  accept = '.pdf,.docx',
  maxSize = 10,
  className = '' 
}: FileUploadCardProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string>('');

  const validateFile = (file: File) => {
    const maxBytes = maxSize * 1024 * 1024;
    if (file.size > maxBytes) {
      setError(`文件大小不能超过 ${maxSize}MB`);
      return false;
    }
    
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    const acceptedTypes = accept.split(',');
    if (!acceptedTypes.includes(extension)) {
      setError('只支持 PDF 和 DOCX 格式');
      return false;
    }
    
    setError('');
    return true;
  };

  const handleFile = (file: File) => {
    if (validateFile(file)) {
      setSelectedFile(file);
      onFileSelect(file);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  return (
    <div className={className}>
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${selectedFile ? 'bg-green-50 border-green-500' : ''}
        `}
      >
        {selectedFile ? (
          <div className="flex items-center justify-center gap-3">
            <FileText className="h-8 w-8 text-green-600" />
            <div className="text-left">
              <p className="font-medium text-green-900">{selectedFile.name}</p>
              <p className="text-sm text-green-700">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>
        ) : (
          <>
            <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-lg mb-2">
              {isDragging ? '松手即可上传' : '拖拽文件到这里或点击选择'}
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              支持 PDF、DOCX 格式，文件大小不超过 {maxSize}MB
            </p>
            <input
              type="file"
              id="file-upload"
              accept={accept}
              onChange={handleFileInputChange}
              className="hidden"
            />
            <Button asChild variant="outline">
              <label htmlFor="file-upload" className="cursor-pointer">
                选择文件
              </label>
            </Button>
          </>
        )}
      </div>
      
      {error && (
        <p className="text-sm text-red-600 mt-2">{error}</p>
      )}
    </div>
  );
}
