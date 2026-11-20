// Encabezado con el delfín pixelado (SVG).
export default function Header() {
  return (
    <div className="brand">
      <svg
        width="60"
        height="60"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ imageRendering: 'pixelated' }}
        aria-hidden="true"
      >
        <path d="M7 2H10V3H11V4H12V5H13V6H14V8H13V9H12V10H9V11H7V10H5V9H3V8H2V7H1V6H3V5H5V4H7V2Z" fill="#00E5FF" />
        <path d="M5 8H9V9H11V10H7V10H5V9H3V8H5Z" fill="#E0F7FA" />
        <rect x="10" y="4" width="1" height="1" fill="#FFFFFF" />
        <rect x="10" y="4" width="0.5" height="0.5" fill="#000000" />
        <rect x="6" y="1" width="2" height="1" fill="#00E5FF" />
        <path d="M1 5H2V4H1V3H0V6H1V5Z" fill="#00E5FF" />
        <path d="M1 8H2V9H1V10H0V7H1V8Z" fill="#00E5FF" />
        <rect x="8" y="3" width="1" height="1" fill="#80DEEA" />
      </svg>
      <div>
        <h1>Delf-IA</h1>
        <p>Tutor de Matemáticas Socrático</p>
      </div>
    </div>
  );
}
