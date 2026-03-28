// Profanity filter — censors matched words as first-letter + asterisks
// Pattern: whole-word match, case-insensitive, handles common letter substitutions

const BANNED = [
  "bastard", "bitch", "bitches", "bullshit",
  "cunt", "cunts",
  "dick", "dicks", "dickhead",
  "fuck", "fucker", "fuckers", "fucking", "fucked", "fucks", "fuckoff",
  "motherfucker", "motherfucking",
  "shit", "shits", "shitty", "shitting",
  "ass", "asses", "asshole", "assholes",
  "piss", "pissed", "pissing",
  "cock", "cocks",
  "pussy", "pussies",
  "whore", "whores",
  "slut", "sluts",
  "nigga", "nigger", "niggers",
  "retard", "retards", "retarded",
  "faggot", "faggots", "fag", "fags",
  "crap", "crappy",
  "damn", "dammit",
  "hell",
  "idiot", "idiots",
  "moron", "morons",
  "stupid",
  "loser", "losers",
];

// Build a map: word → censored form (first char + asterisks for remaining)
const censorMap = new Map(
  BANNED.map(word => [word, word[0] + '*'.repeat(word.length - 1)])
);

// Regex: match any banned word as a whole word, accounting for common l33t-speak substitutions
// We normalise the text before matching but apply censor to original positions

function buildPattern() {
  const escaped = BANNED.map(w =>
    w.split('').map(c => {
      // allow common substitutions per character
      const subs = { a: '[a@4]', e: '[e3]', i: '[i1!]', o: '[o0]', s: '[s$5]', t: '[t7]', g: '[g9]' };
      return subs[c.toLowerCase()] ?? c;
    }).join('')
  );
  return new RegExp(`\\b(${escaped.join('|')})\\b`, 'gi');
}

const PATTERN = buildPattern();

export function censorText(text) {
  if (!text) return text;
  return text.replace(PATTERN, match => {
    const lower = match.toLowerCase();
    // find closest banned word
    const key = [...censorMap.keys()].find(w => {
      const wPat = new RegExp(
        '^' + w.split('').map(c => {
          const subs = { a: '[a@4]', e: '[e3]', i: '[i1!]', o: '[o0]', s: '[s$5]', t: '[t7]', g: '[g9]' };
          return subs[c] ?? c;
        }).join('') + '$',
        'i'
      );
      return wPat.test(match);
    });
    if (key) return match[0] + '*'.repeat(match.length - 1);
    return match;
  });
}
