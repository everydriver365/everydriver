import diaryPhoneMockup from "@/assets/features/diary-option-phone-mockup.png";
import diaryFlatScreenshot from "@/assets/features/diary-option-flat-screenshot.png";
import diaryLifestyle from "@/assets/features/diary-option-lifestyle.png";
import diaryIllustrated from "@/assets/features/diary-option-illustrated.png";

const options = [
  { label: "Option 1: Phone Mockup", img: diaryPhoneMockup },
  { label: "Option 2: Flat Screenshot", img: diaryFlatScreenshot },
  { label: "Option 3: Lifestyle Photo", img: diaryLifestyle },
  { label: "Option 4: Illustrated", img: diaryIllustrated },
];

export default function DiaryImageDemo() {
  return (
    <div className="min-h-screen bg-background p-6 md:p-12">
      <h1 className="text-3xl font-bold text-foreground mb-2">Smart Diary — Image Options</h1>
      <p className="text-muted-foreground mb-8">Pick the style you like best for the Smart Diary section.</p>
      <div className="grid md:grid-cols-2 gap-8">
        {options.map((opt) => (
          <div key={opt.label} className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
            <img src={opt.img} alt={opt.label} className="w-full aspect-square object-cover" />
            <div className="p-4">
              <h2 className="text-lg font-semibold text-foreground">{opt.label}</h2>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
