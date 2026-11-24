// lib/tutorRules.js
// Tutor socrático de matemáticas SIN IA externa: reglas + ramas de respuesta.
// Regla de oro: NUNCA devuelve el resultado. Guía con pistas y preguntas.

import { ACHIEVEMENTS, LEVEL_NAMES, makeExercise, pickExercise } from "./exercises";

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
  const exprX = extractExpr(text);
  const nOps = exprX ? (exprX.match(/[+\-*/^]/g) || []).length : 0;
  if (/\d\s*[+\-*/]\s*\d\s*[+\-*/]\s*\d/.test(t) || nOps >= 2 || (exprX && /[()]/.test(exprX)))
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

/* ───────────── Evaluador matemático seguro (sin eval) ───────────── */

const FUNCS = {
  sqrt: Math.sqrt,
  raiz: Math.sqrt,
  sin: (x) => Math.sin((x * Math.PI) / 180),
  sen: (x) => Math.sin((x * Math.PI) / 180),
  cos: (x) => Math.cos((x * Math.PI) / 180),
  tan: (x) => Math.tan((x * Math.PI) / 180),
  ln: Math.log,
  log: Math.log10,
};

// Evalúa una expresión: + - * / ^ paréntesis, pi, sqrt(), sin() cos() tan() en grados.
function safeEval(src) {
  const s = String(src).toLowerCase().replace(/\s+/g, "").replace(/,/g, ".");
  if (!s) return null;
  let i = 0;
  const fail = () => {
    throw new Error("parse");
  };
  function num() {
    const m = s.slice(i).match(/^(\d+\.?\d*|\.\d+)(e[+-]?\d+)?/);
    if (!m) return null;
    i += m[0].length;
    return parseFloat(m[0]);
  }
  function primary() {
    if (s[i] === "(") {
      i++;
      const v = expr();
      if (s[i] !== ")") fail();
      i++;
      return v;
    }
    if (s.startsWith("pi", i)) {
      i += 2;
      return Math.PI;
    }
    const f = s.slice(i).match(/^[a-z]+/);
    if (f) {
      const fn = FUNCS[f[0]];
      if (!fn) fail();
      i += f[0].length;
      if (s[i] !== "(") fail();
      i++;
      const v = expr();
      if (s[i] !== ")") fail();
      i++;
      return fn(v);
    }
    const v = num();
    if (v === null) fail();
    return v;
  }
  function unary() {
    if (s[i] === "-") {
      i++;
      return -unary();
    }
    if (s[i] === "+") {
      i++;
      return unary();
    }
    return power();
  }
  function power() {
    const base = primary();
    if (s[i] === "^") {
      i++;
      return Math.pow(base, unary());
    }
    return base;
  }
  function term() {
    let v = unary();
    while (s[i] === "*" || s[i] === "/") {
      const op = s[i++];
      const r = unary();
      v = op === "*" ? v * r : v / r;
    }
    return v;
  }
  function expr() {
    let v = term();
    while (s[i] === "+" || s[i] === "-") {
      const op = s[i++];
      const r = term();
      v = op === "+" ? v + r : v - r;
    }
    return v;
  }
  try {
    const v = expr();
    if (i !== s.length || !Number.isFinite(v)) return null;
    return v;
  } catch {
    return null;
  }
}

// Busca dentro de un texto una operación aritmética (con al menos un operador).
function extractExpr(text) {
  const t = String(text)
    .replace(/[×·]/g, "*")
    .replace(/[÷:]/g, "/")
    .replace(/²/g, "^2")
    .replace(/³/g, "^3")
    .replace(/(\d)\s+x\s+(\d)/gi, "$1*$2");
  const m = t.match(/(?:sqrt|raiz|sin|sen|cos|tan|ln|log)?[0-9(][0-9+\-*/^().,\s]*[0-9)]/gi);
  if (!m) return null;
  const cands = m
    .map((x) => x.trim())
    .filter((x) => /[0-9)]\s*[+\-*/^]\s*[0-9(]/.test(x) || /^(sqrt|raiz|sin|sen|cos|tan|ln|log)/i.test(x));
  if (!cands.length) return null;
  return cands.sort((a, b) => b.length - a.length)[0];
}

