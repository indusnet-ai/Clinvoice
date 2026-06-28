export const Options = [
  { label: "1", value: "1" },
  { label: "2", value: "2" },
  { label: "3", value: "3" },
  { label: "4", value: "4" },
  { label: "5", value: "5" },
];
export const UnitOptions = [
  { label: "days", value: "days" },
  { label: "week", value: "weeks" },
  { label: "month", value: "months" },
];
export const FoodOptions = [
  { label: "Before Food", value: "before" },
  { label: "After Food", value: "after" },
];
export const FrequencyOptions = [
  { label: "1-1-1-1", value: "1-1-1-1" },
  { label: "1-1-1", value: "1-1-1" },
  { label: "1-1", value: "1-1" },
  { label: "1", value: "1" },
];
export const TabletOptions = [
  {
    value: "paracetamol_500",
    name: "Paracetamol 500mg",
    brand: "Cipla",
  },
  {
    value: "azithromycin_250",
    name: "Azithromycin 250mg",
    brand: "Sun Pharma",
  },
  {
    value: "azithromycin_2501",
    name: "Azithromycin 250mg",
    brand: "Sun Pharma",
  },
  {
    value: "azithromycin_2502",
    name: "Azithromycin 250mg",
    brand: "Sun Pharma",
  },
];

export const GenderOptions = [
  { label: "Male", value: "Male" },
  { label: "Female", value: "Female" },
  { label: "Other", value: "Other" },
];
export const BloodGroupOptions = [
  { label: "A+", value: "A+" },
  { label: "A-", value: "A-" },
  { label: "B+", value: "B+" },
  { label: "B-", value: "B-" },
  { label: "O+", value: "O+" },
  { label: "O-", value: "O-" },
  { label: "AB+", value: "AB+" },
  { label: "AB-", value: "AB-" },
];
export const SlotOptions = [
  { label: "09:00 AM", value: "09:00 AM" },
  { label: "09:30 AM", value: "09:30 AM" },
  { label: "10:00 AM", value: "10:00 AM" },
  { label: "10:30 AM", value: "10:30 AM" },
  { label: "11:00 AM", value: "11:00 AM" },
  { label: "11:30 AM", value: "11:30 AM" },
  { label: "12:00 PM", value: "12:00 PM" },
  { label: "02:00 PM", value: "02:00 PM" },
  { label: "02:30 PM", value: "02:30 PM" },
  { label: "03:00 PM", value: "03:00 PM" },
];

// Generate year options dynamically - 50 years from current year
const currentYear = new Date().getFullYear();
export const YearOptions = Array.from({ length: 50 }, (_, i) => {
  const year = (currentYear - i).toString();
  return { label: year, value: year };
});

export const DurationOptions = [
  { label: "15 Minutes", value: "15" },
  { label: "30 Minutes", value: "30" },
  { label: "45 Minutes", value: "45" },
  { label: "1 Hour", value: "60" },
  { label: "1.5 Hours", value: "90" },
  { label: "2 Hours", value: "120" },
];

export const HospitalTypeOptions = [
  { label: "Government", value: 1 },
  { label: "Private", value: 2 },
];

export const CountryOptions = [
  { label: "India", value: "India" },
  { label: "United States", value: "USA" },
  { label: "United Kingdom", value: "UK" },
  { label: "Canada", value: "Canada" },
  { label: "Australia", value: "Australia" },
];

export const StateOptions = [
  { label: "Andhra Pradesh", value: "Andhrapradesh" },
  { label: "Arunachal Pradesh", value: "Arunachalpradesh" },
  { label: "Assam", value: "Assam" },
  { label: "Bihar", value: "Bihar" },
  { label: "Chhattisgarh", value: "Chhattisgarh" },
  { label: "Goa", value: "Goa" },
  { label: "Gujarat", value: "Gujarat" },
  { label: "Haryana", value: "Haryana" },
  { label: "Himachal Pradesh", value: "Himachalpradesh" },
  { label: "Jharkhand", value: "Jharkhand" },
  { label: "Karnataka", value: "Karnataka" },
  { label: "Kerala", value: "Kerala" },
  { label: "Madhya Pradesh", value: "Madhyapradesh" },
  { label: "Maharashtra", value: "Maharashtra" },
  { label: "Manipur", value: "Manipur" },
  { label: "Meghalaya", value: "Meghalaya" },
  { label: "Mizoram", value: "Mizoram" },
  { label: "Nagaland", value: "Nagaland" },
  { label: "Odisha", value: "Odisha" },
  { label: "Punjab", value: "Punjab" },
  { label: "Rajasthan", value: "Rajasthan" },
  { label: "Sikkim", value: "Sikkim" },
  { label: "Tamil Nadu", value: "Tamilnadu" },
  { label: "Telangana", value: "Telangana" },
  { label: "Tripura", value: "Tripura" },
  { label: "Uttar Pradesh", value: "Uttarpradesh" },
  { label: "Uttarakhand", value: "Uttarakhand" },
  { label: "West Bengal", value: "Westbengal" },
  { label: "Andaman and Nicobar Islands", value: "Andamannicobar" },
  { label: "Chandigarh", value: "Chandigarh" },
  { label: "Dadra and Nagar Haveli and Daman and Diu", value: "Dnhdd" },
  { label: "Delhi", value: "Delhi" },
  { label: "Jammu and Kashmir", value: "Jammukashmir" },
  { label: "Ladakh", value: "Ladakh" },
  { label: "Lakshadweep", value: "Lakshadweep" },
  { label: "Puducherry", value: "Puducherry" },
];

