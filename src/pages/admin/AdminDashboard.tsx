import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Building2, 
  CheckCircle, 
  XCircle, 
  Clock, 
  LogOut,
  Phone,
  MapPin,
  FileText
} from 'lucide-react';

interface HospitalRequest {
  id: string;
  hospital_name: string;
  hospital_license: string;
  hospital_address: string;
  mobile_number: string;
  is_approved: boolean;
  created_at: string;
}

const AdminDashboard = () => {
  const { signOut } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'pending' | 'approved' | 'all'>('pending');

  const { data: hospitals, isLoading } = useQuery({
    queryKey: ['hospital-requests', filter],
    queryFn: async () => {
      let query = supabase
        .from('profiles')
        .select('*')
        .eq('role', 'hospital')
        .order('created_at', { ascending: false });

      if (filter === 'pending') {
        query = query.eq('is_approved', false);
      } else if (filter === 'approved') {
        query = query.eq('is_approved', true);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as HospitalRequest[];
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (hospitalId: string) => {
      const { error } = await supabase
        .from('profiles')
        .update({ is_approved: true })
        .eq('id', hospitalId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hospital-requests'] });
      toast({
        title: 'Hospital Approved',
        description: 'The hospital can now access the system.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to approve hospital. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (hospitalId: string) => {
      const { error } = await supabase
        .from('profiles')
        .update({ is_approved: false })
        .eq('id', hospitalId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hospital-requests'] });
      toast({
        title: 'Hospital Rejected',
        description: 'The hospital access has been revoked.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to reject hospital. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const pendingCount = hospitals?.filter(h => !h.is_approved).length || 0;
  const approvedCount = hospitals?.filter(h => h.is_approved).length || 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Admin Dashboard</h1>
              <p className="text-sm text-muted-foreground">Hospital Management</p>
            </div>
          </div>
          <Button variant="outline" onClick={signOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Requests</p>
                  <p className="text-3xl font-bold text-warning">{pendingCount}</p>
                </div>
                <Clock className="w-10 h-10 text-warning/50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Approved Hospitals</p>
                  <p className="text-3xl font-bold text-primary">{approvedCount}</p>
                </div>
                <CheckCircle className="w-10 h-10 text-primary/50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Hospitals</p>
                  <p className="text-3xl font-bold text-foreground">{hospitals?.length || 0}</p>
                </div>
                <Building2 className="w-10 h-10 text-muted-foreground/50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={filter === 'pending' ? 'default' : 'outline'}
            onClick={() => setFilter('pending')}
            size="sm"
          >
            <Clock className="w-4 h-4 mr-2" />
            Pending ({pendingCount})
          </Button>
          <Button
            variant={filter === 'approved' ? 'default' : 'outline'}
            onClick={() => setFilter('approved')}
            size="sm"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Approved ({approvedCount})
          </Button>
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
            size="sm"
          >
            All ({hospitals?.length || 0})
          </Button>
        </div>

        {/* Hospital Requests List */}
        <Card>
          <CardHeader>
            <CardTitle>Hospital Requests</CardTitle>
            <CardDescription>
              Review and manage hospital registration requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading requests...
              </div>
            ) : hospitals?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No hospital requests found.
              </div>
            ) : (
              <div className="space-y-4">
                {hospitals?.map((hospital) => (
                  <div
                    key={hospital.id}
                    className="border border-border rounded-lg p-4 bg-card"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-foreground">
                            {hospital.hospital_name}
                          </h3>
                          <Badge
                            variant={hospital.is_approved ? 'default' : 'secondary'}
                          >
                            {hospital.is_approved ? 'Approved' : 'Pending'}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            License: {hospital.hospital_license}
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            {hospital.mobile_number}
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            {hospital.hospital_address}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Registered: {new Date(hospital.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {!hospital.is_approved ? (
                          <>
                            <Button
                              size="sm"
                              onClick={() => approveMutation.mutate(hospital.id)}
                              disabled={approveMutation.isPending}
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => rejectMutation.mutate(hospital.id)}
                              disabled={rejectMutation.isPending}
                            >
                              <XCircle className="w-4 h-4 mr-2" />
                              Reject
                            </Button>
                          </>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => rejectMutation.mutate(hospital.id)}
                            disabled={rejectMutation.isPending}
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Revoke Access
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AdminDashboard;
