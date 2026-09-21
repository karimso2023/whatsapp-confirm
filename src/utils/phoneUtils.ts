/**
 * Utilities for cleaning, standardizing, and validating phone numbers for WhatsApp
 */

// Convert Eastern Arabic and Persian numerals to Western Arabic (0-9)
export function normalizeDigits(input: string): string {
  if (!input) return '';
  const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  const persianNumerals = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  
  let result = input.toString();
  for (let i = 0; i < 10; i++) {
    result = result.split(arabicNumerals[i]).join(i.toString());
    result = result.split(persianNumerals[i]).join(i.toString());
  }
  return result;
}

export interface CleanPhoneResult {
  isValid: boolean;
  cleanPhone: string;
  displayPhone: string;
  error?: string;
  isEgyptian: boolean;
}

/**
 * Clean and format a phone number for WhatsApp link usage.
 * Strict handling for Egyptian mobile operators (010, 011, 012, 015)
 * and international phone codes.
 */
export function processPhoneNumber(
  rawPhone: string | number | undefined | null,
  defaultCountryCode = '20'
): CleanPhoneResult {
  if (rawPhone === undefined || rawPhone === null) {
    return {
      isValid: false,
      cleanPhone: '',
      displayPhone: '',
      error: 'رقم الهاتف غير موجود',
      isEgyptian: false,
    };
  }

  // 1. Convert to string and normalize Arabic/Persian digits
  let phoneStr = normalizeDigits(String(rawPhone).trim());

  // Check if originally started with + (before stripping)
  const hadPlus = phoneStr.startsWith('+');

  // 2. Strip all non-digit characters except we noted hadPlus
  phoneStr = phoneStr.replace(/[\s\-()_.\\/]/g, '').replace(/^\+/, '');

  if (!phoneStr || phoneStr.length === 0) {
    return {
      isValid: false,
      cleanPhone: '',
      displayPhone: '',
      error: 'رقم الهاتف فارغ',
      isEgyptian: false,
    };
  }

  // Check Egyptian format
  // Case A: 11 digits starting with 010, 011, 012, 015 (e.g. 01012345678)
  const isEgyptianLocal11 = /^0(10|11|12|15)\d{8}$/.test(phoneStr);

  // Case B: 10 digits without leading zero (e.g. 1012345678)
  const isEgyptianLocal10 = /^(10|11|12|15)\d{8}$/.test(phoneStr);

  // Case C: 12 digits already starting with 20 (e.g. 201012345678)
  const isEgyptianWith20 = /^20(10|11|12|15)\d{8}$/.test(phoneStr);

  // Case D: 0020 prefix
  const isEgyptianWith0020 = /^0020(10|11|12|15)\d{8}$/.test(phoneStr);

  let cleanPhone = '';
  let displayPhone = phoneStr;
  let isEgyptian = false;

  if (isEgyptianLocal11) {
    // Convert 010xxxxxxxx to 2010xxxxxxxx
    cleanPhone = '20' + phoneStr.substring(1);
    displayPhone = phoneStr;
    isEgyptian = true;
  } else if (isEgyptianLocal10) {
    // Convert 10xxxxxxxx to 2010xxxxxxxx
    cleanPhone = '20' + phoneStr;
    displayPhone = '0' + phoneStr;
    isEgyptian = true;
  } else if (isEgyptianWith20) {
    // Already has 20 prefix
    cleanPhone = phoneStr;
    displayPhone = '0' + phoneStr.substring(2);
    isEgyptian = true;
  } else if (isEgyptianWith0020) {
    // Strip 00
    cleanPhone = phoneStr.substring(2);
    displayPhone = '0' + phoneStr.substring(4);
    isEgyptian = true;
  } else {
    // If user provided a phone number that doesn't strictly match standard 01x,
    // let's check general international or custom default country code
    if (phoneStr.startsWith('00')) {
      cleanPhone = phoneStr.substring(2);
    } else if (hadPlus || phoneStr.length >= 11) {
      // Already has international code or explicit +
      cleanPhone = phoneStr;
    } else if (phoneStr.startsWith('0')) {
      // Local number with leading zero of default country code
      const cleanCode = defaultCountryCode.replace(/\+/g, '');
      cleanPhone = cleanCode + phoneStr.substring(1);
    } else {
      const cleanCode = defaultCountryCode.replace(/\+/g, '');
      cleanPhone = cleanCode + phoneStr;
    }
  }

  // Basic validation on cleanPhone: only digits, length between 9 and 15
  const isValid = /^\d{9,16}$/.test(cleanPhone);
  let error: string | undefined = undefined;

  if (!isValid) {
    if (cleanPhone.length < 9) {
      error = 'رقم الهاتف قصير جداً وغير مكتمل';
    } else if (cleanPhone.length > 16) {
      error = 'رقم الهاتف طويل جداً';
    } else {
      error = 'رقم الهاتف يحتوي على رموز غير صالحة';
    }
  } else if (isEgyptian && cleanPhone.length !== 12) {
    error = 'رقم الموبايل المصري يجب أن يكون 11 رقماً';
  }

  return {
    isValid,
    cleanPhone,
    displayPhone,
    error,
    isEgyptian,
  };
}
