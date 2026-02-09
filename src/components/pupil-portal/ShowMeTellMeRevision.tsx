import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, CheckCircle2, Eye, EyeOff } from "lucide-react";

interface ShowMeTellMeRevisionProps {
  pupilId: string;
  brandColour: string | null;
}

interface SMTMQuestion {
  id: string;
  type: 'show' | 'tell';
  question: string;
  answer: string;
}

const SHOW_ME_TELL_ME: SMTMQuestion[] = [
  // Tell Me Questions
  { id: "t1", type: "tell", question: "Tell me how you'd check that the brakes are working before starting a journey.", answer: "Brakes should not feel spongy or slack. Test them as you set off — the vehicle should not pull to one side." },
  { id: "t2", type: "tell", question: "Tell me where you'd find the information for the recommended tyre pressures and how you'd check them.", answer: "Check the vehicle handbook or door pillar sticker. Use a reliable pressure gauge when tyres are cold. Don't forget the spare." },
  { id: "t3", type: "tell", question: "Tell me how you'd check the tyres to ensure they're correctly inflated, have sufficient tread depth and are in good condition.", answer: "Check pressures with a gauge. Tread must be at least 1.6mm across the central ¾ of the tyre. Look for cuts, bulges, or uneven wear." },
  { id: "t4", type: "tell", question: "Tell me how you'd check that the headlights and tail lights are working.", answer: "Turn on the ignition and switch on the headlights. Walk around the vehicle checking front and rear lights, or use reflections." },
  { id: "t5", type: "tell", question: "Tell me how you'd know if there was a problem with your anti-lock braking system.", answer: "A warning light on the dashboard will illuminate if there's a fault with the ABS system." },
  { id: "t6", type: "tell", question: "Tell me how you'd check the direction indicators are working.", answer: "Switch on the ignition, activate indicators in each direction, and walk around to check they're flashing. Check the dashboard indicator light." },
  { id: "t7", type: "tell", question: "Tell me how you'd check the brake lights are working on this car.", answer: "Apply the footbrake and use a reflection in a window or ask someone to check. Alternatively, reverse close to a wall and check for red glow." },
  { id: "t8", type: "tell", question: "Tell me how you'd check the power-assisted steering is working.", answer: "Gentle pressure on the steering wheel when starting the engine should result in a slight but noticeable movement. The steering should feel light." },
  { id: "t9", type: "tell", question: "Tell me how you'd switch on the rear fog light(s) and explain when you'd use them.", answer: "Show the switch. Use fog lights when visibility is seriously reduced (below 100 metres). Remember to switch them off when visibility improves." },
  { id: "t10", type: "tell", question: "Tell me how you'd check the horn is working.", answer: "Press the horn button and listen to check it works. Only use the horn while moving and never between 11:30 pm and 7:00 am in built-up areas." },
  { id: "t11", type: "tell", question: "Tell me how you'd check engine coolant level.", answer: "Open the bonnet and find the coolant reservoir. Check the level is between the min and max markings. Only open when the engine is cold." },
  { id: "t12", type: "tell", question: "Tell me how you'd check engine oil level.", answer: "Pull out the dipstick, wipe clean, reinsert fully, then pull out again. The oil level should be between the minimum and maximum marks." },

  // Show Me Questions
  { id: "s1", type: "show", question: "Show me how you'd wash and clean the rear windscreen.", answer: "Operate the rear windscreen washer and wiper. (Exact controls vary by vehicle.)" },
  { id: "s2", type: "show", question: "Show me how you'd wash and clean the front windscreen.", answer: "Operate the windscreen washer and wipers." },
  { id: "s3", type: "show", question: "Show me how you'd set the rear demister.", answer: "Press the heated rear window button (usually marked with a rectangle with vertical lines)." },
  { id: "s4", type: "show", question: "Show me how you'd switch your headlight from dipped to main beam.", answer: "Push the stalk forward (or pull towards you depending on vehicle) and check the blue main beam warning light on the dashboard." },
  { id: "s5", type: "show", question: "Show me how you'd open and close the side window.", answer: "Operate the electric window switch or manual window winder." },
  { id: "s6", type: "show", question: "Show me/explain how you'd check that the power-assisted steering is working.", answer: "Two methods: (1) Gentle pressure on steering when starting engine should result in slight movement. (2) At low speed, steering should feel light." },
  { id: "s7", type: "show", question: "Show me how you'd demist the front windscreen.", answer: "Set blowers to windscreen, increase fan speed, use warm air, switch on air conditioning if available." },
];