// Lee el número que el alumno dio como respuesta ("12", "x = 4", "I = 2 A", "3/4", "sqrt(2)").
function readNumber(text) {
  let t = String(text)
    .replace(/−/g, "-")
    .replace(/×/g, "*")
    .replace(/÷/g, "/")
    .replace(/π/gi, "pi")
    .replace(/√/g, "sqrt");
  if (t.includes("=")) t = t.slice(t.lastIndexOf("=") + 1);
  t = t.replace(/(\d),(\d)/g, "$1.$2");
  const keep = new Set(["sqrt", "raiz", "sin", "sen", "cos", "tan", "ln", "log", "pi"]);
  const stripped = t
    .replace(/[a-zA-ZáéíóúüñΩμ°%]+/g, (w) => (keep.has(w.toLowerCase()) ? w.toLowerCase() : " "))
    .trim();
  if (/[0-9)]\s*[+*/^]\s*[0-9(a-z]|[0-9)]\s*-\s*[0-9(a-z]|^(sqrt|sin|cos|tan|ln|log)/.test(stripped)) {
    const v = safeEval(stripped);
    if (v !== null) return v;
  }
  const nums = stripped.match(/-?\d+(?:\.\d+)?(?:e-?\d+)?/gi);
  if (!nums) return null;
  const v = parseFloat(nums[nums.length - 1]);
  return Number.isFinite(v) ? v : null;
}

/* ───────────── Polinomios de grado 2 (ecuaciones cuadráticas) ───────────── */

function parsePoly(str) {
  let s = String(str).replace(/\s+/g, "").toLowerCase().replace(/²/g, "^2").replace(/³/g, "^3").replace(/,/g, ".");
  if (!s || /[()/]/.test(s)) return null;
  const terms = s.match(/[+-]?[^+-]+/g);
  if (!terms || terms.join("") !== s) return null;
  const c = [0, 0, 0, 0];
  let v = null;
  for (const t of terms) {
    const m = t.match(/^([+-]?)(\d*\.?\d*)\*?(?:([a-z])(?:\^(\d))?)?$/);
    if (!m) return null;
    const [, sg, nn, vr, pw] = m;
    if (nn === "" && !vr) return null;
    const coef = (sg === "-" ? -1 : 1) * (nn === "" ? 1 : parseFloat(nn));
    if (Number.isNaN(coef)) return null;
    if (vr) {
      if (v && v !== vr) return null;
      v = vr;
      const p = pw ? parseInt(pw, 10) : 1;
      if (p > 3) return null;
      c[p] += coef;
    } else c[0] += coef;
  }
  return { c, v };
}

function quadInfo(eq) {
  const P = parsePoly(eq.left), Q = parsePoly(eq.right);
  if (!P || !Q) return null;
  const v = P.v || Q.v;
  if (!v || (P.v && Q.v && P.v !== Q.v)) return null;
  const c = P.c.map((x, i) => x - Q.c[i]);
  if (c[3] !== 0 || c[2] === 0) return null;
  const [c0, c1, a] = c;
  const disc = c1 * c1 - 4 * a * c0;
  let roots = [];
  if (disc === 0) roots = [-c1 / (2 * a)];
  else if (disc > 0) roots = [(-c1 - Math.sqrt(disc)) / (2 * a), (-c1 + Math.sqrt(disc)) / (2 * a)];
  return { v, a, b: c1, c: c0, disc, roots };
}

function quadGuide(eq) {
  const shown = pretty(eq.left) + " = " + pretty(eq.right);
  return `¡Una cuadrática! 🎯 ${shown}\n\nPlan de ataque:\n1) Pasa todo a un lado para que quede ax² + bx + c = 0.\n2) Identifica cuánto valen a, b y c (con su signo).\n3) Calcula el discriminante b² − 4ac: según su signo sabrás cuántas soluciones reales hay.\n4) Resuelve factorizando o con la fórmula general.\n\n🤔 Haz solo los pasos 1 y 2 y dime cuánto valen a, b y c.`;
}

/* ───────────── Búsqueda de problemas previos (historial) ───────────── */

