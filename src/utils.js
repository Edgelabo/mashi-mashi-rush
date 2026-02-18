
export class CallGenerator {
  static TOPPINGS = ['yasai', 'ninniku', 'abura'];
  static AMOUNTS = ['nashi', 'sukuname', 'futsu', 'mashi', 'mashimashi']; // Internal logic names

  // Maps amounts to button presses
  static PRESS_COUNT = {
    'nashi': 0,
    'sukuname': 1, // Treat sukuname as 1 for game simplicity or mapped to normal? Spec says "Default 1". Let's stick to spec.
    // Spec:
    // Yasai: Default 1. "Nashi" -> 0.
    // Ninniku/Abura: Default 0. Mentioned -> 1. "Mashi" -> 2. "MashiMashi" -> 3.
  };

  static generate() {
    const r = Math.random();
    
    // 10% chance for "Zen Mashi" / "Zen MashiMashi"
    if (r < 0.1) {
      if (Math.random() < 0.5) return this.createZenMashi();
      return this.createZenMashiMashi();
    }

    // Normal generation
    const order = {
      yasai: 1, // Default Normal
      ninniku: 0, // Default None
      abura: 0, // Default None
      parts: []
    };

    // Yasai Logic
    // 20% Yasai Nashi, 20% Yasai Mashi, 10% Yasai MashiMashi, 50% Default (Silent or "Yasai")
    const yasaiRoll = Math.random();
    if (yasaiRoll < 0.2) {
      order.yasai = 0;
      order.parts.push("ヤサイなし");
    } else if (yasaiRoll < 0.4) {
      order.yasai = 2;
      order.parts.push("ヤサイマシ");
    } else if (yasaiRoll < 0.5) {
      order.yasai = 3;
      order.parts.push("ヤサイマシマシ");
    } else if (yasaiRoll < 0.7) {
        // Explicit "Yasai" or "Yasai Futsu" (Treat as just "Yasai" for brevity)
        order.yasai = 1;
        order.parts.push("ヤサイ");
    }
    // Else: Silent, implicit normal (no text added)

    // Ninniku Logic
    // 30% None (Silent), 30% Normal, 20% Mashi, 20% MashiMashi
    const ninnikuRoll = Math.random();
    if (ninnikuRoll < 0.3) {
      // None, silent
    } else if (ninnikuRoll < 0.6) {
      order.ninniku = 1;
      order.parts.push("ニンニク");
    } else if (ninnikuRoll < 0.8) {
      order.ninniku = 2;
      order.parts.push("ニンニクマシ");
    } else {
      order.ninniku = 3;
      order.parts.push("ニンニクマシマシ");
    }

    // Abura Logic
    // Same prob as Ninniku
    const aburaRoll = Math.random();
    if (aburaRoll < 0.3) {
      // None
    } else if (aburaRoll < 0.6) {
      order.abura = 1;
      order.parts.push("アブラ");
    } else if (aburaRoll < 0.8) {
      order.abura = 2;
      order.parts.push("アブラマシ");
    } else {
      order.abura = 3;
      order.parts.push("アブラマシマシ");
    }

    // Shuffle parts to make it harder
    for (let i = order.parts.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [order.parts[i], order.parts[j]] = [order.parts[j], order.parts[i]];
    }

    if (order.parts.length === 0) {
      // If nothing is said, it means "Yasai Normal" (default), "Ninniku None", "Abura None"
      // User says "Sono mama" (As is) or just silence using a placeholder text
      order.text = "そのまま"; 
    } else {
      order.text = order.parts.join("");
    }

    return order;
  }

  static createZenMashi() {
    return {
      yasai: 2, ninniku: 2, abura: 2,
      text: "全マシ"
    };
  }

  static createZenMashiMashi() {
    return {
      yasai: 3, ninniku: 3, abura: 3,
      text: "全マシマシ"
    };
  }
}
