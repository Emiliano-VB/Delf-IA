// lib/tutorRules.js
// Tutor socrático de matemáticas SIN IA externa: reglas + ramas de respuesta.
// Regla de oro: NUNCA devuelve el resultado. Guía con pistas y preguntas.

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const strip = (s) =>
  String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const toNum = (x) => parseFloat(String(x).replace(",", "."));
const fmt = (n) =>
  Number.isInteger(n) ? String(n) : String(Math.round(n * 1e4) / 1e4);
const pretty = (s) =>
  String(s).replace(/(?<=.)([+\-])/g, " $1 ").replace(/\*/g, " × ").replace(/\s+/g, " ").trim();

function textOf(h) {
  if (typeof h === "string") return h;
  if (!h) return "";
  const c = h.content ?? h.text ?? h.parts;
  if (typeof c === "string") return c;
  if (Array.isArray(c))
    return c.map((p) => (typeof p === "string" ? p : p?.text || "")).join(" ");
  return "";
}
const isUser = (h) => typeof h === "string" || !h?.role || h.role === "user";

/* ───────────── Lectura de ecuaciones ───────────── */

function extractEquation(text) {
  const t = String(text)
    .replace(/−/g, "-")
    .replace(/[×·]/g, "*")
    .replace(/²/g, "^2")
    .replace(/³/g, "^3");
  const i = t.indexOf("=");
  if (i < 0) return null;
  const clean = (tok) => tok.replace(/^[¿¡]+/, "").replace(/[?!.,;:]+$/, "");
  const ok = (tok) =>
    tok !== "" && /^[0-9a-z+\-*.,()^/]+$/i.test(tok) && !/^[a-z]{2,}$/i.test(tok);
  const lt = t.slice(0, i).trim().split(/\s+/).map(clean).filter((x) => x !== "");
  const rt = t.slice(i + 1).trim().split(/\s+/).map(clean).filter((x) => x !== "");
  const left = [];
  for (let k = lt.length - 1; k >= 0; k--) {
    if (!ok(lt[k])) break;
    left.unshift(lt[k]);
  }
  const right = [];
  for (let k = 0; k < rt.length; k++) {
    if (!ok(rt[k])) break;
    right.push(rt[k]);
  }
  if (!left.length || !right.length) return null;
  const l = left.join(""), r = right.join("");
  if (!/[0-9a-z]/i.test(l) || !/[0-9a-z]/i.test(r)) return null;
  return { left: l, right: r };
}

function parseSide(str) {
  let s = String(str).replace(/\s+/g, "").toLowerCase();
  if (!s || /[()/^]/.test(s)) return null;
  s = s.replace(/,/g, ".");
  const terms = s.match(/[+-]?[^+-]+/g);
  if (!terms || terms.join("") !== s) return null;
  let a = 0, b = 0, v = null;
  for (const t of terms) {
    const m = t.match(/^([+-]?)(\d*\.?\d*)\*?([a-z]?)$/);
    if (!m) return null;
    const [, sg, n, vr] = m;
    if (n === "" && vr === "") return null;
    const sign = sg === "-" ? -1 : 1;
    const coef = n === "" ? 1 : parseFloat(n);
    if (Number.isNaN(coef)) return null;
    if (vr) {
      if (v && v !== vr) return null;
      v = vr;
      a += sign * coef;
    } else b += sign * coef;
  }
  return { a, b, v };
}

// Devuelve datos de la ecuación lineal (sin mostrarlos al alumno).
function linearInfo(eq) {
  const L = parseSide(eq.left), R = parseSide(eq.right);
  if (!L || !R) return null;
  const v = L.v || R.v;
  if (!v) return null;
  if (L.v && R.v && L.v !== R.v) return null;
  const a = L.a - R.a, c = R.b - L.b;
  return { L, R, v, a, c, sol: a !== 0 ? c / a : null };
}

/* ───────────── Guías (pistas, nunca el resultado) ───────────── */

