/**
 * Formats a phone number string for display
 * Returns the number as-is if already formatted by react-international-phone,
 * or applies basic formatting for legacy/unformatted numbers
 * @param {string} phoneNumber - The phone number to format
 * @returns {string} - Formatted phone number or empty string if empty
 */
export const formatPhoneNumber = (phoneNumber) => {
  if (!phoneNumber || phoneNumber.trim() === '') {
    return '';
  }
  
  // If the phone number already has proper international formatting with parentheses
  // (starts with + and has parentheses), return as-is
  // react-international-phone already formats numbers correctly per country
  if (phoneNumber.startsWith('+') && phoneNumber.includes('(') && phoneNumber.includes(')')) {
    return phoneNumber;
  }
  
  // If it has + and spaces/dashes but no parentheses, we need to reformat it
  // to match the library's format (especially for US numbers)
  
  // For legacy numbers without proper formatting, add basic spacing
  // Clean the number - remove all non-digit characters except the leading +
  const cleaned = phoneNumber.replace(/[^\d+]/g, '');
  
  // If it doesn't start with +, return as-is (old data without country code)
  if (!cleaned.startsWith('+')) {
    return phoneNumber;
  }
  
  // Smart country code detection for legacy data
  const digitsOnly = cleaned.slice(1); // Remove the +
  let countryCode = '';
  let number = '';
  
  // Detect common country codes
  // Comprehensive list of 2-digit country codes (sorted for clarity)
  const twoDigitCodes = [
    '20','21','22','23','24','25','26','27','28','29', // Africa/Middle East
    '30','31','32','33','34','36','37','38','39',       // Europe
    '40','41','42','43','44','45','46','47','48','49',  // Europe
    '51','52','53','54','55','56','57','58',            // Americas
    '60','61','62','63','64','65','66',                 // Asia/Oceania
    '67','68','69',                                      // Central Asia
    '70','71','72','73','74','75','76','77',            // Russia/Central Asia
    '81','82','83','84','85','86',                      // East Asia
    '90','91','92','93','94','95','96','97','98','99'   // Middle East/South Asia
  ];
  
         // List of 3-digit country codes
         const threeDigitCodes = [
           '220','221','222','223','224','225','226','227','228','229', // Africa
           '230','231','232','233','234','235','236','237','238','239',
           '240','241','242','243','244','245','246','247','248','249',
           '250','251','252','253','254','255','256','257','258','259',
           '260','261','262','263','264','265','266','267','268','269',
           '290','291','297','298','299',                               // Various
           '350','351','352','353','354','355','356','357','358','359', // Europe/Mediterranean
           '370','371','372','373','374','375','376','377','378','379', // Europe
           '380','381','382','383','385','386','387','389',             // Eastern Europe
           '420','421','423',                                            // Czech/Slovakia/Liechtenstein
           '500','501','502','503','504','505','506','507','508','509', // Americas
           '590','591','592','593','594','595','596','597','598','599', // Caribbean/South America
           '670','671','672','673','674','675','676','677','678','679', // Pacific
           '680','681','682','683','684','685','686','687','688','689', // Pacific
           '850','852','853','855','856','870','878','880','886',       // East Asia/Satellite
           '960','961','962','963','964','965','966','967','968','970', // Middle East
           '971','972','973','974','975','976','977','992','993','994','995','996','998' // Central/South Asia
         ];

         // List of 4-digit country codes (less common but some exist)
         const fourDigitCodes = [
           '1242','1246','1264','1268','1284','1340','1345','1441','1473','1649','1664','1670','1671','1684','1721','1758','1767','1784','1787','1809','1829','1849','1868','1869','1876','1939' // Caribbean/North America
         ];
  
         if (digitsOnly.length >= 10) {
           // Check for 4-digit country code first (most specific)
           const firstFour = digitsOnly.slice(0, 4);
           if (fourDigitCodes.includes(firstFour)) {
             countryCode = firstFour;
             number = digitsOnly.slice(4);
           } else {
             // Check for 3-digit country code
             const firstThree = digitsOnly.slice(0, 3);
             if (threeDigitCodes.includes(firstThree)) {
               countryCode = firstThree;
               number = digitsOnly.slice(3);
             } else {
               // Check if first 2 digits match a known 2-digit country code
               const firstTwo = digitsOnly.slice(0, 2);
               if (twoDigitCodes.includes(firstTwo)) {
                 countryCode = firstTwo;
                 number = digitsOnly.slice(2);
               } else {
                 // Check for US/Canada (+1) - special case with parentheses
                 if (digitsOnly.startsWith('1') && digitsOnly.length === 11) {
                   countryCode = '1';
                   number = digitsOnly.slice(1);
                 } else {
                   // Default to 1-digit country code
                   countryCode = digitsOnly.slice(0, 1);
                   number = digitsOnly.slice(1);
                 }
               }
             }
           }
         } else {
           // For shorter numbers, guess based on length
           countryCode = digitsOnly.slice(0, digitsOnly.length >= 8 ? 2 : 1);
           number = digitsOnly.slice(countryCode.length);
         }
  
  // Apply formatting based on country code and number length
  let formatted = `+${countryCode} `;
  const len = number.length;
  
  // Special formatting for US/Canada (country code 1) to match react-international-phone
  if (countryCode === '1' && len === 10) {
    // US/Canada: +1 (XXX) XXX-XXXX
    formatted += `(${number.slice(0, 3)}) ${number.slice(3, 6)}-${number.slice(6)}`;
    return formatted;
  }
  
  // For other countries, use international patterns (no parentheses)
  let chunks = [];
  
  if (len <= 4) {
    chunks = [number];
  } else if (len === 5) {
    chunks = [number.slice(0, 2), number.slice(2)]; // 2-3
  } else if (len === 6) {
    chunks = [number.slice(0, 3), number.slice(3)]; // 3-3
  } else if (len === 7) {
    chunks = [number.slice(0, 3), number.slice(3)]; // 3-4
  } else if (len === 8) {
    chunks = [number.slice(0, 4), number.slice(4)]; // 4-4
  } else if (len === 9) {
    chunks = [number.slice(0, 3), number.slice(3, 6), number.slice(6)]; // 3-3-3
  } else if (len === 10) {
    chunks = [number.slice(0, 3), number.slice(3, 6), number.slice(6)]; // 3-3-4
  } else if (len === 11) {
    chunks = [number.slice(0, 4), number.slice(4, 7), number.slice(7)]; // 4-3-4
  } else {
    // For longer numbers, use flexible chunking (groups of 3-4)
    let remaining = number;
    while (remaining.length > 0) {
      if (remaining.length <= 4) {
        chunks.push(remaining);
        break;
      }
      const chunkSize = (remaining.length % 3 === 1) ? 4 : 3;
      chunks.push(remaining.slice(0, chunkSize));
      remaining = remaining.slice(chunkSize);
    }
  }
  
  formatted += chunks.join(' ');
  
  return formatted;
};