function evalSimple(text) {
  const e = extractExpr(text);
  if (!e) return null;
  const v = safeEval(e);
  return v === null ? null : v;
}

function lastProblem(history) {
  const attempts = [];
  for (let i = history.length - 1; i >= 0; i--) {
    if (!isUser(history[i])) continue;
    const t = textOf(history[i]);
    if (!t) continue;
    const at = parseAttempt(t);
    if (at) {
      attempts.push(at.value);
      continue;
    }
    const eq = extractEquation(t);
    if (eq) {
      const info = linearInfo(eq);
      if (info) return { kind: "linear", eq, info, attempts };
      const q = quadInfo(eq);
      if (q) return { kind: "quad", eq, info: q, attempts };
    }
    const val = evalSimple(t);
    if (val !== null && !/%/.test(t)) return { kind: "arith", text: t, value: val, attempts };
  }
  return null;
}

// ¿El mensaje es un intento de respuesta? (por ejemplo "x = 4" o "me dio 60")
function parseAttempt(text) {
  const t = strip(text);
  const m1 = t.match(/(?:(?:la |mi )?respuesta(?: es)?\s*:?|me dio|me da|me sale|me salio|creo que (?:es|da|sale)|es igual a|el resultado es|resultado\s*:?)\s*(?:=\s*)?(-?\d+(?:[.,]\d+)?(?:\s*\/\s*\d+)?)(?:\s+[a-z]{1,12})?\s*[.!]?\s*$/);
  if (m1) {
    const val = m1[1].includes("/") ? safeEval(m1[1]) : toNum(m1[1]);
    if (val !== null && Number.isFinite(val)) return { value: val, v: null };
  }
  const eq = extractEquation(String(text).replace(/\b([a-z])\s*[₁₂12]\s*=/gi, "$1 ="));
  if (eq) {
    const L = parseSide(eq.left), R = parseSide(eq.right);
    if (L && R && L.v && L.a === 1 && L.b === 0 && !R.v) return { value: R.b, v: L.v };
    if (/^[a-z]$/i.test(eq.left)) {
      const val = safeEval(eq.right);
      if (val !== null) return { value: val, v: eq.left.toLowerCase() };
    }
  }
  return null;
}

/* ───────────── Ejercicios que se presentan solos + logros ───────────── */

const EX_MARK = /\[\[ej:([a-z0-9_]+):(\d+)\]\]/g;
const OK_MARK = /\[\[ok:(\d)\]\]/g;

function findPending(hist) {
  for (let i = hist.length - 1; i >= 0; i--) {
    if (isUser(hist[i])) continue;
    const t = textOf(hist[i]);
    const ms = [...t.matchAll(EX_MARK)];
    if (!ms.length) return null;
    const m = ms[ms.length - 1];
    const attempts = hist.slice(i + 1).filter(isUser).length;
    return { id: m[1], seed: parseInt(m[2], 10), attempts };
  }
  return null;
}

function recentIds(hist) {
  const ids = [];
  for (const h of hist.slice(-12)) {
    if (isUser(h)) continue;
    for (const m of textOf(h).matchAll(EX_MARK)) ids.push(m[1]);
  }
  return ids;
}

function userLevel(hist) {
  let best = 0;
  for (const h of hist) {
    if (isUser(h)) continue;
    for (const m of textOf(h).matchAll(OK_MARK)) best = Math.max(best, parseInt(m[1], 10));
  }
  return Math.max(1, Math.min(5, best || 1));
}

function exerciseBlock(level, hist, intro) {
  const { id, seed } = pickExercise(level, recentIds(hist));
  const ex = makeExercise(id, seed);
  return `${intro}\n\n**Ejercicio · nivel ${level}/5 (${LEVEL_NAMES[level]})**\n\n${ex.text}\n\n🤔 Piensa cómo plantearlo y mándame tu resultado. Si te trabas, escribe «pista» y te guío paso a paso, sin darte la respuesta.[[ej:${id}:${seed}]]`;
}