export function ShowMeTellMeRevision({ pupilId, brandColour }: ShowMeTellMeRevisionProps) {
  const storageKey = `smtm_revised_${pupilId}`;
  const [revisedIds, setRevisedIds] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showType, setShowType] = useState<'all' | 'show' | 'tell'>('all');

  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored) setRevisedIds(new Set(JSON.parse(stored)));
  }, [storageKey]);

  const toggleRevised = (id: string) => {
    const next = new Set(revisedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setRevisedIds(next);
    localStorage.setItem(storageKey, JSON.stringify([...next]));
  };

  const filtered = showType === 'all'
    ? SHOW_ME_TELL_ME
    : SHOW_ME_TELL_ME.filter(q => q.type === showType);

  const revisedCount = SHOW_ME_TELL_ME.filter(q => revisedIds.has(q.id)).length;

  return (
    <Card style={{ backgroundColor: 'var(--brand-card)', borderColor: 'var(--brand-border)' }}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base" style={{ color: 'var(--brand-text)' }}>
            Show Me / Tell Me
          </CardTitle>
          <Badge 
            variant={revisedCount === SHOW_ME_TELL_ME.length ? "default" : "secondary"}
            className="text-xs"
          >
            {revisedCount}/{SHOW_ME_TELL_ME.length} revised
          </Badge>
        </div>
        <div className="flex gap-1.5 mt-2">
          {(['all', 'tell', 'show'] as const).map(t => (
            <Button
              key={t}
              variant={showType === t ? "default" : "outline"}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setShowType(t)}
              style={showType === t 
                ? { backgroundColor: brandColour || '#1e3a5f', color: '#fff' } 
                : { borderColor: 'var(--brand-border)', color: 'var(--brand-text)' }
              }
            >
              {t === 'all' ? 'All' : t === 'tell' ? 'Tell Me' : 'Show Me'}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="space-y-2 pt-2">
        {filtered.map(q => {
          const isExpanded = expandedId === q.id;
          const isRevised = revisedIds.has(q.id);

          return (
            <div 
              key={q.id}
              className="rounded-lg border overflow-hidden"
              style={{ borderColor: 'var(--brand-border)' }}
            >
              <button
                className="w-full text-left p-3 flex items-start gap-2"
                onClick={() => setExpandedId(isExpanded ? null : q.id)}
              >
                <Badge 
                  variant="outline" 
                  className="text-[10px] shrink-0 mt-0.5"
                  style={{ borderColor: brandColour || '#1e3a5f', color: brandColour || '#1e3a5f' }}
                >
                  {q.type === 'tell' ? 'TELL' : 'SHOW'}
                </Badge>
                <span className="text-sm flex-1" style={{ color: 'var(--brand-text)' }}>
                  {q.question}
                </span>
                <div className="flex items-center gap-1 shrink-0">
                  {isRevised && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </button>
              {isExpanded && (
                <div className="px-3 pb-3 space-y-2">
                  <div 
                    className="rounded-lg p-3 text-sm"
                    style={{ backgroundColor: `${brandColour || '#1e3a5f'}10`, color: 'var(--brand-text)' }}
                  >
                    {q.answer}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full h-8 text-xs gap-1.5"
                    onClick={() => toggleRevised(q.id)}
                    style={{ borderColor: 'var(--brand-border)', color: 'var(--brand-text)' }}
                  >
                    {isRevised ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    {isRevised ? 'Mark as unrevised' : 'Mark as revised'}
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
