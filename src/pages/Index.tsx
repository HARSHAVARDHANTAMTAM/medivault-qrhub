import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { MainLayout } from '@/components/layout/MainLayout';
import { 
  QrCode, 
  FileText, 
  Shield, 
  Building2, 
  User, 
  Download, 
  Upload, 
  Clock,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';

const Index = () => {
  const features = [
    {
      icon: <QrCode className="w-8 h-8" />,
      title: "Instant QR Access",
      description: "Hospitals scan patient QR codes to instantly access complete medical history"
    },
    {
      icon: <FileText className="w-8 h-8" />,
      title: "Digital Records",
      description: "All medical reports stored securely in one place, accessible anytime"
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Secure & Private",
      description: "Your medical data is encrypted and protected with industry standards"
    },
    {
      icon: <Clock className="w-8 h-8" />,
      title: "Timeline View",
      description: "View your complete medical history in chronological order"
    }
  ];

  const patientBenefits = [
    "No more carrying physical files",
    "Access records from anywhere",
    "Automatic report updates from hospitals",
    "Download reports anytime"
  ];

  const hospitalBenefits = [
    "Instant patient history access",
    "Upload treatment records",
    "Reduce administrative work",
    "Better patient care decisions"
  ];

  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="hero-gradient py-20 lg:py-32">
        <div className="container px-4">
          <div className="max-w-4xl mx-auto text-center animate-slide-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Shield className="w-4 h-4" />
              Secure Healthcare Records
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
              Your Medical Records,
              <span className="text-primary block">Always With You</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              Patients register with their mobile number and instantly receive a unique QR code. 
              Hospitals scan the QR to access complete medical history, eliminating physical files forever.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="hero" size="xl" asChild>
                <Link to="/patient/register">
                  <User className="w-5 h-5" />
                  Patient Registration
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
              <Button variant="outline" size="xl" asChild>
                <Link to="/hospital/register">
                  <Building2 className="w-5 h-5" />
                  Hospital Registration
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-background">
        <div className="container px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              How MediVault Works
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              A seamless digital healthcare experience for patients and hospitals
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="group p-6 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all duration-300 card-shadow hover:elevated-shadow"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-16 h-16 rounded-xl medical-gradient flex items-center justify-center text-primary-foreground mb-5 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-secondary/30">
        <div className="container px-4">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Patient Benefits */}
            <div className="p-8 rounded-2xl bg-card border border-border card-shadow">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                  <User className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-foreground">For Patients</h3>
                  <p className="text-muted-foreground">Your health, your control</p>
                </div>
              </div>
              <ul className="space-y-4 mb-8">
                {patientBenefits.map((benefit, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />
                    <span className="text-foreground">{benefit}</span>
                  </li>
                ))}
              </ul>
              <div className="flex gap-4">
                <Button variant="default" asChild className="flex-1">
                  <Link to="/patient/register">Register Now</Link>
                </Button>
                <Button variant="outline" asChild className="flex-1">
                  <Link to="/patient/login">Login</Link>
                </Button>
              </div>
            </div>

            {/* Hospital Benefits */}
            <div className="p-8 rounded-2xl bg-card border border-border card-shadow">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center">
                  <Building2 className="w-7 h-7 text-accent" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-foreground">For Hospitals</h3>
                  <p className="text-muted-foreground">Better care, faster access</p>
                </div>
              </div>
              <ul className="space-y-4 mb-8">
                {hospitalBenefits.map((benefit, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />
                    <span className="text-foreground">{benefit}</span>
                  </li>
                ))}
              </ul>
              <div className="flex gap-4">
                <Button variant="default" asChild className="flex-1">
                  <Link to="/hospital/register">Register Hospital</Link>
                </Button>
                <Button variant="outline" asChild className="flex-1">
                  <Link to="/hospital/login">Login</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-background">
        <div className="container px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Simple 3-Step Process
            </h2>
          </div>
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full medical-gradient flex items-center justify-center text-primary-foreground text-2xl font-bold">
                  1
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">Register</h3>
                <p className="text-muted-foreground">
                  Patient registers with mobile number and gets unique QR code
                </p>
              </div>
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full medical-gradient flex items-center justify-center text-primary-foreground text-2xl font-bold">
                  2
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">Scan</h3>
                <p className="text-muted-foreground">
                  Hospital scans QR code to access patient's medical history
                </p>
              </div>
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full medical-gradient flex items-center justify-center text-primary-foreground text-2xl font-bold">
                  3
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">Access & Upload</h3>
                <p className="text-muted-foreground">
                  View history, download reports, and upload new treatment records
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 medical-gradient">
        <div className="container px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-6">
            Ready to Go Digital?
          </h2>
          <p className="text-primary-foreground/80 text-lg mb-8 max-w-2xl mx-auto">
            Join thousands of patients and hospitals using MediVault for secure, 
            instant access to medical records.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="secondary" size="xl" asChild>
              <Link to="/patient/register">
                Get Started Free
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </MainLayout>
  );
};

export default Index;
