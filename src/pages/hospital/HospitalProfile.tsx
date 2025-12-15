import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { 
  Building2, 
  ArrowLeft, 
  MapPin, 
  FileText, 
  Save,
  Loader2,
  CheckCircle,
  XCircle
} from 'lucide-react';

const HospitalProfile = () => {
  const navigate = useNavigate();
  const { profile, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    hospital_name: profile?.hospital_name || '',
    hospital_address: profile?.hospital_address || '',
    hospital_license: profile?.hospital_license || '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!profile?.id) {
      toast.error('Profile not found');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          hospital_name: formData.hospital_name,
          hospital_address: formData.hospital_address,
          hospital_license: formData.hospital_license,
        })
        .eq('id', profile.id);

      if (error) throw error;

      await refreshProfile();
      toast.success('Profile updated successfully!');
    } catch (error: any) {
      console.error('Update error:', error);
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="container py-8 px-4 max-w-2xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate('/hospital/dashboard')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl medical-gradient flex items-center justify-center">
            <Building2 className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Hospital Profile</h1>
          <p className="text-muted-foreground">
            View and manage your hospital information
          </p>
        </div>

        {/* Approval Status */}
        <div className={`mb-6 p-4 rounded-xl border ${profile?.is_approved ? 'bg-success/10 border-success/30' : 'bg-warning/10 border-warning/30'}`}>
          <div className="flex items-center gap-3">
            {profile?.is_approved ? (
              <>
                <CheckCircle className="w-5 h-5 text-success" />
                <div>
                  <p className="font-medium text-foreground">Approved</p>
                  <p className="text-sm text-muted-foreground">Your hospital is verified and can access all features</p>
                </div>
              </>
            ) : (
              <>
                <XCircle className="w-5 h-5 text-warning" />
                <div>
                  <p className="font-medium text-foreground">Pending Approval</p>
                  <p className="text-sm text-muted-foreground">Your hospital registration is under review</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Profile Form */}
        <div className="bg-card rounded-2xl border border-border p-6 card-shadow">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="hospital_name" className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-muted-foreground" />
                Hospital Name
              </Label>
              <Input
                id="hospital_name"
                name="hospital_name"
                placeholder="Enter hospital name"
                value={formData.hospital_name}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hospital_address" className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                Hospital Address
              </Label>
              <Textarea
                id="hospital_address"
                name="hospital_address"
                placeholder="Enter full address"
                value={formData.hospital_address}
                onChange={handleChange}
                className="min-h-[100px]"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hospital_license" className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-muted-foreground" />
                License Number
              </Label>
              <Input
                id="hospital_license"
                name="hospital_license"
                placeholder="Enter license number"
                value={formData.hospital_license}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            <Button 
              type="submit" 
              variant="medical" 
              size="lg" 
              className="w-full" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Save Changes
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </MainLayout>
  );
};

export default HospitalProfile;
