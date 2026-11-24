// lib/exercises.js
// Banco de ejercicios de matemáticas aplicadas a MECATRÓNICA y ELECTROMECÁNICA.
// Cada ejercicio se genera con números aleatorios a partir de una semilla (seed),
// así el servidor puede volver a calcular la respuesta sin guardarla en ningún lado.
// Niveles: 1 (simple) … 5 (complicado). Entre más difícil, mejor el logro.

import { EXTRA } from "./exercises2";

export function rngFrom(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pk = (r, arr) => arr[Math.floor(r() * arr.length)];
const ri = (r, a, b) => a + Math.floor(r() * (b - a + 1));
const n = (x) => String(Number(Number(x).toFixed(4)));
const PI = 3.1416;
const SQ3 = 1.732;

// Polinomio "a t³ + b t² + c t" escrito bonito (omite términos en 0 o coeficiente 1)
function term(coef, v, pow) {
  if (!coef) return "";
  const c = coef === 1 && pow > 0 ? "" : String(coef);
  const p = pow === 0 ? "" : pow === 1 ? v : v + (pow === 2 ? "²" : "³");
  return c + p;
}
function poly(terms) {
  return terms
    .filter(Boolean)
    .join(" + ")
    .replace(/\+ -/g, "- ");
}

export const ACHIEVEMENTS = {
  1: { icon: "⚡", name: "Chispa", xp: 10, desc: "¡Cerraste tu primer circuito! Lo básico ya es tuyo." },
  2: { icon: "⚙️", name: "Engrane", xp: 20, desc: "Ya haces girar las ideas: todo encaja, diente con diente." },
  3: { icon: "🤖", name: "Servo", xp: 35, desc: "Control preciso: resolviste un problema de nivel intermedio." },
  4: { icon: "📡", name: "Ingeniero de Sensores", xp: 50, desc: "Esto ya es de ingeniería de verdad. ¡Qué nivel!" },
  5: { icon: "🏆", name: "Maestro Mecatrónico", xp: 80, desc: "Cálculo, circuitos y dinámica dominados. ¡Eres de élite!" },
};
export const LEVEL_NAMES = { 1: "básico", 2: "fácil", 3: "intermedio", 4: "avanzado", 5: "experto" };

const BASE = [
  /* ───────── Nivel 1 ───────── */
  {
    id: "ohm_v", level: 1, topic: "Ley de Ohm",
    gen(r) {
      const R = pk(r, [10, 20, 47, 100, 220]), I = pk(r, [0.5, 1, 2, 3]);
      return {
        text: `🔌 **Ley de Ohm.** Por un resistor de ${R} Ω circula una corriente de ${I} A. ¿Cuál es el voltaje entre sus terminales? (responde en volts)`,
        answer: R * I,
        hints: [
          "Piensa en la ley de Ohm: relaciona voltaje (V), corriente (I) y resistencia (R). ¿Recuerdas la fórmula?",
          "Es V = I · R. Identifica cuáles son tus datos y qué te piden.",
          "Sustituye I y R en la fórmula y multiplica. Verifica que el resultado esté en volts.",
        ],
      };
    },
  },
  {
    id: "serie", level: 1, topic: "Resistencias en serie",
    gen(r) {
      const a = pk(r, [10, 15, 22, 47]), b = pk(r, [33, 56, 68, 100]), c = pk(r, [100, 120, 150, 220]);
      return {
        text: `🔗 **Resistencias en serie.** Tres resistores de ${a} Ω, ${b} Ω y ${c} Ω están conectados en serie. ¿Cuál es la resistencia total? (en ohms)`,
        answer: a + b + c,
        hints: [
          "En un circuito en serie, la corriente pasa por todos los resistores uno tras otro. ¿Cómo crees que se combinan sus resistencias?",
          "En serie las resistencias simplemente se suman: R_total = R₁ + R₂ + R₃.",
          "Suma las tres de dos en dos para no equivocarte: primero R₁ + R₂ y luego le sumas R₃.",
        ],
      };
    },
  },
  {
    id: "mm_m", level: 1, topic: "Conversión de unidades",
    gen(r) {
      const mm = pk(r, [250, 40, 1500, 75, 600, 3200]);
      return {
        text: `📏 **Unidades.** Un sensor de proximidad detecta objetos a ${mm} mm. ¿A cuántos metros equivale?`,
        answer: mm / 1000,
        hints: [
          "¿Cuántos milímetros hay en 1 metro?",
          "1 m = 1000 mm. Para pasar de milímetros a metros, ¿multiplicas o divides entre 1000?",
          "Divide los milímetros entre 1000: es mover el punto decimal tres lugares a la izquierda.",
        ],
      };
    },
  },
  {
    id: "potencia", level: 1, topic: "Potencia eléctrica",
    gen(r) {
      const V = pk(r, [12, 24, 48]), I = pk(r, [2, 5, 10]);
      return {
        text: `⚡ **Potencia.** Un motor de CD trabaja a ${V} V y consume ${I} A. ¿Qué potencia eléctrica usa? (en watts)`,
        answer: V * I,
        hints: [
          "La potencia eléctrica depende del voltaje y de la corriente. ¿Qué fórmula las relaciona?",
          "P = V · I. ¿Cuáles son tus valores de V y de I?",
          "Multiplica el voltaje por la corriente. El resultado queda en watts.",
        ],
      };
    },
  },
  {
    id: "cal_lineal", level: 1, topic: "Ecuación lineal (calibración)",
    gen(r) {
      const a = pk(r, [2, 3, 4, 5]), b = pk(r, [2, 4, 5, 10]), x0 = ri(r, 2, 9);
      return {
        text: `📟 **Calibración.** La lectura de un sensor sigue la relación y = ${a}x + ${b}. Si el sensor marca y = ${a * x0 + b}, ¿cuánto vale x?`,
        answer: x0,
        hints: [
          `Tienes ${a * x0 + b} = ${a}x + ${b}. Queremos dejar la x sola: ¿qué es lo que le estorba primero, la suma o la multiplicación?`,
          `Deshaz primero la suma: resta ${b} en AMBOS lados. ¿Qué te queda?`,
          `Ahora x está multiplicada por ${a}. ¿Qué operación contraria usas para dejarla sola?`,
        ],
      };
    },
  },
  {
    id: "rel_trans", level: 1, topic: "Transmisión por engranes",
    gen(r) {
      const z1 = pk(r, [10, 12, 15, 20]), k = pk(r, [2, 3, 4, 5]);
      return {
        text: `⚙️ **Engranes.** El engrane motriz tiene ${z1} dientes y el conducido tiene ${z1 * k}. ¿Cuál es la relación de transmisión i = dientes conducido ÷ dientes motriz?`,
        answer: k,
        hints: [
          "La relación de transmisión compara el número de dientes de los dos engranes.",
          "i = dientes del conducido ÷ dientes del motriz. ¿Cuál es cada uno?",
          "Haz la división. Si no sale de golpe, piensa: ¿cuántas veces cabe el motriz en el conducido?",
        ],
      };
    },
  },

  /* ───────── Nivel 2 ───────── */
  {
    id: "torque", level: 2, topic: "Torque",
    gen(r) {
      const F = pk(r, [50, 80, 120, 200]), d = pk(r, [0.2, 0.25, 0.5]);
      return {
        text: `🔧 **Torque.** Se aplica una fuerza de ${F} N, perpendicular, al extremo de una llave de ${d} m de largo. ¿Qué torque produce? (en N·m)`,
        answer: F * d,
        hints: [
          "El torque mide qué tanto una fuerza hace girar algo. Depende de la fuerza y de la distancia al eje.",
          "τ = F · d (cuando la fuerza es perpendicular al brazo).",
          "Multiplica la fuerza por la longitud de la llave. Cuida los decimales.",
        ],
      };
    },
  },
  {
    id: "rpm_rads", level: 2, topic: "Velocidad angular",
    gen(r) {
      const rpm = pk(r, [300, 600, 900, 1200, 1500]);
      return {
        text: `🌀 **Velocidad angular.** Un motor gira a ${rpm} rpm. ¿Cuál es su velocidad angular en rad/s? (usa π ≈ 3.1416)`,
        answer: (rpm * 2 * PI) / 60,
        hints: [
          "Una vuelta completa son 2π radianes, y un minuto tiene 60 segundos.",
          "ω = rpm · 2π ÷ 60. Primero convierte las revoluciones a radianes.",
          "Multiplica las rpm por 2π y luego divide entre 60. Redondea a dos decimales.",
        ],
      };
    },
  },
  {
    id: "paralelo", level: 2, topic: "Resistencias en paralelo",
    gen(r) {
      const [a, b] = pk(r, [[20, 20], [30, 60], [12, 6], [40, 40], [100, 100], [60, 30], [15, 10]]);
      return {
        text: `🔌 **Paralelo.** Dos resistores de ${a} Ω y ${b} Ω se conectan en paralelo. ¿Cuál es la resistencia equivalente? (en ohms)`,
        answer: (a * b) / (a + b),
        hints: [
          "En paralelo la corriente se reparte, así que la resistencia total es MENOR que la más pequeña. Úsalo para revisar tu resultado.",
          "Para dos resistores: R_eq = (R₁ · R₂) ÷ (R₁ + R₂).",
          "Calcula primero el producto, luego la suma, y al final divide. ¿Es menor que ambos? Entonces va bien.",
        ],
      };
    },
  },
  {
    id: "divisor", level: 2, topic: "Divisor de voltaje",
    gen(r) {
      const Vin = pk(r, [12, 24, 10]), R2 = pk(r, [100, 200]), R1 = pk(r, [100, 300]);
      return {
        text: `📟 **Divisor de voltaje.** Vin = ${Vin} V, R₁ = ${R1} Ω y R₂ = ${R2} Ω (en serie, y Vout se mide en R₂). ¿Cuánto vale Vout? (en volts)`,
        answer: (Vin * R2) / (R1 + R2),
        hints: [
          "En un divisor, el voltaje se reparte en proporción a las resistencias.",
          "Vout = Vin · R₂ ÷ (R₁ + R₂).",
          "Suma primero R₁ + R₂, luego multiplica Vin por R₂ y divide entre esa suma.",
        ],
      };
    },
  },
  {
    id: "eficiencia", level: 2, topic: "Porcentajes (eficiencia)",
    gen(r) {
      const Pin = pk(r, [500, 800, 1000, 1500]), eff = pk(r, [80, 85, 90, 75]);
      return {
        text: `📈 **Eficiencia.** Un motor consume ${Pin} W de la red y entrega ${(Pin * eff) / 100} W en la flecha. ¿Cuál es su eficiencia en %?`,
        answer: eff,
        hints: [
          "La eficiencia compara lo que SALE útil contra lo que ENTRA.",
          "η = (P_salida ÷ P_entrada) · 100.",
          "Divide la potencia de salida entre la de entrada y multiplica por 100.",
        ],
      };
    },
  },
  {
    id: "lineal_ambos", level: 2, topic: "Ecuación con x en ambos lados",
    gen(r) {
      const x0 = ri(r, 4, 9), diff = ri(r, 2, 4), c = ri(r, 1, 4), a = c + diff, d = ri(r, 1, 5);
      const b = diff * x0 - d;
      return {
        text: `🧮 **Balance de señales.** Resuelve ${a}x − ${b} = ${c}x + ${d}. ¿Cuánto vale x?`,
        answer: x0,
        hints: [
          "Queremos juntar todas las x de un lado y los números del otro. ¿Qué término con x moverías primero?",
          `Resta ${c}x en ambos lados. Luego suma ${b} en ambos lados. ¿Cómo queda?`,
          "Al final x queda multiplicada por un número: divide ambos lados entre ese número.",
        ],
      };
    },
  },

  /* ───────── Nivel 3 ───────── */
  {
    id: "trig_brazo", level: 3, topic: "Trigonometría (brazo robótico)",
    gen(r) {
      const L = pk(r, [20, 40, 60, 80]);
      const horizontal = r() < 0.5;
      return horizontal
        ? {
            text: `🤖 **Brazo robótico.** Un brazo de ${L} cm forma un ángulo de 60° con la horizontal. ¿Cuál es su alcance horizontal? (en cm; cos 60° = 0.5)`,
            answer: L * 0.5,
            hints: [
              "Dibuja el brazo como la hipotenusa de un triángulo rectángulo. El alcance horizontal es el cateto pegado al ángulo.",
              "Cateto adyacente = hipotenusa · cos(ángulo).",
              "Multiplica la longitud del brazo por cos 60°.",
            ],
          }
        : {
            text: `🤖 **Brazo robótico.** Un brazo de ${L} cm forma un ángulo de 30° con la horizontal. ¿A qué altura queda su punta? (en cm; sen 30° = 0.5)`,
            answer: L * 0.5,
            hints: [
              "Dibuja el brazo como la hipotenusa de un triángulo rectángulo. La altura es el cateto opuesto al ángulo.",
              "Cateto opuesto = hipotenusa · sen(ángulo).",
              "Multiplica la longitud del brazo por sen 30°.",
            ],
          };
    },
  },
  {
    id: "pitagoras", level: 3, topic: "Teorema de Pitágoras",
    gen(r) {
      const k = pk(r, [2, 3, 5, 10]);
      return {
        text: `📐 **Cable tensado.** Un cable va desde la base de un poste hasta un punto a ${3 * k} cm de altura y a ${4 * k} cm de distancia horizontal. ¿Cuánto mide el cable? (en cm)`,
        answer: 5 * k,
        hints: [
          "Haz un dibujo: la altura y la distancia horizontal forman un ángulo recto. ¿Qué lado es el cable?",
          "El cable es la hipotenusa: c² = a² + b².",
          "Eleva al cuadrado cada cateto, súmalos y saca la raíz cuadrada.",
        ],
      };
    },
  },
  {
    id: "tren_engranes", level: 3, topic: "Tren de engranes",
    gen(r) {
      const rpm = pk(r, [1800, 3000]), i1 = pk(r, [2, 3, 5]), i2 = pk(r, [2, 3, 5]);
      return {
        text: `⚙️ **Reductor de dos etapas.** Un motor gira a ${rpm} rpm. La primera etapa reduce con i₁ = ${i1} y la segunda con i₂ = ${i2}. ¿A cuántas rpm gira la salida?`,
        answer: rpm / (i1 * i2),
        hints: [
          "Cada etapa reduce la velocidad dividiéndola entre su relación de transmisión.",
          "Las relaciones de etapas en serie se multiplican: i_total = i₁ · i₂.",
          "Divide las rpm del motor entre i_total.",
        ],
      };
    },
  },
  {
    id: "pot_motor", level: 3, topic: "Potencia mecánica",
    gen(r) {
      const T = pk(r, [2, 5, 10]), rpm = pk(r, [300, 600, 1500]);
      return {
        text: `🔩 **Potencia en la flecha.** Un motor entrega un torque de ${T} N·m a ${rpm} rpm. ¿Qué potencia mecánica desarrolla? (en watts; P = τ · ω, π ≈ 3.1416)`,
        answer: (T * rpm * 2 * PI) / 60,
        hints: [
          "Primero necesitas la velocidad angular ω en rad/s, no en rpm.",
          "ω = rpm · 2π ÷ 60. Calcúlala primero.",
          "Ahora multiplica el torque por ω. El resultado queda en watts.",
        ],
      };
    },
  },
  {
    id: "rc_tau", level: 3, topic: "Circuito RC",
    gen(r) {
      const R = pk(r, [10, 22, 47]), C = pk(r, [10, 47, 100]);
      return {
        text: `⏱️ **Constante de tiempo.** En un circuito RC, R = ${R} kΩ y C = ${C} μF. ¿Cuánto vale la constante de tiempo τ = R · C? (en milisegundos)`,
        answer: R * C,
        hints: [
          "τ = R · C. Cuidado con los prefijos: kΩ = 10³ Ω y μF = 10⁻⁶ F.",
          "Fíjate: 10³ · 10⁻⁶ = 10⁻³, o sea que kΩ · μF te da milisegundos directamente.",
          "Entonces solo multiplica los dos números.",
        ],
      };
    },
  },

  /* ───────── Nivel 4 ───────── */
  {
    id: "cuadratica", level: 4, topic: "Ecuación cuadrática",
    gen(r) {
      const r1 = ri(r, 1, 5), r2 = ri(r, 6, 9);
      return {
        text: `🛠️ **Actuador lineal.** El tiempo t (en segundos) en que un actuador pasa por cierta posición cumple t² − ${r1 + r2}t + ${r1 * r2} = 0. ¿Cuál es el valor MAYOR de t?`,
        answer: r2,
        hints: [
          "Es una ecuación cuadrática: at² + bt + c = 0. Identifica a, b y c.",
          `Puedes factorizar: busca dos números que multiplicados den ${r1 * r2} y sumados den ${r1 + r2}.`,
          "Escríbela como (t − ?)(t − ?) = 0. Cada paréntesis te da una solución; quédate con la mayor.",
        ],
      };
    },
  },
  {
    id: "sistema_mallas", level: 4, topic: "Sistema de ecuaciones (mallas)",
    gen(r) {
      const I1 = ri(r, 1, 5), I2 = ri(r, 1, 5);
      let a1, b1, a2, b2;
      do {
        a1 = ri(r, 1, 4); b1 = ri(r, 1, 4); a2 = ri(r, 1, 4); b2 = ri(r, 1, 4);
      } while (a1 * b2 - a2 * b1 === 0);
      return {
        text: `🔁 **Análisis de mallas.** Al aplicar las leyes de Kirchhoff a un circuito obtienes:\n\n${a1}I₁ + ${b1}I₂ = ${a1 * I1 + b1 * I2}\n\n${a2}I₁ + ${b2}I₂ = ${a2 * I1 + b2 * I2}\n\n¿Cuánto vale I₁? (en amperes)`,
        answer: I1,
        hints: [
          "Tienes dos ecuaciones y dos incógnitas. Puedes usar sustitución, igualación o reducción.",
          "Con reducción: multiplica las ecuaciones para que el coeficiente de I₂ sea el mismo en las dos, y réstalas.",
          "Al restar, I₂ desaparece y te queda una ecuación solo con I₁. Resuélvela.",
        ],
      };
    },
  },
  {
    id: "trifasica", level: 4, topic: "Potencia trifásica",
    gen(r) {
      const V = pk(r, [220, 380, 440]), I = pk(r, [5, 10, 20]), fp = pk(r, [0.8, 0.9]);
      return {
        text: `🏭 **Motor trifásico.** Un motor trifásico conectado a ${V} V de línea consume ${I} A con factor de potencia ${fp}. ¿Qué potencia activa absorbe? (en watts; P = √3 · V · I · cosφ, con √3 ≈ 1.732)`,
        answer: SQ3 * V * I * fp,
        hints: [
          "La fórmula ya te la dan: ¿qué valor corresponde a cada letra? cosφ es el factor de potencia.",
          "Multiplica los números de dos en dos para llevar el control: primero √3 · V, luego por I.",
          "Termina multiplicando por el factor de potencia. Puedes redondear a la unidad.",
        ],
      };
    },
  },
  {
    id: "resonancia", level: 4, topic: "Frecuencia de resonancia (LC)",
    gen(r) {
      const [L, Cu] = pk(r, [[0.1, 10], [0.01, 100], [0.4, 10], [1, 100]]);
      return {
        text: `📡 **Circuito LC.** Un circuito tiene L = ${L} H y C = ${Cu} μF. ¿Cuál es su frecuencia de resonancia f = 1 ÷ (2π√(L·C))? (en Hz, con dos decimales; π ≈ 3.1416)`,
        answer: 1 / (2 * PI * Math.sqrt(L * Cu * 1e-6)),
        hints: [
          "Antes de nada, pasa C a farads: 1 μF = 10⁻⁶ F.",
          "Calcula L · C y luego su raíz cuadrada.",
          "Multiplica esa raíz por 2π y al final calcula 1 ÷ (ese número).",
        ],
      };
    },
  },
  {
    id: "divisor_inv", level: 4, topic: "Divisor de voltaje (despeje)",
    gen(r) {
      const Vout = pk(r, [3, 4, 6]), R2 = pk(r, [1000, 2000]);
      return {
        text: `🎛️ **Diseño de sensor.** En un divisor de voltaje con Vin = 12 V y R₂ = ${R2} Ω quieres obtener Vout = ${Vout} V. ¿Qué valor debe tener R₁? (en ohms)`,
        answer: R2 * (12 / Vout - 1),
        hints: [
          "Parte de la fórmula del divisor: Vout = Vin · R₂ ÷ (R₁ + R₂).",
          "Despeja (R₁ + R₂): intercambia (R₁ + R₂) con Vout. ¿Qué te queda?",
          "Luego resta R₂ para dejar R₁ sola.",
        ],
      };
    },
  },

  /* ───────── Nivel 5 ───────── */
  {
    id: "derivada", level: 5, topic: "Derivadas (velocidad)",
    gen(r) {
      const a = ri(r, 1, 2), b = ri(r, 1, 5), c = ri(r, 1, 4), t0 = ri(r, 1, 3);
      return {
        text: `🚀 **Cinemática.** La posición de un carro en una banda es s(t) = ${poly([term(a, "t", 3), term(b, "t", 2), term(c, "t", 1)])} (en metros). ¿Cuál es su velocidad en t = ${t0} s? (en m/s)`,
        answer: 3 * a * t0 * t0 + 2 * b * t0 + c,
        hints: [
          "La velocidad es la derivada de la posición: v(t) = s′(t).",
          "Regla de potencias: la derivada de k·tⁿ es n·k·tⁿ⁻¹. Aplícala término por término.",
          `Cuando tengas v(t), sustituye t = ${t0} y calcula.`,
        ],
      };
    },
  },
  {
    id: "integral", level: 5, topic: "Integrales (trabajo)",
    gen(r) {
      const a = pk(r, [2, 4, 6]), b = ri(r, 1, 5), m = ri(r, 2, 4);
      return {
        text: `🏗️ **Trabajo de un actuador.** La fuerza de un actuador varía con la posición: F(x) = ${a}x + ${b} (en N). ¿Qué trabajo realiza de x = 0 a x = ${m} m? W = ∫F(x)dx (en joules)`,
        answer: (a * m * m) / 2 + b * m,
        hints: [
          "El trabajo es el área bajo la curva de F(x): una integral definida.",
          "Regla: la integral de k·xⁿ es k·xⁿ⁺¹ ÷ (n+1). Integra término por término.",
          `Evalúa el resultado en x = ${m} y réstale su valor en x = 0.`,
        ],
      };
    },
  },
  {
    id: "impedancia", level: 5, topic: "Impedancia (AC)",
    gen(r) {
      const [R, X] = pk(r, [[30, 40], [6, 8], [5, 12], [8, 15], [9, 12], [60, 80]]);
      return {
        text: `〰️ **Corriente alterna.** Una bobina en un motor tiene resistencia R = ${R} Ω y reactancia inductiva X_L = ${X} Ω. ¿Cuál es el módulo de la impedancia |Z|? (en ohms)`,
        answer: Math.sqrt(R * R + X * X),
        hints: [
          "R y X_L están a 90° entre sí, así que no se suman directamente.",
          "Forman un triángulo rectángulo: |Z|² = R² + X_L².",
          "Eleva al cuadrado cada una, súmalas y saca la raíz cuadrada.",
        ],
      };
    },
  },
  {
    id: "exp_carga", level: 5, topic: "Respuesta exponencial (carga RC)",
    gen(r) {
      const V = pk(r, [5, 10, 12, 24]);
      return {
        text: `📈 **Carga de un capacitor.** El voltaje de un capacitor que se carga es v(t) = ${V}·(1 − e^(−t/τ)) volts. ¿Cuánto vale v cuando t = τ? (en volts, con dos decimales; e ≈ 2.71828)`,
        answer: V * (1 - 1 / Math.E),
        hints: [
          "Si t = τ, ¿qué le pasa al exponente −t/τ?",
          "El exponente queda en −1, así que v = V·(1 − e⁻¹), y e⁻¹ = 1 ÷ e.",
          "Calcula 1 ÷ 2.71828, réstalo de 1 y multiplica por el voltaje.",
        ],
      };
    },
  },
];

const TAGS = {
  ohm_v: "circuitos", serie: "circuitos", mm_m: "mecanica", potencia: "circuitos", cal_lineal: "algebra",
  rel_trans: "mecanica", torque: "mecanica", rpm_rads: "mecanica", paralelo: "circuitos", divisor: "circuitos",
  eficiencia: "circuitos", lineal_ambos: "algebra", trig_brazo: "trigonometria", pitagoras: "trigonometria",
  tren_engranes: "mecanica", pot_motor: "mecanica", rc_tau: "control", cuadratica: "algebra",
  sistema_mallas: "algebra", trifasica: "circuitos", resonancia: "control", divisor_inv: "circuitos",
  derivada: "calculo", integral: "calculo", impedancia: "circuitos", exp_carga: "control",
};

export const EXERCISES = [...BASE.map((e) => ({ ...e, tag: TAGS[e.id] || "algebra" })), ...EXTRA];
export const TOPIC_TAGS = ["circuitos", "mecanica", "algebra", "trigonometria", "calculo", "control"];

const BY_ID = Object.fromEntries(EXERCISES.map((e) => [e.id, e]));

export function makeExercise(id, seed) {
  const def = BY_ID[id];
  if (!def) return null;
  const g = def.gen(rngFrom(seed));
  return { id, level: def.level, topic: def.topic, tag: def.tag, tol: 0.01, ...g };
}

export function pickExercise(level, avoidIds = [], random = Math.random, tag = null) {
  let lvl = Math.max(1, Math.min(5, level));
  const ok = (e) => e.level === lvl && (!tag || e.tag === tag);
  let pool = EXERCISES.filter((e) => ok(e) && !avoidIds.includes(e.id));
  if (!pool.length) pool = EXERCISES.filter(ok);
  if (!pool.length && tag) {
    // No hay de ese tema en ese nivel: usa el nivel más cercano que sí tenga.
    const levels = [...new Set(EXERCISES.filter((e) => e.tag === tag).map((e) => e.level))].sort(
      (a, b) => Math.abs(a - lvl) - Math.abs(b - lvl) || a - b
    );
    lvl = levels[0] ?? lvl;
    pool = EXERCISES.filter((e) => ok(e) && !avoidIds.includes(e.id));
    if (!pool.length) pool = EXERCISES.filter(ok);
  }
  if (!pool.length) pool = EXERCISES.filter((e) => e.level === Math.max(1, Math.min(5, level)));
  const def = pool[Math.floor(random() * pool.length)];
  const seed = Math.floor(random() * 1e9);
  return { id: def.id, seed };
}
