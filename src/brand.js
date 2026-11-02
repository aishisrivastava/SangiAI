// One place for the product name, mark and tagline. Used by the shell, the
// install manifest copy and the share text.
export const BRAND = {
  name: 'Sangi AI',
  devanagari: 'संगी',
  monogram: 'सं',
  tagline: 'Your companion after you move',
  poweredBy: 'Powered by Sarvam',
}

const TAGLINES = {
  hi: 'शहर बदलने के बाद आपका साथी',
  mr: 'शहर बदलल्यानंतर तुमचा सोबती',
  bn: 'শহর বদলের পর আপনার সঙ্গী',
  ta: 'நகரம் மாறியபின் உங்கள் துணை',
  te: 'నగరం మారిన తర్వాత మీ తోడు',
  gu: 'શહેર બદલ્યા પછી તમારો સાથી',
  or: 'ସହର ବଦଳିବା ପରେ ଆପଣଙ୍କ ସାଥୀ',
  en: 'Your companion after you move',
}

// Tamil deliberately uses the Latin name until a human checks the script form.
export const brandTagline = (lang) => TAGLINES[lang] || TAGLINES.en