export const TNDistrictOptions = [
  { label: "Ariyalur", value: "Ariyalur" },
  { label: "Chengalpattu", value: "Chengalpattu" },
  { label: "Chennai", value: "Chennai" },
  { label: "Coimbatore", value: "Coimbatore" },
  { label: "Cuddalore", value: "Cuddalore" },
  { label: "Dharmapuri", value: "Dharmapuri" },
  { label: "Dindigul", value: "Dindigul" },
  { label: "Erode", value: "Erode" },
  { label: "Kallakurichi", value: "Kallakurichi" },
  { label: "Kancheepuram", value: "Kancheepuram" },
  { label: "Kanyakumari", value: "Kanyakumari" },
  { label: "Karur", value: "Karur" },
  { label: "Krishnagiri", value: "Krishnagiri" },
  { label: "Madurai", value: "Madurai" },
  { label: "Mayiladuthurai", value: "Mayiladuthurai" },
  { label: "Nagapattinam", value: "Nagapattinam" },
  { label: "Namakkal", value: "Namakkal" },
  { label: "Nilgiris", value: "Nilgiris" },
  { label: "Perambalur", value: "Perambalur" },
  { label: "Pudukkottai", value: "Pudukkottai" },
  { label: "Ramanathapuram", value: "Ramanathapuram" },
  { label: "Ranipet", value: "Ranipet" },
  { label: "Salem", value: "Salem" },
  { label: "Sivaganga", value: "Sivaganga" },
  { label: "Tenkasi", value: "Tenkasi" },
  { label: "Thanjavur", value: "Thanjavur" },
  { label: "Theni", value: "Theni" },
  { label: "Thoothukudi", value: "Thoothukudi" },
  { label: "Tiruchirappalli", value: "Tiruchirappalli" },
  { label: "Tirunelveli", value: "Tirunelveli" },
  { label: "Tirupathur", value: "Tirupathur" },
  { label: "Tiruppur", value: "Tiruppur" },
  { label: "Tiruvallur", value: "Tiruvallur" },
  { label: "Tiruvannamalai", value: "Tiruvannamalai" },
  { label: "Tiruvarur", value: "Tiruvarur" },
  { label: "Vellore", value: "Vellore" },
  { label: "Viluppuram", value: "Viluppuram" },
  { label: "Virudhunagar", value: "Virudhunagar" },
];

export const MedicalGraduateOptions = [
  { label: "MBBS (Allopathy)", value: "mbbs" },
  { label: "BDS (Dental)", value: "bds" },
  { label: "BAMS (Ayurveda)", value: "bams" },
  { label: "BHMS (Homeopathy)", value: "bhms" },
  { label: "BUMS (Unani)", value: "bums" },
  { label: "BSMS (Siddha)", value: "bsms" },
  { label: "BNYS (Naturopathy)", value: "bnys" },
];

export const RegistrationCouncilOptions = [
  { label: "National Medical Commission (NMC)", value: "nmc" },
  { label: "Dental Council of India (DCI)", value: "dci" },
  { label: "Tamil Nadu Medical Council", value: "tn_medical_council" },
  { label: "Tamil Nadu Dental Council", value: "tn_dental_council" },
  { label: "Maharashtra Medical Council", value: "maharashtra_medical_council" },
  { label: "Karnataka Medical Council", value: "karnataka_medical_council" },
  { label: "Delhi Medical Council", value: "delhi_medical_council" },
  { label: "National Commission for Indian System of Medicine (NCISM)", value: "ncism" },
];

export const ExperienceOptions = [
  { label: "Fresher / Intern", value: "fresher" },
  { label: "1 Year", value: "1_year" },
  { label: "2 Years", value: "2_years" },
  { label: "3 - 5 Years", value: "3_5_years" },
  { label: "5 - 7 Years", value: "5_7_years" },
  { label: "More than 7 Years", value: "7_plus_years" },
  { label: "10+ Years (Senior Consultant)", value: "10_plus_years" },
];

export const SpecializationCategories = [
  { label: "General Medicine / Surgery", value: "1" },
  { label: "Dental Science", value: "2" },
];

export const Salutations = [
  { label: "Mr.", value: "Mr" },
  { label: "Mrs.", value: "Mrs" },
  { label: "Ms.", value: "Ms" },
];
