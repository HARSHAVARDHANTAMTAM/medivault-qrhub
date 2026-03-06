import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { QrCode, Camera, Search, ArrowLeft, RefreshCw, Upload } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { logger } from '@/lib/logger';

const QRScanner = () => {
  const navigate = useNavigate();
  const [scanning, setScanning] = useState(false);
  const [manualId, setManualId] = useState('');
  const [hasCamera, setHasCamera] = useState(true);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const extractPatientId = (decodedText: string): string | null => {
    // Try to parse as JSON first (new format)
    try {
      const data = JSON.parse(decodedText);
      if (data.type === 'medivault_patient' && data.patientId) {
        return data.patientId;
      }
    } catch {
      // Not JSON, try other formats
    }
    
    // Format: MEDIVAULT:PATIENT_ID
    if (decodedText.startsWith('MEDIVAULT:')) {
      return decodedText.replace('MEDIVAULT:', '');
    }
    
    // Plain patient ID format (MED followed by digits)
    if (decodedText.match(/^MED\d+$/)) {
      return decodedText;
    }
    
    return null;
  };

  const handleScanResult = (decodedText: string) => {
    // Stop scanner
    if (scannerRef.current) {
      scannerRef.current.stop().then(() => {
        setScanning(false);
        
        const patientId = extractPatientId(decodedText);
        if (patientId) {
          toast.success('QR Code scanned successfully!');
          navigate(`/hospital/patient/${patientId}`);
        } else {
          toast.error('Invalid QR code format');
        }
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
      logger.error('Scanner error:', error);
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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    setIsProcessingFile(true);
    
    try {
      const html5QrCode = new Html5Qrcode("qr-file-reader");
      const result = await html5QrCode.scanFile(file, true);
      
      const patientId = extractPatientId(result);
      if (patientId) {
        toast.success('QR Code scanned successfully!');
        navigate(`/hospital/patient/${patientId}`);
      } else {
        toast.error('Invalid QR code format');
      }
    } catch (error) {
      console.error('File scan error:', error);
      toast.error('Could not read QR code from image. Please try another image or use manual entry.');
    } finally {
      setIsProcessingFile(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
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
                Please allow camera access or use the upload/manual entry options below.
              </p>
            </div>
          )}
        </div>

        {/* Upload QR Code */}
        <div className="bg-card rounded-2xl border border-border p-6 card-shadow mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Upload className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Upload QR Code</h2>
          </div>
          <p className="text-muted-foreground text-sm mb-4">
            Upload a QR code image from your device.
          </p>
          <div id="qr-file-reader" style={{ display: 'none' }} />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
            id="qr-file-input"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            size="lg"
            className="w-full"
            disabled={isProcessingFile}
          >
            {isProcessingFile ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload QR Image
              </>
            )}
          </Button>
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
