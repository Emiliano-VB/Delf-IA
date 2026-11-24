// lib/exercises2.js
// Ejercicios extra (se suman a los de exercises.js). Cada uno trae su etiqueta de tema.
// Temas: circuitos, mecanica, algebra, trigonometria, calculo, control.

const pk = (r, arr) => arr[Math.floor(r() * arr.length)];
const ri = (r, a, b) => a + Math.floor(r() * (b - a + 1));
const PI = 3.1416;
const sgn = (n) => (n < 0 ? ` − ${-n}` : ` + ${n}`);

export const EXTRA = [
  /* ───────── Nivel 1 ───────── */
  {
    id: "ohm_i", level: 1, topic: "Ley de Ohm (corriente)", tag: "circuitos",
    gen(r) {
      const [V, R] = pk(r, [[12, 4], [24, 8], [48, 12], [120, 10], [24, 6], [12, 3], [30, 5]]);
      return {
        text: `🔌 **Ley de Ohm.** A un resistor de ${R} Ω se le aplica un voltaje de ${V} V. ¿Qué corriente circula? (en amperes)`,
        answer: V / R,
        hints: [
          "Usa la ley de Ohm, que relaciona V, I y R.",
          "V = I · R. Aquí te piden I, así que hay que despejarla.",
          "I = V ÷ R. Divide el voltaje entre la resistencia.",
        ],
      };
    },
  },
  {
    id: "ohm_r", level: 1, topic: "Ley de Ohm (resistencia)", tag: "circuitos",
    gen(r) {
      const [V, I] = pk(r, [[24, 2], [12, 3], [48, 4], [100, 5], [36, 6], [60, 4]]);
      return {
        text: `🔌 **Resistencia de un motor.** Un motor conectado a ${V} V consume ${I} A. ¿Cuál es su resistencia equivalente? (en ohms)`,
        answer: V / I,
        hints: [
          "Relaciona voltaje, corriente y resistencia con la ley de Ohm.",
          "V = I · R. Despeja R.",
          "R = V ÷ I. Haz la división.",
        ],
      };
    },
  },
  {
    id: "peso", level: 1, topic: "Fuerza y peso", tag: "mecanica",
    gen(r) {
      const m = pk(r, [2, 5, 10, 20, 50]);
      return {
        text: `🏋️ **Peso.** Un brazo robótico levanta una pieza de ${m} kg. ¿Qué fuerza (peso) debe vencer? (en newtons; usa g = 9.81 m/s²)`,
        answer: m * 9.81,
        hints: [
          "El peso es la fuerza con que la gravedad jala una masa.",
          "W = m · g.",
          "Multiplica la masa en kg por 9.81. Puedes redondear a una o dos decimales.",
        ],
      };
    },
  },
  {
    id: "area_piston", level: 1, topic: "Área de un círculo", tag: "mecanica",
    gen(r) {
      const d = pk(r, [4, 6, 10, 20]);
      return {
        text: `🛠️ **Pistón.** Un pistón neumático tiene ${d} cm de diámetro. ¿Cuál es el área de su cara circular? (en cm²; π ≈ 3.1416)`,
        answer: (PI * d * d) / 4,
        hints: [
          "El área de un círculo es π por el radio al cuadrado.",
          "Te dan el diámetro, no el radio. ¿Cómo se relacionan?",
          "r = d ÷ 2. Luego A = π · r². Redondea a dos decimales.",
        ],
      };
    },
  },
  {
    id: "porcentaje", level: 1, topic: "Porcentajes", tag: "algebra",
    gen(r) {
      const p = pk(r, [10, 15, 20, 25, 50]), n = pk(r, [80, 120, 200, 240]);
      return {
        text: `🔋 **Batería.** Una batería de ${n} Wh ya perdió el ${p}% de su carga. ¿Cuántos Wh perdió?`,
        answer: (p * n) / 100,
        hints: [
          "\"Por ciento\" significa \"de cada 100\".",
          "Calcula el 10% o el 1% primero y escala.",
          "Multiplica la cantidad por el porcentaje y divide entre 100.",
        ],
      };
    },
  },

  /* ───────── Nivel 2 ───────── */
  {
    id: "velocidad", level: 2, topic: "Velocidad media", tag: "mecanica",
    gen(r) {
      const [d, t] = pk(r, [[12, 3], [30, 5], [45, 6], [60, 10], [80, 8], [24, 4]]);
      return {
        text: `🏃 **Banda transportadora.** Una pieza recorre ${d} m en ${t} s. ¿Cuál es su velocidad media? (en m/s)`,
        answer: d / t,
        hints: [
          "La velocidad dice cuánta distancia se recorre por cada segundo.",
          "v = distancia ÷ tiempo.",
          "Divide los metros entre los segundos.",
        ],
      };
    },
  },
  {
    id: "aceleracion", level: 2, topic: "Aceleración", tag: "mecanica",
    gen(r) {
      const vi = pk(r, [0, 2, 4]), vf = pk(r, [10, 14, 20]), t = pk(r, [2, 4, 5]);
      return {
        text: `🚗 **Carro seguidor de línea.** Un robot pasa de ${vi} m/s a ${vf} m/s en ${t} s. ¿Cuál es su aceleración media? (en m/s²)`,
        answer: (vf - vi) / t,
        hints: [
          "La aceleración mide cuánto cambia la velocidad en cada segundo.",
          "a = (v final − v inicial) ÷ tiempo.",
          "Primero resta las velocidades y luego divide entre el tiempo.",
        ],
      };
    },
  },
  {
    id: "energia_cap", level: 2, topic: "Energía en un capacitor", tag: "circuitos",
    gen(r) {
      const C = pk(r, [100, 200, 470, 1000]), V = pk(r, [10, 12, 24]);
      return {
        text: `🔋 **Capacitor.** Un capacitor de ${C} μF se carga a ${V} V. ¿Cuánta energía almacena E = ½·C·V²? (en milijoules; ojo: μF·V² = μJ)`,
        answer: (C * V * V) / 2 / 1000,
        hints: [
          "Primero eleva el voltaje al cuadrado.",
          "Multiplica por C y divide entre 2. El resultado sale en microjoules (μJ).",
          "Para pasar de μJ a mJ divide entre 1000.",
        ],
      };
    },
  },
  {
    id: "hooke", level: 2, topic: "Ley de Hooke", tag: "mecanica",
    gen(r) {
      const k = pk(r, [200, 500, 1000]), x = pk(r, [0.02, 0.05, 0.1]);
      return {
        text: `🌀 **Resorte.** Un resorte con constante k = ${k} N/m se comprime ${x} m. ¿Qué fuerza ejerce? (en newtons)`,
        answer: k * x,
        hints: [
          "Entre más se comprime un resorte, más fuerza ejerce, en proporción directa.",
          "F = k · x.",
          "Multiplica la constante por la compresión (ya está en metros).",
        ],
      };
    },
  },
  {
    id: "i2r", level: 2, topic: "Potencia disipada (I²R)", tag: "circuitos",
    gen(r) {
      const I = pk(r, [2, 3, 5]), R = pk(r, [4, 10, 20]);
      return {
        text: `🔥 **Calentamiento.** Por un resistor de ${R} Ω circula una corriente de ${I} A. ¿Qué potencia disipa en forma de calor? (en watts)`,
        answer: I * I * R,
        hints: [
          "La potencia se puede escribir con la corriente y la resistencia.",
          "P = I² · R.",
          "Eleva la corriente al cuadrado y luego multiplica por R.",
        ],
      };
    },
  },
  {
    id: "periodo", level: 2, topic: "Frecuencia y periodo", tag: "control",
    gen(r) {
      const f = pk(r, [50, 60, 100, 200, 500, 1000]);
      return {
        text: `〰️ **Señal.** Una señal tiene una frecuencia de ${f} Hz. ¿Cuál es su periodo? (en milisegundos)`,
        answer: 1000 / f,
        hints: [
          "El periodo es el tiempo que dura un ciclo completo.",
          "T = 1 ÷ f. Esto te da segundos.",
          "Multiplica por 1000 para pasar de segundos a milisegundos.",
        ],
      };
    },
  },
  {
    id: "lineal_frac", level: 2, topic: "Ecuación con fracciones", tag: "algebra",
    gen(r) {
      const k = pk(r, [2, 3, 4, 5]), m = ri(r, 2, 6), b = ri(r, 1, 5);
      return {
        text: `🧮 **Escalamiento.** Resuelve x/${k} + ${b} = ${m + b}. ¿Cuánto vale x?`,
        answer: k * m,
        hints: [
          `Primero deja sola la fracción: resta ${b} en ambos lados.`,
          `Ahora tienes x/${k} = ... ¿Qué operación deshace una división entre ${k}?`,
          `Multiplica ambos lados por ${k}.`,
        ],
      };
    },
  },

  /* ───────── Nivel 3 ───────── */
  {
    id: "fuerza_comp", level: 3, topic: "Componentes de una fuerza", tag: "trigonometria",
    gen(r) {
      const F = pk(r, [40, 80, 100, 200]);
      return {
        text: `📐 **Cilindro inclinado.** Un actuador empuja con ${F} N formando 60° con la horizontal. ¿Cuánto vale la componente horizontal Fₓ = F·cos θ? (en N; cos 60° = 0.5)`,
        answer: F * 0.5,
        hints: [
          "Descompón la fuerza en un triángulo rectángulo: la fuerza es la hipotenusa.",
          "La componente pegada al ángulo (horizontal) usa el coseno.",
          "Multiplica la fuerza por cos 60°.",
        ],
      };
    },
  },
  {
    id: "reductor_torque", level: 3, topic: "Torque en un reductor", tag: "mecanica",
    gen(r) {
      const T = pk(r, [1, 2, 5]), i = pk(r, [5, 10, 20]), eta = pk(r, [80, 90]);
      return {
        text: `⚙️ **Motorreductor.** Un motor da ${T} N·m. El reductor tiene i = ${i} y eficiencia de ${eta}%. ¿Qué torque entrega a la salida? (en N·m)`,
        answer: (T * i * eta) / 100,
        hints: [
          "Un reductor multiplica el torque por su relación de transmisión.",
          "Pero parte se pierde: la eficiencia indica qué fracción se aprovecha.",
          "T_salida = T · i · (η ÷ 100). Multiplica en orden.",
        ],
      };
    },
  },
  {
    id: "potencia_banda", level: 3, topic: "Potencia de elevación", tag: "mecanica",
    gen(r) {
      const m = pk(r, [20, 50, 100]), h = pk(r, [2, 5]), t = pk(r, [5, 10]);
      return {
        text: `🏗️ **Elevador.** Un motor sube una carga de ${m} kg a ${h} m de altura en ${t} s. ¿Qué potencia útil desarrolla? (en watts; usa g = 10 m/s²)`,
        answer: (m * 10 * h) / t,
        hints: [
          "Potencia = trabajo ÷ tiempo.",
          "El trabajo de elevar es peso por altura: W = m · g · h.",
          "Calcula el trabajo y divídelo entre el tiempo.",
        ],
      };
    },
  },
  {
    id: "paralelo_mixto", level: 3, topic: "Circuito serie-paralelo", tag: "circuitos",
    gen(r) {
      const [a, b, c] = pk(r, [[20, 30, 8], [10, 10, 5], [60, 30, 10], [12, 6, 6]]);
      return {
        text: `🔌 **Serie-paralelo.** Dos resistores de ${a} Ω y ${b} Ω están en paralelo, y en serie con otro de ${c} Ω. ¿Cuál es la resistencia total? (en ohms)`,
        answer: (a * b) / (a + b) + c,
        hints: [
          "Resuelve por partes: primero el bloque en paralelo.",
          "R_par = (R₁·R₂) ÷ (R₁+R₂).",
          "Luego ese resultado queda en serie con el último: se suman.",
        ],
      };
    },
  },
  {
    id: "kirchhoff_v", level: 3, topic: "Ley de voltajes de Kirchhoff", tag: "circuitos",
    gen(r) {
      const I = pk(r, [2, 3, 4]), R3 = pk(r, [2, 5]), V1 = pk(r, [4, 6]), V2 = pk(r, [6, 8]);
      const V = V1 + V2 + I * R3;
      return {
        text: `🔁 **Malla.** Una fuente de ${V} V alimenta dos cargas en serie que caen ${V1} V y ${V2} V, y un resistor de ${R3} Ω. ¿Qué corriente circula por la malla? (en amperes)`,
        answer: I,
        hints: [
          "Ley de voltajes: la suma de caídas de voltaje es igual al voltaje de la fuente.",
          "¿Cuánto voltaje le toca al resistor? Resta las otras dos caídas a la fuente.",
          `Con el voltaje del resistor y su valor (${R3} Ω), usa la ley de Ohm para hallar I.`,
        ],
      };
    },
  },
  {
    id: "omega_f", level: 3, topic: "Frecuencia angular", tag: "control",
    gen(r) {
      const f = pk(r, [50, 60, 120]);
      return {
        text: `〰️ **Red eléctrica.** Una señal senoidal tiene f = ${f} Hz. ¿Cuál es su frecuencia angular ω = 2πf? (en rad/s; π ≈ 3.1416)`,
        answer: 2 * PI * f,
        hints: [
          "Un ciclo completo equivale a 2π radianes.",
          "ω = 2 · π · f.",
          "Multiplica 2 · 3.1416 · f. Redondea a un decimal.",
        ],
      };
    },
  },
  {
    id: "motor_cd", level: 3, topic: "Potencia de un motor de CD", tag: "circuitos",
    gen(r) {
      const V = pk(r, [12, 24, 48]), I = pk(r, [2, 5, 10]), eta = pk(r, [70, 80, 90]);
      return {
        text: `⚡ **Motor de CD.** Un motor trabaja a ${V} V y ${I} A con una eficiencia de ${eta}%. ¿Qué potencia mecánica entrega? (en watts)`,
        answer: (V * I * eta) / 100,
        hints: [
          "Primero calcula la potencia eléctrica que consume.",
          "P_entrada = V · I.",
          "La potencia mecánica es la parte aprovechada: multiplica por η y divide entre 100.",
        ],
      };
    },
  },
  {
    id: "tau_rl", level: 3, topic: "Constante de tiempo RL", tag: "control",
    gen(r) {
      const L = pk(r, [20, 50, 100]), R = pk(r, [5, 10, 20]);
      return {
        text: `⏱️ **Bobina.** Un circuito RL tiene L = ${L} mH y R = ${R} Ω. ¿Cuánto vale su constante de tiempo τ = L ÷ R? (en milisegundos)`,
        answer: L / R,
        hints: [
          "τ = L ÷ R.",
          "mH ÷ Ω te da directamente milisegundos.",
          "Solo divide los dos números.",
        ],
      };
    },
  },

  /* ───────── Nivel 4 ───────── */
  {
    id: "cuad_neg", level: 4, topic: "Ecuación cuadrática (raíces con signo)", tag: "algebra",
    gen(r) {
      const r1 = ri(r, -6, -1), r2 = ri(r, 1, 5);
      const s = r1 + r2, p = r1 * r2;
      return {
        text: `🛠️ **Posición de equilibrio.** Una pieza oscila y su posición x cumple x²${s === 0 ? "" : sgn(-s) + "x"}${sgn(p)} = 0. ¿Cuál es el valor MENOR de x? (puede ser negativo)`,
        answer: r1,
        hints: [
          "Es una cuadrática. Identifica a, b y c con sus signos.",
          "Busca dos números que multiplicados den c y sumados den −b (cuidado con los signos).",
          "Factoriza como (x − ?)(x − ?) = 0 y quédate con la solución menor.",
        ],
      };
    },
  },
  {
    id: "sistema_i2", level: 4, topic: "Sistema de ecuaciones (mallas, I₂)", tag: "algebra",
    gen(r) {
      const I1 = ri(r, 1, 5), I2 = ri(r, 1, 5);
      let a1, b1, a2, b2;
      do {
        a1 = ri(r, 1, 4); b1 = ri(r, 1, 4); a2 = ri(r, 1, 4); b2 = ri(r, 1, 4);
      } while (a1 * b2 - a2 * b1 === 0);
      return {
        text: `🔁 **Dos mallas.** Las leyes de Kirchhoff te dan:\n\n${a1}I₁ + ${b1}I₂ = ${a1 * I1 + b1 * I2}\n\n${a2}I₁ + ${b2}I₂ = ${a2 * I1 + b2 * I2}\n\n¿Cuánto vale I₂? (en amperes)`,
        answer: I2,
        hints: [
          "Dos ecuaciones, dos incógnitas: usa sustitución o reducción.",
          "Con reducción, iguala los coeficientes de I₁ multiplicando cada ecuación y réstalas.",
          "Al restar desaparece I₁ y te queda una ecuación solo con I₂.",
        ],
      };
    },
  },
  {
    id: "deriv2", level: 4, topic: "Derivadas (velocidad)", tag: "calculo",
    gen(r) {
      const a = ri(r, 1, 5), b = ri(r, 1, 6), c = ri(r, 0, 5), t0 = ri(r, 1, 4);
      const pos = `${a}t²${sgn(b)}t${c ? sgn(c) : ""}`;
      return {
        text: `🚀 **Cinemática.** La posición de un deslizador es s(t) = ${pos} (en metros). ¿Qué velocidad tiene en t = ${t0} s? (en m/s)`,
        answer: 2 * a * t0 + b,
        hints: [
          "La velocidad es la derivada de la posición.",
          "Regla: la derivada de k·tⁿ es n·k·tⁿ⁻¹; la de una constante es 0.",
          `Obtén v(t) y sustituye t = ${t0}.`,
        ],
      };
    },
  },
  {
    id: "resorte_int", level: 4, topic: "Integral (energía en un resorte)", tag: "calculo",
    gen(r) {
      const k = pk(r, [100, 200, 400, 600]), x = pk(r, [0.1, 0.2, 0.5]);
      return {
        text: `🌀 **Energía del resorte.** El trabajo para comprimir un resorte (k = ${k} N/m) desde 0 hasta ${x} m es W = ∫ k·x dx. ¿Cuánto vale? (en joules)`,
        answer: (k * x * x) / 2,
        hints: [
          "Integra k·x respecto a x: k es una constante.",
          "La integral de x es x²/2, así que W = k·x²/2 evaluada entre 0 y el límite superior.",
          "Sustituye x en la fórmula (el límite inferior 0 da 0).",
        ],
      };
    },
  },
  {
    id: "trif_i", level: 4, topic: "Corriente en motor trifásico", tag: "circuitos",
    gen(r) {
      const P = pk(r, [5000, 8000, 10000]), V = pk(r, [380, 400, 440]), fp = pk(r, [0.8, 0.9]);
      return {
        text: `🏭 **Motor trifásico.** Un motor absorbe ${P} W a ${V} V de línea con factor de potencia ${fp}. ¿Qué corriente de línea toma? (en amperes, con un decimal; I = P ÷ (√3·V·cosφ), √3 ≈ 1.732)`,
        answer: P / (1.732 * V * fp),
        hints: [
          "La fórmula ya está dada: ¿qué valor corresponde a cada letra?",
          "Calcula primero el denominador: √3 · V · cosφ.",
          "Divide la potencia entre ese resultado.",
        ],
      };
    },
  },
  {
    id: "ganancia_db", level: 4, topic: "Ganancia en decibeles", tag: "control",
    gen(r) {
      const A = pk(r, [10, 100, 1000, 20, 50]);
      return {
        text: `🎛️ **Amplificador.** Un amplificador de instrumentación tiene una ganancia de voltaje Av = ${A}. ¿Cuánto es en decibeles, 20·log₁₀(Av)? (con dos decimales)`,
        answer: 20 * Math.log10(A),
        hints: [
          "Necesitas el logaritmo base 10 de la ganancia: ¿a qué potencia hay que elevar 10 para obtener Av?",
          "Si no sale exacto, usa calculadora (tecla log).",
          "Multiplica ese logaritmo por 20.",
        ],
      };
    },
  },
  {
    id: "rms", level: 4, topic: "Valor RMS", tag: "control",
    gen(r) {
      const Vp = pk(r, [100, 170, 311]);
      return {
        text: `〰️ **Señal senoidal.** Una señal tiene un voltaje pico de ${Vp} V. ¿Cuál es su valor RMS, Vp ÷ √2? (en volts, con un decimal; √2 ≈ 1.4142)`,
        answer: Vp / 1.4142,
        hints: [
          "El valor RMS es el equivalente en corriente directa de una señal alterna.",
          "V_rms = V_pico ÷ √2.",
          "Divide el voltaje pico entre 1.4142.",
        ],
      };
    },
  },

  /* ───────── Nivel 5 ───────── */
  {
    id: "aceleracion_d2", level: 5, topic: "Segunda derivada (aceleración)", tag: "calculo",
    gen(r) {
      const a = ri(r, 1, 3), b = ri(r, 1, 5), t0 = ri(r, 1, 4);
      return {
        text: `🚀 **Dinámica.** La posición de un brazo es s(t) = ${a === 1 ? "" : a}t³${sgn(b)}t² (en metros). ¿Cuál es su aceleración en t = ${t0} s? (en m/s²)`,
        answer: 6 * a * t0 + 2 * b,
        hints: [
          "La aceleración es la derivada de la velocidad, o sea la SEGUNDA derivada de la posición.",
          "Deriva una vez para v(t) y otra vez para a(t).",
          `Sustituye t = ${t0} en a(t).`,
        ],
      };
    },
  },
  {
    id: "integral_cuad", level: 5, topic: "Integral definida (polinomio)", tag: "calculo",
    gen(r) {
      const a = pk(r, [3, 6]), b = pk(r, [2, 4]), n = pk(r, [2, 3]);
      return {
        text: `🏗️ **Trabajo variable.** La fuerza de un actuador es F(x) = ${a}x² + ${b}x (en N). ¿Qué trabajo realiza de x = 0 a x = ${n} m? W = ∫F(x)dx (en joules)`,
        answer: (a * n ** 3) / 3 + (b * n * n) / 2,
        hints: [
          "Es una integral definida: encuentra la antiderivada y evalúa en los límites.",
          "Regla: ∫k·xⁿ dx = k·xⁿ⁺¹ ÷ (n+1). Hazlo término por término.",
          `Evalúa en x = ${n} y réstale el valor en x = 0 (que es 0).`,
        ],
      };
    },
  },
  {
    id: "factor_pot", level: 5, topic: "Factor de potencia (AC)", tag: "circuitos",
    gen(r) {
      const [R, X] = pk(r, [[30, 40], [6, 8], [8, 6], [60, 80], [5, 12]]);
      return {
        text: `〰️ **Bobina de motor.** Una carga tiene R = ${R} Ω y reactancia X_L = ${X} Ω. ¿Cuál es su factor de potencia cosφ = R ÷ |Z|? (con dos decimales)`,
        answer: R / Math.sqrt(R * R + X * X),
        hints: [
          "Primero necesitas el módulo de la impedancia |Z|.",
          "|Z| = √(R² + X_L²).",
          "Luego divide R entre |Z|.",
        ],
      };
    },
  },
  {
    id: "exp_carga2", level: 5, topic: "Carga de un capacitor (t = 2τ)", tag: "control",
    gen(r) {
      const V = pk(r, [5, 10, 12, 24]);
      return {
        text: `📈 **Carga RC.** v(t) = ${V}·(1 − e^(−t/τ)) volts. ¿Cuánto vale v cuando t = 2τ? (en volts, con dos decimales; e ≈ 2.71828)`,
        answer: V * (1 - Math.exp(-2)),
        hints: [
          "Si t = 2τ, ¿cuánto vale el exponente −t/τ?",
          "Queda e⁻² = 1 ÷ e². Calcula e² primero.",
          "Resta ese número de 1 y multiplica por el voltaje.",
        ],
      };
    },
  },
  {
    id: "exp_descarga", level: 5, topic: "Descarga de un capacitor", tag: "control",
    gen(r) {
      const V = pk(r, [5, 10, 12, 24]);
      return {
        text: `📉 **Descarga RC.** v(t) = ${V}·e^(−t/τ) volts. ¿Cuánto vale v cuando t = τ? (en volts, con dos decimales; e ≈ 2.71828)`,
        answer: V / Math.E,
        hints: [
          "Si t = τ, el exponente −t/τ vale −1.",
          "e⁻¹ = 1 ÷ e.",
          "Divide el voltaje inicial entre 2.71828.",
        ],
      };
    },
  },
  {
    id: "reductor_mixto", level: 5, topic: "Reductor de dos etapas (torque)", tag: "mecanica",
    gen(r) {
      const T = pk(r, [1, 2, 4]), i1 = pk(r, [3, 5]), i2 = pk(r, [2, 4]), eta = pk(r, [80, 90]);
      return {
        text: `⚙️ **Reductor de dos etapas.** Un motor da ${T} N·m. Las etapas tienen i₁ = ${i1} e i₂ = ${i2}, y la eficiencia TOTAL es ${eta}%. ¿Qué torque entrega a la salida? (en N·m)`,
        answer: (T * i1 * i2 * eta) / 100,
        hints: [
          "Cada etapa multiplica el torque por su relación de transmisión.",
          "La relación total es i₁ · i₂.",
          "T_salida = T · i_total · (η ÷ 100). Calcula paso a paso.",
        ],
      };
    },
  },
];
