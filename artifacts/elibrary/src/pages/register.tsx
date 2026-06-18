import { useState } from "react";
import { useRegister, useVerifyIdentity } from "@workspace/api-client-react";
import type { RegisterInputRole } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocation, Link } from "wouter";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Library, Eye, EyeOff, ChevronLeft, User } from "lucide-react";

const CAMPUSES = [
  "ZDSPGC-Dimataling Campus",
  "ZDSPGC-Dumingag Campus",
  "ZDSPGC-Guipos Campus",
  "ZDSPGC-Josefina Campus",
  "ZDSPGC-Kumalarang Campus",
  "ZDSPGC-Lakewood Campus",
  "ZDSPGC-Lapuyan Campus",
  "ZDSPGC-Mahayag Campus",
  "ZDSPGC-Margosatubig Campus",
  "ZDSPGC-Midsalip Campus",
  "ZDSPGC-Molave Campus",
  "ZDSPGC-Pagadian Campus",
  "ZDSPGC-Ramon Magsaysay Campus",
  "ZDSPGC-San Pablo Campus",
  "ZDSPGC-Tambulig Campus",
  "ZDSPGC-Tigbao Campus",
  "ZDSPGC-Tukuran Campus",
  "ZDSPGC-Vincenzo Sagun Campus",
];

// Associate courses are 1st–2nd year only
const ASSOCIATE_COURSES = new Set([
  "Associate in Computer Technology",
]);

const COURSES = [
  "Bachelor of Science in Computer Science",
  "Bachelor of Science in Information Technology",
  "Bachelor of Science in Information System",
  "Bachelor of Science in Education",
  "Bachelor of Science in Nursing",
  "Bachelor of Science in Business Administration",
  "Bachelor of Science in Engineering",
  "Bachelor of Physical Education",
  "Bachelor of Arts in Communication",
  "Bachelor of Science in Accountancy",
  "Associate in Computer Technology",
];

