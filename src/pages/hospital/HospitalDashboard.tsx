import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { 
  QrCode, 
  FileText, 
  Users,
  Upload,
  Clock,
  Building2,
  ChevronRight,
  Search
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface RecentRecord {
  id: string;
  title: string;
  patient_id: string;
  record_date: string;
  created_at: string;
}

const HospitalDashboard = () => {
  const { profile } = useAuth();
  const [recentRecords, setRecentRecords] = useState<RecentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [patientIdSearch, setPatientIdSearch] = useState('');
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPatients, setTotalPatients] = useState(0);

  useEffect(() => {
    const fetchStats = async () => {
      if (!profile) return;
      
      try {
        // Fetch recent records created by this hospital
        const { data: records, error: recordsError } = await supabase
          .from('medical_records')
          .select('*')
          .eq('hospital_id', profile.id)
          .order('created_at', { ascending: false })
          .limit(5);

        if (recordsError) throw recordsError;
        setRecentRecords(records || []);

        // Get total records count
        const { count: recordCount } = await supabase
          .from('medical_records')
          .select('*', { count: 'exact', head: true })
          .eq('hospital_id', profile.id);
        
        setTotalRecords(recordCount || 0);

        // Get unique patients count
        const { data: uniquePatients } = await supabase
          .from('medical_records')
          .select('patient_id')
          .eq('hospital_id', profile.id);
        
        const uniquePatientIds = new Set(uniquePatients?.map(r => r.patient_id));
        setTotalPatients(uniquePatientIds.size);

      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [profile]);

  const handleManualSearch = () => {
    if (!patientIdSearch.trim()) {
      toast.error('Please enter a Patient ID');
      return;
    }
    // Navigate to patient history with the patient ID
    window.location.href = `/hospital/patient/${patientIdSearch.trim()}`;
  };

  return (
    <MainLayout>
      <div className="container py-8 px-4">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Welcome, {profile?.hospital_name || 'Hospital'}
          </h1>
          <p className="text-muted-foreground">
            Scan patient QR codes or search by Patient ID to access medical records
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Link
            to="/hospital/scan"
            className="group p-6 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all card-shadow hover:elevated-shadow"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary-foreground/20 flex items-center justify-center">
                <QrCode className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Scan QR Code</h3>
                <p className="text-sm opacity-80">Access patient records</p>
              </div>
              <ChevronRight className="w-5 h-5 opacity-60 group-hover:opacity-100 transition-opacity" />
            </div>
          </Link>

          <Link
            to="/hospital/upload"
            className="group p-6 rounded-xl bg-card border border-border hover:border-primary/30 transition-all card-shadow hover:elevated-shadow"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                <Upload className="w-6 h-6 text-accent" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                  Upload Report
                </h3>
                <p className="text-sm text-muted-foreground">Add medical records</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </Link>

          <div className="p-6 rounded-xl bg-secondary/50 border border-border">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-foreground">{totalRecords}</h3>
                <p className="text-sm text-muted-foreground">Records Created</p>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-xl bg-secondary/50 border border-border">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-accent" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-foreground">{totalPatients}</h3>
                <p className="text-sm text-muted-foreground">Patients Served</p>
              </div>
            </div>
          </div>
        </div>

        {/* Manual Patient ID Search */}
        <div className="bg-card rounded-2xl border border-border p-6 card-shadow mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Search className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">Search by Patient ID</h2>
          </div>
          <p className="text-muted-foreground mb-4">
            Enter the Patient ID manually if you can't scan the QR code
          </p>
          <div className="flex gap-3">
            <Input
              placeholder="Enter Patient ID (e.g., MED123456)"
              value={patientIdSearch}
              onChange={(e) => setPatientIdSearch(e.target.value)}
              className="flex-1"
              onKeyDown={(e) => e.key === 'Enter' && handleManualSearch()}
            />
            <Button onClick={handleManualSearch} variant="medical">
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
          </div>
        </div>

        {/* Recent Records */}
        <div className="bg-card rounded-2xl border border-border p-6 card-shadow">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Clock className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">Recent Records</h2>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="w-10 h-10 mx-auto mb-4 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
              <p className="text-muted-foreground">Loading records...</p>
            </div>
          ) : recentRecords.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
                <FileText className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">No Records Yet</h3>
              <p className="text-muted-foreground max-w-sm mx-auto mb-4">
                Start by scanning a patient's QR code and uploading their medical records.
              </p>
              <Button asChild variant="medical">
                <Link to="/hospital/scan">
                  <QrCode className="w-4 h-4 mr-2" />
                  Scan First Patient
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {recentRecords.map((record) => (
                <div
                  key={record.id}
                  className="p-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-foreground">{record.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(record.created_at), 'MMM dd, yyyy HH:mm')}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm">
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default HospitalDashboard;
