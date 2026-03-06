import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  Calendar, 
  Download, 
  ArrowLeft,
  AlertCircle,
  Loader2,
  Stethoscope,
  ClipboardList,
  MessageSquare,
  Building2
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { getMultipleSignedUrls, countFiles } from '@/lib/storage';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/lib/logger';

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
  patient_id: string;
}

interface HospitalProfile {
  id: string;
  hospital_name: string | null;
}

const PatientRecordView = () => {
  const { recordId } = useParams<{ recordId: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [record, setRecord] = useState<MedicalRecord | null>(null);
  const [hospital, setHospital] = useState<HospitalProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [files, setFiles] = useState<{ url: string; name: string }[]>([]);

  useEffect(() => {
    const fetchRecord = async () => {
      if (!recordId || !profile) return;
      
      try {
        const { data: recordData, error: recordError } = await supabase
          .from('medical_records')
          .select('*')
          .eq('id', recordId)
          .eq('patient_id', profile.id)
          .maybeSingle();

        if (recordError) throw recordError;
        
        if (!recordData) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        setRecord(recordData);

        // Fetch hospital info
        const { data: hospitalData } = await supabase
          .from('profiles')
          .select('id, hospital_name')
          .eq('id', recordData.hospital_id)
          .maybeSingle();

        if (hospitalData) {
          setHospital(hospitalData);
        }

        // Load file URLs
        if (recordData.file_url) {
          const signedFiles = await getMultipleSignedUrls(recordData.file_url);
          setFiles(signedFiles);
        }

      } catch (error) {
        console.error('Error fetching record:', error);
        toast.error('Failed to load record');
      } finally {
        setLoading(false);
      }
    };

    fetchRecord();
  }, [recordId, profile]);

  const handleDownload = async (url: string) => {
    window.open(url, '_blank');
  };

  const handleDownloadAll = async () => {
    if (files.length === 0) return;
    setDownloading(true);
    
    for (const file of files) {
      window.open(file.url, '_blank');
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    setDownloading(false);
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="container py-8 px-4 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-10 h-10 mx-auto mb-4 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
            <p className="text-muted-foreground">Loading record...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (notFound || !record) {
    return (
      <MainLayout>
        <div className="container py-8 px-4 max-w-2xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate('/patient/dashboard')}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>

          <div className="text-center py-12">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="w-10 h-10 text-destructive" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Record Not Found</h2>
            <p className="text-muted-foreground mb-6">
              This medical record could not be found or you don't have access.
            </p>
            <Button onClick={() => navigate('/patient/dashboard')} variant="medical">
              Go to Dashboard
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  const fileCount = countFiles(record.file_url);

  return (
    <MainLayout>
      <div className="container py-8 px-4 max-w-3xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate('/patient/dashboard')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        {/* Record Header */}
        <div className="bg-card rounded-2xl border border-border p-6 card-shadow mb-6">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-2">{record.title}</h1>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>{format(new Date(record.record_date), 'MMMM dd, yyyy')}</span>
              </div>
            </div>
            {files.length > 0 && (
              <Button
                variant="medical"
                onClick={handleDownloadAll}
                disabled={downloading}
              >
                {downloading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                Download {fileCount > 1 ? 'All' : 'File'}
              </Button>
            )}
          </div>

          {/* Hospital Info */}
          {hospital && (
            <div className="flex items-center gap-4 p-4 rounded-xl bg-primary/5 border border-primary/20 mb-6">
              <div className="w-12 h-12 rounded-xl medical-gradient flex items-center justify-center">
                <Building2 className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Uploaded by</p>
                <p className="font-semibold text-foreground">{hospital.hospital_name || 'Hospital'}</p>
              </div>
            </div>
          )}

          {/* Record Details */}
          <div className="space-y-4">
            {record.diagnosis && (
              <div className="p-4 rounded-xl bg-secondary/50">
                <div className="flex items-center gap-2 mb-2">
                  <Stethoscope className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-foreground">Diagnosis</h3>
                </div>
                <p className="text-foreground">{record.diagnosis}</p>
              </div>
            )}

            {record.doctor_name && (
              <div className="p-4 rounded-xl bg-secondary/50">
                <div className="flex items-center gap-2 mb-2">
                  <ClipboardList className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-foreground">Doctor</h3>
                </div>
                <p className="text-foreground">{record.doctor_name}</p>
              </div>
            )}

            {record.doctor_notes && (
              <div className="p-4 rounded-xl bg-secondary/50">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-foreground">Doctor's Notes</h3>
                </div>
                <p className="text-foreground italic">"{record.doctor_notes}"</p>
              </div>
            )}

            {record.description && (
              <div className="p-4 rounded-xl bg-secondary/50">
                <h3 className="font-semibold text-foreground mb-2">Description</h3>
                <p className="text-foreground">{record.description}</p>
              </div>
            )}
          </div>
        </div>

        {/* Attached Files */}
        {files.length > 0 && (
          <div className="bg-card rounded-2xl border border-border p-6 card-shadow">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">
                Attached Files ({files.length})
              </h2>
            </div>
            <div className="space-y-3">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground truncate max-w-[250px]">
                        {file.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        File {index + 1} of {files.length}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(file.url)}
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Download
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>Record created on {format(new Date(record.created_at || record.record_date), 'MMMM dd, yyyy \'at\' h:mm a')}</p>
        </div>
      </div>
    </MainLayout>
  );
};

export default PatientRecordView;
