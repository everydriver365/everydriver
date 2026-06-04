import { format } from "date-fns";

export type Platform = "xero" | "quickbooks" | "freeagent" | "sage";

export interface PlatformConfig {
  label: string;
  expenseHeaders: string[];
  incomeHeaders: string[];
  dateFormat: string;
  formatExpenseRow: (expense: any, accountCode: string) => string[];
  formatIncomeRow: (lesson: any, amount: number) => string[];
  getCategoryCode: (category: string) => string;
  getIncomeCode: () => string;
  filePrefix: string;
}

const xeroCategories: Record<string, string> = {
  Fuel: "429",
  "Vehicle Maintenance": "455",
  Insurance: "463",
  "Training Materials": "400",
  "Office Supplies": "453",
  Marketing: "449",
  "Tolls & Parking": "429",
  Mileage: "410",
  Other: "499",
};

const qboCategories: Record<string, string> = {
  Fuel: "Car & Van Expenses",
  "Vehicle Maintenance": "Repair & Maintenance",
  Insurance: "Insurance",
  "Training Materials": "Training Costs",
  "Office Supplies": "Office Expenses",
  Marketing: "Advertising & Marketing",
  "Tolls & Parking": "Travel Expenses",
  Mileage: "Car & Van Expenses",
  Other: "Other Expenses",
};

const freeagentCategories: Record<string, string> = {
  Fuel: "Motor Expenses",
  "Vehicle Maintenance": "Motor Expenses",
  Insurance: "Insurance",
  "Training Materials": "Staff Training",
  "Office Supplies": "Office Costs",
  Marketing: "Advertising",
  "Tolls & Parking": "Motor Expenses",
  Mileage: "Motor Expenses",
  Other: "General Administrative Costs",
};

const sageCategories: Record<string, string> = {
  Fuel: "7300",
  "Vehicle Maintenance": "7301",
  Insurance: "7104",
  "Training Materials": "7603",
  "Office Supplies": "7502",
  Marketing: "6201",
  "Tolls & Parking": "7300",
  Mileage: "7400",
  Other: "8200",
};

const formatDate = (date: string, fmt: string) => format(new Date(date), fmt);

export const platformConfigs: Record<Platform, PlatformConfig> = {
  xero: {
    label: "Xero",
    expenseHeaders: ["*Date", "*Amount", "Description", "Reference", "Account Code", "Tax Rate"],
    incomeHeaders: ["*Date", "*Amount", "Description", "Reference", "Account Code", "Tax Rate"],
    dateFormat: "dd/MM/yy",
    getCategoryCode: (cat) => xeroCategories[cat] || "499",
    getIncomeCode: () => "200",
    formatExpenseRow: (exp, code) => [
      formatDate(exp.expense_date, "dd/MM/yy"),
      exp.amount.toFixed(2),
      exp.description || exp.category,
      exp.id.slice(0, 8),
      code,
      "20% (VAT on Expenses)",
    ],
    formatIncomeRow: (lesson, amount) => [
      formatDate(lesson.lesson_date, "dd/MM/yy"),
      amount.toFixed(2),
      `Driving Lesson - ${lesson.pupils?.name || "Student"}`,
      lesson.id.slice(0, 8),
      "200",
      "No VAT",
    ],
    filePrefix: "xero",
  },
  quickbooks: {
    label: "QuickBooks",
    expenseHeaders: ["Date", "Description", "Amount", "Category", "Ref Number"],
    incomeHeaders: ["Date", "Description", "Amount", "Category", "Ref Number"],
    dateFormat: "MM/dd/yyyy",
    getCategoryCode: (cat) => qboCategories[cat] || "Other Expenses",
    getIncomeCode: () => "Sales",
    formatExpenseRow: (exp, code) => [
      formatDate(exp.expense_date, "MM/dd/yyyy"),
      exp.description || exp.category,
      exp.amount.toFixed(2),
      code,
      exp.id.slice(0, 8),
    ],
    formatIncomeRow: (lesson, amount) => [
      formatDate(lesson.lesson_date, "MM/dd/yyyy"),
      `Driving Lesson - ${lesson.pupils?.name || "Student"}`,
      amount.toFixed(2),
      "Sales",
      lesson.id.slice(0, 8),
    ],
    filePrefix: "quickbooks",
  },
  freeagent: {
    label: "FreeAgent",
    expenseHeaders: ["Dated on", "Description", "Gross Value", "Category", "Sales Tax Rate"],
    incomeHeaders: ["Dated on", "Description", "Gross Value", "Category", "Sales Tax Rate"],
    dateFormat: "dd/MM/yy",
    getCategoryCode: (cat) => freeagentCategories[cat] || "General Administrative Costs",
    getIncomeCode: () => "Driving Tuition Income",
    formatExpenseRow: (exp, code) => [
      formatDate(exp.expense_date, "dd/MM/yy"),
      exp.description || exp.category,
      exp.amount.toFixed(2),
      code,
      "No VAT",
    ],
    formatIncomeRow: (lesson, amount) => [
      formatDate(lesson.lesson_date, "dd/MM/yy"),
      `Driving Lesson - ${lesson.pupils?.name || "Student"}`,
      amount.toFixed(2),
      "Driving Tuition Income",
      "No VAT",
    ],
    filePrefix: "freeagent",
  },
  sage: {
    label: "Sage",
    expenseHeaders: ["Date", "N/C", "Reference", "Details", "Net Amount", "Tax Code"],
    incomeHeaders: ["Date", "N/C", "Reference", "Details", "Net Amount", "Tax Code"],
    dateFormat: "dd/MM/yy",
    getCategoryCode: (cat) => sageCategories[cat] || "8200",
    getIncomeCode: () => "4000",
    formatExpenseRow: (exp, code) => [
      formatDate(exp.expense_date, "dd/MM/yy"),
      code,
      exp.id.slice(0, 8),
      exp.description || exp.category,
      exp.amount.toFixed(2),
      "T1",
    ],
    formatIncomeRow: (lesson, amount) => [
      formatDate(lesson.lesson_date, "dd/MM/yy"),
      "4000",
      lesson.id.slice(0, 8),
      `Driving Lesson - ${lesson.pupils?.name || "Student"}`,
      amount.toFixed(2),
      "T0",
    ],
    filePrefix: "sage",
  },
};
