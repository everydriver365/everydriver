import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, Car, User } from "lucide-react";
import { WorkingHoursEditor } from "./WorkingHoursEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
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

const instructorSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  home_postcode: z.string().min(3, "Postcode is required"),
  radius_miles: z.coerce.number().min(1).max(100),
  car_type: z.string().min(1, "Car type is required"),
  car_make: z.string().optional(),
  car_model: z.string().optional(),
  bio: z.string().optional(),
  hourly_rate: z.coerce.number().optional(),
  buffer_minutes: z.coerce.number().min(0).max(60),
});

type InstructorFormData = z.infer<typeof instructorSchema>;

interface InstructorFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  initialData?: Partial<InstructorFormData & { id: string; profile_image_url?: string; car_image_url?: string; buffer_minutes?: number }>;
}

const carTypes = [
  "Manual",
  "Automatic",
  "Both",
];

export function InstructorForm({ onSuccess, onCancel, initialData }: InstructorFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(initialData?.profile_image_url || null);
  const [carImage, setCarImage] = useState<File | null>(null);
  const [carImagePreview, setCarImagePreview] = useState<string | null>(initialData?.car_image_url || null);

  const form = useForm<InstructorFormData>({
    resolver: zodResolver(instructorSchema),
    defaultValues: {
      name: initialData?.name || "",
      email: initialData?.email || "",
      phone: initialData?.phone || "",
      home_postcode: initialData?.home_postcode || "",
      radius_miles: initialData?.radius_miles || 10,
      car_type: initialData?.car_type || "",
      car_make: initialData?.car_make || "",
      car_model: initialData?.car_model || "",
      bio: initialData?.bio || "",
      hourly_rate: initialData?.hourly_rate || undefined,
      buffer_minutes: initialData?.buffer_minutes ?? 15,
    },
  });

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

  const onSubmit = async (data: InstructorFormData) => {
    setIsSubmitting(true);

    try {
      let profileImageUrl = initialData?.profile_image_url || null;
      let carImageUrl = initialData?.car_image_url || null;

      // Upload profile image if new one selected
      if (profileImage) {
        const url = await uploadImage(profileImage, "profiles");
        if (url) profileImageUrl = url;
      }

      // Upload car image if new one selected
      if (carImage) {
        const url = await uploadImage(carImage, "cars");
        if (url) carImageUrl = url;
      }

      const instructorData = {
        name: data.name,
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
        profile_image_url: profileImageUrl,
        car_image_url: carImageUrl,
      };

      if (initialData?.id) {
        // Update existing instructor
        const { error } = await supabase
          .from("instructors")
          .update(instructorData)
          .eq("id", initialData.id);

        if (error) throw error;
        toast.success("Instructor updated successfully!");
      } else {
        // Create new instructor
        const { error } = await supabase
          .from("instructors")
          .insert([instructorData]);

        if (error) throw error;
        toast.success("Instructor added successfully!");
      }

      onSuccess();
    } catch (error) {
      console.error("Error saving instructor:", error);
      toast.error("Failed to save instructor. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Image Uploads */}
        <div className="grid gap-6 sm:grid-cols-2">
          {/* Profile Image */}
          <div>
            <label className="mb-2 block text-sm font-medium">Profile Photo</label>
            <div className="relative">
              {profileImagePreview ? (
                <div className="relative h-40 w-40 overflow-hidden rounded-xl border">
                  <img src={profileImagePreview} alt="Profile" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      setProfileImage(null);
                      setProfileImagePreview(null);
                    }}
                    className="absolute right-2 top-2 rounded-full bg-destructive p-1 text-destructive-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label className="flex h-40 w-40 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/30 hover:border-primary">
                  <User className="mb-2 h-8 w-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Upload Photo</span>
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
                <div className="relative h-40 w-40 overflow-hidden rounded-xl border">
                  <img src={carImagePreview} alt="Car" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      setCarImage(null);
                      setCarImagePreview(null);
                    }}
                    className="absolute right-2 top-2 rounded-full bg-destructive p-1 text-destructive-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label className="flex h-40 w-40 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/30 hover:border-primary">
                  <Car className="mb-2 h-8 w-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Upload Car</span>
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

          <FormField
            control={form.control}
            name="buffer_minutes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Buffer Between Lessons (mins)</FormLabel>
                <FormControl>
                  <Input type="number" min={0} max={60} placeholder="15" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Location */}
        <div className="grid gap-4 sm:grid-cols-2">
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

        {/* Car Details */}
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

        {/* Bio */}
        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bio</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Tell us about this instructor's experience and teaching style..."
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Working Hours - Only show for existing instructors */}
        {initialData?.id && (
          <div className="rounded-lg border p-4">
            <h3 className="mb-4 text-lg font-semibold">Working Hours & Availability</h3>
            <WorkingHoursEditor instructorId={initialData.id} />
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3">
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
