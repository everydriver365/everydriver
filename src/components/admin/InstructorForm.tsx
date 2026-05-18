import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { X, Car, User, Clock, MapPin, GraduationCap, Palette, Globe, Link, Image, CalendarIcon, Award, Video, Upload, QrCode, Layout, Calendar as CalendarLucide, Satellite, Camera } from "lucide-react";
import { GoogleServiceAccountSetup } from "@/components/instructor/GoogleServiceAccountSetup";
import { WorkingHoursEditor } from "./WorkingHoursEditor";
import { TestCentreCombobox } from "./TestCentreCombobox";
import { CourseImageEditor } from "./CourseImageEditor";
import { AdminWebsiteManager } from "./AdminWebsiteManager";
import { GoogleAddressAutocomplete } from "./GoogleAddressAutocomplete";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { formatUKPostcode } from "@/lib/postcode";

const COURSE_HOURS = [8, 10, 12, 16, 20, 24, 28, 30, 32, 40, 48];
const LESSON_LENGTHS = [30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330, 360, 390, 420];
const BOOKABLE_LESSON_LENGTHS = [60, 120, 180, 240, 300, 360, 420]; // 1-7 hours in minutes

const instructorSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  home_address: z.string().optional(),
  home_postcode: z.string().min(3, "Postcode is required"),
  radius_miles: z.coerce.number().min(1).max(100),
  car_type: z.string().min(1, "Car type is required"),
  car_make: z.string().optional(),
  car_model: z.string().optional(),
  bio: z.string().optional(),
  hourly_rate: z.coerce.number().optional(),
  buffer_minutes: z.coerce.number().min(0).max(60),
  preferred_lesson_length: z.coerce.number().min(30).max(420),
  google_calendar_id: z.string().optional(),
  // New fields
  special_skills: z.string().optional(),
  extra_info: z.string().optional(),
  brand_colour: z.string().optional(),
  school_skim_amount: z.coerce.number().min(0).optional(),
  booking_advance_days: z.coerce.number().min(1).max(548).optional(), // up to 18 months
  available_from: z.date().nullable().optional(),
  personal_website_url: z.string().url().optional().or(z.literal("")),
  facebook_url: z.string().url().optional().or(z.literal("")),
  instagram_url: z.string().url().optional().or(z.literal("")),
  twitter_url: z.string().url().optional().or(z.literal("")),
  linkedin_url: z.string().url().optional().or(z.literal("")),
  custom_branding_enabled: z.boolean().optional(),
  // Certifications
  cpd_certified: z.boolean().optional(),
  adi_code_of_practice: z.boolean().optional(),
  instructor_grade: z.string().optional(),
  // Booking mode
  booking_mode: z.enum(["pupil_choice", "auto_assign", "instructor_assigns", "first_lesson_only", "enquiry_only"]).optional(),
});

type InstructorFormData = z.infer<typeof instructorSchema>;

interface TestCentre {
  id: string;
  name: string;
  address: string | null;
  postcode: string | null;
}

interface InstructorFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  initialData?: Partial<InstructorFormData & { 
    id: string; 
    profile_image_url?: string; 
    car_image_url?: string;
    welcome_video_url?: string;
    payment_qr_url?: string;
    special_skills?: string;
    extra_info?: string;
    brand_colour?: string;
    school_skim_percentage?: number;
    booking_advance_days?: number;
    available_from?: string | null;
    allowed_lesson_lengths?: number[];
    personal_website_url?: string;
    facebook_url?: string;
    instagram_url?: string;
    twitter_url?: string;
    linkedin_url?: string;
    custom_branding_enabled?: boolean;
    cpd_certified?: boolean;
    adi_code_of_practice?: boolean;
    instructor_grade?: string;
    app_slug?: string;
    booking_mode?: "pupil_choice" | "auto_assign" | "instructor_assigns" | "first_lesson_only" | "enquiry_only";
  }>;
}

