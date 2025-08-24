
import { VoIPRecord } from '../types';
import { parseDateTime } from './cdrUtils'; 

declare var XLSX: any;

const EXPECTED_VOIP_HEADERS_MAP: Record<string, keyof Omit<VoIPRecord, 'id'|'sourceFileId'|'fileName'|'rowIndex'|'destinationPhoneNumber'|'callType'>> = {
  'date & time': 'timestamp',
  'phone number': 'sourcePhoneNumber',
  'direction name': 'direction', // This will be parsed further
  'ip address': 'ipAddress',
  'duration (min)': 'durationMinutes',
};

// Function to parse the complex "Direction Name" column
const parseDirectionName = (directionStr: string): { destinationPhoneNumber: string, callType: string, direction: 'Outgoing' | 'Incoming' | 'Unknown' } => {
    const outgoingMatch = directionStr.match(/outgoing call to (\d+)\s*\((.*?)\)/i);
    if (outgoingMatch) {
        return {
            destinationPhoneNumber: outgoingMatch[1],
            callType: outgoingMatch[2],
            direction: 'Outgoing',
        };
    }
    // Add logic for incoming calls if the format is known
    const incomingMatch = directionStr.match(/incoming call from (\d+)\s*\((.*?)\)/i);
     if (incomingMatch) {
        return {
            destinationPhoneNumber: incomingMatch[1],
            callType: incomingMatch[2],
            direction: 'Incoming',
        };
    }
    
    return { destinationPhoneNumber: directionStr, callType: 'Unknown', direction: 'Unknown' };
};

export const parseVoIPExcelFile = (file: File): Promise<{ records: VoIPRecord[], headers: string[] }> => {
  return new Promise((resolve, reject) => {
    if (typeof XLSX === 'undefined') {
      reject(new Error('SheetJS (XLSX) library is not loaded.'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: 'binary', cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        const jsonData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null, raw: false, dateNF: 'm/d/yyyy h:mm'});
        
        let rawHeaders: string[] = [];
        let headerRowIndex = 0; // Assume header is at the first row for this specific format.

        if(jsonData.length > 0) {
            rawHeaders = jsonData[headerRowIndex].map((h: any) => String(h || '').trim());
        } else {
            reject(new Error("File appears to be empty."));
            return;
        }

        const dataRows = jsonData.slice(headerRowIndex + 1);

        const parsedRecords: VoIPRecord[] = dataRows.map((row, dataRowIndex) => {
          const record: Partial<VoIPRecord> = {
            id: `${file.name}-${dataRowIndex}`,
            sourceFileId: file.name,
            fileName: file.name,
            rowIndex: dataRowIndex + headerRowIndex + 2,
          };
          
          rawHeaders.forEach((header, colIndex) => {
              const normalizedHeader = header.toLowerCase();
              const mappedKey = EXPECTED_VOIP_HEADERS_MAP[normalizedHeader];
              const cellValue = row[colIndex];
              if(cellValue === null || cellValue === undefined) return;

              if(mappedKey === 'timestamp') {
                  const parsedDate = parseDateTime(String(cellValue));
                  record.timestamp = parsedDate ? parsedDate.toISOString() : String(cellValue);
              } else if (mappedKey === 'durationMinutes') {
                  record.durationMinutes = parseFloat(String(cellValue)) || 0;
              } else if (mappedKey === 'direction') {
                  const { destinationPhoneNumber, callType, direction } = parseDirectionName(String(cellValue));
                  record.destinationPhoneNumber = destinationPhoneNumber;
                  record.callType = callType;
                  record.direction = direction;
              }
              else if (mappedKey) {
                  (record as any)[mappedKey] = String(cellValue);
              }
          });
          
          return record as VoIPRecord;
        }).filter(r => r.sourcePhoneNumber && r.destinationPhoneNumber); // Basic validation

        resolve({ records: parsedRecords, headers: rawHeaders });

      } catch (e) {
        console.error("Error in parseVoIPExcelFile:", e);
        reject(e);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsBinaryString(file);
  });
};
