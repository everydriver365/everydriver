import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, MapPin, Phone, Mail, Car, BookOpen, CreditCard, 
  Calendar, CheckCircle2, XCircle, Clock, Hash
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO } from "date-fns";

interface PupilDetailsDrawerProps {
  open: boolean;
  onClose: () => void;
  pupilId: string;
  brandColour: string | null;
  darkMode: boolean;
}

interface TestResult {
  id: string;
  test_date: string;
  result: string;
  is_mock: boolean;
  total_minor_faults: number;
  total_serious_faults: number;
  total_dangerous_faults: number;
}

interface PaymentRecord {
  id: string;
  amount: number;
  payment_date: string;
  payment_method: string | null;
  notes: string | null;
}

interface PupilDetails {
  address: string;
  postcode: string;
  phone: string | null;
  email: string | null;
  what3words: string | null;
  driver_number: string | null;
  theory_cert_number: string | null;
  theory_test_date: string | null;
  theory_test_passed: boolean | null;
  test_date: string | null;
  test_passed: boolean | null;
}

export function PupilDetailsDrawer({ open, onClose, pupilId, brandColour, darkMode }: PupilDetailsDrawerProps) {
  const [details, setDetails] = useState<PupilDetails | null>(null);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open && pupilId) {
      fetchAll();
    }
  }, [open, pupilId]);

  const fetchAll = async () => {
    setLoading(true);
    const [detailsRes, testsRes, paymentsRes] = await Promise.all([
      supabase
        .from("pupils")
        .select("address, postcode, phone, email, what3words, driver_number, theory_cert_number, theory_test_date, theory_test_passed, test_date, test_passed")
        .eq("id", pupilId)
        .single(),
      supabase
        .from("driving_test_results")
        .select("id, test_date, result, is_mock, total_minor_faults, total_serious_faults, total_dangerous_faults")
        .eq("pupil_id", pupilId)
        .order("test_date", { ascending: false })
        .limit(10),
      supabase
        .from("payment_history")
        .select("id, amount, recorded_at, payment_method, notes")
        .eq("pupil_id", pupilId)
        .order("recorded_at", { ascending: false })
        .limit(20),
    ]);

    if (detailsRes.data) setDetails(detailsRes.data);
    if (testsRes.data) setTestResults(testsRes.data);
    if (paymentsRes.data) {
      setPayments(paymentsRes.data.map(p => ({
        id: p.id,
        amount: p.amount,
        payment_date: p.recorded_at,
        payment_method: p.payment_method,
        notes: p.notes,
      })));
    }
    setLoading(false);
  };

  const bg = darkMode ? '#1a1a1a' : '#ffffff';
  const text = darkMode ? '#ffffff' : '#1a1a1a';
  const muted = darkMode ? '#a0a0a0' : '#6b7280';
  const border = darkMode ? '#2a2a2a' : '#e5e7eb';
  const sectionBg = darkMode ? '#111111' : '#f9fafb';

  const DetailRow = ({ icon: Icon, label, value }: { icon: any; label: string; value: string | null | undefined }) => {
    if (!value) return null;
    return (
      <div className="flex items-start gap-3 py-2">
        <Icon className="h-4 w-4 mt-0.5 shrink-0" style={{ color: brandColour || '#1e3a5f' }} />
        <div className="min-w-0">
          <p className="text-xs" style={{ color: muted }}>{label}</p>
          <p className="text-sm break-words" style={{ color: text }}>{value}</p>
        </div>
      </div>
    );
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-50"
            onClick={onClose}
          />
          {/* Drawer */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-2xl shadow-2xl"
            style={{ backgroundColor: bg }}
          >
            {/* Handle */}
            <div className="sticky top-0 flex items-center justify-between px-4 py-3 border-b" style={{ backgroundColor: bg, borderColor: border }}>
              <div className="w-10 h-1 rounded-full mx-auto absolute left-1/2 -translate-x-1/2 top-2" style={{ backgroundColor: border }} />
              <h2 className="text-base font-semibold mt-2" style={{ color: text }}>My Details</h2>
              <button onClick={onClose} className="mt-2">
                <X className="h-5 w-5" style={{ color: muted }} />
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Clock className="h-5 w-5 animate-spin" style={{ color: muted }} />
              </div>
            ) : (
              <div className="px-4 pb-8 space-y-4">
                {/* Contact & Address */}
                <div className="py-3 space-y-1" style={{ borderBottom: `1px solid ${border}` }}>
                  <DetailRow icon={MapPin} label="Home Address" value={details ? `${details.address}, ${details.postcode}` : null} />
                  <DetailRow icon={Phone} label="Phone Number" value={details?.phone} />
                  <DetailRow icon={Mail} label="Email" value={details?.email} />
                  <DetailRow icon={MapPin} label="what3words" value={details?.what3words ? `///${details.what3words}` : null} />
                </div>

                {/* Licence Numbers */}
                <div className="py-3 space-y-1" style={{ borderBottom: `1px solid ${border}` }}>
                  <DetailRow icon={Car} label="Driver Number" value={details?.driver_number} />
                  <DetailRow icon={Hash} label="Theory Certificate Number" value={details?.theory_cert_number} />
                  {details?.theory_test_date && (
                    <div className="flex items-center gap-2 py-2">
                      <BookOpen className="h-4 w-4" style={{ color: brandColour || '#1e3a5f' }} />
                      <span className="text-xs" style={{ color: muted }}>Theory Test:</span>
                      <span className="text-sm" style={{ color: text }}>
                        {format(parseISO(details.theory_test_date), "d MMM yyyy")}
                      </span>
                      {details.theory_test_passed !== null && (
                        details.theory_test_passed 
                          ? <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          : <XCircle className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                  )}
                </div>

                {/* Test History */}
                <div className="py-3" style={{ borderBottom: `1px solid ${border}` }}>
                  <h3 className="text-sm font-semibold mb-2" style={{ color: text }}>Test History</h3>
                  {testResults.length === 0 ? (
                    <p className="text-xs" style={{ color: muted }}>No test results recorded</p>
                  ) : (
                    <div className="space-y-2">
                      {testResults.map(test => (
                        <div key={test.id} className="flex items-center justify-between p-2 rounded" style={{ backgroundColor: sectionBg }}>
                          <div className="flex items-center gap-2">
                            {test.result === 'pass' 
                              ? <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                              : <XCircle className="h-4 w-4 text-red-500" />
                            }
                            <div>
                              <p className="text-sm font-medium" style={{ color: text }}>
                                {test.is_mock ? 'Mock' : 'Driving'} Test — {test.result.charAt(0).toUpperCase() + test.result.slice(1)}
                              </p>
                              <p className="text-xs" style={{ color: muted }}>
                                {format(parseISO(test.test_date), "d MMM yyyy")}
                              </p>
                            </div>
                          </div>
                          <div className="text-right text-xs" style={{ color: muted }}>
                            <span>{test.total_minor_faults}m</span>
                            {test.total_serious_faults > 0 && <span className="text-red-500 ml-1">{test.total_serious_faults}s</span>}
                            {test.total_dangerous_faults > 0 && <span className="text-red-600 ml-1">{test.total_dangerous_faults}d</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Payment History */}
                <div className="py-3">
                  <h3 className="text-sm font-semibold mb-2" style={{ color: text }}>Payment History</h3>
                  {payments.length === 0 ? (
                    <p className="text-xs" style={{ color: muted }}>No payments recorded</p>
                  ) : (
                    <div className="space-y-2">
                      {payments.map(p => (
                        <div key={p.id} className="flex items-center justify-between p-2 rounded" style={{ backgroundColor: sectionBg }}>
                          <div>
                            <p className="text-sm font-medium" style={{ color: text }}>
                              £{p.amount.toFixed(2)}
                            </p>
                            <p className="text-xs" style={{ color: muted }}>
                              {format(parseISO(p.payment_date), "d MMM yyyy")}
                              {p.payment_method && ` · ${p.payment_method}`}
                            </p>
                          </div>
                          <CreditCard className="h-4 w-4" style={{ color: muted }} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
