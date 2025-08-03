import { Upload } from "lucide-react";
import React, { useState, ChangeEvent } from "react";

type FileUploaderProps = {
  onUploaded: (url: string) => void;
};

type UploadFile = {
  file: File;
  progress: number;
  error?: string;
};

const FileUploader: React.FC<FileUploaderProps> = ({ onUploaded }) => {
  const [files, setFiles] = useState<UploadFile[]>([]);

  const uploadFile = (fileObj: UploadFile) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append("files", fileObj.file);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const progress = Math.round((event.loaded / event.total) * 100);
        setFiles((prev) =>
          prev.map((f) =>
            f.file === fileObj.file ? { ...f, progress } : f
          )
        );
      }
    };

    xhr.onload = () => {
      console.log("XHR response:", xhr.responseText);
      if (xhr.status === 200) {
        const response = JSON.parse(xhr.responseText);
        const fileUrl = response.uploaded?.[0];
        setFiles((prev) =>
          prev.map((f) =>
            f.file === fileObj.file ? { ...f, progress: 100 } : f
          )
        );
        onUploaded(fileUrl);
      } else {
        setFiles((prev) =>
          prev.map((f) =>
            f.file === fileObj.file
              ? { ...f, error: "Ошибка загрузки" }
              : f
          )
        );
      }
    };

    xhr.onerror = () => {
      setFiles((prev) =>
        prev.map((f) =>
          f.file === fileObj.file ? { ...f, error: "Ошибка сети" } : f
        )
      );
    };

    xhr.open("POST", "https://26.234.138.233:3006/upload");
    xhr.send(formData);
  };

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const selectedFiles = Array.from(e.target.files);

    // Проверка типа и размера (например, max 10MB)
    const allowedTypes = ["image/png", "image/jpeg", "application/pdf"];
    const maxSize = 10 * 1024 * 1024;

    const filteredFiles = selectedFiles.filter(
      (file) =>
        allowedTypes.includes(file.type) && file.size <= maxSize
    );

    const newFiles = filteredFiles.map((file) => ({
      file,
      progress: 0,
    }));

    setFiles((prev) => [...prev, ...newFiles]);

    newFiles.forEach(uploadFile);
  };

  return (
    <label className="flex custom-file-upload w-15 h-10 p-2 file cursor-pointer relative ">
      <Upload className="absolute top-0 hover:brightness-90" color="#fff" size={40} strokeWidth={1.25} />
      <input className="absolute -z-1 bg-amber-50 w-10 h-10 top-0 bottom-0" type="file" multiple onChange={onChange} />
      {/* <ul>
         {files.map(({ file, progress, error }) => (
          <li key={file.name}>
            {file.name} - {progress}%
            {error && <span style={{ color: "red" }}> ({error})</span>}
            {file.type.startsWith("image/") && progress === 100 && !error && (
              <img
                src={URL.createObjectURL(file)}
                alt={file.name}
                style={{ maxWidth: 100, display: "block", marginTop: 5 }}
              />
            )}
          </li>
        ))} 
      </ul> */}
    </label>
  );
};

export default FileUploader;
