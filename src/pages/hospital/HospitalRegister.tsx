import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Building2, ArrowRight, Loader2, Phone, Mail, Lock, MapPin, FileCheck } from 'lucide-react';
import { z } from 'zod';

const registerSchema = z.object({
  hospitalName: z.string().min(2, 'Hospital name must be at least 2 characters'),
  hospitalLicense: z.string().min(5, 'License number must be at least 5 characters'),
  hospitalAddress: z.string().min(10, 'Please provide a complete address'),
  mobileNumber: z.string().min(10, 'Mobile number must be at least 10 digits'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const HospitalRegister = () => {
  const [formData, setFormData] = useState({
    hospitalName: '',
    hospitalLicense: '',
    hospitalAddress: '',
    mobileNumber: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    const result = registerSchema.safeParse(formData);
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
      const { error } = await signUp(formData.email, formData.password, 'hospital', {
        hospital_name: formData.hospitalName,
        hospital_license: formData.hospitalLicense,
        hospital_address: formData.hospitalAddress,
        mobile_number: formData.mobileNumber
      });

      if (error) {
        if (error.message.includes('already registered')) {
          toast.error('This email is already registered. Please login instead.');
        } else {
          toast.error(error.message);
        }
      } else {
        toast.success('Registration submitted! Please wait for admin approval.');
        navigate('/hospital/login');
      }
    } catch (error) {
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-lg">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-accent flex items-center justify-center">
              <Building2 className="w-8 h-8 text-accent-foreground" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Hospital Registration</h1>
            <p className="text-muted-foreground">
              Register your hospital to access patient records via QR scan
            </p>
          </div>

          <div className="bg-card rounded-2xl border border-border p-8 card-shadow">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="hospitalName">Hospital Name</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="hospitalName"
                    name="hospitalName"
                    type="text"
                    placeholder="Enter hospital name"
                    value={formData.hospitalName}
                    onChange={handleChange}
                    className="pl-10"
                    disabled={loading}
                  />
                </div>
                {errors.hospitalName && <p className="text-sm text-destructive">{errors.hospitalName}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="hospitalLicense">Hospital License Number</Label>
                <div className="relative">
                  <FileCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="hospitalLicense"
                    name="hospitalLicense"
                    type="text"
                    placeholder="Enter license number"
                    value={formData.hospitalLicense}
                    onChange={handleChange}
                    className="pl-10"
                    disabled={loading}
                  />
                </div>
                {errors.hospitalLicense && <p className="text-sm text-destructive">{errors.hospitalLicense}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="hospitalAddress">Hospital Address</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                  <Textarea
                    id="hospitalAddress"
                    name="hospitalAddress"
                    placeholder="Enter complete address"
                    value={formData.hospitalAddress}
                    onChange={handleChange}
                    className="pl-10 min-h-[80px]"
                    disabled={loading}
                  />
                </div>
                {errors.hospitalAddress && <p className="text-sm text-destructive">{errors.hospitalAddress}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="mobileNumber">Contact Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="mobileNumber"
                    name="mobileNumber"
                    type="tel"
                    placeholder="Enter contact number"
                    value={formData.mobileNumber}
                    onChange={handleChange}
                    className="pl-10"
                    disabled={loading}
                  />
                </div>
                {errors.mobileNumber && <p className="text-sm text-destructive">{errors.mobileNumber}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Enter hospital email"
                    value={formData.email}
                    onChange={handleChange}
                    className="pl-10"
                    disabled={loading}
                  />
                </div>
                {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="Password"
                      value={formData.password}
                      onChange={handleChange}
                      className="pl-10"
                      disabled={loading}
                    />
                  </div>
                  {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      placeholder="Confirm"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="pl-10"
                      disabled={loading}
                    />
                  </div>
                  {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword}</p>}
                </div>
              </div>

              <div className="p-4 rounded-lg bg-warning/10 border border-warning/20">
                <p className="text-sm text-warning-foreground">
                  <strong>Note:</strong> Hospital registration requires admin approval. You'll be notified once approved.
                </p>
              </div>

              <Button type="submit" variant="medical" size="lg" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    Submit Registration
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-muted-foreground">
                Already registered?{' '}
                <Link to="/hospital/login" className="text-primary hover:underline font-medium">
                  Login here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default HospitalRegister;
