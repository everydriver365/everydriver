UPDATE public.pupils SET
  theory_test_date = src.theory_test_date,
  theory_test_passed = src.theory_test_passed,
  test_date = src.test_date,
  test_time = src.test_time,
  test_passed = src.test_passed,
  test_centre_id = src.test_centre_id
FROM (SELECT theory_test_date, theory_test_passed, test_date, test_time, test_passed, test_centre_id FROM public.pupils WHERE id='53011379-5cf6-4385-9e9c-544d3e9ae961') AS src
WHERE public.pupils.id='383c3edb-bd9c-4247-94e0-396326c5837b';