const YEAR_OPTIONS = ["1st Year", "2nd Year", "3rd Year", "4th Year"];
const ASSOCIATE_YEAR_OPTIONS = ["1st Year", "2nd Year"];

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({
    fullname: "", email: "", password: "", phone: "", address: "", campus: "", role: "student",
    photoUrl: "",
    studentNumber: "", course: "", year: "", section: "",
  });
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const registerMutation = useRegister();
  const verifyMutation = useVerifyIdentity();
  const [authorizedUserId, setAuthorizedUserId] = useState<number | null>(null);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }));

  const isStudent = form.role === "student";
  const isInstructor = form.role === "instructor";
  const isAdmin = form.role === "admin";
  const totalSteps = isStudent ? 4 : 3;
  const isAssociate = ASSOCIATE_COURSES.has(form.course);
  const yearOptions = isAssociate ? ASSOCIATE_YEAR_OPTIONS : YEAR_OPTIONS;

  const handleCourseChange = (v: string) => {
    const newIsAssociate = ASSOCIATE_COURSES.has(v);
    setForm(f => ({
      ...f,
      course: v,
      // reset year if current year is invalid for the new course
      year: newIsAssociate && (f.year === "3rd Year" || f.year === "4th Year") ? "" : f.year,
    }));
  };

  const handleNext = async () => {
    if (step === 1 && (isStudent || isInstructor)) {
      try {
        const res = await verifyMutation.mutateAsync({
          data: {
            fullName: form.fullname,
            schoolId: form.studentNumber,
            role: form.role as "student" | "instructor"
          }
        });
        if (res.valid) {
          setAuthorizedUserId(res.authorizedUserId);
          toast({ title: "Identity Verified", description: `Welcome, ${res.fullName}` });
          setStep(2);
        }
      } catch (err: any) {
        const msg = err?.data?.error || err?.response?.data?.error || "Identity verification failed.";
        toast({ title: "Verification Failed", description: msg, variant: "destructive" });
        return;
      }
    } else {
      setStep(s => s + 1);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (step < totalSteps) { 
      handleNext();
      return; 
    }

    try {
      const result = await registerMutation.mutateAsync({
        data: {
          fullname: form.fullname,
          email: form.email,
          password: form.password,
          phone: form.phone,
          address: form.address,
          campus: form.campus,
          role: form.role as RegisterInputRole,
          photoUrl: form.photoUrl,
          studentNumber: (isStudent || isInstructor) ? form.studentNumber : undefined,
          course: isStudent ? form.course : undefined,
          year: isStudent ? form.year : undefined,
          section: isStudent ? form.section : undefined,
          authorizedUserId: authorizedUserId,
        },
      });
      toast({ title: "Account created successfully!", description: "Please sign in with your email and password." });
      setLocation("/login");
    } catch (err: any) {
      const msg =
        err?.data?.error ||
        err?.response?.data?.error ||
        err?.message ||
        "Registration failed. Please check all fields and try again.";
      toast({ title: msg, variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background watermark overlay */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none select-none flex items-center justify-center">
        <img src="/logo.jpg" alt="" className="w-[450px] h-[450px] object-contain" />
      </div>

      <div className="w-full max-w-lg z-10">
        <div className="flex items-center gap-3 mb-8">
          <img src="/logo.jpg" alt="ZDSPGC Logo" className="w-8 h-8 rounded-full bg-white p-0.5 object-cover shrink-0" />
          <div>
            <p className="font-bold text-base text-primary leading-tight">ZDSPGC E-Library</p>
            <p className="text-xs text-muted-foreground leading-tight">Zamboanga del Sur Provincial Government College</p>
          </div>
        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Create your account</h1>
          <p className="text-muted-foreground text-sm mt-1">Step {step} of {totalSteps}</p>
          <div className="flex gap-1 mt-3">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-colors ${i < step ? "bg-primary" : "bg-muted"}`}
              />
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {step === 1 && (
            <>
              <div className="space-y-2">
                <Label>I am a</Label>
                <Select value={form.role} onValueChange={(v) => {
                  setForm(f => ({ ...f, role: v, studentNumber: "" }));
                  setAuthorizedUserId(null);
                }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="instructor">Instructor / Faculty</SelectItem>
                    <SelectItem value="admin">Admin/Librarian</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input value={form.fullname} onChange={set("fullname")} placeholder="Juan dela Cruz" required />
                <p className="text-xs text-muted-foreground">Must exactly match school records.</p>
              </div>
              {(isStudent || isInstructor) && (
                <div className="space-y-2">
                  <Label>{isStudent ? "School ID Number" : "Employee ID Number"}</Label>
                  <Input value={form.studentNumber} onChange={set("studentNumber")} placeholder="e.g. 2024-00001" required />
                </div>
              )}
            </>
          )}

          {step === 2 && (
            <>
              <div className="space-y-2">
                <Label>Email Address</Label>
                <Input type="email" value={form.email} onChange={set("email")} placeholder="username@zdspgc.edu.ph" required />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <div className="relative">
                  <Input
                    type={showPass ? "text" : "password"}
                    value={form.password}
                    onChange={set("password")}
                    placeholder="At least 8 characters"
                    required
                    minLength={8}
                    className="pr-10"
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input value={form.phone} onChange={set("phone")} placeholder="+63 912 345 6789" required />
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Input value={form.address} onChange={set("address")} placeholder="Street, City, Province" required />
              </div>
              <div className="space-y-2">
                <Label>Campus</Label>
                <Select value={form.campus} onValueChange={(v) => setForm(f => ({ ...f, campus: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select campus" /></SelectTrigger>
                  <SelectContent>
                    {CAMPUSES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Profile Photo *</Label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full border bg-muted flex items-center justify-center overflow-hidden shrink-0">
                    {form.photoUrl ? (
                      <img src={form.photoUrl} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-8 h-8 text-muted-foreground/50" />
                    )}
                  </div>
                  <div className="flex-1">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setForm(f => ({ ...f, photoUrl: reader.result as string }));
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      required={!form.photoUrl}
                    />
                    <p className="text-[11px] text-muted-foreground mt-1">Provide a clear portrait photo</p>
                  </div>
                </div>
              </div>
            </>
          )}

          {step === 4 && isStudent && (
            <>
              <div className="space-y-2">
                <Label>Course</Label>
                <Select value={form.course} onValueChange={handleCourseChange}>
                  <SelectTrigger><SelectValue placeholder="Select course" /></SelectTrigger>
                  <SelectContent>
                    {COURSES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Year Level</Label>
                  <Select value={form.year} onValueChange={(v) => setForm(f => ({ ...f, year: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select year" /></SelectTrigger>
                    <SelectContent>
                      {yearOptions.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Section</Label>
                  <Input value={form.section} onChange={set("section")} placeholder="e.g. A" required />
                </div>
              </div>
            </>
          )}

          <div className="flex gap-3 pt-4 mt-6 border-t">
            {step > 1 && (
              <Button type="button" variant="outline" onClick={() => setStep(s => s - 1)} className="gap-2" disabled={verifyMutation.isPending || registerMutation.isPending}>
                <ChevronLeft className="w-4 h-4" /> Back
              </Button>
            )}
            <Button 
              type="submit" 
              className="flex-1" 
              disabled={registerMutation.isPending || verifyMutation.isPending || (step === 3 && (!form.campus || !form.photoUrl))}
            >
              {verifyMutation.isPending ? "Verifying..." :
                registerMutation.isPending ? "Creating account..." :
                  step < totalSteps ? "Continue" : "Complete Registration"}
            </Button>
          </div>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-primary font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