function award(ctx, level) {
  const a = ACHIEVEMENTS[level];
  ctx.bonusXp = a.xp;
  ctx.achievement = { level, name: a.name, icon: a.icon, xp: a.xp };
  return `🏆 **¡Logro desbloqueado: ${a.icon} ${a.name}!** (nivel ${level}/5)\n\n_${a.desc}_\n\n⭐ **+${a.xp} XP** de bonificación[[ok:${level}]]`;
}

function cheer(level) {
  if (level >= 4) return pick(["¡ESPECTACULAR! 🎉🔥", "¡Increíble, eso estuvo muy difícil y lo lograste! 🎉", "¡Nivel ingeniero! 👏🔥"]);
  if (level === 3) return pick(["¡Excelente trabajo! 🎉", "¡Muy bien, eso no era fácil! 👏"]);
  return pick(["¡Correcto! ✅ ¡Muy bien!", "¡Eso es! ✅ Buen trabajo.", "¡Exacto! 🎯"]);
}

// Felicita, da el logro y presenta solo el siguiente ejercicio (un nivel más difícil).
function celebrate(ctx, level, hist, headline) {
  const next = Math.min(5, level + 1);
  const intro = level >= 5 ? "Y como ya dominas el nivel máximo, aquí va otro reto experto:" : `Sigamos, aquí tienes un reto de **nivel ${next}**:`;
  return `${cheer(level)} ${headline}\n\n${award(ctx, level)}\n\nAntes de seguir, cuéntame en una frase: ¿cuál fue el paso clave para resolverlo?\n\n${exerciseBlock(next, hist, intro)}`;
}

function gradeExercise(ex, val, attempts) {
  const tol = Math.max(ex.tol * Math.abs(ex.answer), 0.005);
  if (Math.abs(val - ex.answer) <= tol) return { ok: true };
  const rel = Math.abs(val - ex.answer) / Math.max(Math.abs(ex.answer), 1e-9);
  const scaled = [1000, 100, 10].some((k) => Math.abs(val * k - ex.answer) <= tol || Math.abs(val / k - ex.answer) <= tol);
  return { ok: false, close: rel < 0.1, scaled, signFlip: Math.abs(val + ex.answer) <= tol, attempts };
}

function pendingReply(ctx, hist, raw, pending, extraPrefix = "") {
  const ex = makeExercise(pending.id, pending.seed);
  if (!ex) return null;
  const s = strip(raw);
  const mark = `[[ej:${pending.id}:${pending.seed}]]`;
  const idx = Math.min(pending.attempts, 2);
  const hint = `💡 **Pista:** ${ex.hints[idx]}`;
  const exit = pending.attempts >= 2 ? "\n\nSi prefieres cambiar de ejercicio, escribe «otro»." : "";

  const wantsAnswer = /dame la respuesta|dime la respuesta|solo la respuesta|el resultado|resuelvelo|hazlo tu|dime cuanto|dame el resultado|dime el resultado|solo dime|cuanto (da|es|vale|sale)/.test(s);
  const wantsHint = /pista|no entiendo|no se\b|no puedo|ayuda|ayudame|me confund|dificil|me trabo|estoy perdid|no me sale|no logro|como (lo )?(hago|resuelvo|empiezo)|explica/.test(s);
  const looksLikeAnswer = (() => {
    if (/[?¿]/.test(raw) || raw.length > 60) return false;
    if (/^(como|cuanto|calcula|resuelve|que|cual|ayuda|explica)/.test(s)) return false;
    if (raw.includes("=")) return /^\s*(?:[a-zA-ZΩω_₀-₉0-9]{1,6}|la respuesta|mi respuesta|respuesta|resultado|rta)\s*=/i.test(raw);
    return true;
  })();
  const val = readNumber(raw);

  if (wantsAnswer)
    return `${extraPrefix}Entiendo las ganas de ir directo al resultado 😊, pero mi trabajo es que TÚ lo descubras, ¡y vas a poder!\n\n${hint}${exit}${mark}`;
  if (wantsHint && !(val !== null && looksLikeAnswer && /\d/.test(raw) && raw.length < 25))
    return `${extraPrefix}Sin prisa, vamos paso a paso 💙\n\n${hint}\n\nCuando tengas tu resultado, mándamelo.${exit}${mark}`;
  if (val !== null && looksLikeAnswer && /\d/.test(raw)) {
    const g = gradeExercise(ex, val, pending.attempts);
    if (g.ok) {
      return celebrate(ctx, ex.level, hist, `Resolviste el ejercicio de **${ex.topic}**.`);
    }
    let lead = "Todavía no 🙂, pero sigue intentándolo: equivocarse es parte de aprender.";
    if (g.scaled) lead = "Casi 👀: el procedimiento parece ir bien, pero revisa las **unidades** o dónde pusiste el punto decimal.";
    else if (g.signFlip) lead = "Revisa el **signo** de tu resultado 🧐.";
    else if (g.close) lead = "¡Vas muy cerca! 👏 Revisa con calma tus cuentas (redondeos o algún dato).";
    return `${lead}\n\n${hint}\n\nCorrígelo y mándame tu nuevo resultado.${exit}${mark}`;
  }
  return null; // no parece respuesta ni pista: se atiende como un problema nuevo
}

