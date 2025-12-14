import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { 
  Upload, 
  ArrowLeft, 
  FileText, 
  User, 
  Calendar,
  Loader2,
  CheckCircle,
  Search
} from 'lucide-react';
import { z } from 'zod';

interface PatientInfo {
  id: string;
  full_name: string | null;
  patient_id: string | null;
}

const uploadSchema = z.object({
  title: z.string().min(2, 'Title is required'),
  diagnosis: z.string().optional(),
  doctorName: z.string().optional(),
  doctorNotes: z.string().optional(),
  recordDate: z.string().min(1, 'Record date is required'),
});

const UploadReport = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedPatientId = searchParams.get('patient');
  const { profile: hospitalProfile } = useAuth();
  
  const [patientSearch, setPatientSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<PatientInfo | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    diagnosis: '',
    doctorName: '',
    doctorNotes: '',
    recordDate: new Date().toISOString().split('T')[0]
  });
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  useEffect(() => {
    // If patient ID is preselected, fetch patient info
    if (preselectedPatientId) {
      const fetchPatient = async () => {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('id, full_name, patient_id')
            .eq('id', preselectedPatientId)
            .eq('role', 'patient')
            .maybeSingle();

          if (!error && data) {
            setSelectedPatient(data);
          }
        } catch (error) {
          console.error('Error fetching patient:', error);
        }
      };
      fetchPatient();
    }
  }, [preselectedPatientId]);

  const handlePatientSearch = async () => {
    if (!patientSearch.trim()) {
      toast.error('Please enter a Patient ID');
      return;
    }

    setSearchLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, patient_id')
        .eq('patient_id', patientSearch.trim())
        .eq('role', 'patient')
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSelectedPatient(data);
        toast.success('Patient found!');
      } else {
        toast.error('Patient not found');
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Failed to search patient');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file size (max 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPatient) {
      toast.error('Please select a patient first');
      return;
    }

    if (!hospitalProfile) {
      toast.error('Hospital profile not found');
      return;
    }

    setErrors({});
    
    const result = uploadSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    try {
      let fileUrl: string | null = null;

      // Upload file if provided
      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${selectedPatient.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError, data: uploadData } = await supabase.storage
          .from('medical-files')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('medical-files')
          .getPublicUrl(fileName);
        
        fileUrl = urlData.publicUrl;
      }

      // Create medical record
      const { error: recordError } = await supabase
        .from('medical_records')
        .insert({
          patient_id: selectedPatient.id,
          hospital_id: hospitalProfile.id,
          title: formData.title,
          diagnosis: formData.diagnosis || null,
          doctor_name: formData.doctorName || null,
          doctor_notes: formData.doctorNotes || null,
          record_date: formData.recordDate,
          file_url: fileUrl
        });

      if (recordError) throw recordError;

      setUploadSuccess(true);
      toast.success('Medical record uploaded successfully!');
      
      // Reset form
      setTimeout(() => {
        navigate(`/hospital/patient/${selectedPatient.patient_id}`);
      }, 2000);

    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload record');
    } finally {
      setLoading(false);
    }
  };

  if (uploadSuccess) {
    return (
      <MainLayout>
        <div className="container py-8 px-4 max-w-2xl mx-auto">
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-success/10 flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-success" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Upload Successful!</h2>
            <p className="text-muted-foreground mb-4">
              The medical record has been added to the patient's history.
            </p>
            <p className="text-sm text-muted-foreground">Redirecting...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container py-8 px-4 max-w-2xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl medical-gradient flex items-center justify-center">
            <Upload className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Upload Medical Report</h1>
          <p className="text-muted-foreground">
            Add a new medical record to the patient's history
          </p>
        </div>

        {/* Patient Selection */}
        {!selectedPatient ? (
          <div className="bg-card rounded-2xl border border-border p-6 card-shadow mb-6">
            <div className="flex items-center gap-3 mb-4">
              <User className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Select Patient</h2>
            </div>
            <div className="flex gap-3">
              <Input
                placeholder="Enter Patient ID (e.g., MED123456)"
                value={patientSearch}
                onChange={(e) => setPatientSearch(e.target.value)}
                className="flex-1"
                onKeyDown={(e) => e.key === 'Enter' && handlePatientSearch()}
              />
              <Button onClick={handlePatientSearch} disabled={searchLoading}>
                {searchLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="bg-primary/5 rounded-2xl border border-primary/20 p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl medical-gradient flex items-center justify-center">
                  <User className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{selectedPatient.full_name}</h3>
                  <p className="text-sm text-muted-foreground font-mono">ID: {selectedPatient.patient_id}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedPatient(null)}>
                Change
              </Button>
            </div>
          </div>
        )}

        {/* Upload Form */}
        <div className="bg-card rounded-2xl border border-border p-6 card-shadow">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="title">Report Title *</Label>
              <Input
                id="title"
                name="title"
                placeholder="e.g., Blood Test Results, X-Ray Report"
                value={formData.title}
                onChange={handleChange}
                disabled={loading || !selectedPatient}
              />
              {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="diagnosis">Diagnosis</Label>
              <Input
                id="diagnosis"
                name="diagnosis"
                placeholder="Enter diagnosis (optional)"
                value={formData.diagnosis}
                onChange={handleChange}
                disabled={loading || !selectedPatient}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="doctorName">Doctor Name</Label>
                <Input
                  id="doctorName"
                  name="doctorName"
                  placeholder="Dr. Name"
                  value={formData.doctorName}
                  onChange={handleChange}
                  disabled={loading || !selectedPatient}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="recordDate">Record Date *</Label>
                <Input
                  id="recordDate"
                  name="recordDate"
                  type="date"
                  value={formData.recordDate}
                  onChange={handleChange}
                  disabled={loading || !selectedPatient}
                />
                {errors.recordDate && <p className="text-sm text-destructive">{errors.recordDate}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="doctorNotes">Doctor Notes</Label>
              <Textarea
                id="doctorNotes"
                name="doctorNotes"
                placeholder="Add any additional notes..."
                value={formData.doctorNotes}
                onChange={handleChange}
                className="min-h-[100px]"
                disabled={loading || !selectedPatient}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="file">Attach File (Optional)</Label>
              <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary/50 transition-colors">
                <input
                  type="file"
                  id="file"
                  className="hidden"
                  onChange={handleFileChange}
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  disabled={loading || !selectedPatient}
                />
                <label htmlFor="file" className="cursor-pointer">
                  {file ? (
                    <div className="flex items-center justify-center gap-3">
                      <FileText className="w-8 h-8 text-primary" />
                      <div className="text-left">
                        <p className="font-medium text-foreground">{file.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        PDF, JPG, PNG, DOC (Max 10MB)
                      </p>
                    </>
                  )}
                </label>
              </div>
            </div>

            <Button 
              type="submit" 
              variant="medical" 
              size="lg" 
              className="w-full" 
              disabled={loading || !selectedPatient}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  Upload Record
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </MainLayout>
  );
};

export default UploadReport;
