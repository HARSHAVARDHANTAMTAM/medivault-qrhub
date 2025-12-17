import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  User, 
  Calendar, 
  Download, 
  Eye,
  Clock,
  ArrowLeft,
  Upload,
  Phone,
  AlertCircle,
  Loader2,
  Files,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { getMultipleSignedUrls, countFiles } from '@/lib/storage';

interface PatientProfile {
  id: string;
  full_name: string | null;
  patient_id: string | null;
  mobile_number: string | null;
}

interface MedicalRecord {
  id: string;
  title: string;
  description: string | null;
  diagnosis: string | null;
  doctor_name: string | null;
  doctor_notes: string | null;
  file_url: string | null;
  record_date: string;
  created_at: string;
  hospital_id: string;
}

const PatientHistory = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const { profile: hospitalProfile } = useAuth();
  const [patient, setPatient] = useState<PatientProfile | null>(null);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [expandedRecords, setExpandedRecords] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedRecords(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleDownload = async (record: MedicalRecord) => {
    if (!record.file_url) return;
    
    setDownloadingId(record.id);
    try {
      const files = await getMultipleSignedUrls(record.file_url);
      if (files.length === 0) {
        toast.error('Failed to generate download links');
        return;
      }
      
      // If single file, open directly
      if (files.length === 1) {
        window.open(files[0].url, '_blank');
      } else {
        // If multiple files, expand to show all and notify
        setExpandedRecords(prev => new Set(prev).add(record.id));
        toast.success(`${files.length} files available - click individual files to download`);
      }
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download file');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleSingleFileDownload = async (fileUrl: string) => {
    try {
      const files = await getMultipleSignedUrls(fileUrl);
      if (files.length > 0) {
        window.open(files[0].url, '_blank');
      }
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download file');
    }
  };

  useEffect(() => {
    const fetchPatientData = async () => {
      if (!patientId) return;
      
      try {
        // First, find the patient by patient_id
        const { data: patientData, error: patientError } = await supabase
          .from('profiles')
          .select('id, full_name, patient_id, mobile_number')
          .eq('patient_id', patientId)
          .eq('role', 'patient')
          .maybeSingle();

        if (patientError) throw patientError;
        
        if (!patientData) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        setPatient(patientData);

        // Fetch medical records for this patient
        const { data: recordsData, error: recordsError } = await supabase
          .from('medical_records')
          .select('*')
          .eq('patient_id', patientData.id)
          .order('record_date', { ascending: false });

        if (recordsError) throw recordsError;
        setRecords(recordsData || []);

      } catch (error) {
        console.error('Error fetching patient data:', error);
        toast.error('Failed to load patient data');
      } finally {
        setLoading(false);
      }
    };

    fetchPatientData();
  }, [patientId]);

  if (loading) {
    return (
      <MainLayout>
        <div className="container py-8 px-4 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-10 h-10 mx-auto mb-4 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
            <p className="text-muted-foreground">Loading patient data...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (notFound) {
    return (
      <MainLayout>
        <div className="container py-8 px-4 max-w-2xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate('/hospital/scan')}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Scanner
          </Button>

          <div className="text-center py-12">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="w-10 h-10 text-destructive" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Patient Not Found</h2>
            <p className="text-muted-foreground mb-6">
              No patient found with ID: <span className="font-mono font-medium">{patientId}</span>
            </p>
            <div className="flex justify-center gap-4">
              <Button onClick={() => navigate('/hospital/scan')} variant="medical">
                Try Again
              </Button>
              <Button onClick={() => navigate('/hospital/dashboard')} variant="outline">
                Go to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container py-8 px-4">
        <Button
          variant="ghost"
          onClick={() => navigate('/hospital/dashboard')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        {/* Patient Info Card */}
        <div className="bg-card rounded-2xl border border-border p-6 card-shadow mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl medical-gradient flex items-center justify-center">
                <User className="w-8 h-8 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  {patient?.full_name || 'Unknown Patient'}
                </h1>
                <div className="flex flex-wrap items-center gap-4 mt-2 text-muted-foreground">
                  <span className="font-mono text-sm bg-secondary px-3 py-1 rounded-full">
                    ID: {patient?.patient_id}
                  </span>
                  {patient?.mobile_number && (
                    <span className="flex items-center gap-1 text-sm">
                      <Phone className="w-4 h-4" />
                      {patient.mobile_number}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <Button asChild variant="medical" size="lg">
              <Link to={`/hospital/upload?patient=${patient?.id}`}>
                <Upload className="w-5 h-5 mr-2" />
                Upload Report
              </Link>
            </Button>
          </div>
        </div>

        {/* Medical Records Timeline */}
        <div className="bg-card rounded-2xl border border-border p-6 card-shadow">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Clock className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">Medical History</h2>
              <span className="text-sm text-muted-foreground bg-secondary px-3 py-1 rounded-full">
                {records.length} records
              </span>
            </div>
          </div>

          {records.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
                <FileText className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">No Records Yet</h3>
              <p className="text-muted-foreground max-w-sm mx-auto mb-4">
                This patient doesn't have any medical records yet. Upload the first report.
              </p>
              <Button asChild variant="medical">
                <Link to={`/hospital/upload?patient=${patient?.id}`}>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload First Report
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {records.map((record) => {
                const fileCount = countFiles(record.file_url);
                const isExpanded = expandedRecords.has(record.id);
                
                return (
                  <div
                    key={record.id}
                    className="relative pl-8 pb-8 border-l-2 border-border last:pb-0"
                  >
                    <div className="absolute left-0 top-0 w-4 h-4 -translate-x-1/2 rounded-full medical-gradient" />
                    
                    <div className="p-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              {format(new Date(record.record_date), 'MMMM dd, yyyy')}
                            </span>
                            {fileCount > 1 && (
                              <span className="flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                <Files className="w-3 h-3" />
                                {fileCount} files
                              </span>
                            )}
                          </div>
                          <h3 className="text-lg font-semibold text-foreground mb-1">
                            {record.title}
                          </h3>
                          {record.diagnosis && (
                            <p className="text-muted-foreground mb-2">
                              <span className="font-medium">Diagnosis:</span> {record.diagnosis}
                            </p>
                          )}
                          {record.doctor_name && (
                            <p className="text-sm text-muted-foreground">
                              <span className="font-medium">Doctor:</span> {record.doctor_name}
                            </p>
                          )}
                          {record.doctor_notes && (
                            <p className="text-sm text-muted-foreground mt-2 italic">
                              "{record.doctor_notes}"
                            </p>
                          )}
                        </div>
                        
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                          >
                            <Link to={`/hospital/record/${record.id}`}>
                              <Eye className="w-4 h-4" />
                              View
                            </Link>
                          </Button>
                          {record.file_url && (
                            <>
                              {fileCount > 1 ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => toggleExpand(record.id)}
                                >
                                  {isExpanded ? (
                                    <ChevronUp className="w-4 h-4 mr-1" />
                                  ) : (
                                    <ChevronDown className="w-4 h-4 mr-1" />
                                  )}
                                  {fileCount} Files
                                </Button>
                              ) : (
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => handleDownload(record)}
                                  disabled={downloadingId === record.id}
                                >
                                  {downloadingId === record.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Download className="w-4 h-4" />
                                  )}
                                  Download
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </div>

                      {/* Expanded Files List */}
                      {isExpanded && record.file_url && (
                        <div className="mt-4 pt-4 border-t border-border">
                          <p className="text-sm font-medium text-foreground mb-3">Attached Files:</p>
                          <div className="space-y-2">
                            {record.file_url.split(',').map((filePath, index) => {
                              const fileName = filePath.trim().split('/').pop() || `File ${index + 1}`;
                              return (
                                <div
                                  key={index}
                                  className="flex items-center justify-between p-3 rounded-lg bg-background"
                                >
                                  <div className="flex items-center gap-3">
                                    <FileText className="w-4 h-4 text-primary" />
                                    <span className="text-sm text-foreground truncate max-w-[200px]">
                                      {fileName}
                                    </span>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleSingleFileDownload(filePath.trim())}
                                  >
                                    <Download className="w-4 h-4" />
                                  </Button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default PatientHistory;
