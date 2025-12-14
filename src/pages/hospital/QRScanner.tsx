import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { QrCode, Camera, Search, ArrowLeft, RefreshCw } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';

const QRScanner = () => {
  const navigate = useNavigate();
  const [scanning, setScanning] = useState(false);
  const [manualId, setManualId] = useState('');
  const [hasCamera, setHasCamera] = useState(true);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check for camera permissions
    const checkCamera = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(d => d.kind === 'videoinput');
        setHasCamera(videoDevices.length > 0);
      } catch (error) {
        setHasCamera(false);
      }
    };
    checkCamera();

    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const handleScanResult = (decodedText: string) => {
    // Stop scanner
    if (scannerRef.current) {
      scannerRef.current.stop().then(() => {
        setScanning(false);
        // Extract patient ID from QR data
        // Format: MEDIVAULT:PATIENT_ID or just PATIENT_ID
        let patientId = decodedText;
        if (decodedText.startsWith('MEDIVAULT:')) {
          patientId = decodedText.replace('MEDIVAULT:', '');
        }
        toast.success('QR Code scanned successfully!');
        navigate(`/hospital/patient/${patientId}`);
      }).catch(() => {});
    }
  };

  const startScanner = async () => {
    if (!containerRef.current) return;
    
    try {
      const html5QrCode = new Html5Qrcode("qr-reader");
      scannerRef.current = html5QrCode;
      
      await html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        handleScanResult,
        () => {} // Ignore scan failures
      );
      
      setScanning(true);
    } catch (error) {
      console.error('Scanner error:', error);
      toast.error('Failed to start camera. Please try manual entry.');
      setHasCamera(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        setScanning(false);
      } catch (error) {
        console.error('Error stopping scanner:', error);
      }
    }
  };

  const handleManualSearch = () => {
    if (!manualId.trim()) {
      toast.error('Please enter a Patient ID');
      return;
    }
    navigate(`/hospital/patient/${manualId.trim()}`);
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
            <QrCode className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Scan Patient QR</h1>
          <p className="text-muted-foreground">
            Scan the patient's QR code to access their medical history
          </p>
        </div>

        {/* QR Scanner */}
        <div className="bg-card rounded-2xl border border-border p-6 card-shadow mb-6">
          {hasCamera ? (
            <>
              <div 
                id="qr-reader" 
                ref={containerRef}
                className="rounded-xl overflow-hidden bg-secondary mb-4"
                style={{ minHeight: scanning ? '300px' : '0' }}
              />
              
              {!scanning ? (
                <Button onClick={startScanner} variant="medical" size="lg" className="w-full">
                  <Camera className="w-5 h-5 mr-2" />
                  Start Camera
                </Button>
              ) : (
                <div className="flex gap-3">
                  <Button onClick={stopScanner} variant="outline" size="lg" className="flex-1">
                    Stop Camera
                  </Button>
                  <Button onClick={() => { stopScanner(); startScanner(); }} variant="ghost" size="lg">
                    <RefreshCw className="w-5 h-5" />
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
                <Camera className="w-8 h-8 text-destructive" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">Camera Not Available</h3>
              <p className="text-muted-foreground">
                Please allow camera access or use manual Patient ID entry below.
              </p>
            </div>
          )}
        </div>

        {/* Manual Entry */}
        <div className="bg-card rounded-2xl border border-border p-6 card-shadow">
          <div className="flex items-center gap-3 mb-4">
            <Search className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Manual Entry</h2>
          </div>
          <p className="text-muted-foreground text-sm mb-4">
            Can't scan? Enter the Patient ID manually.
          </p>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="patientId">Patient ID</Label>
              <Input
                id="patientId"
                placeholder="Enter Patient ID (e.g., MED123456)"
                value={manualId}
                onChange={(e) => setManualId(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleManualSearch()}
              />
            </div>
            <Button onClick={handleManualSearch} variant="outline" size="lg" className="w-full">
              <Search className="w-4 h-4 mr-2" />
              Search Patient
            </Button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default QRScanner;
