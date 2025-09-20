export default function Footer() {
  return (
    <footer className="mt-10 border-t border-black/10 text-sm text-muted px-4 py-6 text-center">
      <p>
        © {new Date().getFullYear()} Arcturus Digital Consulting ·{" "}
        <a href="/privacy" className="hover:text-brand underline">Privacy</a> ·{" "}
        <a href="/terms" className="hover:text-brand underline">Terms</a>
      </p>
    </footer>
  );
}
