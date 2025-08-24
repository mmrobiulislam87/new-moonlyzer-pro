import React, { useState, useMemo } from 'react';
import { Briefcase, PlusCircle, UserPlus, Trash2, Edit3, Save, X, Search, FileText, Users, FolderOpen } from 'lucide-react';
import { useInvestigationFileContext } from '../contexts/InvestigationFileContext';
import { InvestigationFile, SuspectProfileInCase } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { cn } from '../utils/cn';

const InvestigationFilesView: React.FC = () => {
  const { investigationFiles, addFile, updateFile, deleteFile } = useInvestigationFileContext();
  const [selectedFile, setSelectedFile] = useState<InvestigationFile | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedFile, setEditedFile] = useState<Partial<InvestigationFile> | null>(null);

  const filteredFiles = useMemo(() => {
    if (!searchTerm) return investigationFiles;
    const lowerSearchTerm = searchTerm.toLowerCase();
    return investigationFiles.filter(file =>
      file.caseName.toLowerCase().includes(lowerSearchTerm) ||
      (file.caseNumber && file.caseNumber.toLowerCase().includes(lowerSearchTerm)) ||
      file.suspects.some(s => s.name.toLowerCase().includes(lowerSearchTerm) || s.msisdns?.some(msisdn => msisdn.includes(lowerSearchTerm)))
    );
  }, [investigationFiles, searchTerm]);

  const handleSelectFile = (file: InvestigationFile) => {
    setSelectedFile(file);
    setIsEditing(false);
    setEditedFile(null);
  };

  const handleNewFile = () => {
    const newFileTemplate: Omit<InvestigationFile, 'id' | 'createdAt' | 'updatedAt'> = {
      caseName: 'New Case File',
      caseNumber: '',
      status: 'Open',
      summary: '',
      suspects: [],
    };
    addFile(newFileTemplate);
  };

  const handleDeleteFile = (fileId: string, caseName: string) => {
    if (window.confirm(`Are you sure you want to delete the case "${caseName}"? This cannot be undone.`)) {
      deleteFile(fileId);
      if (selectedFile?.id === fileId) {
        setSelectedFile(null);
      }
    }
  };

  const handleStartEditing = () => {
    if (selectedFile) {
      setEditedFile({ ...selectedFile });
      setIsEditing(true);
    }
  };

  const handleCancelEditing = () => {
    setIsEditing(false);
    setEditedFile(null);
  };

  const handleSaveFile = () => {
    if (editedFile && editedFile.id) {
        const cleanFile = JSON.parse(JSON.stringify(editedFile));

        if (cleanFile.suspects) {
            cleanFile.suspects = cleanFile.suspects.map((suspect: SuspectProfileInCase) => {
                const cleanSuspect = { ...suspect };
                for (const key in cleanSuspect) {
                    const field = key as keyof SuspectProfileInCase;
                    if (Array.isArray(cleanSuspect[field])) {
                        (cleanSuspect[field] as any) = (cleanSuspect[field] as string[]).map(s => s.trim()).filter(Boolean);
                    }
                }
                return cleanSuspect;
            });
        }
      
      updateFile(cleanFile.id, cleanFile);
      setSelectedFile(cleanFile as InvestigationFile);
    }
    setIsEditing(false);
    setEditedFile(null);
  };

  const handleFieldChange = (field: keyof InvestigationFile, value: any) => {
    if (editedFile) {
      setEditedFile(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleAddSuspect = () => {
    if (editedFile) {
      const newSuspect: SuspectProfileInCase = {
        id: uuidv4(),
        name: 'New Suspect',
        msisdns: [], imeis: [], bkashNumbers: [], nagadNumbers: [], roketNumbers: [], voipNumbers: [], facebookIds: [], gmailAddresses: [],
        nid: '',
        address: '',
        notes: '',
      };
      setEditedFile(prev => ({ ...prev, suspects: [...(prev?.suspects || []), newSuspect] }));
    }
  };

  const handleSuspectChange = (suspectId: string, field: keyof SuspectProfileInCase, value: string | string[]) => {
    if (editedFile) {
      const updatedSuspects = editedFile.suspects?.map(s =>
        s.id === suspectId ? { ...s, [field]: value } : s
      ) || [];
      setEditedFile(prev => ({ ...prev, suspects: updatedSuspects }));
    }
  };

  const handleDeleteSuspect = (suspectId: string) => {
     if (editedFile) {
         const updatedSuspects = editedFile.suspects?.filter(s => s.id !== suspectId) || [];
         setEditedFile(prev => ({...prev, suspects: updatedSuspects}));
     }
  };
  
  const fileToDisplay = isEditing ? editedFile : selectedFile;

  const renderMultiInputField = (suspect: SuspectProfileInCase, field: keyof SuspectProfileInCase, label: string, placeholder: string) => {
      const values = (suspect[field] as string[] | undefined) || [];

      if (!isEditing) {
          return <p><strong className="text-neutral-dark">{label}:</strong> {values.join(', ') || 'N/A'}</p>;
      }

      const handleValueChange = (index: number, newValue: string) => {
          const newValues = [...values];
          newValues[index] = newValue;
          handleSuspectChange(suspect.id, field, newValues);
      };
      const handleAddValue = () => {
          handleSuspectChange(suspect.id, field, [...values, '']);
      };
      const handleRemoveValue = (index: number) => {
          const newValues = values.filter((_, i) => i !== index);
          handleSuspectChange(suspect.id, field, newValues);
      };

      return (
          <div className="col-span-1">
              <label className="font-medium text-textPrimary">{label}:</label>
              <div className="space-y-2 mt-1">
                  {values.map((value, index) => (
                      <div key={index} className="flex items-center gap-2">
                          <input
                              value={value}
                              onChange={e => handleValueChange(index, e.target.value)}
                              placeholder={placeholder}
                              className="w-full p-1 border border-neutral-light rounded text-xs"
                          />
                           <button type="button" onClick={() => handleRemoveValue(index)} className="p-1 text-danger-dark hover:bg-danger-lighter rounded-full flex-shrink-0">
                               <X size={14} />
                           </button>
                      </div>
                  ))}
                  <button type="button" onClick={handleAddValue} className="px-2 py-1 text-xs bg-primary-light text-white rounded-md hover:bg-primary flex items-center">
                      <PlusCircle size={14} className="mr-1" /> Add
                  </button>
              </div>
          </div>
      );
  };

  const renderSingleInputField = (suspect: SuspectProfileInCase, field: keyof SuspectProfileInCase, label: string, placeholder: string, isTextArea: boolean = false) => {
     if (!isEditing) {
         return <p><strong className="text-neutral-dark">{label}:</strong> {(suspect[field] as string | undefined) || 'N/A'}</p>;
     }
     
     const commonProps = {
        value: (suspect[field] as string | undefined) || '',
        onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => handleSuspectChange(suspect.id, field, e.target.value),
        placeholder,
        className: "w-full p-1 border border-neutral-light rounded text-xs mt-1"
     };

     return (
        <div className={isTextArea ? "col-span-1 md:col-span-2" : "col-span-1"}>
            <label className="font-medium text-textPrimary">{label}:</label>
            {isTextArea ? <textarea {...commonProps} rows={2} /> : <input {...commonProps} />}
        </div>
     );
  };


  return (
    <div className="flex h-full gap-4">
      {/* Left Panel: File List */}
      <div className="w-1/3 flex-shrink-0 bg-surface border border-neutral-light rounded-xl shadow-lg p-4 flex flex-col">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold text-textPrimary flex items-center"><Briefcase size={20} className="mr-2"/>Case Files</h2>
          <button onClick={handleNewFile} className="p-1.5 text-primary hover:bg-primary-lighter rounded-full"><PlusCircle size={22}/></button>
        </div>
        <div className="relative mb-3">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-DEFAULT"/>
            <input type="text" placeholder="Search cases..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 pr-3 py-1.5 border rounded-lg text-sm"/>
        </div>
        <div className="flex-grow overflow-y-auto scrollbar-thin">
            {filteredFiles.length > 0 ? (
                <ul className="space-y-2">
                    {filteredFiles.map(file => (
                        <li key={file.id} onClick={() => handleSelectFile(file)}
                            className={cn(
                                "p-2.5 rounded-lg cursor-pointer border-l-4 transition-colors",
                                selectedFile?.id === file.id ? 'bg-primary-lighter border-primary-dark shadow-sm' : 'bg-neutral-lightest hover:bg-neutral-light/70 border-transparent'
                            )}>
                            <p className="font-semibold text-sm text-textPrimary truncate">{file.caseName}</p>
                            <p className="text-xs text-textSecondary">{file.caseNumber || 'No Case Number'}</p>
                        </li>
                    ))}
                </ul>
            ) : (
                <div className="text-center text-sm text-textSecondary py-10">
                    <p>No case files found.</p>
                </div>
            )}
        </div>
      </div>

      {/* Right Panel: File Details */}
      <div className="w-2/3 flex-grow bg-surface border border-neutral-light rounded-xl shadow-lg p-4 flex flex-col">
        {fileToDisplay ? (
            <>
              <div className="flex justify-between items-center mb-3 pb-3 border-b">
                <h2 className="text-lg font-semibold text-textPrimary flex items-center">
                    <FileText size={20} className="mr-2"/> Case Details
                </h2>
                <div className="flex gap-2">
                  {isEditing ? (
                    <>
                      <button onClick={handleSaveFile} className="px-3 py-1.5 text-xs bg-success text-white rounded-lg hover:bg-success-dark flex items-center"><Save size={14} className="mr-1"/>Save Changes</button>
                      <button onClick={handleCancelEditing} className="px-3 py-1.5 text-xs bg-neutral-light hover:bg-neutral-DEFAULT/30 rounded-lg flex items-center"><X size={14} className="mr-1"/>Cancel</button>
                    </>
                  ) : (
                    <>
                      <button onClick={handleStartEditing} className="px-3 py-1.5 text-xs bg-primary text-white rounded-lg hover:bg-primary-dark flex items-center"><Edit3 size={14} className="mr-1"/>Edit</button>
                      <button onClick={() => handleDeleteFile(fileToDisplay.id!, fileToDisplay.caseName!)} className="px-3 py-1.5 text-xs bg-danger text-white rounded-lg hover:bg-danger-dark flex items-center"><Trash2 size={14} className="mr-1"/>Delete</button>
                    </>
                  )}
                </div>
              </div>
              <div className="flex-grow overflow-y-auto scrollbar-thin space-y-4 pr-2">
                {/* Case Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                    <div>
                        <label className="text-xs font-medium text-textSecondary">Case Name</label>
                        {isEditing ? <input type="text" value={editedFile?.caseName || ''} onChange={e => handleFieldChange('caseName', e.target.value)} className="w-full p-1 border rounded"/> : <p className="font-semibold">{fileToDisplay.caseName}</p>}
                    </div>
                     <div>
                        <label className="text-xs font-medium text-textSecondary">Case Number</label>
                        {isEditing ? <input type="text" value={editedFile?.caseNumber || ''} onChange={e => handleFieldChange('caseNumber', e.target.value)} className="w-full p-1 border rounded"/> : <p>{fileToDisplay.caseNumber || 'N/A'}</p>}
                    </div>
                     <div>
                        <label className="text-xs font-medium text-textSecondary">Status</label>
                        {isEditing ? <select value={editedFile?.status || 'Open'} onChange={e => handleFieldChange('status', e.target.value)} className="w-full p-1 border rounded"><option>Open</option><option>Closed</option><option>Cold</option></select> : <p>{fileToDisplay.status}</p>}
                    </div>
                </div>
                 {/* Summary */}
                <div>
                    <label className="text-xs font-medium text-textSecondary">Summary/Notes</label>
                    {isEditing ? <textarea value={editedFile?.summary || ''} onChange={e => handleFieldChange('summary', e.target.value)} rows={5} className="w-full p-1 border rounded text-sm"/> : <p className="text-sm p-2 bg-neutral-lightest rounded border whitespace-pre-wrap min-h-[5rem]">{fileToDisplay.summary || 'No summary provided.'}</p>}
                </div>

                {/* Suspects */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                     <h3 className="text-md font-semibold text-textPrimary flex items-center"><Users size={18} className="mr-2"/>Suspects</h3>
                     {isEditing && <button onClick={handleAddSuspect} className="px-2 py-1 text-xs bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center"><UserPlus size={14} className="mr-1"/>Add Suspect</button>}
                  </div>
                  <div className="space-y-3">
                    {(fileToDisplay.suspects || []).map(suspect => (
                        <div key={suspect.id} className="p-2.5 bg-neutral-lightest rounded border">
                            {isEditing ? (
                                <div className="space-y-3 text-xs">
                                    <div className="flex justify-between items-start">
                                        {renderSingleInputField(suspect, 'name', 'Name', 'Suspect Name/Alias')}
                                        <button onClick={() => handleDeleteSuspect(suspect.id)} className="p-1 text-danger-dark hover:bg-danger-lighter rounded-full ml-2 mt-4 flex-shrink-0"><Trash2 size={14}/></button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {renderMultiInputField(suspect, 'msisdns', 'MSISDN(s)', 'Enter MSISDN')}
                                        {renderMultiInputField(suspect, 'imeis', 'IMEI(s)', 'Enter IMEI')}
                                        {renderMultiInputField(suspect, 'bkashNumbers', 'bKash Number(s)', 'Enter bKash number')}
                                        {renderMultiInputField(suspect, 'nagadNumbers', 'Nagad Number(s)', 'Enter Nagad number')}
                                        {renderMultiInputField(suspect, 'roketNumbers', 'Roket Number(s)', 'Enter Roket number')}
                                        {renderMultiInputField(suspect, 'voipNumbers', 'VoIP/IP Number(s)', 'Enter VoIP/IP number')}
                                        {renderMultiInputField(suspect, 'facebookIds', 'Facebook ID(s)', 'Enter Facebook ID')}
                                        {renderMultiInputField(suspect, 'gmailAddresses', 'Gmail Address(es)', 'Enter Gmail address')}
                                        {renderSingleInputField(suspect, 'nid', 'NID', 'Enter NID')}
                                        {renderSingleInputField(suspect, 'address', 'Address', 'Enter address')}
                                    </div>
                                    {renderSingleInputField(suspect, 'notes', 'Notes', 'Enter notes', true)}
                                </div>
                            ) : (
                               <div className="text-sm">
                                   <p className="font-semibold text-primary-dark">{suspect.name}</p>
                                   <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 text-xs mt-1">
                                       {renderMultiInputField(suspect, 'msisdns', 'MSISDN(s)', '')}
                                       {renderMultiInputField(suspect, 'imeis', 'IMEI(s)', '')}
                                       {renderMultiInputField(suspect, 'bkashNumbers', 'bKash', '')}
                                       {renderMultiInputField(suspect, 'nagadNumbers', 'Nagad', '')}
                                       {renderMultiInputField(suspect, 'roketNumbers', 'Roket', '')}
                                       {renderMultiInputField(suspect, 'voipNumbers', 'VoIP/IP', '')}
                                       {renderMultiInputField(suspect, 'facebookIds', 'Facebook', '')}
                                       {renderMultiInputField(suspect, 'gmailAddresses', 'Gmail', '')}
                                       {renderSingleInputField(suspect, 'nid', 'NID', '')}
                                       <div className="col-span-2">{renderSingleInputField(suspect, 'address', 'Address', '')}</div>
                                       <div className="col-span-2">{renderSingleInputField(suspect, 'notes', 'Notes', '', true)}</div>
                                   </div>
                               </div>
                            )}
                        </div>
                    ))}
                    {!isEditing && (!fileToDisplay.suspects || fileToDisplay.suspects.length === 0) && <p className="text-xs text-center p-2">No suspects added to this case.</p>}
                  </div>
                </div>
              </div>
            </>
        ) : (
            <div className="flex flex-col items-center justify-center h-full text-center text-textSecondary">
                <FolderOpen size={48} className="mb-4 text-neutral-light"/>
                <p className="text-lg font-medium">Select a Case File</p>
                <p>Select a case from the list on the left to view its details, or create a new case file.</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default InvestigationFilesView;