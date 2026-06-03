export interface DemoInstructor {
  id: string;
  name: string;
  profile_image_url: string | null;
  brand_colour: string | null;
  home_postcode: string | null;
  car_type: string | null;
  hourly_rate: number | null;
}

export interface DemoCourse {
  id: string;
  course_name: string;
  course_hours: number;
  flat_price: number | null;
  discounted_price: number | null;
  is_intensive: boolean;
  offer_active: boolean;
  available_from: string | null;
}

export function computePrice(course: DemoCourse, hourlyRate: number | null): number | null {
  if (course.discounted_price != null) return Number(course.discounted_price);
  if (course.flat_price != null) return Number(course.flat_price);
  if (hourlyRate != null) return hourlyRate * course.course_hours;
  return null;
}
