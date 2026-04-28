import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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
  ChevronRight,
  QrCode,
  Loader2,
  Files,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { format } from 'date-fns';
import { getMultipleSignedUrls, countFiles } from '@/lib/storage';
import { logger } from '@/lib/logger';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, CheckCircle2 } from 'lucide-react';

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

const PatientDashboard = () => {
  const { profile } = useAuth();
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [expandedRecords, setExpandedRecords] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);

  const qrData = JSON.stringify({
    type: 'medivault_patient',
    patientId: profile?.patient_id,
    id: profile?.id,
  });

  const copyPatientId = () => {
    if (profile?.patient_id) {
      navigator.clipboard.writeText(profile.patient_id);
      setCopied(true);
      toast.success('Patient ID copied!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

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
      
      if (files.length === 1) {
        window.open(files[0].url, '_blank');
      } else {
        setExpandedRecords(prev => new Set(prev).add(record.id));
        toast.success(`${files.length} files available - click individual files to download`);
      }
    } catch (error) {
      logger.error('Download error:', error);
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
      logger.error('Download error:', error);
      toast.error('Failed to download file');
    }
  };

  useEffect(() => {
    const fetchRecords = async () => {
      if (!profile) return;
      
      try {
        const { data, error } = await supabase
          .from('medical_records')
          .select('*')
          .eq('patient_id', profile.id)
          .order('record_date', { ascending: false });

        if (error) throw error;
        setRecords(data || []);
      } catch (error) {
        logger.error('Error fetching records:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecords();
  }, [profile]);

  return (
    <MainLayout>
      <div className="container py-8 px-4">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Welcome, {profile?.full_name || 'Patient'}
          </h1>
          <p className="text-muted-foreground">
            View and manage your medical records
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {/* QR Code & Patient ID */}
        <div className="grid lg:grid-cols-3 gap-4 mb-8">
          {/* QR Code Card */}
          <div className="lg:col-span-2 p-6 rounded-xl bg-card border border-border card-shadow">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="p-4 bg-white rounded-2xl shadow-md shrink-0">
                {profile?.patient_id ? (
                  <QRCodeSVG
                    value={qrData}
                    size={160}
                    level="H"
                    includeMargin={true}
                    bgColor="#ffffff"
                    fgColor="#0EA5E9"
                  />
                ) : (
                  <div className="w-[160px] h-[160px] flex items-center justify-center text-muted-foreground text-sm">
                    Generating...
                  </div>
                )}
              </div>

              <div className="flex-1 text-center sm:text-left w-full">
                <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
                  <QrCode className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-semibold text-foreground">Your Patient QR</h2>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Show this to hospitals for instant access to your medical history
                </p>

                <div className="mb-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                    Patient ID
                  </p>
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <code className="px-3 py-2 rounded-lg bg-secondary text-foreground font-mono text-base font-semibold">
                      {profile?.patient_id || '—'}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyPatientId}
                      disabled={!profile?.patient_id}
                    >
                      {copied ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <Button variant="outline" size="sm" asChild>
                  <Link to="/patient/profile">
                    View full profile
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Total Records */}
          <div className="p-6 rounded-xl bg-primary/5 border border-primary/20 flex items-center">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-foreground">{records.length}</h3>
                <p className="text-sm text-muted-foreground">Total Records</p>
              </div>
            </div>
          </div>
        </div>

        {/* Medical Records Timeline */}
        <div className="bg-card rounded-2xl border border-border p-6 card-shadow">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Clock className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">Medical History Timeline</h2>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="w-10 h-10 mx-auto mb-4 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
              <p className="text-muted-foreground">Loading records...</p>
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
                <FileText className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">No Records Yet</h3>
              <p className="text-muted-foreground max-w-sm mx-auto">
                Your medical records will appear here when hospitals upload them after scanning your QR code.
              </p>
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
                            <Link to={`/patient/record/${record.id}`}>
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

export default PatientDashboard;
