import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { 
  Star, MapPin, Phone, Mail, Clock, Car, Award, 
  Calendar, ChevronRight, Globe, Facebook, Instagram, 
  Twitter, Linkedin, CheckCircle2, Play
, Car } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

interface Instructor {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  bio: string | null;
  profile_image_url: string | null;
  logo_url: string | null;
  brand_colour: string | null;
  secondary_colour: string | null;
  home_postcode: string;
  car_type: string;
  car_make: string | null;
  car_model: string | null;
  car_image_url: string | null;
  hourly_rate: number | null;
  radius_miles: number;
  instructor_grade: string | null;
  cpd_certified: boolean | null;
  adi_code_of_practice: boolean | null;
  special_skills: string | null;
  welcome_video_url: string | null;
  personal_website_url: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  twitter_url: string | null;
  linkedin_url: string | null;
}

interface Course {
  id: string;
  course_name: string;
  course_hours: number;
  discounted_price: number | null;
  course_image_url: string | null;
  custom_features: string[] | null;
}

interface Review {
  id: string;
  reviewer_name: string;
  rating: number;
  review_text: string;
  course_hours: number;
  review_date: string | null;
  is_verified: boolean | null;
}

export default function InstructorMiniWebsite() {
  const { slug } = useParams<{ slug: string }>();
  const [instructor, setInstructor] = useState<Instructor | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetchInstructorData();
  }, [slug]);

  const fetchInstructorData = async () => {
    if (!slug) return;
    
    try {
      // Fetch instructor by slug
      const { data: instructorData, error: instructorError } = await supabase
        .from("instructors")
        .select("*")
        .eq("app_slug", slug)
        .eq("is_active", true)
        .single();

      if (instructorError || !instructorData) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setInstructor(instructorData);

      // Fetch courses and reviews in parallel
      const [coursesRes, reviewsRes] = await Promise.all([
        supabase
          .from("instructor_courses")
          .select("*")
          .eq("instructor_id", instructorData.id)
          .eq("is_active", true),
        supabase
          .from("course_reviews")
          .select("*")
          .eq("instructor_id", instructorData.id)
          .eq("moderation_status", "approved")
          .order("review_date", { ascending: false })
          .limit(6)
      ]);

      if (coursesRes.data) setCourses(coursesRes.data);
      if (reviewsRes.data) setReviews(reviewsRes.data);
    } catch (error) {
      console.error("Error fetching instructor:", error);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  // Calculate average rating
  const avgRating = reviews.length > 0 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  // Generate CSS variables for branding
  const brandStyles = instructor ? {
    '--brand-primary': instructor.brand_colour || '#1e3a5f',
    '--brand-secondary': instructor.secondary_colour || '#d4a574',
  } as React.CSSProperties : {};

  const primaryColor = instructor?.brand_colour || '#1e3a5f';
  const secondaryColor = instructor?.secondary_colour || '#d4a574';

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-48 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-40 rounded-xl" />
            <Skeleton className="h-40 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !instructor) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <Card className="max-w-md w-full text-center p-8">
          <div className="mb-4"><Car className="h-16 w-16 text-muted-foreground mx-auto" /></div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Instructor Not Found</h1>
          <p className="text-gray-600 mb-6">
            Sorry, we couldn't find an instructor with this profile.
          </p>
          <Link to={`/i/${slug}`}>
            <Button>Find Instructors</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" style={brandStyles}>
      {/* Hero Section */}
      <header 
        className="relative overflow-hidden"
        style={{ backgroundColor: primaryColor }}
      >
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, ${secondaryColor} 0%, transparent 50%),
                             radial-gradient(circle at 80% 50%, ${secondaryColor} 0%, transparent 50%)`
          }} />
        </div>
        
        <div className="relative max-w-4xl mx-auto px-4 py-12 sm:py-16">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Profile Image or Logo */}
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="relative"
            >
              {instructor.logo_url ? (
                <img 
                  src={instructor.logo_url} 
                  alt={`${instructor.name} logo`}
                  className="h-24 w-auto object-contain bg-white rounded-lg p-2"
                />
              ) : instructor.profile_image_url ? (
                <img 
                  src={instructor.profile_image_url} 
                  alt={instructor.name}
                  className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-xl"
                />
              ) : (
                <div 
                  className="w-28 h-28 rounded-full flex items-center justify-center text-4xl font-bold text-white border-4 border-white/30"
                  style={{ backgroundColor: secondaryColor }}
                >
                  {instructor.name.charAt(0)}
                </div>
              )}
            </motion.div>

            {/* Instructor Info */}
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-center sm:text-left text-white"
            >
              <h1 className="text-3xl sm:text-4xl font-bold mb-2">{instructor.name}</h1>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-white/90">
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {instructor.home_postcode}
                </span>
                {avgRating && (
                  <span className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-current" style={{ color: secondaryColor }} />
                    {avgRating} ({reviews.length} reviews)
                  </span>
                )}
              </div>
              
              {/* Badges */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3">
                {instructor.instructor_grade && (
                  <Badge className="bg-white/20 text-white border-0">
                    Grade {instructor.instructor_grade}
                  </Badge>
                )}
                {instructor.cpd_certified && (
                  <Badge className="bg-white/20 text-white border-0">
                    <Award className="h-3 w-3 mr-1" /> CPD Certified
                  </Badge>
                )}
                {instructor.adi_code_of_practice && (
                  <Badge className="bg-white/20 text-white border-0">
                    ADI Code
                  </Badge>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Quick Actions */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex flex-wrap gap-3 justify-center sm:justify-start"
        >
          <Link to={`/i/${slug}/contact`}>
            <Button 
              size="lg" 
              className="text-white shadow-lg"
              style={{ backgroundColor: primaryColor }}
            >
              <Calendar className="h-5 w-5 mr-2" />
              Book a Lesson
            </Button>
          </Link>
          {instructor.phone && (
            <a href={`tel:${instructor.phone}`}>
              <Button variant="outline" size="lg">
                <Phone className="h-5 w-5 mr-2" />
                Call Now
              </Button>
            </a>
          )}
        </motion.div>

        {/* About Section */}
        {instructor.bio && (
          <motion.section 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-3" style={{ color: primaryColor }}>
                  About Me
                </h2>
                <p className="text-gray-600 leading-relaxed">{instructor.bio}</p>
                
                {instructor.special_skills && (
                  <div className="mt-4 pt-4 border-t">
                    <h3 className="font-medium text-gray-900 mb-2">Specialties</h3>
                    <p className="text-gray-600">{instructor.special_skills}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.section>
        )}

        {/* Welcome Video */}
        {instructor.welcome_video_url && (
          <motion.section 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.35 }}
          >
            <Card className="overflow-hidden">
              <div className="aspect-video bg-gray-900 relative">
                <iframe
                  src={instructor.welcome_video_url}
                  className="absolute inset-0 w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </Card>
          </motion.section>
        )}

        {/* Vehicle Info */}
        <motion.section 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4" style={{ color: primaryColor }}>
                Training Vehicle
              </h2>
              <div className="flex flex-col sm:flex-row gap-4">
                {instructor.car_image_url && (
                  <img 
                    src={instructor.car_image_url}
                    alt="Training vehicle"
                    className="w-full sm:w-48 h-32 object-cover rounded-lg"
                  />
                )}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Car className="h-5 w-5" style={{ color: primaryColor }} />
                    <span className="font-medium">
                      {instructor.car_make} {instructor.car_model}
                    </span>
                  </div>
                  <Badge 
                    variant="secondary" 
                    className="text-white"
                    style={{ backgroundColor: secondaryColor }}
                  >
                    {instructor.car_type}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.section>

        {/* Courses */}
        {courses.length > 0 && (
          <motion.section 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <h2 className="text-xl font-semibold mb-4" style={{ color: primaryColor }}>
              Available Courses
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {courses.map((course) => (
                <Card key={course.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  {course.course_image_url && (
                    <img 
                      src={course.course_image_url}
                      alt={course.course_name}
                      className="w-full h-32 object-cover"
                    />
                  )}
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-gray-900">{course.course_name}</h3>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-gray-600">
                        <Clock className="h-4 w-4 inline mr-1" />
                        {course.course_hours} hours
                      </span>
                      {course.discounted_price && (
                        <span className="font-bold" style={{ color: primaryColor }}>
                          £{course.discounted_price}
                        </span>
                      )}
                    </div>
                    {course.custom_features && course.custom_features.length > 0 && (
                      <ul className="mt-3 space-y-1">
                        {course.custom_features.slice(0, 3).map((feature, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                            <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: secondaryColor }} />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    )}
                    <Link to={`/i/${slug}/contact`}>
                      <Button 
                        className="w-full mt-4 text-white"
                        style={{ backgroundColor: primaryColor }}
                      >
                        Book Now
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.section>
        )}

        {/* Reviews */}
        {reviews.length > 0 && (
          <motion.section 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold" style={{ color: primaryColor }}>
                Student Reviews
              </h2>
              {avgRating && (
                <div className="flex items-center gap-1" style={{ color: secondaryColor }}>
                  <Star className="h-5 w-5 fill-current" />
                  <span className="font-bold">{avgRating}</span>
                  <span className="text-gray-500">({reviews.length})</span>
                </div>
              )}
            </div>
            <div className="space-y-4">
              {reviews.map((review) => (
                <Card key={review.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">{review.reviewer_name}</span>
                          {review.is_verified && (
                            <Badge variant="outline" className="text-xs">Verified</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i}
                              className={`h-4 w-4 ${i < review.rating ? 'fill-current' : ''}`}
                              style={{ color: i < review.rating ? secondaryColor : '#e5e7eb' }}
                            />
                          ))}
                        </div>
                      </div>
                      <span className="text-sm text-gray-500">{review.course_hours}h course</span>
                    </div>
                    <p className="text-gray-600 text-sm">{review.review_text}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.section>
        )}

        {/* Contact & Social */}
        <motion.section 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4" style={{ color: primaryColor }}>
                Get in Touch
              </h2>
              <div className="space-y-3">
                {instructor.phone && (
                  <a href={`tel:${instructor.phone}`} className="flex items-center gap-3 text-gray-600 hover:text-gray-900">
                    <Phone className="h-5 w-5" style={{ color: primaryColor }} />
                    {instructor.phone}
                  </a>
                )}
                {instructor.email && (
                  <a href={`mailto:${instructor.email}`} className="flex items-center gap-3 text-gray-600 hover:text-gray-900">
                    <Mail className="h-5 w-5" style={{ color: primaryColor }} />
                    {instructor.email}
                  </a>
                )}
                <div className="flex items-center gap-3 text-gray-600">
                  <MapPin className="h-5 w-5" style={{ color: primaryColor }} />
                  Covering {instructor.radius_miles} miles around {instructor.home_postcode}
                </div>
                {instructor.hourly_rate && (
                  <div className="flex items-center gap-3 text-gray-600">
                    <Clock className="h-5 w-5" style={{ color: primaryColor }} />
                    £{instructor.hourly_rate}/hour
                  </div>
                )}
              </div>

              {/* Social Links */}
              {(instructor.personal_website_url || instructor.facebook_url || 
                instructor.instagram_url || instructor.twitter_url || instructor.linkedin_url) && (
                <div className="flex items-center gap-3 mt-6 pt-4 border-t">
                  {instructor.personal_website_url && (
                    <a 
                      href={instructor.personal_website_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                      style={{ color: primaryColor }}
                    >
                      <Globe className="h-5 w-5" />
                    </a>
                  )}
                  {instructor.facebook_url && (
                    <a 
                      href={instructor.facebook_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                      style={{ color: primaryColor }}
                    >
                      <Facebook className="h-5 w-5" />
                    </a>
                  )}
                  {instructor.instagram_url && (
                    <a 
                      href={instructor.instagram_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                      style={{ color: primaryColor }}
                    >
                      <Instagram className="h-5 w-5" />
                    </a>
                  )}
                  {instructor.twitter_url && (
                    <a 
                      href={instructor.twitter_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                      style={{ color: primaryColor }}
                    >
                      <Twitter className="h-5 w-5" />
                    </a>
                  )}
                  {instructor.linkedin_url && (
                    <a 
                      href={instructor.linkedin_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                      style={{ color: primaryColor }}
                    >
                      <Linkedin className="h-5 w-5" />
                    </a>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.section>

        {/* Footer CTA */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center py-8"
        >
          <Link to={`/i/${slug}/contact`}>
            <Button 
              size="lg" 
              className="text-white shadow-xl px-8"
              style={{ backgroundColor: primaryColor }}
            >
              Book Your First Lesson
              <ChevronRight className="h-5 w-5 ml-1" />
            </Button>
          </Link>
          <p className="text-sm text-gray-500 mt-3">
            Powered by EveryDriver
          </p>
        </motion.div>
      </main>
    </div>
  );
}
