import type * as React from "react";
import { useCallback } from "react";
import { useDropzone, type Accept } from "react-dropzone";
import { Upload, Trash2, File } from "lucide-react";
import { classHelper } from "@/lib/utils/class-helper";

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

interface FileUploaderProps {
  value?: File[];
  onChange?: (files: File[]) => void;
  multiple?: boolean;
  accept?: Accept;
  maxSize?: number;
  disabled?: boolean;
  className?: string;
}

function FileUploader({
  value = [],
  onChange,
  multiple = false,
  accept,
  maxSize,
  disabled = false,
  className,
}: FileUploaderProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (!onChange) return;

      if (multiple) {
        onChange([...value, ...acceptedFiles]);
      } else {
        onChange(acceptedFiles.slice(0, 1));
      }
    },
    [onChange, multiple, value]
  );

  const removeFile = useCallback(
    (index: number) => {
      if (!onChange) return;
      const newFiles = [...value];
      newFiles.splice(index, 1);
      onChange(newFiles);
    },
    [onChange, value]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxSize,
    multiple,
    disabled,
  });

  return (
    <div data-slot="file-uploader" className={classHelper("space-y-3", className)}>
      <div
        {...getRootProps()}
        data-slot="file-uploader-dropzone"
        className={classHelper(
          "flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 text-center transition-colors",
          "border-input bg-background",
          "hover:border-primary/50 hover:bg-accent/50",
          isDragActive && "border-primary bg-accent",
          disabled && "pointer-events-none opacity-50"
        )}
      >
        <input {...getInputProps()} />
        <Upload className="size-10 text-muted-foreground" />
        <div className="space-y-1">
          <p className="text-sm font-medium">
            {isDragActive ? "Solte os arquivos aqui" : "Clique para enviar ou arraste e solte"}
          </p>
          <p className="text-xs text-muted-foreground">
            {multiple ? "Você pode selecionar múltiplos arquivos" : "Selecione um arquivo"}
          </p>
        </div>
      </div>

      {value.length > 0 && (
        <ul data-slot="file-uploader-list" className="space-y-2">
          {value.map((file, index) => (
            <li
              key={`${file.name}-${index}`}
              data-slot="file-uploader-item"
              className="flex items-center justify-between gap-3 rounded-lg border bg-background p-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <File className="size-5 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeFile(index)}
                disabled={disabled}
                className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:pointer-events-none disabled:opacity-50"
              >
                <Trash2 className="size-4" />
                <span className="sr-only">Remover arquivo</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export { FileUploader, type FileUploaderProps };
