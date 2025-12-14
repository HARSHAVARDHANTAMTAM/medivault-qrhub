import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { QRCodeSVG } from 'qrcode.react';
import { 
  User, 
  Phone, 
  Mail, 
  Calendar,
  Copy,
  Download,
  CheckCircle2,
  QrCode
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useState, useRef } from 'react';

const PatientProfile = () => {
  const { user, profile } = useAuth();
  const [copied, setCopied] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  const copyPatientId = () => {
    if (profile?.patient_id) {
      navigator.clipboard.writeText(profile.patient_id);
      setCopied(true);
      toast.success('Patient ID copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const downloadQR = () => {
    if (qrRef.current) {
      const svg = qrRef.current.querySelector('svg');
      if (svg) {
        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        canvas.width = 300;
        canvas.height = 300;
        
        img.onload = () => {
          ctx?.drawImage(img, 0, 0, 300, 300);
          const pngUrl = canvas.toDataURL('image/png');
          const link = document.createElement('a');
          link.download = `patient-qr-${profile?.patient_id}.png`;
          link.href = pngUrl;
          link.click();
          toast.success('QR Code downloaded!');
        };
        
        img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
      }
    }
  };

  // Create QR data with patient info
  const qrData = JSON.stringify({
    type: 'medivault_patient',
    patientId: profile?.patient_id,
    id: profile?.id
  });

  return (
    <MainLayout>
      <div className="container py-8 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full medical-gradient flex items-center justify-center">
              <User className="w-10 h-10 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              {profile?.full_name || 'Patient Profile'}
            </h1>
            <p className="text-muted-foreground">Your personal information and QR code</p>
          </div>

          {/* QR Code Card */}
          <div className="bg-card rounded-2xl border border-border p-8 mb-6 card-shadow text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <QrCode className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">Your Patient QR Code</h2>
            </div>
            <p className="text-muted-foreground mb-6">
              Show this QR code to hospitals for instant access to your medical history
            </p>
            
            <div 
              ref={qrRef}
              className="inline-block p-6 bg-white rounded-2xl shadow-lg mb-6"
            >
              <QRCodeSVG
                value={qrData}
                size={200}
                level="H"
                includeMargin={true}
                bgColor="#ffffff"
                fgColor="#0EA5E9"
              />
            </div>

            <div className="flex justify-center gap-3">
              <Button variant="outline" onClick={downloadQR}>
                <Download className="w-4 h-4" />
                Download QR
              </Button>
            </div>
          </div>

          {/* Patient ID Card */}
          <div className="bg-card rounded-2xl border border-border p-6 mb-6 card-shadow">
            <h3 className="text-lg font-semibold text-foreground mb-4">Patient ID</h3>
            <div className="flex items-center justify-between p-4 rounded-xl bg-primary/5 border border-primary/20">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Unique Patient ID</p>
                <p className="text-2xl font-mono font-bold text-primary">
                  {profile?.patient_id || 'Loading...'}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={copyPatientId}>
                {copied ? (
                  <CheckCircle2 className="w-4 h-4 text-success" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
                {copied ? 'Copied!' : 'Copy'}
              </Button>
            </div>
          </div>

          {/* Profile Details */}
          <div className="bg-card rounded-2xl border border-border p-6 card-shadow">
            <h3 className="text-lg font-semibold text-foreground mb-4">Profile Details</h3>
            
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 rounded-xl bg-secondary/50">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Full Name</p>
                  <p className="font-medium text-foreground">{profile?.full_name || 'Not set'}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-xl bg-secondary/50">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Phone className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Mobile Number</p>
                  <p className="font-medium text-foreground">{profile?.mobile_number || 'Not set'}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-xl bg-secondary/50">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email Address</p>
                  <p className="font-medium text-foreground">{user?.email || 'Not set'}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-xl bg-secondary/50">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Member Since</p>
                  <p className="font-medium text-foreground">
                    {profile?.created_at 
                      ? format(new Date(profile.created_at), 'MMMM dd, yyyy')
                      : 'Not available'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default PatientProfile;