function linearGuide(eq) {
  const shown = pretty(eq.left) + " = " + pretty(eq.right);
  const L = parseSide(eq.left), R = parseSide(eq.right);

  if (!L || !R) {
    if (!/[a-z]/i.test(eq.left + eq.right)) return null;
    if (/\(/.test(eq.left + eq.right))
      return `Veo paréntesis en ${shown}. Vamos con calma 🙂\n\n1) Primero elimina los paréntesis: el número que está afuera multiplica a CADA término de adentro (¡también al signo!).\n2) Después junta lo parecido y despeja.\n\nHaz solo el paso 1 y cuéntame qué expresión te queda.`;
    if (/\^/.test(eq.left + eq.right))
      return `${shown} tiene una potencia, así que es una ecuación de grado 2 (o más). Antes de resolver, pregúntate:\n\n¿Puedes pasar todo a un lado para que quede igual a 0? Hazlo y dime cómo queda. Después vemos si se puede factorizar o si conviene usar la fórmula general.`;
    if (/\//.test(eq.left + eq.right))
      return `${shown} tiene fracciones. Un truco muy útil: multiplica ambos lados por el denominador para quitarlo.\n\n¿Por cuánto tendrías que multiplicar para que desaparezca la fracción? Pruébalo y dime qué te queda.`;
    return `Vamos a ordenar ${shown}. La idea general es dejar los términos con la letra de un lado y los números del otro. ¿Qué término moverías primero? Dime cuál y qué operación harías.`;
  }

  const v = L.v || R.v;
  if (!v)
    return `En ${shown} no hay ninguna incógnita 🤔. Calcula cada lado por separado: ¿te da lo mismo en los dos? Cuéntame qué obtienes en cada lado.`;
  if (L.v && R.v && L.v !== R.v) return null;

  const aTot = L.a - R.a;
  if (L.a !== 0 && R.a !== 0) {
    if (aTot === 0)
      return `Interesante: en ${shown} hay "${v}" en los dos lados. Junta los términos con ${v} en un solo lado. ¿Qué pasa con ellos? ¿La igualdad se cumple siempre, nunca, o solo con algún valor? Dime qué observas.`;
    return `¡Buen reto! En ${shown} hay "${v}" en AMBOS lados.\n\nPaso 1: junta todos los términos con ${v} en un solo lado. Para mover un término al otro lado, haces la operación contraria en los dos lados.\n\n¿Cuál término con ${v} moverías y qué operación harías? Dime cómo queda la ecuación después.`;
  }

  const xs = L.a !== 0 ? L : R;
  if (xs.b !== 0) {
    const verbo = xs.b > 0 ? `sumando ${fmt(xs.b)}` : `restando ${fmt(-xs.b)}`;
    const deshace = xs.b > 0 ? "restar" : "sumar";
    const accion = xs.b > 0 ? `sumar ${fmt(xs.b)}` : `restar ${fmt(-xs.b)}`;
    return `¡Vamos paso a paso con ${shown}!\n\nImagina que ${v} es una cajita misteriosa. Hoy a esa caja le están haciendo cosas: la están afectando ${verbo} y, además, ${Math.abs(xs.a) !== 1 ? `la multiplican por ${fmt(xs.a)}` : "está sola en su término"}.\n\nPara abrir la caja hay que deshacer lo que le hicieron, en orden inverso. Primero lo que se hizo al final.\n\n🤔 Pista: la operación contraria de ${accion} es ${deshace}. Recuerda hacerla en AMBOS lados para mantener el equilibrio.\n\n¿Qué ecuación te queda después de ese primer paso?`;
  }
  if (Math.abs(xs.a) !== 1) {
    return `¡Vamos con ${shown}! 🙂\n\nFíjate: ${v} está multiplicada por ${fmt(xs.a)} (3x significa 3 · x). Queremos dejar ${v} solita.\n\n🤔 Pregunta: ¿qué operación deshace una multiplicación? Hazla en AMBOS lados de la igualdad.\n\nAntes de calcular, ¿puedes estimar si el valor de ${v} será mayor o menor que el número del otro lado? Cuéntame tu idea y luego el resultado de tu paso.`;
  }
  return `En ${shown} la ${v} ya está sola de un lado 🙂. ¿Eso es lo que obtuviste al resolver un ejercicio, o quieres practicar? Si es una respuesta, dime cuál era el ejercicio y la comprobamos juntos.`;
}

function microHint(eq) {
  const info = linearInfo(eq);
  const shown = pretty(eq.left) + " = " + pretty(eq.right);
  if (!info)
    return `Vayamos más despacio con ${shown}. Dime solo esto: ¿qué es lo que queremos encontrar y qué datos tenemos? Con eso arrancamos.`;
  const xs = info.L.a !== 0 ? info.L : info.R;
  return pick([
    `Sin prisa, vamos más despacio con ${shown} 💙. Solo una cosa: mira el lado donde está ${info.v}. ¿Qué números o signos la acompañan? Dime lo que ves, aunque no estés seguro.`,
    `Tranquilo, es normal trabarse aquí. Olvidemos el resto y mira solo esto: ${xs.b !== 0 ? `junto a ${info.v} hay un ${xs.b > 0 ? "+" : ""}${fmt(xs.b)}. ¿Qué operación lo "cancelaría"?` : `${info.v} está multiplicada por ${fmt(xs.a)}. ¿Qué operación cancela una multiplicación?`}`,
  ]);
}

function fractionGuide(text) {
  const m = text.match(/(\d+)\s*\/\s*(\d+)\s*([+\-*x×÷:])\s*(\d+)\s*\/\s*(\d+)/i);
  if (!m) return null;
  const [, n1, d1, op, n2, d2] = m;
  const a = `${n1}/${d1}`, b = `${n2}/${d2}`;
  if (op === "+" || op === "-")
    return `Operación con fracciones: ${a} ${op} ${b}.\n\nSumar o restar fracciones solo se puede cuando tienen el MISMO denominador.\n\n🤔 ¿Los denominadores (${d1} y ${d2}) son iguales? Si no, busca un número que sea múltiplo de ambos. Dime cuál elegirías y cómo quedan las dos fracciones con ese denominador.`;
  if (op === "÷" || op === ":")
    return `Dividir fracciones: ${a} ÷ ${b}.\n\nHay un truco: dividir entre una fracción es multiplicar por su inversa (la "volteas").\n\n🤔 ¿Cuál es la inversa de ${b}? Escríbela y dime qué multiplicación te queda.`;
  return `Multiplicar fracciones: ${a} × ${b}.\n\nAquí es más fácil: se multiplican arriba con arriba y abajo con abajo.\n\n🤔 ¿Qué numerador y qué denominador obtienes? Después fíjate si se puede simplificar.`;
}

function percentGuide(text) {
  const m = text.match(/(\d+(?:[.,]\d+)?)\s*%\s*(?:de|of)?\s*(\d+(?:[.,]\d+)?)/i);
  if (!m) return null;
  const p = m[1], n = m[2];
  return `Porcentaje: ${p}% de ${n}.\n\n"Por ciento" significa "de cada 100". Un truco para calcular de cabeza:\n• El 10% de un número se obtiene dividiendo entre 10.\n• El 1% se obtiene dividiendo entre 100.\n\n🤔 ¿Cuánto es el 10% de ${n}? Con eso, piensa cuántos "10%" necesitas para llegar a ${p}%. Cuéntame tu razonamiento.`;
}

function arithmeticGuide(text) {
  const t = String(text).replace(/(\d)\s+x\s+(\d)/gi, "$1*$2").replace(/[×]/g, "*").replace(/[÷:]/g, "/");
  if (/\d\s*[+\-*/]\s*\d\s*[+\-*/]\s*\d/.test(t))
    return `Esa operación tiene varios pasos 🧩. Cuando hay varias operaciones importa el ORDEN:\n1) Paréntesis\n2) Potencias y raíces\n3) Multiplicaciones y divisiones (de izquierda a derecha)\n4) Sumas y restas (de izquierda a derecha)\n\n🤔 ¿Cuál operación harías primero? Dime cuál y cuánto te da, y seguimos juntos.`;
  const m = t.match(/(\d+(?:[.,]\d+)?)\s*([+\-*/^])\s*(\d+(?:[.,]\d+)?)/);
  if (!m) return null;
  const a = m[1], op = m[2], b = m[3];
  if (op === "+")
    return `Vamos a sumar ${a} + ${b} sin miedo 🙂.\n\nTruco: descomponer. Por ejemplo, separa ${b} en decenas y unidades (si ${b} fuera 37, sería 30 + 7).\n\n🤔 Primero suma ${a} con las decenas de ${b}. ¿Cuánto te da? Luego añade las unidades. Cuéntame cada paso.`;
  if (op === "-")
    return `Restar ${a} − ${b}.\n\nUna forma de pensarlo: ¿cuánto le falta a ${b} para llegar a ${a}? Puedes contar hacia arriba desde ${b}, primero hasta la decena cercana y luego hasta ${a}.\n\n🤔 ¿Cuál sería ese primer salto? Dime qué haces y qué obtienes.`;
  if (op === "*")
    return `Multiplicar ${a} × ${b} es lo mismo que sumar ${a} repetido ${b} veces, pero hay atajos.\n\nTruco: descompón uno de los números en decenas y unidades (por ejemplo, 12 = 10 + 2) y multiplica por partes.\n\n🤔 ¿Cómo descompondrías ${b}? Multiplica ${a} por cada parte y dime qué te queda antes de sumar.`;
  if (op === "/") {
    if (toNum(b) === 0)
      return `Una pregunta muy interesante 🤔: ${a} ÷ 0. Dividir es repartir en grupos iguales. ¿Qué crees que significa repartir ${a} cosas en 0 grupos? Piénsalo y dime tu idea; de ahí sale una regla muy importante en matemáticas.`;
    return `Dividir ${a} ÷ ${b} es preguntarse: ¿cuántas veces cabe ${b} dentro de ${a}?\n\nTruco: prueba con múltiplos de ${b} (${b}×2, ${b}×5, ${b}×10…) y busca el que se acerque a ${a} sin pasarse.\n\n🤔 ¿Cuál probarías primero? Cuéntame qué encuentras.`;
  }
  return `${a}^${b} significa multiplicar ${a} por sí mismo ${b} veces.\n\n🤔 Escribe esa multiplicación completa (sin calcularla todavía). ¿Cuántos ${a} hay? Luego avanza de dos en dos.`;
}

/* ───────────── Temas por palabras clave ───────────── */

const TOPICS = [
  { re: /sistema.*ecuacion|ecuaciones.*sistema|dos ecuaciones/, reply: () => `Un sistema de ecuaciones busca valores que cumplan TODAS las ecuaciones a la vez.\n\nHay tres métodos: sustitución, igualación y reducción (suma/resta).\n\n🤔 Mira tus ecuaciones: ¿hay alguna donde sea fácil despejar una letra? Si es así, sustitución es buen camino. Dime cuál despejarías y cómo queda.` },
  { re: /cuadratica|segundo grado|x\^2|x2\b|formula general|discriminante/, reply: () => `Una ecuación cuadrática tiene la forma ax² + bx + c = 0.\n\nTienes dos caminos: factorizar o usar la fórmula general.\n\n🤔 Primero identifica: ¿cuánto valen a, b y c en tu ecuación? Escríbelos y después decidimos qué camino conviene.` },
  { re: /factoriz/, reply: () => `Factorizar es escribir una expresión como una multiplicación.\n\nPrimera pregunta clave: ¿hay un número o una letra que se repita en TODOS los términos? A eso se le llama factor común.\n\n🤔 Mira tu expresión y dime qué ves repetido en todos los términos.` },
  { re: /derivad|derivar/, reply: () => `Derivar mide cómo cambia una función. Se hace con reglas.\n\n🤔 Primero dime: ¿qué forma tiene tu función? (una potencia como x³, un producto, un cociente, una raíz...). Según eso elegimos la regla. ¿Cuál crees que aplica?` },
  { re: /integral|integrar|antiderivad/, reply: () => `Integrar es "deshacer" una derivada.\n\n🤔 Para empezar: ¿qué función tienes dentro de la integral? Si es una potencia, piensa: ¿de qué función saldría esa expresión al derivarla? Cuéntame tu idea.` },
  { re: /pitagoras|hipotenusa|cateto/, reply: () => `El teorema de Pitágoras funciona solo en triángulos rectángulos (con un ángulo de 90°).\n\n🤔 Dibuja tu triángulo. ¿Cuál lado es la hipotenusa? (pista: es el que está frente al ángulo recto y es el más largo). ¿Qué lados conoces y cuál buscas?` },
  { re: /seno|coseno|tangente|trigonometr|sen\(|cos\(|tan\(/, reply: () => `En trigonometría con triángulos rectángulos se usan estas razones: seno = opuesto/hipotenusa, coseno = adyacente/hipotenusa, tangente = opuesto/adyacente.\n\n🤔 Dibuja el triángulo y marca el ángulo que te dan. ¿Qué lado conoces y cuál quieres encontrar (opuesto, adyacente o hipotenusa)?` },
  { re: /area|perimetro|volumen|triangulo|rectangulo|cuadrado|circulo|circunferencia|trapecio|cilindro|esfera|cubo|rombo/, reply: () => `¡Geometría! 📐 Vamos con orden:\n\n1) Dibuja la figura y escribe sobre ella los datos que te dan.\n2) Decide qué te piden: ¿área (cuánta superficie), perímetro (el contorno) o volumen (cuánto espacio ocupa)?\n3) Recuerda la fórmula que corresponde.\n\n🤔 Cuéntame: ¿qué figura es y qué medidas tienes? ¿Qué fórmula crees que sirve?` },
  { re: /angulo|grados|complementario|suplementario/, reply: () => `Con ángulos ayuda recordar esto: los ángulos de un triángulo suman 180°, los complementarios suman 90° y los suplementarios 180°.\n\n🤔 ¿Qué tipo de figura o relación hay en tu problema? Dime qué ángulos conoces y cuál buscas.` },
  { re: /probabilidad|azar|dado|moneda|baraja/, reply: () => `Probabilidad = casos favorables ÷ casos posibles.\n\n🤔 En tu problema: ¿cuántos resultados posibles hay en total? ¿Y cuántos de ellos son los que te piden? Escríbelos y armamos la fracción.` },
  { re: /promedio|media|mediana|moda|desviacion/, reply: () => `Los datos se resumen con medidas distintas: media (promedio), mediana (valor del centro) y moda (el que más se repite).\n\n🤔 ¿Cuál te piden? Si es el promedio: ¿qué dos cosas necesitas saber (la suma de los datos y cuántos datos hay)?` },
  { re: /regla de tres|proporcion|razon|directamente|inversamente/, reply: () => `En una proporción dos razones son iguales. Primero hay que decidir si es directa (si una sube, la otra sube) o inversa (si una sube, la otra baja).\n\n🤔 En tu problema, ¿qué pasa con una cantidad cuando aumenta la otra? Dime y armamos la proporción.` },
  { re: /porcentaje|descuento|interes|por ciento|%/, reply: () => `Porcentajes: "por ciento" = "de cada 100". El 10% se saca dividiendo entre 10 y el 1% dividiendo entre 100.\n\n🤔 ¿Qué cantidad es el 100% en tu problema (el total o precio original)? Dime los números y avanzamos juntos.` },
  { re: /raiz|raices|radical/, reply: () => `La raíz cuadrada pregunta: ¿qué número multiplicado por sí mismo da este número?\n\n🤔 Prueba con cuadrados que conozcas (4, 9, 16, 25, 36...). ¿Entre cuáles dos queda tu número? Dime qué encuentras.` },
  { re: /potencia|exponente|elevado/, reply: () => `Un exponente cuenta cuántas veces se multiplica la base por sí misma: 2³ = 2 × 2 × 2.\n\n🤔 ¿Cuál es la base y cuál el exponente en tu ejercicio? Escribe la multiplicación completa y dime qué sigue.` },
  { re: /mcd|mcm|minimo comun|maximo comun|divisor|multiplo|primo/, reply: () => `Para MCD y MCM lo primero es descomponer los números en factores primos.\n\n🤔 ¿Puedes descomponer tus números en primos? Empieza dividiendo entre 2, luego 3, luego 5... y dime cómo queda cada uno.` },
  { re: /fraccion|numerador|denominador|simplificar/, reply: () => `Las fracciones representan partes de un todo. El denominador dice en cuántas partes se divide y el numerador cuántas se toman.\n\n🤔 ¿Qué quieres hacer con tu fracción: sumarla, restarla, simplificarla...? Escríbeme el ejercicio completo y lo vemos.` },
  { re: /funcion|grafica|graficar|dominio|rango|pendiente/, reply: () => `Para entender una función puedes hacer una tabla de valores: eliges algunos valores de x y calculas la y.\n\n🤔 ¿Qué función tienes? Prueba con x = 0, 1 y 2 y cuéntame qué valores de y obtienes. Con eso vemos el patrón.` },
  { re: /ecuacion|despejar|incognita/, reply: () => `Resolver una ecuación es como una balanza ⚖️: lo que haces de un lado, lo haces del otro.\n\n🤔 Escríbeme tu ecuación completa (por ejemplo: 2x + 3 = 11) y empezamos a despejar paso a paso.` },
];

/* ───────────── Búsqueda de problemas previos (historial) ───────────── */

function evalSimple(text) {
  const t = String(text).replace(/(\d)\s+x\s+(\d)/gi, "$1*$2").replace(/[×]/g, "*").replace(/[÷:]/g, "/");
  if (/\d\s*[+\-*/]\s*\d\s*[+\-*/]\s*\d/.test(t)) return null;
  const m = t.match(/(\d+(?:[.,]\d+)?)\s*([+\-*/^])\s*(\d+(?:[.,]\d+)?)/);
  if (!m) return null;
  const a = toNum(m[1]), b = toNum(m[3]);
  switch (m[2]) {
    case "+": return a + b;
    case "-": return a - b;
    case "*": return a * b;
    case "/": return b === 0 ? null : a / b;
    case "^": return Math.pow(a, b);
    default: return null;
  }
}

function lastProblem(history) {
  for (let i = history.length - 1; i >= 0; i--) {
    if (!isUser(history[i])) continue;
    const t = textOf(history[i]);
    if (!t) continue;
    if (parseAttempt(t)) continue;
    const eq = extractEquation(t);
    if (eq) {
      const info = linearInfo(eq);
      if (info && info.sol !== null) return { kind: "linear", eq, info };
      if (info) return { kind: "linear", eq, info };
    }
    const val = evalSimple(t);
    if (val !== null && !/%/.test(t)) return { kind: "arith", text: t, value: val };
  }
  return null;
}

// ¿El mensaje es un intento de respuesta? (por ejemplo "x = 4" o "me dio 60")
function parseAttempt(text) {
  const t = strip(text);
  const m1 = t.match(/(?:respuesta es|me dio|me da|me sale|me salio|creo que (?:es|da|sale)|es igual a|el resultado es|resultado:?)\s*(-?\d+(?:[.,]\d+)?)\s*[.!]?\s*$/);
  if (m1) return { value: toNum(m1[1]), v: null };
  const eq = extractEquation(text);
  if (eq) {
    const L = parseSide(eq.left), R = parseSide(eq.right);
    if (L && R && L.v && L.a === 1 && L.b === 0 && !R.v)
      return { value: R.b, v: L.v };
  }
  return null;
}

/* ───────────── Motor principal ───────────── */

export function tutorRespond(message, history = []) {
  const raw = String(message ?? "").trim();
  const hist = Array.isArray(history) ? history : [];
  if (!raw)
    return "Escribe tu duda o problema y lo trabajamos juntos 🙂. Por ejemplo: ¿Cómo resuelvo 2x + 3 = 11?";
  if (raw.length > 1500)
    return "Tu mensaje es muy largo para que lo trabajemos bien 😅. Cuéntame solo la parte donde te trabaste y vamos paso a paso.";

  const s = strip(raw);

  // 1) Cortesías
  if (/^(gracias|muchas gracias|ok gracias|grac)\b|\bgracias\b/.test(s) && s.length < 60)
    return pick([
      "¡De nada! 💙 Lo hiciste muy bien porque razonaste tú mismo. ¿Quieres intentar otro ejercicio?",
      "¡Con gusto! Recuerda: lo importante no es la respuesta, sino cómo llegaste a ella. ¿Seguimos practicando?",
    ]);
  if (/^(adios|bye|chao|hasta luego|nos vemos)\b/.test(s))
    return "¡Hasta luego! 👋 Descansa y, cuando quieras, vuelve con otro problema. ¡Vas muy bien!";
  if (/^(hola|buenas|hey|que tal|buenos dias|buenas tardes|buenas noches|holi)\b/.test(s) && !/\d/.test(s) && s.length < 40)
    return "¡Hola! 👋 Soy Delf-IA, tu tutor de matemáticas. No te voy a dar las respuestas directas, pero sí te voy a guiar para que las encuentres tú. ¿Con qué problema empezamos?";

  // 2) ¿Es un intento de respuesta? Se comprueba, sin revelar la solución.
  const attempt = parseAttempt(raw);
  if (attempt) {
    const prev = lastProblem(hist);
    if (prev && prev.kind === "linear" && prev.info.sol !== null && (!attempt.v || attempt.v === prev.info.v)) {
      const ok = Math.abs(attempt.value - prev.info.sol) < 1e-9;
      if (ok)
        return pick([
          `¡Exacto! ✅ Lo resolviste tú. Para cerrar con broche de oro: sustituye tu valor en ${pretty(prev.eq.left)} = ${pretty(prev.eq.right)} y comprueba que ambos lados dan lo mismo.\n\nAhora cuéntame: ¿cuál fue el paso clave? ¿Quieres otro ejercicio un poco más difícil?`,
          `¡Muy bien! 🎉 Esa es. Lo importante es que sabes por qué. Explícame con tus palabras qué hiciste primero y por qué, y te propongo otro reto.`,
        ]);
      let pista = "";
      if (prev.info.a !== 1 && prev.info.a !== 0 && Math.abs(attempt.value - prev.info.c) < 1e-9)
        pista = "\n\n💡 Mira la ecuación otra vez: ¿ya quedó la letra completamente sola, o todavía tiene algún número pegado?";
      else if (Math.abs(Math.abs(attempt.value) - Math.abs(prev.info.sol)) < 1e-9)
        pista = "\n\n💡 Revisa con cuidado los signos en cada paso.";
      return `Todavía no 🙂, pero estás cerca de entenderlo. Equivocarse es parte de aprender.\n\nHagamos una comprobación: sustituye tu valor en la ecuación original (${pretty(prev.eq.left)} = ${pretty(prev.eq.right)}) y calcula cada lado. ¿Te da lo mismo de los dos lados?${pista}\n\nSi no coincide, cuéntame qué paso hiciste primero y lo revisamos juntos.`;
    }
    if (prev && prev.kind === "arith") {
      const ok = Math.abs(attempt.value - prev.value) < 1e-9;
      return ok
        ? "¡Correcto! ✅ Bien hecho. Cuéntame cómo lo pensaste (¿descompusiste, contaste, usaste algún truco?) y te propongo otro reto."
        : "Todavía no 🙂. No pasa nada. Vuelve a hacerlo por partes y dime el resultado de cada paso, así encontramos juntos dónde se cruzó algo.";
    }
    return `Veo que me das "${raw}" 🙂. Si es la respuesta a un ejercicio, dime cuál era el ejercicio y la comprobamos juntos. Y si quieres practicar, escríbeme un problema.`;
  }

  // 3) Detectar intención
  const wantsAnswer = /dame la respuesta|dime la respuesta|solo la respuesta|el resultado|cuanto (da|es|vale|sale)|resuelvelo|hazlo tu|dime cuanto|dame el resultado|dime el resultado|solo dime/.test(s);
  const confused = /no entiendo|no se\b|no puedo|no le entiendo|ayuda|ayudame|me confund|dificil|me trabo|estoy perdid|no me sale|no logro/.test(s);
  const prefix = wantsAnswer
    ? pick([
        "Entiendo que quieras ir directo al resultado 😊, pero mi trabajo es ayudarte a que TÚ lo descubras, ¡y vas a poder! Mira:\n\n",
        "No te voy a dar el resultado, pero te prometo que vas a llegar a él por tu cuenta y te vas a sentir genial 💪. Empecemos:\n\n",
      ])
    : "";

  // 4) Problema dentro del mensaje
  let guide = null;
  const eq = extractEquation(raw);
  if (eq) guide = linearGuide(eq);
  guide = guide || fractionGuide(raw) || percentGuide(raw) || arithmeticGuide(raw);
  if (guide) return prefix + guide;

  // 5) Temas por palabra clave
  const topic = TOPICS.find((t) => t.re.test(s));
  if (topic) return prefix + topic.reply();

  // 6) Confusión o petición de respuesta sobre el problema anterior
  if (confused || wantsAnswer) {
    const prev = lastProblem(hist);
    if (prev && prev.kind === "linear") return prefix + microHint(prev.eq);
    if (prev && prev.kind === "arith") return prefix + (arithmeticGuide(prev.text) || "");
    return pick([
      "Tranquilo, no pasa nada por no entender algo 💙. Todos aprendemos a nuestro ritmo. Cuéntame: ¿cuál es el problema o tema que se te dificulta? Escríbelo tal como te lo dieron y lo vamos desarmando en pasos pequeños.",
      "Gracias por decírmelo, eso ayuda mucho 🙂. Empecemos desde cero: escríbeme el ejercicio completo y dime qué parte es la que más te confunde (aunque sea 'todo'). Vamos con calma.",
    ]);
  }

  // 7) Problema de texto
  if (/\d/.test(raw) && raw.split(/\s+/).length >= 8)
    return `Los problemas de texto se resuelven mejor por pasos 🧩:\n\n1) Lee el problema y subraya qué te preguntan.\n2) Haz una lista con los datos que te dan.\n3) Decide qué operación o ecuación conecta esos datos.\n\n🤔 Empecemos por el paso 1: con tus palabras, ¿qué es lo que te piden encontrar? Y ¿cuáles son los datos importantes?`;

  // 8) Respuesta general
  return pick([
    "Soy tu tutor de matemáticas 🧮. Cuéntame el problema completo, tal como te lo dieron, y dime qué has intentado hasta ahora. ¿Qué parte es la que no te queda clara?",
    "Con gusto te ayudo, pero necesito entender mejor qué estás trabajando 🙂. ¿Me escribes el ejercicio o el tema (por ejemplo: ecuaciones, fracciones, geometría...) y qué has intentado?",
  ]);
}
