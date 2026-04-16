import { useEffect } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";

/**
 * Legacy route — redirects to the unified settings page.
 * Preserves ?open= param so deep links still work.
 */
export default function InstructorSettingsCategory() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const basePath = window.location.pathname.includes("/every-instructor")
      ? "/every-instructor/menu"
      : "/instructor/menu";
    const openParam = searchParams.get("open");
    const qs = openParam ? `?open=${openParam}` : "";
    navigate(`${basePath}${qs}`, { replace: true });
  }, [categoryId, searchParams, navigate]);

  return null;
}
