// Starter catalogs so he isn't staring at an empty screen on day one.
// Names and typical weights only — no photos. He edits the weights to match
// his own pieces and photographs them himself; a stock photo would be
// showing a customer something he does not actually have.

export const SAMPLE_ITEMS = [
  { name: 'लौंग वाली राखी', metal: 'chandi', weight: 8, makingPaise: 15000 },
  { name: 'चांदी की राखी', metal: 'chandi', weight: 5, makingPaise: 10000 },
  { name: 'मंगलसूत्र', metal: 'sona', weight: 14, makingPaise: 250000 },
  { name: 'सोने की चेन', metal: 'sona', weight: 10, makingPaise: 180000 },
  { name: 'झुमका', metal: 'sona', weight: 6, makingPaise: 140000 },
  { name: 'नथ', metal: 'sona', weight: 3, makingPaise: 90000 },
  { name: 'लौंग (नाक की)', metal: 'sona', weight: 0.5, makingPaise: 30000 },
  { name: 'अंगूठी', metal: 'sona', weight: 4, makingPaise: 100000 },
  { name: 'कंगन (जोड़ी)', metal: 'sona', weight: 22, makingPaise: 350000 },
  { name: 'पायल (जोड़ी)', metal: 'chandi', weight: 45, makingPaise: 25000 },
  { name: 'बिछिया (जोड़ी)', metal: 'chandi', weight: 12, makingPaise: 8000 },
  { name: 'चांदी का सिक्का (10 ग्राम)', metal: 'chandi', weight: 10, makingPaise: 5000 }
];

// Traditional pieces common across the Etah / Braj belt of western UP.
// Regional styles, not Awagarh-exclusive — local names vary from village to
// village, so these are meant to be renamed to whatever his customers ask for.
export const REGIONAL_ITEMS = [
  // सोना
  { name: 'हंसुली (सोना)', metal: 'sona', weight: 28, makingPaise: 420000 },
  { name: 'चंपाकली हार', metal: 'sona', weight: 26, makingPaise: 450000 },
  { name: 'रानीहार', metal: 'sona', weight: 35, makingPaise: 600000 },
  { name: 'गुलूबंद', metal: 'sona', weight: 18, makingPaise: 320000 },
  { name: 'मांग टीका', metal: 'sona', weight: 5, makingPaise: 120000 },
  { name: 'बोरला', metal: 'sona', weight: 7, makingPaise: 150000 },
  { name: 'कर्णफूल', metal: 'sona', weight: 8, makingPaise: 170000 },
  { name: 'बुलाक', metal: 'sona', weight: 2, makingPaise: 70000 },
  { name: 'कंठी', metal: 'sona', weight: 16, makingPaise: 280000 },
  { name: 'बाजूबंद', metal: 'sona', weight: 12, makingPaise: 220000 },

  // चांदी
  { name: 'हंसुली (चांदी)', metal: 'chandi', weight: 120, makingPaise: 40000 },
  { name: 'छड़ा (जोड़ी)', metal: 'chandi', weight: 180, makingPaise: 50000 },
  { name: 'तोड़ा (जोड़ी)', metal: 'chandi', weight: 150, makingPaise: 45000 },
  { name: 'लच्छा (जोड़ी)', metal: 'chandi', weight: 90, makingPaise: 30000 },
  { name: 'करधनी / तगड़ी', metal: 'chandi', weight: 200, makingPaise: 60000 },
  { name: 'हमेल (सिक्कों वाली)', metal: 'chandi', weight: 160, makingPaise: 55000 },
  { name: 'घुंघरू वाली पायल', metal: 'chandi', weight: 70, makingPaise: 28000 },
  { name: 'कड़ा (जोड़ी)', metal: 'chandi', weight: 100, makingPaise: 32000 },
  { name: 'सुतिया', metal: 'chandi', weight: 55, makingPaise: 20000 },
  { name: 'चूड़ा (चांदी)', metal: 'chandi', weight: 140, makingPaise: 42000 }
];
