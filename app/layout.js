import 'katex/dist/katex.min.css';
import './globals.css';

export const metadata = {
  title: 'Delf-IA - Tutor Socrático',
  description: 'Tutor de matemáticas socrático: te guía con preguntas para que encuentres la respuesta por ti mismo.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
