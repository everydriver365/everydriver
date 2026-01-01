-- Create instructors table
CREATE TABLE public.instructors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  home_postcode TEXT NOT NULL,
  radius_miles INTEGER NOT NULL DEFAULT 10,
  car_type TEXT NOT NULL,
  car_make TEXT,
  car_model TEXT,
  profile_image_url TEXT,
  car_image_url TEXT,
  bio TEXT,
  hourly_rate DECIMAL(10,2),
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Enable Row Level Security
ALTER TABLE public.instructors ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access (anyone can view instructors)
CREATE POLICY "Instructors are publicly viewable" 
ON public.instructors 
FOR SELECT 
USING (true);

-- Create policy for authenticated users to manage instructors (admin functionality)
CREATE POLICY "Authenticated users can insert instructors" 
ON public.instructors 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update instructors" 
ON public.instructors 
FOR UPDATE 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete instructors" 
ON public.instructors 
FOR DELETE 
TO authenticated
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_instructors_updated_at
BEFORE UPDATE ON public.instructors
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for instructor images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('instructor-images', 'instructor-images', true);

-- Create storage policies for instructor images
CREATE POLICY "Anyone can view instructor images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'instructor-images');

CREATE POLICY "Authenticated users can upload instructor images" 
ON storage.objects 
FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'instructor-images');

CREATE POLICY "Authenticated users can update instructor images" 
ON storage.objects 
FOR UPDATE 
TO authenticated
USING (bucket_id = 'instructor-images');

CREATE POLICY "Authenticated users can delete instructor images" 
ON storage.objects 
FOR DELETE 
TO authenticated
USING (bucket_id = 'instructor-images');