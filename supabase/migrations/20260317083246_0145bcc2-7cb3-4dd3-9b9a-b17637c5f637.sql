
CREATE OR REPLACE FUNCTION public.create_instructor_website_pages()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.instructor_website_pages (instructor_id, page_type, page_title, hero_heading, hero_subheading, display_order, content_blocks)
  VALUES
    (NEW.id, 'home', 'Home', 
     'Driving Lessons with ' || NEW.name, 
     'Professional driving instruction tailored to your needs', 1, 
     '[{"type":"text","title":"Why Choose Us","content":"With years of experience and a passion for teaching, I provide patient, professional driving instruction to help you pass your test with confidence."},{"type":"features","title":"What We Offer","items":["Free re-test if you fail","Earlier test date guaranteed","Flexible payments with Klarna & Clearpay","Free theory test access","Free cancellation finder","Modern dual-control vehicle"]}]'::jsonb),
    (NEW.id, 'about', 'About', 'About ' || NEW.name, 'Get to know your instructor', 2,
     '[{"type":"text","title":"My Background","content":"I am a qualified ADI with a commitment to providing excellent driving tuition. My goal is to help every student become a safe, confident driver for life."},{"type":"text","title":"Teaching Philosophy","content":"I believe in patient, encouraging instruction that builds confidence step by step."}]'::jsonb),
    (NEW.id, 'services', 'Services', 'Our Services', 'Driving courses to suit every learner', 3,
     '[{"type":"text","title":"Lesson Options","content":"Whether you prefer regular weekly lessons or an intensive course, I can create a learning plan that works for you."},{"type":"features","title":"Course Types","items":["Weekly lessons - learn at your own pace","Semi-intensive - pass in 2-4 weeks","Intensive courses - pass in 1-2 weeks","Test in a Week packages"]}]'::jsonb),
    (NEW.id, 'reviews', 'Reviews', 'Student Reviews', 'See what my students say', 4,
     '[{"type":"text","title":"Testimonials","content":"My students success is my greatest achievement. Read their stories below."}]'::jsonb),
    (NEW.id, 'contact', 'Contact', 'Get in Touch', 'Ready to start your driving journey?', 5,
     '[{"type":"text","title":"Book Your First Lesson","content":"Contact me today to discuss your learning needs and book your first lesson. I look forward to helping you achieve your driving goals!"}]'::jsonb);
  
  RETURN NEW;
END;
$function$;
