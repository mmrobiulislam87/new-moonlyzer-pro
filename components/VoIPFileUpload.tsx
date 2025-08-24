
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { v4 as uuidv4 } from 'uuid';
import { UploadCloud, FileText, XCircle, Edit3, Check, X, SquareDashedBottomCode } from 'lucide-react';
import { useVoIPContext } from '../contexts/VoIPContext';
import { UploadedVoIPFile } from '../types';
import { parseVoIPExcelFile } from '../utils/voipParser';

interface FileWithSourceName extends File {
  sourceName?: string;
}

const VoIPFileUpload: React.FC = () => {
  const { addVoIPFile, setIsLoading, setError, error, uploadedVoIPFiles, removeVoIPFile, updateVoIPFileSourceName } = useVoIPContext();
  const [editingSourceNameId, setEditingSourceNameId] = useState<string | null>(null);
  const [currentEditValue, setCurrentEditValue] = useState<string>("");

  const onDrop = useCallback(async (acceptedFiles: FileWithSourceName[]) => {
    setIsLoading(true);
    setError(null);
    let fileIndexOffset = uploadedVoIPFiles.length;

    for (const file of acceptedFiles) {
      try {
        const { records, headers } = await parseVoIPExcelFile(file);
        const fileId = uuidv4();
        const userDefinedSourceName = file.sourceName || `VoIP Source ${fileIndexOffset + 1}`;
        fileIndexOffset++;
        
        const newFile: UploadedVoIPFile = {
          id: fileId, name: file.name, sourceName: userDefinedSourceName,
          records: records, headers: headers,
        };
        addVoIPFile(newFile);

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error('Error processing VoIP file:', file.name, err);
        setError(`Error processing ${file.name}: ${errorMessage}`);
      }
    }
    setIsLoading(false);
  }, [addVoIPFile, setIsLoading, setError, uploadedVoIPFiles.length]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    multiple: true,
     getFilesFromEvent: async (event: any) => { 
      const files = Array.from(event.target.files || event.dataTransfer.files || []);
      return files.map((file: any, index: number) => Object.assign(file, {
        sourceName: `VoIP Source ${uploadedVoIPFiles.length + index + 1}` 
      }));
    }
  });

  const handleSourceNameChange = (newName: string) => setCurrentEditValue(newName);
  const saveSourceName = (fileId: string) => {
    if (currentEditValue.trim()) updateVoIPFileSourceName(fileId, currentEditValue.trim());
    setEditingSourceNameId(null); setCurrentEditValue("");
  };
  const cancelEditSourceName = () => { setEditingSourceNameId(null); setCurrentEditValue(""); };
  const startEditing = (file: UploadedVoIPFile) => { setEditingSourceNameId(file.id); setCurrentEditValue(file.sourceName); };

  return (
    <div className="bg-surface shadow-xl rounded-xl p-4 sm:p-6 border border-neutral-light">
      <h2 className="text-xl font-semibold text-textPrimary mb-4">Upload VoIP CDR</h2>
      {error && <div className="mb-4 p-3 bg-danger-lighter text-danger-darker rounded-md border border-danger-light">{error}</div>}
      
      <div {...getRootProps()} className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all ${isDragActive ? 'border-indigo-500 bg-indigo-100/60' : 'border-neutral-light hover:border-indigo-400'}`}>
        <input {...getInputProps()} />
        <UploadCloud className="mx-auto h-10 w-10 mb-2 text-indigo-500/90" />
        <p className="text-textSecondary text-sm">{isDragActive ? 'Drop files here...' : "Drag 'n' drop VoIP CDR files here"}</p>
      </div>

      {uploadedVoIPFiles.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-medium text-textPrimary mb-3">Uploaded Files:</h3>
          <ul className="space-y-3">
            {uploadedVoIPFiles.map((file) => (
              <li key={file.id} className="flex items-center justify-between bg-neutral-lightest p-3 rounded-lg shadow-sm border border-neutral-light">
                <div className="flex items-center flex-grow min-w-0">
                  <SquareDashedBottomCode className="h-5 w-5 text-indigo-500 mr-3 flex-shrink-0" />
                  <div className="flex-grow min-w-0">
                    {editingSourceNameId === file.id ? (
                      <div className="flex items-center space-x-1.5 w-full">
                        <input type="text" value={currentEditValue} onChange={e => handleSourceNameChange(e.target.value)} className="flex-grow text-sm p-1.5 border rounded-md" autoFocus onKeyDown={(e) => e.key === 'Enter' && saveSourceName(file.id)} />
                        <button onClick={() => saveSourceName(file.id)} className="p-1.5 text-success-dark hover:bg-success-lighter rounded-md"><Check size={18}/></button>
                        <button onClick={cancelEditSourceName} className="p-1.5 text-danger hover:bg-danger-lighter rounded-md"><X size={18}/></button>
                      </div>
                    ) : (
                      <span onClick={() => startEditing(file)} className="text-sm font-semibold text-textPrimary cursor-pointer hover:text-indigo-600 block truncate">{file.sourceName}</span>
                    )}
                    <p className="text-xs text-textSecondary truncate" title={file.name}>{file.name} ({file.records.length} records)</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {editingSourceNameId !== file.id && <button onClick={() => startEditing(file)} className="p-1.5 text-indigo-600/80 hover:text-indigo-700 rounded-md"><Edit3 size={16} /></button>}
                  <button onClick={() => removeVoIPFile(file.id)} className="p-1.5 text-danger/80 hover:text-danger-dark rounded-md"><XCircle size={18} /></button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default VoIPFileUpload;