/* ───────────── Motor principal ───────────── */

function core(message, history, ctx) {
  const raw = String(message ?? "").trim();
  const hist = Array.isArray(history) ? history : [];
  if (!raw)
    return "Escribe tu duda o ejercicio y lo trabajamos juntos 🙂. Por ejemplo: ¿Cómo resuelvo 2x + 3 = 11? O escribe «ejercicio» y te pongo uno de mecatrónica.";
  if (raw.length > 1500)
    return "Tu mensaje es muy largo para que lo trabajemos bien 😅. Cuéntame solo la parte donde te trabaste y vamos paso a paso.";

  const s = strip(raw);
  const pending = findPending(hist);
  const level = userLevel(hist);

  // 0) Piden un ejercicio nuevo
  if (!/\d/.test(raw) && raw.length < 60 && /\b(otro|otra|siguiente|nuevo|ejercicio|ejercicios|reto|practicar|practica|ponme|dame uno|problema)\b/.test(s)) {
    const lvl = pending ? makeExercise(pending.id, pending.seed)?.level || level : level;
    const intro = pending ? "Sin problema, cambiamos de reto 🔄" : "¡Va! Practicar es la mejor forma de aprender 💪";
    return exerciseBlock(lvl, hist, intro);
  }

  // 1) Cortesías (y el siguiente ejercicio se presenta solo)
  if (/^(gracias|muchas gracias|ok gracias|grac)\b|\bgracias\b/.test(s) && s.length < 60)
    return exerciseBlock(level, hist, pick(["¡De nada! 💙 Lo importante es que razonaste tú mismo.", "¡Con gusto! Recuerda: no importa la respuesta, sino cómo llegaste a ella."]) + " Para seguir practicando:");
  if (/^(adios|bye|chao|hasta luego|nos vemos)\b/.test(s))
    return "¡Hasta luego! 👋 Descansa y, cuando quieras, vuelve con otro problema. ¡Vas muy bien!";
  if (/^(hola|buenas|hey|que tal|buenos dias|buenas tardes|buenas noches|holi)\b/.test(s) && !/\d/.test(s) && s.length < 40) {
    if (pending) {
      const ex = makeExercise(pending.id, pending.seed);
      if (ex)
        return `¡Hola de nuevo! 👋 Te quedó un ejercicio pendiente:\n\n${ex.text}\n\nMándame tu resultado, o escribe «pista» o «otro».[[ej:${pending.id}:${pending.seed}]]`;
    }
    return exerciseBlock(level, hist, "¡Hola! 👋 Soy **Delf-IA**, tu tutor de matemáticas para mecatrónica y electromecánica. No te doy las respuestas directas: te guío para que las encuentres tú, y por cada ejercicio correcto ganas **logros** y XP.\n\n📌 **Cómo usarme:** responde con «La respuesta es: …», escribe «pista» si te trabas y «otro» para cambiar de ejercicio.\n\nEmpecemos con uno:");
  }

  // 2) Respuesta a un ejercicio que el tutor presentó
  if (pending) {
    const r = pendingReply(ctx, hist, raw, pending);
    if (r) return r;
  }

  // 3) ¿Es un intento de respuesta a un problema que escribió el alumno?
  const attempt = parseAttempt(raw);
  if (attempt) {
    const prev = lastProblem(hist);
    if (prev && prev.kind === "linear" && prev.info.sol !== null && (!attempt.v || attempt.v === prev.info.v)) {
      const ok = Math.abs(attempt.value - prev.info.sol) < 1e-9;
      if (ok) {
        const xs = prev.info.L.a !== 0 ? prev.info.L : prev.info.R;
        let lvl = 1;
        if (prev.info.L.a !== 0 && prev.info.R.a !== 0) lvl += 1;
        if (xs.b !== 0 && Math.abs(xs.a) !== 1) lvl += 1;
        return `${cheer(lvl)} Lo resolviste tú. Para cerrar con broche de oro: sustituye tu valor en ${pretty(prev.eq.left)} = ${pretty(prev.eq.right)} y comprueba que ambos lados dan lo mismo.\n\n${award(ctx, lvl)}\n\n${exerciseBlock(Math.min(5, lvl + 1), hist, "Sigamos practicando con un reto de mecatrónica:")}`;
      }
      let pista = "";
      if (prev.info.a !== 1 && prev.info.a !== 0 && Math.abs(attempt.value - prev.info.c) < 1e-9)
        pista = "\n\n💡 Mira la ecuación otra vez: ¿ya quedó la letra completamente sola, o todavía tiene algún número pegado?";
      else if (Math.abs(Math.abs(attempt.value) - Math.abs(prev.info.sol)) < 1e-9)
        pista = "\n\n💡 Revisa con cuidado los signos en cada paso.";
      return `Todavía no 🙂, pero estás cerca de entenderlo. Equivocarse es parte de aprender.\n\nHagamos una comprobación: sustituye tu valor en la ecuación original (${pretty(prev.eq.left)} = ${pretty(prev.eq.right)}) y calcula cada lado. ¿Te da lo mismo de los dos lados?${pista}\n\nSi no coincide, cuéntame qué paso hiciste primero y lo revisamos juntos.`;
    }
    if (prev && prev.kind === "quad" && (!attempt.v || attempt.v === prev.info.v)) {
      const q = prev.info;
      const hit = q.roots.findIndex((r) => Math.abs(r - attempt.value) < 1e-6);
      if (hit >= 0) {
        const others = q.roots.filter((_, i) => i !== hit);
        const gaveOther = others.length === 0 || others.every((o) => prev.attempts.some((a) => Math.abs(a - o) < 1e-6));
        if (gaveOther)
          return `${cheer(3)} Encontraste ${q.roots.length === 2 ? "las dos raíces" : "la raíz"}.\n\nPara cerrar: sustituye cada una en la ecuación original y verifica que da 0.\n\n${award(ctx, 3)}\n\n${exerciseBlock(4, hist, "Subamos la dificultad, aquí tienes un reto de **nivel 4**:")}`;
        return `¡Esa es una raíz! ✅ Pero una cuadrática puede tener **dos** soluciones.\n\n🤔 ¿Cuál es la otra? Pista: si ya factorizaste, cada paréntesis te da una; si usaste la fórmula general, piensa en el ± .`;
      }
      return `Todavía no 🙂. Comprueba: sustituye tu valor en la ecuación original, ¿se vuelve 0?\n\n💡 Revisa primero el **discriminante** b² − 4ac: te dice cuántas soluciones reales hay. Si no te sale cuadrado perfecto, usa la fórmula general con calma.`;
    }
    if (prev && prev.kind === "arith") {
      const ok = Math.abs(attempt.value - prev.value) < 1e-9 || Math.abs(attempt.value - prev.value) <= Math.abs(prev.value) * 1e-4;
      if (ok) {
        const ops = (prev.text.match(/[+\-*/^×÷]/g) || []).length;
        const lvl = ops >= 3 ? 3 : ops === 2 ? 2 : 1;
        return `${cheer(lvl)} Cuéntame cómo lo pensaste (¿descompusiste, contaste, usaste algún truco?).\n\n${award(ctx, lvl)}\n\n${exerciseBlock(Math.min(5, lvl + 1), hist, "Aquí va el siguiente reto, aplicado a mecatrónica:")}`;
      }
      return "Todavía no 🙂. No pasa nada. Vuelve a hacerlo por partes y dime el resultado de cada paso, así encontramos juntos dónde se cruzó algo.";
    }
    return `Veo que me das "${raw}" 🙂. Si es la respuesta a un ejercicio, dime cuál era el ejercicio y la comprobamos juntos. Y si quieres practicar, escribe «ejercicio».`;
  }

  // 4) Detectar intención
  const wantsAnswer = /dame la respuesta|dime la respuesta|solo la respuesta|el resultado|cuanto (da|es|vale|sale)|resuelvelo|hazlo tu|dime cuanto|dame el resultado|dime el resultado|solo dime/.test(s);
  const confused = /no entiendo|no se\b|no puedo|no le entiendo|ayuda|ayudame|me confund|dificil|me trabo|estoy perdid|no me sale|no logro/.test(s);
  const prefix = wantsAnswer
    ? pick([
        "Entiendo que quieras ir directo al resultado 😊, pero mi trabajo es ayudarte a que TÚ lo descubras, ¡y vas a poder! Mira:\n\n",
        "No te voy a dar el resultado, pero te prometo que vas a llegar a él por tu cuenta y te vas a sentir genial 💪. Empecemos:\n\n",
      ])
    : "";

  // 5) Problema dentro del mensaje
  let guide = null;
  const eq = extractEquation(raw);
  if (eq) guide = quadInfo(eq) ? quadGuide(eq) : linearGuide(eq);
  guide = guide || fractionGuide(raw) || percentGuide(raw) || arithmeticGuide(raw);
  if (guide) return prefix + guide;

  // 6) Temas por palabra clave
  const topic = TOPICS.find((t) => t.re.test(s));
  if (topic) return prefix + topic.reply();

  // 7) Confusión o petición de respuesta sobre el problema anterior
  if (confused || wantsAnswer) {
    const prev = lastProblem(hist);
    if (prev && prev.kind === "linear") return prefix + microHint(prev.eq);
    if (prev && prev.kind === "quad") return prefix + quadGuide(prev.eq);
    if (prev && prev.kind === "arith") return prefix + (arithmeticGuide(prev.text) || "");
    return pick([
      "Tranquilo, no pasa nada por no entender algo 💙. Todos aprendemos a nuestro ritmo. Cuéntame: ¿cuál es el problema o tema que se te dificulta? Escríbelo tal como te lo dieron y lo vamos desarmando en pasos pequeños. O escribe «ejercicio» y empezamos con uno sencillo.",
      "Gracias por decírmelo, eso ayuda mucho 🙂. Empecemos desde cero: escríbeme el ejercicio completo, o escribe «ejercicio» y te pongo uno básico para entrar en calor.",
    ]);
  }

  // 8) Problema de texto
  if (/\d/.test(raw) && raw.split(/\s+/).length >= 8)
    return `Los problemas de texto se resuelven mejor por pasos 🧩:\n\n1) Lee el problema y subraya qué te preguntan.\n2) Haz una lista con los datos que te dan (con sus unidades).\n3) Decide qué fórmula o ecuación conecta esos datos.\n\n🤔 Empecemos por el paso 1: con tus palabras, ¿qué es lo que te piden encontrar? Y ¿cuáles son los datos importantes?`;

  // 9) Respuesta general: se presenta un ejercicio solo
  return exerciseBlock(level, hist, "No estoy seguro de qué quieres trabajar 🤔. Cuéntame tu ejercicio completo y qué has intentado, o mientras tanto, practica con este:");
}

// Devuelve la respuesta junto con el logro y el XP extra (si el alumno acertó).
export function tutorRespondFull(message, history = []) {
  const ctx = { bonusXp: 0, achievement: null };
  const reply = core(message, history, ctx);
  return { reply, bonusXp: ctx.bonusXp, achievement: ctx.achievement };
}

export function tutorRespond(message, history = []) {
  return tutorRespondFull(message, history).reply;
}
