import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, Car, User, Clock, MapPin, GraduationCap, Palette, Globe, Link, Image } from "lucide-react";
import { WorkingHoursEditor } from "./WorkingHoursEditor";
import { TestCentreCombobox } from "./TestCentreCombobox";
import { CourseImageEditor } from "./CourseImageEditor";
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

const COURSE_HOURS = [8, 10, 12, 16, 20, 24, 28, 30, 32, 40, 48];
const LESSON_LENGTHS = [30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330, 360, 390, 420];

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
  school_skim_percentage: z.coerce.number().min(0).max(100).optional(),
  booking_advance_days: z.coerce.number().min(1).max(365).optional(),
  personal_website_url: z.string().url().optional().or(z.literal("")),
  facebook_url: z.string().url().optional().or(z.literal("")),
  instagram_url: z.string().url().optional().or(z.literal("")),
  twitter_url: z.string().url().optional().or(z.literal("")),
  linkedin_url: z.string().url().optional().or(z.literal("")),
  custom_branding_enabled: z.boolean().optional(),
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
    special_skills?: string;
    extra_info?: string;
    brand_colour?: string;
    school_skim_percentage?: number;
    booking_advance_days?: number;
    personal_website_url?: string;
    facebook_url?: string;
    instagram_url?: string;
    twitter_url?: string;
    linkedin_url?: string;
    custom_branding_enabled?: boolean;
  }>;
}

const carTypes = ["Manual", "Automatic", "Both"];

export function InstructorForm({ onSuccess, onCancel, initialData }: InstructorFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(initialData?.profile_image_url || null);
  const [carImage, setCarImage] = useState<File | null>(null);
  const [carImagePreview, setCarImagePreview] = useState<string | null>(initialData?.car_image_url || null);
  
  // New state for courses and test centres
  const [selectedCourses, setSelectedCourses] = useState<number[]>([]);
  const [testCentres, setTestCentres] = useState<TestCentre[]>([]);
  const [selectedTestCentres, setSelectedTestCentres] = useState<string[]>([]);

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
      school_skim_percentage: initialData?.school_skim_percentage ?? 0,
      booking_advance_days: initialData?.booking_advance_days ?? 28,
      personal_website_url: initialData?.personal_website_url || "",
      facebook_url: initialData?.facebook_url || "",
      instagram_url: initialData?.instagram_url || "",
      twitter_url: initialData?.twitter_url || "",
      linkedin_url: initialData?.linkedin_url || "",
      custom_branding_enabled: initialData?.custom_branding_enabled ?? false,
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
    };
    fetchInstructorData();
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

  const onSubmit = async (data: InstructorFormData) => {
    setIsSubmitting(true);

    try {
      let profileImageUrl = initialData?.profile_image_url || null;
      let carImageUrl = initialData?.car_image_url || null;

      if (profileImage) {
        const url = await uploadImage(profileImage, "profiles");
        if (url) profileImageUrl = url;
      }

      if (carImage) {
        const url = await uploadImage(carImage, "cars");
        if (url) carImageUrl = url;
      }

      const instructorData = {
        name: data.name,
        home_address: data.home_address || null,
        home_postcode: data.home_postcode,
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
        // New fields
        special_skills: data.special_skills || null,
        extra_info: data.extra_info || null,
        brand_colour: data.brand_colour || '#1e3a5f',
        school_skim_percentage: data.school_skim_percentage ?? 0,
        booking_advance_days: data.booking_advance_days ?? 28,
        personal_website_url: data.personal_website_url || null,
        facebook_url: data.facebook_url || null,
        instagram_url: data.instagram_url || null,
        twitter_url: data.twitter_url || null,
        linkedin_url: data.linkedin_url || null,
        custom_branding_enabled: data.custom_branding_enabled ?? false,
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
                    <Input placeholder="123 Main Street, London" {...field} />
                  </FormControl>
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
                    <Input placeholder="SW1A 1AA" {...field} />
                  </FormControl>
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
        <div className="space-y-4 rounded-lg border border-amber-200 bg-amber-50/50 p-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-amber-800">
            <Globe className="h-4 w-4" /> Booking Settings (Admin Only)
          </h3>
          <p className="text-xs text-amber-700">These settings are not visible to instructors</p>
          
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="school_skim_percentage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>School Skim (%)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      step={0.5}
                      placeholder="0"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Extra % charged to pupils (hidden from instructor)
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

        {/* Actions */}
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