const carTypes = ["Manual", "Automatic", "Both"];

export function InstructorForm({ onSuccess, onCancel, initialData }: InstructorFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(initialData?.profile_image_url || null);
  const [carImage, setCarImage] = useState<File | null>(null);
  const [carImagePreview, setCarImagePreview] = useState<string | null>(initialData?.car_image_url || null);
  const [paymentQrImage, setPaymentQrImage] = useState<File | null>(null);
  const [paymentQrPreview, setPaymentQrPreview] = useState<string | null>(initialData?.payment_qr_url || null);
  const [welcomeVideoUrl, setWelcomeVideoUrl] = useState<string | null>(initialData?.welcome_video_url || null);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  
  // New state for courses and test centres
  const [selectedCourses, setSelectedCourses] = useState<number[]>([]);
  const [testCentres, setTestCentres] = useState<TestCentre[]>([]);
  const [selectedTestCentres, setSelectedTestCentres] = useState<string[]>([]);
  const [allowedLessonLengths, setAllowedLessonLengths] = useState<number[]>([60, 120]);
  const [addressVerified, setAddressVerified] = useState(false);
  
  // Quartix tracker state
  const [quartixDeviceName, setQuartixDeviceName] = useState("");
  const [quartixVehicleId, setQuartixVehicleId] = useState("");
  const [quartixDriverId, setQuartixDriverId] = useState("");


  const form = useForm<InstructorFormData>({
    resolver: zodResolver(instructorSchema),
    defaultValues: {
      name: initialData?.name || "",
      email: initialData?.email || "",
      phone: initialData?.phone || "",
      home_address: initialData?.home_address || "",
      home_postcode: initialData?.home_postcode || "",
      radius_miles: initialData?.radius_miles || 10,
      car_type: initialData?.car_type || "",
      car_make: initialData?.car_make || "",
      car_model: initialData?.car_model || "",
      bio: initialData?.bio || "",
      hourly_rate: initialData?.hourly_rate || undefined,
      buffer_minutes: initialData?.buffer_minutes ?? 15,
      preferred_lesson_length: initialData?.preferred_lesson_length ?? 60,
      google_calendar_id: initialData?.google_calendar_id || "",
      // New fields
      special_skills: initialData?.special_skills || "",
      extra_info: initialData?.extra_info || "",
      brand_colour: initialData?.brand_colour || "#1e3a5f",
      school_skim_amount: initialData?.school_skim_amount ?? 0,
      booking_advance_days: initialData?.booking_advance_days ?? 28,
      available_from: initialData?.available_from ? new Date(initialData.available_from) : null,
      personal_website_url: initialData?.personal_website_url || "",
      facebook_url: initialData?.facebook_url || "",
      instagram_url: initialData?.instagram_url || "",
      twitter_url: initialData?.twitter_url || "",
      linkedin_url: initialData?.linkedin_url || "",
      custom_branding_enabled: initialData?.custom_branding_enabled ?? false,
      // Certifications
      cpd_certified: initialData?.cpd_certified ?? false,
      adi_code_of_practice: initialData?.adi_code_of_practice ?? false,
      instructor_grade: initialData?.instructor_grade || "",
      // Booking mode
      booking_mode: initialData?.booking_mode ?? "pupil_choice",
    },
  });

  // Fetch test centres
  useEffect(() => {
    const fetchTestCentres = async () => {
      const { data } = await supabase
        .from("test_centres")
        .select("*")
        .eq("is_active", true)
        .order("name");
      
      if (data) setTestCentres(data);
    };
    fetchTestCentres();
  }, []);

  // Fetch existing courses and test centres for instructor
  useEffect(() => {
    if (!initialData?.id) return;

    const fetchInstructorData = async () => {
      // Fetch courses
      const { data: courses } = await supabase
        .from("instructor_courses")
        .select("course_hours")
        .eq("instructor_id", initialData.id)
        .eq("is_active", true);
      
      if (courses) {
        setSelectedCourses(courses.map(c => c.course_hours));
      }

      // Fetch test centres
      const { data: centres } = await supabase
        .from("instructor_test_centres")
        .select("test_centre_id")
        .eq("instructor_id", initialData.id);
      
      if (centres) {
        setSelectedTestCentres(centres.map(c => c.test_centre_id));
      }

      // Set allowed lesson lengths from initialData
      if (initialData.allowed_lesson_lengths) {
        setAllowedLessonLengths(initialData.allowed_lesson_lengths);
      }
    };
    fetchInstructorData();
  }, [initialData?.id, initialData?.allowed_lesson_lengths]);

  // Fetch Quartix tracker config for existing instructor
  useEffect(() => {
    if (!initialData?.id) return;
    const fetchQuartixConfig = async () => {
      const { data: device } = await supabase
        .from("gps_devices")
        .select("device_name, quartix_vehicle_id, quartix_driver_id")
        .eq("instructor_id", initialData.id!)
        .eq("tracking_provider", "quartix")
        .maybeSingle();
      if (device) {
        setQuartixDeviceName((device as any).device_name || "");
        setQuartixVehicleId((device as any).quartix_vehicle_id || "");
        setQuartixDriverId((device as any).quartix_driver_id || "");
      }
    };
    fetchQuartixConfig();
  }, [initialData?.id]);


  const handleImageChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setImage: (file: File | null) => void,
    setPreview: (url: string | null) => void
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file: File, folder: string): Promise<string | null> => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from("instructor-images")
      .upload(fileName, file);

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return null;
    }

    const { data } = supabase.storage
      .from("instructor-images")
      .getPublicUrl(fileName);

    return data.publicUrl;
  };

  const toggleCourse = (hours: number) => {
    setSelectedCourses(prev => 
      prev.includes(hours) 
        ? prev.filter(h => h !== hours)
        : [...prev, hours]
    );
  };

  const toggleTestCentre = (centreId: string) => {
    setSelectedTestCentres(prev =>
      prev.includes(centreId)
        ? prev.filter(id => id !== centreId)
        : [...prev, centreId]
    );
  };

  const toggleLessonLength = (minutes: number) => {
    setAllowedLessonLengths(prev =>
      prev.includes(minutes)
        ? prev.filter(m => m !== minutes)
        : [...prev, minutes].sort((a, b) => a - b)
    );
  };

  const formatLessonLengthLabel = (minutes: number) => {
    const hours = minutes / 60;
    return `${hours} hr${hours > 1 ? 's' : ''}`;
  };

  const onSubmit = async (data: InstructorFormData) => {
    setIsSubmitting(true);

    try {
      let profileImageUrl = initialData?.profile_image_url || null;
      let carImageUrl = initialData?.car_image_url || null;
      let paymentQrUrl = initialData?.payment_qr_url || null;
      const welcomeVideoUrlValue = welcomeVideoUrl;

      if (profileImage) {
        const url = await uploadImage(profileImage, "profiles");
        if (url) profileImageUrl = url;
      }

      if (carImage) {
        const url = await uploadImage(carImage, "cars");
        if (url) carImageUrl = url;
      }

      if (paymentQrImage) {
        const url = await uploadImage(paymentQrImage, "payment-qr");
        if (url) paymentQrUrl = url;
      }

      const instructorData = {
        name: data.name,
        home_address: data.home_address || null,
        home_postcode: formatUKPostcode(data.home_postcode) || data.home_postcode,
        radius_miles: data.radius_miles,
        car_type: data.car_type,
        email: data.email || null,
        phone: data.phone || null,
        car_make: data.car_make || null,
        car_model: data.car_model || null,
        bio: data.bio || null,
        hourly_rate: data.hourly_rate || null,
        buffer_minutes: data.buffer_minutes,
        preferred_lesson_length: data.preferred_lesson_length,
        google_calendar_id: data.google_calendar_id || null,
        profile_image_url: profileImageUrl,
        car_image_url: carImageUrl,
        payment_qr_url: paymentQrUrl,
        // New fields
        special_skills: data.special_skills || null,
        extra_info: data.extra_info || null,
        brand_colour: data.brand_colour || '#1e3a5f',
        school_skim_amount: data.school_skim_amount ?? 0,
        booking_advance_days: data.booking_advance_days ?? 28,
        available_from: data.available_from ? format(data.available_from, "yyyy-MM-dd") : null,
        allowed_lesson_lengths: allowedLessonLengths.length > 0 ? allowedLessonLengths : [60, 120],
        personal_website_url: data.personal_website_url || null,
        facebook_url: data.facebook_url || null,
        instagram_url: data.instagram_url || null,
        twitter_url: data.twitter_url || null,
        linkedin_url: data.linkedin_url || null,
        custom_branding_enabled: data.custom_branding_enabled ?? false,
        // Certifications
        cpd_certified: data.cpd_certified ?? false,
        adi_code_of_practice: data.adi_code_of_practice ?? false,
        instructor_grade: data.instructor_grade || null,
        welcome_video_url: welcomeVideoUrlValue,
        // Booking mode
        booking_mode: data.booking_mode ?? "pupil_choice",
      };

      let instructorId = initialData?.id;

      if (initialData?.id) {
        const { error } = await supabase
          .from("instructors")
          .update(instructorData)
          .eq("id", initialData.id);

        if (error) throw error;
      } else {
        const { data: newInstructor, error } = await supabase
          .from("instructors")
          .insert([instructorData])
          .select()
          .single();

        if (error) throw error;
        instructorId = newInstructor.id;

        // Auto-initialize default working hours (Mon-Fri 9am-5pm)
        const defaultWorkingHours = [1, 2, 3, 4, 5].map((dayOfWeek) => ({
          instructor_id: instructorId,
          day_of_week: dayOfWeek,
          start_time: "09:00",
          end_time: "17:00",
          is_active: true,
        }));

        await supabase.from("instructor_working_hours").insert(defaultWorkingHours);
      }

      // Save courses
      if (instructorId) {
        // Delete existing courses
        await supabase
          .from("instructor_courses")
          .delete()
          .eq("instructor_id", instructorId);

        // Insert new courses
        if (selectedCourses.length > 0) {
          const coursesToInsert = selectedCourses.map(hours => ({
            instructor_id: instructorId,
            course_hours: hours,
            course_name: hours === 28 ? "Test in a Week" : `${hours} Hour Course`,
            is_active: true,
          }));

          await supabase.from("instructor_courses").insert(coursesToInsert);
        }

        // Delete existing test centres
        await supabase
          .from("instructor_test_centres")
          .delete()
          .eq("instructor_id", instructorId);

        // Insert new test centres
        if (selectedTestCentres.length > 0) {
          const centresToInsert = selectedTestCentres.map(centreId => ({
            instructor_id: instructorId,
            test_centre_id: centreId,
          }));

          await supabase.from("instructor_test_centres").insert(centresToInsert);
        }

        // Save Quartix tracker config
        if (quartixVehicleId) {
          const { data: existingDevice } = await supabase
            .from("gps_devices")
            .select("id")
            .eq("instructor_id", instructorId)
            .eq("tracking_provider", "quartix")
            .maybeSingle();

          if (existingDevice) {
            await supabase
              .from("gps_devices")
              .update({
                device_name: quartixDeviceName || "Quartix Tracker",
                quartix_vehicle_id: quartixVehicleId,
                quartix_driver_id: quartixDriverId || null,
              } as any)
              .eq("id", existingDevice.id);
          } else {
            await supabase
              .from("gps_devices")
              .insert({
                instructor_id: instructorId,
                device_identifier: `quartix-${quartixVehicleId}`,
                device_name: quartixDeviceName || "Quartix Tracker",
                quartix_vehicle_id: quartixVehicleId,
                quartix_driver_id: quartixDriverId || null,
                tracking_provider: "quartix",
                is_active: true,
              } as any);
          }
        }
      }

      toast.success(initialData?.id ? "Instructor updated successfully!" : "Instructor added successfully!");
      onSuccess();
    } catch (error) {
      console.error("Error saving instructor:", error);
      toast.error("Failed to save instructor. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatLessonLength = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins} mins`;
    if (mins === 0) return `${hours} hr${hours > 1 ? 's' : ''}`;
    return `${hours}h ${mins}m`;
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
        {/* Image Uploads */}
        <div className="grid gap-6 sm:grid-cols-2">
          {/* Profile Image */}
          <div>
            <label className="mb-2 block text-sm font-medium">Profile Photo</label>
            <div className="relative">
              {profileImagePreview ? (
                <div className="relative h-32 w-32 overflow-hidden rounded-xl border">
                  <img src={profileImagePreview} alt="Profile" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      setProfileImage(null);
                      setProfileImagePreview(null);
                    }}
                    className="absolute right-2 top-2 rounded-full bg-destructive p-1 text-destructive-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <label className="flex h-32 w-32 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/30 hover:border-primary">
                  <User className="mb-1 h-6 w-6 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Upload</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImageChange(e, setProfileImage, setProfileImagePreview)}
                  />
                </label>
              )}
            </div>
          </div>

          {/* Car Image */}
          <div>
            <label className="mb-2 block text-sm font-medium">Car Photo</label>
            <div className="relative">
              {carImagePreview ? (
                <div className="relative h-32 w-32 overflow-hidden rounded-xl border">
                  <img src={carImagePreview} alt="Car" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      setCarImage(null);
                      setCarImagePreview(null);
                    }}
                    className="absolute right-2 top-2 rounded-full bg-destructive p-1 text-destructive-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <label className="flex h-32 w-32 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/30 hover:border-primary">
                  <Car className="mb-1 h-6 w-6 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Upload</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImageChange(e, setCarImage, setCarImagePreview)}
                  />
                </label>
              )}
            </div>
          </div>

          {/* Welcome Video Upload */}
          <div>
            <label className="mb-2 block text-sm font-medium flex items-center gap-2">
              <Video className="h-4 w-4" /> Welcome Video
            </label>
            <div className="relative">
              {welcomeVideoUrl ? (
                <div className="relative h-32 w-32 overflow-hidden rounded-xl border">
                  <video
                    src={welcomeVideoUrl}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <Video className="h-6 w-6 text-white" />
                  </div>
                  <button
                    type="button"
                    onClick={() => setWelcomeVideoUrl(null)}
                    className="absolute right-2 top-2 rounded-full bg-destructive p-1 text-destructive-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <label className={`flex h-32 w-32 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/30 hover:border-primary ${uploadingVideo ? "pointer-events-none opacity-50" : ""}`}>
                  {uploadingVideo ? (
                    <>
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      <span className="mt-1 text-xs text-muted-foreground">Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="mb-1 h-6 w-6 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Upload</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="video/*"
                    className="hidden"
                    disabled={uploadingVideo}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;

                      if (!file.type.startsWith("video/")) {
                        toast.error("Please select a video file");
                        return;
                      }

                      if (file.size > 100 * 1024 * 1024) {
                        toast.error("Video must be less than 100MB");
                        return;
                      }

                      setUploadingVideo(true);
                      const fileExt = file.name.split(".").pop();
                      const fileName = `welcome-${Date.now()}.${fileExt}`;
                      const filePath = `welcome/${fileName}`;

                      const { error: uploadError } = await supabase.storage
                        .from("course-videos")
                        .upload(filePath, file);

                      if (uploadError) {
                        console.error("Upload error:", uploadError);
                        toast.error("Failed to upload video");
                        setUploadingVideo(false);
                        return;
                      }

                      const { data: urlData } = supabase.storage
                        .from("course-videos")
                        .getPublicUrl(filePath);

                      setWelcomeVideoUrl(urlData.publicUrl);
                      toast.success("Video uploaded");
                      setUploadingVideo(false);
                    }}
                  />
                </label>
              )}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Max 100MB</p>
          </div>

          {/* Payment QR Code */}
          <div>
            <label className="mb-2 block text-sm font-medium flex items-center gap-2">
              <QrCode className="h-4 w-4" /> Payment QR Code
            </label>
            <div className="relative">
              {paymentQrPreview ? (
                <div className="relative h-32 w-32 overflow-hidden rounded-xl border">
                  <img src={paymentQrPreview} alt="Payment QR Code" className="h-full w-full object-contain bg-white" />
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentQrImage(null);
                      setPaymentQrPreview(null);
                    }}
                    className="absolute right-2 top-2 rounded-full bg-destructive p-1 text-destructive-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <label className="flex h-32 w-32 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/30 hover:border-primary">
                  <QrCode className="mb-1 h-6 w-6 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Upload</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImageChange(e, setPaymentQrImage, setPaymentQrPreview)}
                  />
                </label>
              )}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">For in-car payments</p>
          </div>
        </div>

        {/* Basic Info */}
        <div className="space-y-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <User className="h-4 w-4" /> Basic Information
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="John Smith" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="john@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input placeholder="07123 456789" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="hourly_rate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hourly Rate (£)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="35" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Certifications */}
        <div className="space-y-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <Award className="h-4 w-4" /> Certifications & Grade
          </h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <FormField
              control={form.control}
              name="cpd_certified"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>CPD Certified</FormLabel>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="adi_code_of_practice"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>ADI Code of Practice</FormLabel>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="instructor_grade"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Instructor Grade</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select grade" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="A">Grade A</SelectItem>
                      <SelectItem value="B">Grade B</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Location */}
        <div className="space-y-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <MapPin className="h-4 w-4" /> Location
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="home_address"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Home Address</FormLabel>
                  <FormControl>
                    <GoogleAddressAutocomplete
                      value={field.value || ""}
                      onChange={(address) => {
                        field.onChange(address);
                      }}
                      onPostcodeChange={(postcode) => {
                        form.setValue("home_postcode", postcode);
                      }}
                      onAddressVerified={(verified) => {
                        setAddressVerified(verified);
                      }}
                      placeholder="Start typing an address..."
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Type to search and select a verified UK address
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="home_postcode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Home Postcode *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="SW1A 1AA" 
                      {...field} 
                      className={addressVerified ? "border-green-500" : ""}
                    />
                  </FormControl>
                  {addressVerified && (
                    <p className="text-xs text-green-600">Auto-filled from verified address</p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="radius_miles"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Coverage Radius (miles) *</FormLabel>
                  <FormControl>
                    <Input type="number" min={1} max={100} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Car Details */}
        <div className="space-y-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <Car className="h-4 w-4" /> Vehicle Details
          </h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <FormField
              control={form.control}
              name="car_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Transmission Type *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {carTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="car_make"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Car Make</FormLabel>
                  <FormControl>
                    <Input placeholder="Toyota" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="car_model"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Car Model</FormLabel>
                  <FormControl>
                    <Input placeholder="Yaris" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Lesson Preferences */}
        <div className="space-y-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <Clock className="h-4 w-4" /> Lesson Preferences
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="preferred_lesson_length"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preferred Lesson Length</FormLabel>
                  <Select onValueChange={(v) => field.onChange(parseInt(v))} value={field.value?.toString()}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select length" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {LESSON_LENGTHS.map((mins) => (
                        <SelectItem key={mins} value={mins.toString()}>
                          {formatLessonLength(mins)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="buffer_minutes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Buffer Between Lessons</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} max={60} placeholder="15" {...field} />
                  </FormControl>
                  <FormDescription>Minutes between lessons</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="available_from"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Available From</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Available now</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value || undefined}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date()}
                        initialFocus
                        className="pointer-events-auto"
                      />
                      {field.value && (
                        <div className="border-t p-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full"
                            onClick={() => field.onChange(null)}
                          >
                            Clear date (Available now)
                          </Button>
                        </div>
                      )}
                    </PopoverContent>
                  </Popover>
                  <FormDescription>
                    Earliest date this instructor accepts bookings
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Allowed Lesson Lengths */}
          <div className="mt-4">
            <FormLabel>Allowed Lesson Lengths</FormLabel>
            <FormDescription className="mb-3">
              Select which lesson durations pupils can book
            </FormDescription>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
              {BOOKABLE_LESSON_LENGTHS.map((minutes) => (
                <div key={minutes} className="flex items-center space-x-2">
                  <Switch
                    id={`lesson-length-${minutes}`}
                    checked={allowedLessonLengths.includes(minutes)}
                    onCheckedChange={() => toggleLessonLength(minutes)}
                  />
                  <Label htmlFor={`lesson-length-${minutes}`} className="text-sm cursor-pointer">
                    {formatLessonLengthLabel(minutes)}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Courses Offered */}
        <div className="space-y-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <GraduationCap className="h-4 w-4" /> Courses Offered
          </h3>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {COURSE_HOURS.map((hours) => (
              <div key={hours} className="flex items-center space-x-2">
                <Switch
                  id={`course-${hours}`}
                  checked={selectedCourses.includes(hours)}
                  onCheckedChange={() => toggleCourse(hours)}
                />
                <Label htmlFor={`course-${hours}`} className="text-sm cursor-pointer">
                  {hours === 28 ? "Test Week (28h)" : `${hours}h`}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Course Images */}
        {selectedCourses.length > 0 && (
          <div className="space-y-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <Image className="h-4 w-4" /> Course Photos
            </h3>
            <p className="text-xs text-muted-foreground">
              Add photos for each course to display on course listings
            </p>
            <CourseImageEditor
              instructorId={initialData?.id || ""}
              selectedCourses={selectedCourses}
            />
          </div>
        )}

        {/* Test Centres */}
        <div className="space-y-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <MapPin className="h-4 w-4" /> Test Centres Covered
          </h3>
          <TestCentreCombobox
            testCentres={testCentres}
            selectedIds={selectedTestCentres}
            onSelectionChange={setSelectedTestCentres}
          />
        </div>

        {/* Google Calendar */}
        <div className="space-y-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            Google Calendar Sync
          </h3>
          <FormField
            control={form.control}
            name="google_calendar_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Calendar ID</FormLabel>
                <FormControl>
                  <Input placeholder="your-calendar@gmail.com" {...field} />
                </FormControl>
                <FormDescription>
                  Enter the Google Calendar ID to sync (e.g., your Gmail address or a specific calendar ID)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Bio & Skills */}
        <div className="space-y-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <User className="h-4 w-4" /> Biography & Skills
          </h3>
          
          <FormField
            control={form.control}
            name="bio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bio</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Tell us about this instructor's experience and teaching style..."
                    className="min-h-[80px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="special_skills"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Special Skills</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="e.g., Motorway lessons, nervous driver specialist, automatic only..."
                    className="min-h-[60px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="extra_info"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Extra Information</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Any additional information about this instructor..."
                    className="min-h-[60px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Branding & Web Presence */}
        <div className="space-y-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <Palette className="h-4 w-4" /> Branding & Web Presence
          </h3>
          
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="brand_colour"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Brand Colour</FormLabel>
                  <FormControl>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        className="w-14 h-10 p-1 cursor-pointer"
                        {...field}
                      />
                      <Input
                        type="text"
                        placeholder="#1e3a5f"
                        value={field.value}
                        onChange={field.onChange}
                        className="flex-1"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="custom_branding_enabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Custom Branding</FormLabel>
                    <FormDescription className="text-xs">
                      Enable personal branding on their page
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="personal_website_url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Personal Website</FormLabel>
                <FormControl>
                  <Input placeholder="https://example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="facebook_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Facebook URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://facebook.com/..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="instagram_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Instagram URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://instagram.com/..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="twitter_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Twitter/X URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://twitter.com/..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="linkedin_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>LinkedIn URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://linkedin.com/in/..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Booking Settings (Admin Only) */}
        <div className="space-y-4 rounded-lg border border-warning/30 bg-warning/5 p-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-warning-foreground">
            <Globe className="h-4 w-4" /> Booking Settings (Admin Only)
          </h3>
          <p className="text-xs text-muted-foreground">These settings are not visible to instructors</p>
          
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <FormField
              control={form.control}
              name="booking_mode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Booking Mode</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select booking mode" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="pupil_choice">Pupil Choice</SelectItem>
                      <SelectItem value="auto_assign">Auto-Assign</SelectItem>
                      <SelectItem value="instructor_assigns">Instructor Assigns</SelectItem>
                      <SelectItem value="first_lesson_only">First Lesson Only</SelectItem>
                      <SelectItem value="enquiry_only">Enquiry Only</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription className="text-xs">
                    How lessons are scheduled for this instructor
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="school_skim_amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>School Skim (£)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      step={1}
                      placeholder="0"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Fixed GBP amount deducted per booking
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="booking_advance_days"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Booking Advance (Days)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      max={365}
                      placeholder="28"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    How far in advance bookings can be made
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Working Hours - Only show for existing instructors */}
        {initialData?.id && (
          <div className="rounded-lg border p-4">
            <h3 className="mb-4 text-lg font-semibold">Working Hours & Availability</h3>
            <WorkingHoursEditor instructorId={initialData.id} />
          </div>
        )}

        {/* Google Calendar Sync - Only show for existing instructors */}
        {initialData?.id && (
          <div className="rounded-lg border p-4">
            <h3 className="mb-4 text-lg font-semibold flex items-center gap-2">
              <CalendarLucide className="h-5 w-5" /> Google Calendar Sync
            </h3>
            <GoogleServiceAccountSetup instructorId={initialData.id} />
          </div>
        )}

        {/* Mini-Website Pages - Only show for existing instructors */}
        {initialData?.id && initialData?.app_slug && (
          <div className="rounded-lg border p-4">
            <h3 className="mb-4 text-lg font-semibold flex items-center gap-2">
              <Layout className="h-5 w-5" /> Mini-Website Pages
            </h3>
            <AdminWebsiteManager 
              instructorId={initialData.id} 
              instructorSlug={initialData.app_slug}
              instructorName={initialData.name || "Instructor"}
            />
          </div>
        )}

        {/* Quartix Tracker - Only show for existing instructors */}
        {initialData?.id && (
          <div className="rounded-lg border p-4">
            <h3 className="mb-4 text-lg font-semibold flex items-center gap-2">
              <Satellite className="h-5 w-5" /> Quartix Tracker
            </h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Tracker Name</Label>
                <Input
                  placeholder="e.g., Toyota Yaris - Roller Skate"
                  value={quartixDeviceName}
                  onChange={(e) => setQuartixDeviceName(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">A friendly name for this instructor's vehicle tracker</p>
              </div>
              <div className="space-y-2">
                <Label>Quartix Vehicle ID</Label>
                <Input
                  placeholder="e.g., 6877225"
                  value={quartixVehicleId}
                  onChange={(e) => setQuartixVehicleId(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">The numeric vehicle ID from Quartix</p>
              </div>
              <div className="space-y-2">
                <Label>Quartix Driver ID (optional)</Label>
                <Input
                  placeholder="Driver ID if different from vehicle"
                  value={quartixDriverId}
                  onChange={(e) => setQuartixDriverId(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}


        <div className="flex justify-end gap-3 sticky bottom-0 bg-background pt-4 border-t">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : initialData?.id ? "Update Instructor" : "Add Instructor"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
